import { tool } from "ai";
import { z } from "zod";

import { MAX_ADDED_SOURCES_PER_RUN } from "@/lib/agent-tools/constants";
import type { AddSourceToolOutput } from "@/lib/agent-tools/types";
import { stableHash } from "@/lib/markdown";
import { buildSourceLogoUrl } from "@/lib/source-signals";
import type { CategorySlug, SourceDefinition, SourceKind } from "@/lib/types";

const ALLOWED_SOURCE_KINDS: SourceKind[] = [
  "rss",
  "atom",
  "docs",
  "blog",
  "github",
  "changelog",
  "releases",
  "docs-index",
];

export type AddedSourceCollector = {
  sources: SourceDefinition[];
};

function isDuplicateSource(
  url: string,
  existingSources: SourceDefinition[],
  collector: AddedSourceCollector
): boolean {
  const normalizedUrl = url.replace(/\/+$/, "").toLowerCase();
  const allUrls = [
    ...existingSources.map((s) => s.url),
    ...collector.sources.map((s) => s.url),
  ].map((u) => u.replace(/\/+$/, "").toLowerCase());

  return allUrls.includes(normalizedUrl);
}

export function buildAddSourceTool(
  existingSources: SourceDefinition[],
  category: CategorySlug,
  collector: AddedSourceCollector
) {
  return tool({
    description:
      "Permanently add a new tracked source so future refreshes automatically pull signals from it. " +
      "Use when you discover a high-value recurring source during research: official docs, release feeds, changelogs, maintained blogs, or GitHub repos. " +
      `Limit: ${MAX_ADDED_SOURCES_PER_RUN} new sources per refresh. Prefer quality over quantity — only add sources that will reliably produce useful signals over time.`,
    inputSchema: z.object({
      label: z.string().min(3).max(80).describe("Human-readable name, e.g. 'Next.js Changelog' or 'Tailwind CSS Blog'"),
      url: z.string().url().describe("Stable feed or page URL that will continue producing content"),
      kind: z
        .enum(ALLOWED_SOURCE_KINDS as [string, ...string[]])
        .describe("Source type — use 'rss' or 'atom' for feeds, 'changelog' for release pages, 'docs' for doc pages, 'github' for repos"),
      tags: z
        .array(z.string())
        .min(1)
        .max(5)
        .describe("Topic tags for categorization, e.g. ['react', 'server-components', 'rendering']"),
      rationale: z
        .string()
        .describe("One sentence: why this source will produce valuable ongoing signals for this skill"),
    }),
    execute: async ({ label, url, kind, tags, rationale }): Promise<AddSourceToolOutput> => {
      if (collector.sources.length >= MAX_ADDED_SOURCES_PER_RUN) {
        console.warn(`[tool:add_source] Limit reached (${MAX_ADDED_SOURCES_PER_RUN}) – rejecting "${label}" (${url})`);
        return {
          error: `Source limit reached (${MAX_ADDED_SOURCES_PER_RUN} per refresh). Cannot add more.`,
        };
      }

      if (isDuplicateSource(url, existingSources, collector)) {
        console.info(`[tool:add_source] Duplicate skipped: "${label}" (${url})`);
        return { error: `Source URL already tracked: ${url}` };
      }

      const source: SourceDefinition = {
        id: stableHash(`${category}:${url}`),
        label: label.trim(),
        url: url.trim(),
        kind: kind as SourceKind,
        tags: tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
        logoUrl: buildSourceLogoUrl(url),
        mode: "discover",
        trust: "community",
        rationale,
      };

      collector.sources.push(source);
      console.info(`[tool:add_source] Added "${label}" (${kind}) – ${url} – total: ${collector.sources.length}`);

      return { added: true, source };
    },
  });
}
