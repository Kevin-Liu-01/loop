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
      "Add a new source to this skill's tracked sources for future refreshes. " +
      "Only add sources that are clearly high-quality and relevant: " +
      "official docs, maintained blogs, release feeds, or GitHub repos. " +
      `You can add up to ${MAX_ADDED_SOURCES_PER_RUN} sources per refresh.`,
    inputSchema: z.object({
      label: z.string().min(3).max(80).describe("Human-readable name for this source"),
      url: z.string().url().describe("The source URL (feed, docs page, or repo)"),
      kind: z
        .enum(ALLOWED_SOURCE_KINDS as [string, ...string[]])
        .describe("The type of source"),
      tags: z
        .array(z.string())
        .min(1)
        .max(5)
        .describe("Relevant topic tags for this source"),
      rationale: z
        .string()
        .describe("Why this source is valuable for this skill"),
    }),
    execute: async ({ label, url, kind, tags, rationale }): Promise<AddSourceToolOutput> => {
      if (collector.sources.length >= MAX_ADDED_SOURCES_PER_RUN) {
        return {
          error: `Source limit reached (${MAX_ADDED_SOURCES_PER_RUN} per refresh). Cannot add more.`,
        };
      }

      if (isDuplicateSource(url, existingSources, collector)) {
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

      return { added: true, source };
    },
  });
}
