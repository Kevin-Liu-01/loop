import { tool } from "ai";
import { z } from "zod";

import { FETCH_PAGE_MAX_CHARS, FETCH_PAGE_TIMEOUT_MS } from "@/lib/agent-tools/constants";
import type { FetchPageToolOutput } from "@/lib/agent-tools/types";

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string {
  const match = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return match?.[1]?.trim() ?? "Untitled";
}

export async function fetchPageContent(
  url: string,
  timeoutMs = FETCH_PAGE_TIMEOUT_MS,
  maxChars = FETCH_PAGE_MAX_CHARS
): Promise<FetchPageToolOutput> {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "LoopBot/0.1 (+https://loop.local)",
        accept: "text/html, application/xhtml+xml, text/plain, */*",
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      return { error: `HTTP ${response.status} ${response.statusText}` };
    }

    const raw = await response.text();
    const title = extractTitle(raw);
    const content = stripHtmlToText(raw).slice(0, maxChars);

    return { url, title, content, contentLength: content.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fetch failed";
    return { error: `Failed to fetch ${url}: ${message}` };
  }
}

export function buildFetchPageTool() {
  return tool({
    description:
      "Fetch and read the content of a specific URL. " +
      "Use when web_search found a promising result and you need the full details from that page.",
    inputSchema: z.object({
      url: z.string().url().describe("The URL to fetch and read"),
    }),
    execute: async ({ url }): Promise<FetchPageToolOutput> => {
      return fetchPageContent(url);
    },
  });
}
