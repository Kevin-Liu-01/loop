import fs from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import { buildVersionLabel, buildSkillVersionHref } from "@/lib/format";
import { createExcerpt, extractHeadings, slugify, stableHash } from "@/lib/markdown";
import { CATEGORY_REGISTRY } from "@/lib/registry";
import type {
  AgentPrompt,
  AutomationSummary,
  CategorySlug,
  DailySignal,
  ReferenceDoc,
  SkillAutomationState,
  SkillRecord,
  SourceDefinition,
  SourceKind,
  UserSkillCadence,
  UserSkillDocument,
  UserSkillStore,
  UserSkillVersion,
  VersionReference
} from "@/lib/types";

const USER_SKILL_STORE_VERSION = 2;
const USER_SKILL_BLOB_PATH = "skillwire/user-skills.json";
const USER_SKILL_STORE_FILE = path.join(
  process.cwd(),
  "content/generated/skillwire-user-skills.local.json"
);
const CATEGORY_SLUGS = CATEGORY_REGISTRY.map((category) => category.slug) as [
  CategorySlug,
  ...CategorySlug[]
];

const sourceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  url: z.string().url(),
  kind: z.enum(["rss", "atom", "docs", "blog", "github", "watchlist"]),
  tags: z.array(z.string())
});

const automationSchema = z.object({
  enabled: z.boolean(),
  cadence: z.enum(["daily", "weekly", "manual"]),
  status: z.enum(["active", "paused"]),
  prompt: z.string(),
  lastRunAt: z.string().datetime().optional()
});

const updateSchema = z.object({
  generatedAt: z.string().datetime(),
  summary: z.string(),
  whatChanged: z.string(),
  experiments: z.array(z.string()),
  bodyChanged: z.boolean().optional(),
  changedSections: z.array(z.string()).optional(),
  editorModel: z.string().optional(),
  items: z.array(
    z.object({
      title: z.string(),
      url: z.string().url(),
      source: z.string(),
      publishedAt: z.string().datetime(),
      summary: z.string(),
      tags: z.array(z.string())
    })
  )
});

const userSkillVersionSchema = z.object({
  version: z.number().int().min(1),
  updatedAt: z.string().datetime(),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(CATEGORY_SLUGS),
  body: z.string().min(1),
  ownerName: z.string().min(1).optional(),
  tags: z.array(z.string()),
  visibility: z.enum(["public", "member"]),
  sources: z.array(sourceSchema),
  automation: automationSchema,
  updates: z.array(updateSchema)
});

const currentSkillSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(CATEGORY_SLUGS),
  body: z.string().min(1),
  ownerName: z.string().min(1).optional(),
  tags: z.array(z.string()),
  visibility: z.enum(["public", "member"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  sources: z.array(sourceSchema),
  automation: automationSchema,
  updates: z.array(updateSchema),
  version: z.number().int().min(1),
  versions: z.array(userSkillVersionSchema).min(1)
});

const legacySkillSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(CATEGORY_SLUGS),
  body: z.string().min(1),
  ownerName: z.string().min(1).optional(),
  tags: z.array(z.string()),
  visibility: z.enum(["public", "member"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  sources: z.array(sourceSchema),
  automation: automationSchema,
  updates: z.array(updateSchema)
});

export const createUserSkillInputSchema = z.object({
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().min(16).max(220),
  category: z.enum(CATEGORY_SLUGS),
  body: z.string().trim().min(40).max(24000),
  ownerName: z.string().trim().max(48).optional(),
  tags: z.array(z.string().trim().min(1).max(32)).max(8).default([]),
  sourceUrls: z.array(z.string().url()).max(8).default([]),
  autoUpdate: z.boolean().default(true),
  automationCadence: z.enum(["daily", "weekly", "manual"]).default("daily"),
  automationPrompt: z.string().trim().max(240).optional()
});

export type CreateUserSkillInput = z.infer<typeof createUserSkillInputSchema>;
export const updateUserSkillInputSchema = createUserSkillInputSchema.extend({
  slug: z.string().trim().min(1)
});

export type UpdateUserSkillInput = z.infer<typeof updateUserSkillInputSchema>;

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function emptyStore(): UserSkillStore {
  return {
    version: USER_SKILL_STORE_VERSION,
    skills: []
  };
}

function titleCaseFromHost(hostname: string): string {
  return hostname
    .replace(/^www\./, "")
    .split(".")
    .filter((part, index, parts) => index < parts.length - 1)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferSourceKind(url: string): SourceKind {
  const lower = url.toLowerCase();

  if (lower.endsWith(".atom") || lower.includes("/atom")) {
    return "atom";
  }
  if (lower.includes("github.com")) {
    return "github";
  }
  if (lower.includes("/docs") || lower.includes("developers.")) {
    return "docs";
  }
  if (lower.includes("/blog") || lower.includes("blog.")) {
    return "blog";
  }
  if (lower.includes("rss") || lower.includes("feed") || lower.endsWith(".xml")) {
    return "rss";
  }

  return "watchlist";
}

function normalizeTags(input: string[]): string[] {
  return Array.from(
    new Set(
      input
        .map((tag) => slugify(tag))
        .map((tag) => tag.replace(/^-+|-+$/g, ""))
        .filter(Boolean)
    )
  ).slice(0, 8);
}

function normalizeSource(url: string, category: CategorySlug): SourceDefinition {
  const parsed = new URL(url);
  const hostnameLabel = titleCaseFromHost(parsed.hostname) || "Watchlist";
  const pathLabel = parsed.pathname
    .split("/")
    .filter(Boolean)
    .slice(-1)[0]
    ?.replace(/\.(xml|rss|atom|json)$/i, "")
    ?.replace(/[-_]/g, " ");
  const suffix = pathLabel && pathLabel.toLowerCase() !== hostnameLabel.toLowerCase() ? ` ${pathLabel}` : "";
  const label = `${hostnameLabel}${suffix}`.trim();

  return {
    id: stableHash(`${category}:${url}`),
    label,
    url,
    kind: inferSourceKind(url),
    tags: normalizeTags([category, hostnameLabel, pathLabel ?? ""])
  };
}

function buildAutomationPrompt(
  input: Pick<CreateUserSkillInput, "automationPrompt">,
  slug: string
): string {
  const trimmedPrompt = input.automationPrompt?.trim();
  if (trimmedPrompt) {
    return trimmedPrompt;
  }

  return `Refresh $${slug} from the tracked sources. Capture only concrete changes, fold them into the skill, and stay terse.`;
}

function buildAgentPrompt(skill: UserSkillDocument | UserSkillVersion, slug: string): AgentPrompt {
  return {
    provider: "skillwire",
    displayName: "Skillwire default",
    shortDescription: "Base prompt synthesized from the submitted skill and its update rules.",
    defaultPrompt: skill.automation.prompt || `Use $${slug} for this task.`,
    path: `skillwire://skills/${slug}/prompt`
  };
}

function buildSourceReferences(sources: SourceDefinition[]): ReferenceDoc[] {
  return sources.map((source) => ({
    slug: source.id,
    title: source.label,
    path: source.url,
    excerpt: source.tags.join(" · ") || source.kind
  }));
}

function formatCadence(cadence: UserSkillCadence): string {
  if (cadence === "daily") {
    return "Daily";
  }
  if (cadence === "weekly") {
    return "Weekly";
  }

  return "Manual";
}

function toVersionReference(version: UserSkillVersion): VersionReference {
  return {
    version: version.version,
    label: buildVersionLabel(version.version),
    updatedAt: version.updatedAt
  };
}

function buildUserSkillVersion(
  fields: Omit<UserSkillVersion, "version" | "updatedAt">,
  version: number,
  updatedAt: string
): UserSkillVersion {
  return {
    version,
    updatedAt,
    ...fields
  };
}

function latestUserSkillVersion(skill: UserSkillDocument): UserSkillVersion {
  return skill.versions
    .slice()
    .sort((left, right) => right.version - left.version)[0];
}

function materializeUserSkillVersion(skill: UserSkillDocument, requestedVersion?: number): UserSkillVersion {
  if (!requestedVersion) {
    return latestUserSkillVersion(skill);
  }

  return skill.versions.find((version) => version.version === requestedVersion) ?? latestUserSkillVersion(skill);
}

function buildUserSkillBody(version: UserSkillVersion): string {
  const sections = [version.body.trim()];
  const latestUpdate = version.updates[0];

  sections.push(
    [
      "## Update engine",
      "- Mode: fetch -> analyze -> rewrite -> version",
      `- Cadence: ${formatCadence(version.automation.cadence)}`,
      `- Status: ${version.automation.status}`,
      `- Sources tracked: ${version.sources.length}`,
      latestUpdate ? `- Last refresh: ${latestUpdate.generatedAt}` : "- Last refresh: waiting for first pass"
    ].join("\n")
  );

  if (latestUpdate) {
    sections.push(
      [
        "## Latest automated refresh",
        latestUpdate.summary,
        "",
        latestUpdate.whatChanged,
        "",
        `- Body edits: ${latestUpdate.bodyChanged ? "yes" : "no"}`,
        `- Editor: ${latestUpdate.editorModel ?? "heuristic-fallback"}`,
        latestUpdate.changedSections && latestUpdate.changedSections.length > 0
          ? `- Sections changed: ${latestUpdate.changedSections.join(", ")}`
          : "- Sections changed: none recorded",
        "",
        "### Suggested moves",
        ...latestUpdate.experiments.map((experiment) => `- ${experiment}`)
      ].join("\n")
    );
  }

  if (version.sources.length > 0) {
    sections.push(
      [
        "## Tracked sources",
        ...version.sources.map((source) => `- [${source.label}](${source.url}) · ${source.kind}`)
      ].join("\n")
    );
  }

  if (version.updates.length > 0) {
    sections.push(
      [
        "## Recent signal log",
        ...version.updates.slice(0, 3).map((update) => `- ${update.generatedAt}: ${update.summary}`)
      ].join("\n")
    );
  }

  return sections.filter(Boolean).join("\n\n");
}

function normalizeDocument(value: unknown): UserSkillDocument | null {
  const current = currentSkillSchema.safeParse(value);
  if (current.success) {
    const versions = current.data.versions.slice().sort((left, right) => right.version - left.version);
    const latest = versions[0];

    return {
      ...current.data,
      title: latest.title,
      description: latest.description,
      category: latest.category,
      body: latest.body,
      ownerName: latest.ownerName,
      tags: latest.tags,
      visibility: latest.visibility,
      updatedAt: latest.updatedAt,
      sources: latest.sources,
      automation: latest.automation,
      updates: latest.updates,
      version: latest.version,
      versions
    };
  }

  const legacy = legacySkillSchema.safeParse(value);
  if (!legacy.success) {
    return null;
  }

  const migratedVersion = buildUserSkillVersion(
    {
      title: legacy.data.title,
      description: legacy.data.description,
      category: legacy.data.category,
      body: legacy.data.body,
      ownerName: legacy.data.ownerName,
      tags: legacy.data.tags,
      visibility: legacy.data.visibility,
      sources: legacy.data.sources,
      automation: legacy.data.automation,
      updates: legacy.data.updates
    },
    1,
    legacy.data.updatedAt
  );

  return {
    ...legacy.data,
    version: 1,
    versions: [migratedVersion]
  };
}

function normalizeStore(value: unknown): UserSkillStore {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyStore();
  }

  const skills = Array.isArray((value as { skills?: unknown[] }).skills)
    ? (value as { skills: unknown[] }).skills
        .map(normalizeDocument)
        .filter((skill): skill is UserSkillDocument => skill !== null)
    : [];

  return {
    version: USER_SKILL_STORE_VERSION,
    skills
  };
}

function cloneVersion(version: UserSkillVersion): UserSkillVersion {
  return {
    ...version,
    tags: [...version.tags],
    sources: version.sources.map((source) => ({ ...source, tags: [...source.tags] })),
    automation: { ...version.automation },
    updates: version.updates.map((update) => ({
      ...update,
      experiments: [...update.experiments],
      changedSections: update.changedSections ? [...update.changedSections] : undefined,
      items: update.items.map((item) => ({ ...item, tags: [...item.tags] }))
    }))
  };
}

export function isUserSkillAutomationDue(skill: UserSkillDocument, now = new Date()): boolean {
  if (!skill.automation.enabled || skill.automation.status !== "active" || skill.sources.length === 0) {
    return false;
  }

  if (skill.automation.cadence === "manual") {
    return false;
  }

  const lastRunAt = skill.automation.lastRunAt ? new Date(skill.automation.lastRunAt) : null;
  if (!lastRunAt || Number.isNaN(lastRunAt.valueOf())) {
    return true;
  }

  const elapsedMs = now.valueOf() - lastRunAt.valueOf();
  const thresholdMs = skill.automation.cadence === "daily" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  return elapsedMs >= thresholdMs;
}

export function createUserSkillDocument(input: CreateUserSkillInput, now = new Date()): UserSkillDocument {
  const parsed = createUserSkillInputSchema.parse({
    ...input,
    ownerName: input.ownerName?.trim() || undefined,
    tags: normalizeTags(input.tags),
    sourceUrls: Array.from(new Set(input.sourceUrls.map((url) => url.trim()).filter(Boolean)))
  });

  const slugBase = slugify(parsed.title) || `skill-${stableHash(parsed.title)}`;
  const createdAt = now.toISOString();
  const sources = parsed.sourceUrls.map((url) => normalizeSource(url, parsed.category));
  const automationEnabled = parsed.autoUpdate && parsed.sourceUrls.length > 0;
  const latestVersion = buildUserSkillVersion(
    {
      title: parsed.title,
      description: parsed.description,
      category: parsed.category,
      body: parsed.body,
      ownerName: parsed.ownerName,
      tags: normalizeTags([parsed.category, ...parsed.tags, "community"]),
      visibility: "public",
      sources,
      automation: {
        enabled: automationEnabled,
        cadence: automationEnabled ? parsed.automationCadence : "manual",
        status: automationEnabled ? "active" : "paused",
        prompt: buildAutomationPrompt(parsed, slugBase)
      },
      updates: []
    },
    1,
    createdAt
  );

  return {
    slug: slugBase,
    title: latestVersion.title,
    description: latestVersion.description,
    category: latestVersion.category,
    body: latestVersion.body,
    ownerName: latestVersion.ownerName,
    tags: latestVersion.tags,
    visibility: latestVersion.visibility,
    createdAt,
    updatedAt: createdAt,
    sources: latestVersion.sources,
    automation: latestVersion.automation,
    updates: latestVersion.updates,
    version: 1,
    versions: [latestVersion]
  };
}

export async function addTrackedSkillFromRecord(
  skill: SkillRecord,
  categorySources: SourceDefinition[],
  now = new Date()
): Promise<UserSkillDocument> {
  const store = await readUserSkillStore();
  const existing = store.skills.find((entry) => entry.slug === skill.slug);
  if (existing) {
    return existing;
  }

  const createdAt = now.toISOString();
  const sources = categorySources.map((source) => normalizeSource(source.url, skill.category));
  const automationEnabled = sources.length > 0;
  const latestVersion = buildUserSkillVersion(
    {
      title: skill.title,
      description: skill.description,
      category: skill.category,
      body: skill.body,
      ownerName: skill.ownerName,
      tags: normalizeTags([skill.category, ...skill.tags, "tracked"]),
      visibility: skill.visibility,
      sources,
      automation: {
        enabled: automationEnabled,
        cadence: automationEnabled ? "daily" : "manual",
        status: automationEnabled ? "active" : "paused",
        prompt: `Refresh $${skill.slug} from the tracked sources. Capture only concrete changes, fold them into the skill, and stay terse.`
      },
      updates: []
    },
    1,
    createdAt
  );

  const document: UserSkillDocument = {
    slug: skill.slug,
    title: latestVersion.title,
    description: latestVersion.description,
    category: latestVersion.category,
    body: latestVersion.body,
    ownerName: latestVersion.ownerName,
    tags: latestVersion.tags,
    visibility: latestVersion.visibility,
    createdAt,
    updatedAt: createdAt,
    sources: latestVersion.sources,
    automation: latestVersion.automation,
    updates: latestVersion.updates,
    version: 1,
    versions: [latestVersion]
  };

  await writeUserSkillStore({
    version: USER_SKILL_STORE_VERSION,
    skills: [document, ...store.skills]
  });

  return document;
}

function buildEditableTags(existing: string[], category: CategorySlug, nextTags: string[]): string[] {
  const marker = existing.includes("tracked") ? "tracked" : existing.includes("community") ? "community" : "community";
  const filtered = nextTags.filter((tag) => tag !== "tracked" && tag !== "community");
  return normalizeTags([category, ...filtered, marker]);
}

function sameSourceList(left: SourceDefinition[], right: SourceDefinition[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sameAutomation(left: SkillAutomationState, right: SkillAutomationState): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function updateUserSkillDocument(
  skill: UserSkillDocument,
  input: UpdateUserSkillInput,
  now = new Date()
): { skill: UserSkillDocument; changed: boolean } {
  if (input.slug !== skill.slug) {
    throw new Error("The requested skill slug does not match the current document.");
  }

  const parsed = updateUserSkillInputSchema.parse({
    ...input,
    ownerName: input.ownerName?.trim() || undefined,
    tags: normalizeTags(input.tags),
    sourceUrls: Array.from(new Set(input.sourceUrls.map((url) => url.trim()).filter(Boolean)))
  });

  const nextSources = parsed.sourceUrls.map((url) => normalizeSource(url, parsed.category));
  const automationEnabled = parsed.autoUpdate && nextSources.length > 0;
  const nextAutomation: SkillAutomationState = {
    enabled: automationEnabled,
    cadence: automationEnabled ? parsed.automationCadence : "manual",
    status: automationEnabled ? "active" : "paused",
    prompt: buildAutomationPrompt(parsed, skill.slug),
    lastRunAt: skill.automation.lastRunAt
  };
  const nextTags = buildEditableTags(skill.tags, parsed.category, parsed.tags);

  const changed =
    skill.title !== parsed.title ||
    skill.description !== parsed.description ||
    skill.category !== parsed.category ||
    skill.body !== parsed.body ||
    skill.ownerName !== parsed.ownerName ||
    JSON.stringify(skill.tags) !== JSON.stringify(nextTags) ||
    !sameSourceList(skill.sources, nextSources) ||
    !sameAutomation(skill.automation, nextAutomation);

  if (!changed) {
    return { skill, changed: false };
  }

  const updatedAt = now.toISOString();
  const nextSkill = createNextUserSkillVersion(
    skill,
    {
      title: parsed.title,
      description: parsed.description,
      category: parsed.category,
      body: parsed.body,
      ownerName: parsed.ownerName,
      tags: nextTags,
      visibility: skill.visibility,
      sources: nextSources,
      automation: nextAutomation,
      updates: skill.updates
    },
    updatedAt
  );

  return {
    skill: nextSkill,
    changed: true
  };
}

async function readStoreFromBlob(): Promise<UserSkillStore | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return null;
  }

  try {
    const { list } = await import("@vercel/blob");
    const result = await list({
      limit: 10,
      prefix: USER_SKILL_BLOB_PATH
    });
    const blob = result.blobs.find((entry) => entry.pathname === USER_SKILL_BLOB_PATH);
    if (!blob) {
      return null;
    }

    const response = await fetch(blob.url, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    return normalizeStore(await response.json());
  } catch {
    return null;
  }
}

async function readStoreFromFile(): Promise<UserSkillStore | null> {
  if (!(await pathExists(USER_SKILL_STORE_FILE))) {
    return null;
  }

  try {
    return normalizeStore(JSON.parse(await fs.readFile(USER_SKILL_STORE_FILE, "utf8")));
  } catch {
    return null;
  }
}

export async function readUserSkillStore(): Promise<UserSkillStore> {
  const remoteStore = await readStoreFromBlob();
  if (remoteStore) {
    return remoteStore;
  }

  return (await readStoreFromFile()) ?? emptyStore();
}

export async function writeUserSkillStore(store: UserSkillStore): Promise<void> {
  const normalized = normalizeStore(store);
  const payload = JSON.stringify(normalized, null, 2);

  await fs.mkdir(path.dirname(USER_SKILL_STORE_FILE), { recursive: true });
  await fs.writeFile(USER_SKILL_STORE_FILE, payload);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    await put(USER_SKILL_BLOB_PATH, payload, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json"
    });
  }
}

export async function listUserSkillDocuments(): Promise<UserSkillDocument[]> {
  const store = await readUserSkillStore();
  return [...store.skills].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function saveUserSkillDocuments(skills: UserSkillDocument[]): Promise<void> {
  await writeUserSkillStore({
    version: USER_SKILL_STORE_VERSION,
    skills
  });
}

export async function addUserSkill(input: CreateUserSkillInput): Promise<UserSkillDocument> {
  const store = await readUserSkillStore();
  const document = createUserSkillDocument(input);

  if (store.skills.some((skill) => skill.slug === document.slug)) {
    throw new Error("A user skill with that slug already exists.");
  }

  await writeUserSkillStore({
    version: USER_SKILL_STORE_VERSION,
    skills: [document, ...store.skills]
  });

  return document;
}

export function createNextUserSkillVersion(
  skill: UserSkillDocument,
  next: Omit<UserSkillVersion, "version" | "updatedAt">,
  updatedAt: string
): UserSkillDocument {
  const versionNumber = skill.version + 1;
  const snapshot = buildUserSkillVersion(next, versionNumber, updatedAt);

  return {
    ...skill,
    title: snapshot.title,
    description: snapshot.description,
    category: snapshot.category,
    body: snapshot.body,
    ownerName: snapshot.ownerName,
    tags: snapshot.tags,
    visibility: snapshot.visibility,
    updatedAt,
    sources: snapshot.sources,
    automation: snapshot.automation,
    updates: snapshot.updates,
    version: versionNumber,
    versions: [snapshot, ...skill.versions.map(cloneVersion)]
      .sort((left, right) => right.version - left.version)
  };
}

export function buildUserSkillAutomation(skill: UserSkillDocument): AutomationSummary | null {
  if (!skill.automation.enabled) {
    return null;
  }

  return {
    id: `user:${skill.slug}`,
    name: `${skill.title} refresh`,
    prompt: skill.automation.prompt,
    schedule: formatCadence(skill.automation.cadence),
    status: skill.automation.status.toUpperCase(),
    path: `skillwire://skills/${skill.slug}/automation`,
    cwd: [],
    matchedSkillSlugs: [skill.slug],
    matchedCategorySlugs: [skill.category]
  };
}

export function buildUserSkillRecord(skill: UserSkillDocument, requestedVersion?: number): SkillRecord {
  const version = materializeUserSkillVersion(skill, requestedVersion);
  const body = buildUserSkillBody(version);
  const category = CATEGORY_REGISTRY.find((entry) => entry.slug === version.category);
  const latestUpdate = version.updates[0];

  return {
    slug: skill.slug,
    title: version.title,
    description: latestUpdate?.summary ?? version.description,
    category: version.category,
    accent: category?.accent ?? "signal-red",
    featured: false,
    visibility: version.visibility,
    origin: "user",
    href: buildSkillVersionHref(skill.slug, version.version),
    path: `skillwire://community-skills/${skill.slug}`,
    relativeDir: `community/${skill.slug}`,
    updatedAt: version.updatedAt,
    tags: normalizeTags(version.tags),
    headings: extractHeadings(body),
    body,
    excerpt: createExcerpt(body),
    references: buildSourceReferences(version.sources),
    agents: [buildAgentPrompt(version, skill.slug)],
    automations: [],
    version: version.version,
    versionLabel: buildVersionLabel(version.version),
    availableVersions: skill.versions
      .slice()
      .sort((left, right) => right.version - left.version)
      .map(toVersionReference),
    ownerName: version.ownerName,
    sources: version.sources,
    automation: version.automation,
    updates: version.updates
  };
}

export function buildSkillUpdateSignals(
  skill: UserSkillDocument
): Array<{ label: string; items: DailySignal[] }> {
  return skill.updates.map((update) => ({
    label: update.generatedAt,
    items: update.items
  }));
}

export function getUserSkillVersion(skill: UserSkillDocument, requestedVersion?: number): UserSkillVersion {
  return materializeUserSkillVersion(skill, requestedVersion);
}
