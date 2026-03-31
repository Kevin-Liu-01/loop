import matter from "gray-matter";

import {
  EXTERNAL_SKILL_SOURCES,
  getContentsUrl,
  getRawUrl,
  type ExternalSkillSource,
} from "@/lib/external-skill-sources";
import { createExcerpt, slugify } from "@/lib/markdown";
import { getSkillBySlug, createSkill } from "@/lib/db/skills";
import type {
  AgentDocKey,
  AgentDocs,
  CategorySlug,
  SkillAutomationState,
  SourceDefinition,
} from "@/lib/types";
import { AGENT_DOC_FILENAMES } from "@/lib/types";
import { normalizeSource, normalizeTags } from "@/lib/user-skills";

export type WeeklyImportResult = {
  imported: ImportedSkillSummary[];
  skipped: string[];
  errors: Array<{ slug: string; error: string }>;
};

export type ImportedSkillSummary = {
  slug: string;
  title: string;
  category: CategorySlug;
  sourceId: string;
  sourceName: string;
  description: string;
};

type GitHubItem = {
  name: string;
  path: string;
  type: "file" | "dir";
};

const CATEGORY_INFERENCE: Array<{ pattern: RegExp; category: CategorySlug }> = [
  { pattern: /frontend|react|next|vue|css|tailwind|animation|three/i, category: "frontend" },
  { pattern: /seo|crawl|schema|geo|sitemap/i, category: "seo-geo" },
  { pattern: /social|linkedin|twitter|post|audience/i, category: "social" },
  { pattern: /security|auth|threat|abuse/i, category: "security" },
  { pattern: /linear|github|ci|workflow|automation|ops/i, category: "ops" },
  { pattern: /agent|a2a|mcp|orchestration|tool/i, category: "a2a" },
  { pattern: /docker|container|kubernetes|oci/i, category: "containers" },
  { pattern: /infra|cloud|serverless|edge|deploy|database/i, category: "infra" },
];

function inferCategory(slug: string, content: string): CategorySlug {
  const haystack = `${slug} ${content}`.toLowerCase();
  for (const rule of CATEGORY_INFERENCE) {
    if (rule.pattern.test(haystack)) return rule.category;
  }
  return "frontend";
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

async function fetchAgentDocs(
  source: ExternalSkillSource,
  skillPath: string
): Promise<AgentDocs> {
  const docs: AgentDocs = {};
  const entries = Object.entries(AGENT_DOC_FILENAMES) as [AgentDocKey, string][];

  const results = await Promise.all(
    entries.map(async ([key, filename]) => {
      const url = getRawUrl(source, `${skillPath}/${filename}`);
      const content = await fetchText(url);
      return content ? { key, content: content.trim() } : null;
    })
  );

  for (const result of results) {
    if (result) docs[result.key] = result.content;
  }

  return docs;
}

async function discoverAndImportFromSource(
  source: ExternalSkillSource,
  result: WeeklyImportResult
): Promise<void> {
  let dirs: { name: string; path: string }[] = [];

  if (source.skillsPath === "__readme_links__") {
    return;
  }

  try {
    const url = getContentsUrl(source);
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.github.v3+json" },
      cache: "no-store",
    });
    if (!res.ok) {
      result.errors.push({ slug: source.id, error: `GitHub API ${res.status}` });
      return;
    }
    const items = (await res.json()) as GitHubItem[];
    dirs = items.filter((i) => i.type === "dir" && !i.name.startsWith("."));
  } catch (err) {
    result.errors.push({
      slug: source.id,
      error: err instanceof Error ? err.message : "Discovery failed",
    });
    return;
  }

  const importPromises = dirs.map(async (dir) => {
    const slug = dir.name;

    const existing = await getSkillBySlug(slug);
    if (existing) {
      result.skipped.push(slug);
      return;
    }

    const skillMdUrl = getRawUrl(source, `${dir.path}/SKILL.md`);
    const raw = await fetchText(skillMdUrl);
    if (!raw) {
      result.skipped.push(slug);
      return;
    }

    try {
      const { data, content } = matter(raw);
      const title =
        content.match(/^#\s+(.+)$/m)?.[1]?.trim() ??
        slug.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
      const description = String(
        data.description ?? createExcerpt(content, 160)
      );
      const category = inferCategory(slug, `${description}\n${content}`);

      const [agentDocs] = await Promise.all([
        fetchAgentDocs(source, dir.path),
      ]);

      const sourceUrl = `https://github.com/${source.org}/${source.repo}/tree/${source.branch}/${dir.path}`;
      const sources: SourceDefinition[] = [normalizeSource(sourceUrl, category)];

      const automation: SkillAutomationState = {
        enabled: true,
        cadence: "weekly",
        status: "active",
        prompt: `Refresh ${title} from upstream source.`,
      };

      await createSkill({
        slug,
        title,
        description,
        category,
        body: content.trim(),
        visibility: "public",
        origin: "remote",
        tags: normalizeTags([
          category,
          source.trustTier,
          source.name.toLowerCase().replace(/\s+/g, "-"),
          ...((data.tags as string[]) ?? []),
        ]),
        ownerName: source.name,
        sources,
        automation,
        updates: [],
        agentDocs: Object.keys(agentDocs).length > 0 ? agentDocs : undefined,
        version: 1,
      });

      result.imported.push({
        slug,
        title,
        category,
        sourceId: source.id,
        sourceName: source.name,
        description,
      });
    } catch (err) {
      result.errors.push({
        slug,
        error: err instanceof Error ? err.message : "Import failed",
      });
    }
  });

  const CONCURRENCY = 5;
  for (let i = 0; i < importPromises.length; i += CONCURRENCY) {
    await Promise.all(importPromises.slice(i, i + CONCURRENCY));
  }
}

export async function runWeeklyImport(): Promise<WeeklyImportResult> {
  const result: WeeklyImportResult = {
    imported: [],
    skipped: [],
    errors: [],
  };

  for (const source of EXTERNAL_SKILL_SOURCES) {
    await discoverAndImportFromSource(source, result);
  }

  return result;
}
