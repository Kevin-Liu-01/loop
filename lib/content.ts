import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import matter from "gray-matter";
import YAML from "yaml";

import { parseAgentDocs } from "@/lib/agent-docs";
import { DEFAULT_PREFERRED_HOUR } from "@/lib/automation-constants";
import { formatScheduleLabel } from "@/lib/schedule";
import {
  listSkills as dbListSkills,
  getSkillBySlug as dbGetSkillBySlug,
  getSkillAtVersion as dbGetSkillAtVersion
} from "@/lib/db/skills";
import { listCategories as dbListCategories } from "@/lib/db/categories";
import {
  listMcps as dbListMcps,
  getMcpByName as dbGetMcpByName,
  getMcpAtVersion as dbGetMcpAtVersion
} from "@/lib/db/mcps";
import { listBriefs as dbListBriefs } from "@/lib/db/briefs";
import { buildSkillVersionHref, buildVersionLabel } from "@/lib/format";
import { createExcerpt, extractHeadings, slugify } from "@/lib/markdown";
import {
  CATEGORY_REGISTRY,
  FEATURED_SKILLS,
  MEMBERSHIP_PLANS,
  SKILL_OVERRIDES
} from "@/lib/registry";
import type {
  AgentPrompt,
  AutomationSummary,
  CategorySlug,
  ImportedMcpDocument,
  ReferenceDoc,
  SkillRecord,
  LoopSnapshot
} from "@/lib/types";

const WORKSPACE_ROOT = process.cwd();
const CODEX_ROOT = path.join(os.homedir(), ".codex");
const CODEX_SKILLS_ROOT = path.join(CODEX_ROOT, "skills");

const IGNORE_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  "node_modules",
  "output",
  "public",
  "app",
  "components",
  "lib"
]);

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function findSkillFiles(rootDir: string): Promise<string[]> {
  if (!(await pathExists(rootDir))) {
    return [];
  }

  const discovered: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    await Promise.all(
      entries.map(async (entry) => {
        const absolutePath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          if (IGNORE_DIRS.has(entry.name)) {
            return;
          }

          await walk(absolutePath);
          return;
        }

        if (entry.isFile() && entry.name === "SKILL.md") {
          discovered.push(absolutePath);
        }
      })
    );
  }

  await walk(rootDir);
  return discovered.sort();
}

function inferCategory(slug: string, content: string, skillFile: string): CategorySlug {
  const override = SKILL_OVERRIDES[slug];
  if (override) {
    return override.category;
  }

  if (
    skillFile.includes("frontend-frontier-pack/third-party-skills") ||
    skillFile.includes("frontend-frontier-pack/codex-skill/frontend-frontier") ||
    /^(frontend-frontier|animated-component-libraries|animejs|barba-js|gsap-scrolltrigger|lightweight-3d-effects|locomotive-scroll|lottie-animations|modern-web-design|motion-framer|pixijs-2d|playcanvas-engine|react-spring-physics|react-three-fiber|rive-interactive|scroll-reveal-libraries|spline-interactive|threejs-webgl|aframe-webxr|babylonjs-engine|blender-web-pipeline|substance-3d-texturing|web3d-integration-patterns)$/.test(
      slug
    )
  ) {
    return "frontend";
  }

  const haystack = `${slug} ${content}`.toLowerCase();
  if (/^(seo-geo)$/.test(slug) || /(seo|geo|aeo|schema|crawl|citability)/.test(haystack)) {
    return "seo-geo";
  }
  if (/^(social-content-os|social-draft)$/.test(slug) || /(social|linkedin|twitter|x rules|post|audience)/.test(haystack)) {
    return "social";
  }
  if (/^security-/.test(slug) || /(security|auth|threat|abuse|hardening)/.test(haystack)) {
    return "security";
  }
  if (/^(linear|gh-fix-ci|gh-address-comments|yeet|recent-code-bugfix)$/.test(slug) || /(linear|github|ci|workflow|issue|automation)/.test(haystack)) {
    return "ops";
  }
  if (/(agent|a2a|tool orchestration|mcp|orchestration)/.test(haystack)) {
    return "a2a";
  }
  if (/(docker|container|kubernetes|oci|podman)/.test(haystack)) {
    return "containers";
  }
  if (/(infra|cloud|serverless|edge|deploy|database)/.test(haystack)) {
    return "infra";
  }
  return "frontend";
}

async function parseAgentPrompts(skillDir: string): Promise<AgentPrompt[]> {
  const agentsDir = path.join(skillDir, "agents");
  if (!(await pathExists(agentsDir))) {
    return [];
  }

  const files = (await fs.readdir(agentsDir)).filter((file) => file.endsWith(".yaml"));
  const prompts = await Promise.all(
    files.map(async (fileName) => {
      const absolutePath = path.join(agentsDir, fileName);
      const raw = await fs.readFile(absolutePath, "utf8");
      const parsed = YAML.parse(raw) as {
        interface?: {
          display_name?: string;
          short_description?: string;
          default_prompt?: string;
        };
      };

      return {
        provider: fileName.replace(/\.yaml$/, ""),
        displayName: parsed.interface?.display_name ?? "Agent prompt",
        shortDescription: parsed.interface?.short_description ?? "",
        defaultPrompt: parsed.interface?.default_prompt ?? "",
        path: absolutePath
      } satisfies AgentPrompt;
    })
  );

  return prompts;
}

async function parseReferences(skillDir: string): Promise<ReferenceDoc[]> {
  const referencesDir = path.join(skillDir, "references");
  if (!(await pathExists(referencesDir))) {
    return [];
  }

  const files = (await fs.readdir(referencesDir))
    .filter((fileName) => fileName.endsWith(".md"))
    .sort();

  return Promise.all(
    files.map(async (fileName) => {
      const absolutePath = path.join(referencesDir, fileName);
      const raw = await fs.readFile(absolutePath, "utf8");
      const titleMatch = /^#\s+(.+)$/m.exec(raw);

      return {
        slug: fileName.replace(/\.md$/, ""),
        title: titleMatch?.[1]?.trim() ?? fileName.replace(/\.md$/, ""),
        path: absolutePath,
        excerpt: createExcerpt(raw, 160)
      } satisfies ReferenceDoc;
    })
  );
}

export async function parseSkill(skillFile: string): Promise<SkillRecord> {
  const raw = await fs.readFile(skillFile, "utf8");
  const stats = await fs.stat(skillFile);
  const skillDir = path.dirname(skillFile);
  const { data, content } = matter(raw);

  const slug = String(data.name ?? path.basename(skillDir));
  const title =
    raw.match(/^#\s+(.+)$/m)?.[1]?.trim() ??
    slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  const description = String(data.description ?? createExcerpt(content, 160));
  const category = inferCategory(slug, `${description}\n${content}`, skillFile);
  const override = SKILL_OVERRIDES[slug];
  const origin = skillFile.startsWith(CODEX_ROOT) ? "codex" : "repo";

  const [references, agents, agentDocs] = await Promise.all([
    parseReferences(skillDir),
    parseAgentPrompts(skillDir),
    parseAgentDocs(skillDir)
  ]);

  return {
    slug,
    title,
    description,
    category,
    accent: override?.accent ?? CATEGORY_REGISTRY.find((entry) => entry.slug === category)?.accent ?? "signal-red",
    featured: FEATURED_SKILLS.has(slug),
    visibility: override?.visibility ?? "public",
    origin,
    href: buildSkillVersionHref(slug, 1),
    path: skillFile,
    relativeDir: path.relative(WORKSPACE_ROOT, skillDir),
    updatedAt: stats.mtime.toISOString(),
    tags: Array.from(
      new Set([
        category,
        ...(override?.tags ?? []),
        ...extractHeadings(content)
          .slice(0, 4)
          .map((heading) => slugify(heading.title))
      ])
    ),
    headings: extractHeadings(content),
    body: content.trim(),
    excerpt: createExcerpt(content),
    references,
    agents,
    agentDocs,
    automations: [],
    version: 1,
    versionLabel: buildVersionLabel(1),
    availableVersions: [
      {
        version: 1,
        label: buildVersionLabel(1),
        updatedAt: stats.mtime.toISOString()
      }
    ]
  };
}

/**
 * Derive AutomationSummary objects from skills that have automation config.
 * Replaces the old TOML-based parseAutomations() + attachAutomations() pipeline.
 */
function deriveAutomationsFromSkills(
  skills: SkillRecord[]
): { skills: SkillRecord[]; automations: AutomationSummary[] } {
  const allAutomations: AutomationSummary[] = [];

  const enrichedSkills = skills.map((skill) => {
    const auto = skill.automation;
    if (!auto) return skill;

    const summary: AutomationSummary = {
      id: skill.slug,
      name: `${skill.title} refresh`,
      prompt: auto.prompt || `Refresh ${skill.title} from tracked sources.`,
      schedule: formatScheduleLabel(auto.cadence, auto.preferredHour ?? DEFAULT_PREFERRED_HOUR, auto.preferredDay),
      cadence: auto.cadence,
      status: auto.enabled ? "ACTIVE" : "PAUSED",
      path: "",
      cwd: [],
      matchedSkillSlugs: [skill.slug],
      matchedCategorySlugs: [skill.category],
      preferredModel: auto.preferredModel,
      preferredHour: auto.preferredHour,
      preferredDay: auto.preferredDay,
    };

    allAutomations.push(summary);

    return { ...skill, automations: [summary] };
  });

  return {
    skills: enrichedSkills.sort((a, b) => a.title.localeCompare(b.title)),
    automations: allAutomations.sort((a, b) => a.name.localeCompare(b.name))
  };
}

// ---------------------------------------------------------------------------
// Primary DB-backed queries (replaces snapshot assembly)
// ---------------------------------------------------------------------------

export async function getSkillCatalogue(options?: {
  includePrivate?: boolean;
}): Promise<
  Omit<LoopSnapshot, "dailyBriefs" | "generatedAt" | "generatedFrom">
> {
  const [skills, categories, mcps] = await Promise.all([
    options?.includePrivate
      ? dbListSkills()
      : dbListSkills({ visibility: "public" }),
    dbListCategories(),
    dbListMcps()
  ]);

  const derived = deriveAutomationsFromSkills(skills);

  return {
    categories: categories.length > 0 ? categories : CATEGORY_REGISTRY,
    skills: derived.skills,
    mcps,
    automations: derived.automations,
    plans: MEMBERSHIP_PLANS
  };
}

/** @deprecated Use getSkillCatalogue() instead */
export const getLocalSnapshotBase = getSkillCatalogue;

export async function getSkillRecordBySlug(
  slug: string,
  requestedVersion?: number
): Promise<SkillRecord | null> {
  if (requestedVersion) {
    return dbGetSkillAtVersion(slug, requestedVersion);
  }
  return dbGetSkillBySlug(slug);
}

export async function getLoopSnapshot(options?: {
  includePrivate?: boolean;
}): Promise<LoopSnapshot> {
  const [catalogue, briefs] = await Promise.all([
    getSkillCatalogue({ includePrivate: options?.includePrivate }),
    dbListBriefs()
  ]);

  return {
    ...catalogue,
    dailyBriefs: briefs,
    generatedAt: new Date().toISOString(),
    generatedFrom: "remote-refresh"
  };
}

export async function getMcpRecordByName(
  name: string,
  requestedVersion?: number
): Promise<ImportedMcpDocument | null> {
  if (requestedVersion) {
    return dbGetMcpAtVersion(name, requestedVersion);
  }
  return dbGetMcpByName(name);
}

// ---------------------------------------------------------------------------
// Filesystem helpers (kept for sync/migration)
// ---------------------------------------------------------------------------

export {
  WORKSPACE_ROOT,
  CODEX_SKILLS_ROOT,
  CODEX_ROOT
};
