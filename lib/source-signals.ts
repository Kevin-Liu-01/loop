import { XMLParser } from "fast-xml-parser";

import type { DailySignal, SourceDefinition } from "@/lib/types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: ""
});

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

export function normalizeFeedItems(source: SourceDefinition, payload: string): DailySignal[] {
  const parsed = parser.parse(payload);
  const rssItems = asArray(parsed?.rss?.channel?.item);
  const atomEntries = asArray(parsed?.feed?.entry);
  const normalized = rssItems.length > 0 ? rssItems : atomEntries;

  return normalized
    .map((item) => {
      const linkValue =
        typeof item.link === "string"
          ? item.link
          : item.link?.href ?? item.guid?.["#text"] ?? item.id ?? source.url;
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
    .slice(0, 6);
}

export async function fetchSignals(source: SourceDefinition): Promise<DailySignal[]> {
  try {
    const response = await fetch(source.url, {
      headers: {
        "user-agent": "LoopBot/0.1 (+https://loop.local)"
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.text();
    return normalizeFeedItems(source, payload);
  } catch {
    return [];
  }
}
