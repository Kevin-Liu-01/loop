import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import matter from "gray-matter";
import { parse as parseToml } from "smol-toml";
import YAML from "yaml";

import { buildSkillVersionHref, buildVersionLabel } from "@/lib/format";
import { createExcerpt, extractHeadings, slugify } from "@/lib/markdown";
import {
  CATEGORY_REGISTRY,
  FEATURED_SKILLS,
  MEMBERSHIP_PLANS,
  SKILL_OVERRIDES
} from "@/lib/registry";
import { buildImportedSkillRecord, listImportedMcps, listImportedSkills } from "@/lib/imports";
import {
  buildUserSkillAutomation,
  buildUserSkillRecord,
  listUserSkillDocuments
} from "@/lib/user-skills";
import type {
  AgentPrompt,
  AutomationSummary,
  CategoryDefinition,
  CategorySlug,
  ReferenceDoc,
  SkillRecord,
  SkillwireSnapshot
} from "@/lib/types";

const WORKSPACE_ROOT = process.cwd();
const CODEX_ROOT = path.join(os.homedir(), ".codex");
const CODEX_SKILLS_ROOT = path.join(CODEX_ROOT, "skills");
const AUTOMATIONS_ROOT = path.join(CODEX_ROOT, "automations");
const SNAPSHOT_FILE = path.join(WORKSPACE_ROOT, "content/generated/skillwire-snapshot.local.json");

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

async function findSkillFiles(rootDir: string): Promise<string[]> {
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

async function parseSkill(skillFile: string): Promise<SkillRecord> {
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
    references: await parseReferences(skillDir),
    agents: await parseAgentPrompts(skillDir),
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

async function parseAutomations(): Promise<AutomationSummary[]> {
  if (!(await pathExists(AUTOMATIONS_ROOT))) {
    return [];
  }

  const entries = await fs.readdir(AUTOMATIONS_ROOT);

  const items: Array<AutomationSummary | null> = await Promise.all(
    entries.map(async (entry) => {
      const automationPath = path.join(AUTOMATIONS_ROOT, entry, "automation.toml");
      if (!(await pathExists(automationPath))) {
        return null;
      }

      const raw = await fs.readFile(automationPath, "utf8");
      const parsed = parseToml(raw) as {
        id?: string;
        name?: string;
        prompt?: string;
        rrule?: string;
        status?: string;
        cwds?: string[];
      };

      return {
        id: parsed.id ?? entry,
        name: parsed.name ?? entry,
        prompt: parsed.prompt ?? "",
        schedule: parsed.rrule ?? "",
        status: parsed.status ?? "ACTIVE",
        path: automationPath,
        cwd: parsed.cwds ?? [],
        matchedSkillSlugs: [],
        matchedCategorySlugs: []
      } satisfies AutomationSummary;
    })
  );

  return items.filter((item): item is AutomationSummary => item !== null);
}

function getSkillOriginPriority(skill: SkillRecord): number {
  switch (skill.origin) {
    case "user":
      return 4;
    case "remote":
      return 3;
    case "repo":
      return 2;
    case "codex":
      return 1;
    default:
      return 0;
  }
}

function shouldReplaceSkillRecord(existing: SkillRecord | undefined, incoming: SkillRecord): boolean {
  if (!existing) {
    return true;
  }

  const existingPriority = getSkillOriginPriority(existing);
  const incomingPriority = getSkillOriginPriority(incoming);

  if (incomingPriority !== existingPriority) {
    return incomingPriority > existingPriority;
  }

  if (incoming.version !== existing.version) {
    return incoming.version > existing.version;
  }

  return +new Date(incoming.updatedAt) >= +new Date(existing.updatedAt);
}

function attachAutomations(
  skills: SkillRecord[],
  automations: AutomationSummary[],
  categories: CategoryDefinition[]
): { skills: SkillRecord[]; automations: AutomationSummary[] } {
  const enrichedAutomations = automations.map((automation) => {
    const promptHaystack = automation.prompt.toLowerCase();
    const cwdHaystack = automation.cwd.join(" ").toLowerCase();

    const matchedSkillSlugs = skills
      .filter((skill) => {
        return (
          promptHaystack.includes(`$${skill.slug}`) ||
          promptHaystack.includes(skill.slug) ||
          cwdHaystack.includes(skill.slug) ||
          automation.cwd.some((cwd) => skill.path.startsWith(cwd))
        );
      })
      .map((skill) => skill.slug);

    const matchedCategorySlugs = categories
      .filter((category) => {
        if (promptHaystack.includes(category.slug) || cwdHaystack.includes(category.slug)) {
          return true;
        }

        return category.keywords.some((keyword) => promptHaystack.includes(keyword));
      })
      .map((category) => category.slug);

    return {
      ...automation,
      matchedSkillSlugs,
      matchedCategorySlugs
    };
  });

  const skillMap = new Map<string, SkillRecord>(
    skills.map((skill) => {
      const skillAutomations = enrichedAutomations.filter((automation) =>
        automation.matchedSkillSlugs.includes(skill.slug)
      );

      return [skill.slug, { ...skill, automations: skillAutomations }];
    })
  );

  return {
    skills: Array.from(skillMap.values()).sort((left, right) => left.title.localeCompare(right.title)),
    automations: enrichedAutomations.sort((left, right) => left.name.localeCompare(right.name))
  };
}

export async function getLocalSnapshotBase(): Promise<
  Omit<SkillwireSnapshot, "dailyBriefs" | "generatedAt" | "generatedFrom">
> {
  const repoSkillFiles = await findSkillFiles(WORKSPACE_ROOT);
  const codexSkillFiles = await findSkillFiles(CODEX_SKILLS_ROOT);
  const parsedSkills = await Promise.all([...repoSkillFiles, ...codexSkillFiles].map(parseSkill));
  const userSkillDocuments = await listUserSkillDocuments();
  const importedSkills = await listImportedSkills();
  const importedMcps = await listImportedMcps();
  const userSkillRecords = userSkillDocuments.map(buildUserSkillRecord);
  const importedSkillRecords = importedSkills.map(buildImportedSkillRecord);
  const dedupedSkills = Array.from(
    [...parsedSkills, ...userSkillRecords, ...importedSkillRecords].reduce((map, skill) => {
      const existing = map.get(skill.slug);
      if (shouldReplaceSkillRecord(existing, skill)) {
        map.set(skill.slug, skill);
      }

      return map;
    }, new Map<string, SkillRecord>()).values()
  );
  const categories = CATEGORY_REGISTRY;
  const automations = [
    ...(await parseAutomations()),
    ...userSkillDocuments.map(buildUserSkillAutomation).filter((item): item is AutomationSummary => item !== null)
  ];
  const attached = attachAutomations(dedupedSkills, automations, categories);

  return {
    categories,
    skills: attached.skills,
    mcps: importedMcps,
    automations: attached.automations,
    plans: MEMBERSHIP_PLANS
  };
}

export async function getSkillRecordBySlug(
  slug: string,
  requestedVersion?: number
): Promise<SkillRecord | null> {
  const base = await getLocalSnapshotBase();
  const skill = base.skills.find((entry) => entry.slug === slug);

  if (!skill) {
    return null;
  }

  if (skill.origin === "user") {
    const documents = await listUserSkillDocuments();
    const document = documents.find((entry) => entry.slug === slug);
    if (!document) {
      return null;
    }

    const record = buildUserSkillRecord(document, requestedVersion);
    return requestedVersion && !record.availableVersions.some((version) => version.version === requestedVersion)
      ? null
      : {
          ...record,
          automations: skill.automations
        };
  }

  if (skill.origin === "remote") {
    const documents = await listImportedSkills();
    const document = documents.find((entry) => entry.slug === slug);
    if (!document) {
      return null;
    }

    const record = buildImportedSkillRecord(document, requestedVersion);
    return requestedVersion && !record.availableVersions.some((version) => version.version === requestedVersion)
      ? null
      : {
          ...record,
          automations: skill.automations
        };
  }

  if (requestedVersion && requestedVersion !== 1) {
    return null;
  }

  return skill;
}

export async function readLocalSnapshotFile(): Promise<SkillwireSnapshot | null> {
  if (!(await pathExists(SNAPSHOT_FILE))) {
    return null;
  }

  const raw = await fs.readFile(SNAPSHOT_FILE, "utf8");
  const parsed = JSON.parse(raw) as Partial<SkillwireSnapshot>;
  if (!parsed.skills || !parsed.categories || !parsed.automations || !parsed.dailyBriefs || !parsed.plans) {
    return null;
  }

  const hasVersionedSkills = parsed.skills.every(
    (skill) =>
      typeof skill?.version === "number" &&
      typeof skill?.versionLabel === "string" &&
      typeof skill?.href === "string" &&
      Array.isArray(skill?.availableVersions)
  );
  const hasVersionedMcps = (parsed.mcps ?? []).every(
    (mcp) =>
      typeof mcp?.version === "number" &&
      typeof mcp?.versionLabel === "string" &&
      Array.isArray(mcp?.versions)
  );
  if (!hasVersionedSkills || !hasVersionedMcps) {
    return null;
  }

  return {
    ...parsed,
    mcps: parsed.mcps ?? []
  } as SkillwireSnapshot;
}

export async function writeLocalSnapshotFile(snapshot: SkillwireSnapshot): Promise<void> {
  await fs.mkdir(path.dirname(SNAPSHOT_FILE), { recursive: true });
  await fs.writeFile(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
}
