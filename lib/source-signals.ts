import { XMLParser } from "fast-xml-parser";

import type { DailySignal, SourceDefinition } from "@/lib/types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: ""
});

const MAX_FEED_ITEMS = 12;

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function cleanHtml(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function pickDate(value?: string): string {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
}

export function buildSourceLogoUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
  } catch {
    return "";
  }
}

function looksLikeHtmlPage(payload: string): boolean {
  const head = payload.trimStart().slice(0, 500).toLowerCase();
  return head.includes("<!doctype html") || head.includes("<html") || head.includes("<head");
}

function looksLikeFeed(payload: string): boolean {
  const head = payload.trimStart().slice(0, 200).toLowerCase();
  return head.includes("<?xml") || head.includes("<rss") || head.includes("<feed") || head.includes("<atom");
}

function extractLinksFromHtml(source: SourceDefinition, html: string): DailySignal[] {
  const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  const seen = new Set<string>();
  const items: DailySignal[] = [];

  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(html)) !== null && items.length < MAX_FEED_ITEMS) {
    const url = match[1];
    const title = cleanHtml(match[2]);
    if (!url || !title || title.length < 4 || seen.has(url)) continue;
    if (url.startsWith("#") || url.startsWith("javascript:") || url.startsWith("mailto:")) continue;
    try {
      const resolved = new URL(url, source.url).toString();
      if (seen.has(resolved)) continue;
      seen.add(resolved);
      items.push({
        title,
        url: resolved,
        source: source.label,
        publishedAt: new Date().toISOString(),
        summary: "",
        tags: source.tags
      });
    } catch {
      continue;
    }
  }

  return items;
}

function resolveLink(link: unknown, fallbackId: unknown, fallbackUrl: string): string {
  if (typeof link === "string") return link;
  if (Array.isArray(link)) {
    const alternate = link.find((entry) => entry?.rel === "alternate");
    const first = alternate ?? link[0];
    if (first?.href) return String(first.href);
  }
  if (link && typeof link === "object" && "href" in link) return String((link as { href: string }).href);
  if (typeof fallbackId === "string" && fallbackId.startsWith("http")) return fallbackId;
  return fallbackUrl;
}

export function normalizeFeedItems(source: SourceDefinition, payload: string): DailySignal[] {
  if (looksLikeHtmlPage(payload) && !looksLikeFeed(payload)) {
    return extractLinksFromHtml(source, payload);
  }

  const parsed = parser.parse(payload);
  const rssItems = asArray(parsed?.rss?.channel?.item);
  const atomEntries = asArray(parsed?.feed?.entry);
  const normalized = rssItems.length > 0 ? rssItems : atomEntries;

  if (normalized.length === 0 && payload.length > 100) {
    return extractLinksFromHtml(source, payload);
  }

  return normalized
    .map((item) => {
      const linkValue = resolveLink(item.link, item.id ?? item.guid?.["#text"], source.url);
      const publishedAt =
        item.pubDate ?? item.published ?? item.updated ?? item["dc:date"] ?? new Date().toISOString();

      return {
        title: cleanHtml(item.title ?? "Untitled signal"),
        url: String(linkValue),
        source: source.label,
        publishedAt: pickDate(String(publishedAt)),
        summary: cleanHtml(item.description ?? item.summary ?? item.content ?? item["content:encoded"]),
        tags: source.tags
      } satisfies DailySignal;
    })
    .filter((item) => item.title.length > 0)
    .sort((left, right) => +new Date(right.publishedAt) - +new Date(left.publishedAt))
    .slice(0, MAX_FEED_ITEMS);
}

export async function fetchSignals(source: SourceDefinition): Promise<DailySignal[]> {
  try {
    const response = await fetch(source.url, {
      headers: {
        "user-agent": "LoopBot/0.1 (+https://loop.local)",
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html, */*"
      },
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      console.warn(`[source-signals] ${source.label} (${source.url}) returned ${response.status}`);
      return [];
    }

    const payload = await response.text();
    if (!payload || payload.length < 20) {
      console.warn(`[source-signals] ${source.label} returned an empty or near-empty response`);
      return [];
    }

    const items = normalizeFeedItems(source, payload);
    if (items.length === 0) {
      console.warn(`[source-signals] ${source.label} parsed zero items from ${payload.length} bytes`);
    }

    return items;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error";
    console.warn(`[source-signals] ${source.label} (${source.url}) failed: ${message}`);
    return [];
  }
}
