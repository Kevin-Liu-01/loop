import { z } from "zod";

import { DEFAULT_PREFERRED_HOUR } from "@/lib/automation-constants";
import { formatScheduleLabel } from "@/lib/schedule";
import {
  createSkill as dbCreateSkill,
  getSkillBySlug as dbGetSkillBySlug,
  getSkillIdBySlug,
  listSkills as dbListSkills,
  updateSkill as dbUpdateSkill
} from "@/lib/db/skills";
import {
  createSkillVersion as dbCreateSkillVersion,
  getSkillVersions as dbGetSkillVersions
} from "@/lib/db/skill-versions";
import { buildVersionLabel, buildSkillVersionHref } from "@/lib/format";
import { createExcerpt, extractHeadings, slugify, stableHash } from "@/lib/markdown";
import { CATEGORY_REGISTRY } from "@/lib/registry";
import type {
  AgentDocs,
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
  UserSkillVersion,
  VersionReference
} from "@/lib/types";

const CATEGORY_SLUGS = CATEGORY_REGISTRY.map((category) => category.slug) as [
  CategorySlug,
  ...CategorySlug[]
];

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const sourceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  url: z.string().url(),
  kind: z.enum(["rss", "atom", "docs", "blog", "github", "watchlist"]),
  tags: z.array(z.string())
});

export const AUTOMATION_PROMPT_MAX_LENGTH = 600;

const automationSchema = z.object({
  enabled: z.boolean(),
  cadence: z.enum(["daily", "weekly", "manual"]),
  status: z.enum(["active", "paused"]),
  prompt: z.string(),
  lastRunAt: z.string().datetime().optional()
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
  automationPrompt: z.string().trim().max(AUTOMATION_PROMPT_MAX_LENGTH).optional(),
  preferredHour: z.number().int().min(0).max(23).optional(),
  preferredDay: z.number().int().min(0).max(6).optional(),
  agentDocs: z.record(z.string()).optional(),
  price: z.object({ amount: z.number(), currency: z.string() }).nullable().optional(),
  visibility: z.enum(["public", "private"]).optional().default("private"),
});

export type CreateUserSkillInput = z.input<typeof createUserSkillInputSchema>;

export const updateUserSkillInputSchema = createUserSkillInputSchema.extend({
  slug: z.string().trim().min(1)
});

export type UpdateUserSkillInput = z.input<typeof updateUserSkillInputSchema>;

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

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

  if (lower.endsWith(".atom") || lower.includes("/atom")) return "atom";
  if (lower.includes("github.com")) return "github";
  if (lower.includes("/docs") || lower.includes("developers.")) return "docs";
  if (lower.includes("/blog") || lower.includes("blog.")) return "blog";
  if (lower.includes("rss") || lower.includes("feed") || lower.endsWith(".xml")) return "rss";

  return "watchlist";
}

export function normalizeTags(input: string[]): string[] {
  return Array.from(
    new Set(
      input
        .map((tag) => slugify(tag))
        .map((tag) => tag.replace(/^-+|-+$/g, ""))
        .filter(Boolean)
    )
  ).slice(0, 8);
}

export function normalizeSource(url: string, category: CategorySlug): SourceDefinition {
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

export function buildAutomationPrompt(
  input: Pick<CreateUserSkillInput, "automationPrompt">,
  slug: string
): string {
  const trimmedPrompt = input.automationPrompt?.trim();
  if (trimmedPrompt) return trimmedPrompt;
  return `Refresh $${slug} from the tracked sources. Capture only concrete changes, fold them into the skill, and stay terse.`;
}

function buildAgentPrompt(skill: UserSkillDocument | UserSkillVersion, slug: string): AgentPrompt {
  return {
    provider: "loop",
    displayName: "Loop default",
    shortDescription: "Base prompt synthesized from the submitted skill and its update rules.",
    defaultPrompt: skill.automation.prompt || `Use $${slug} for this task.`,
    path: `loop://skills/${slug}/prompt`
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
  if (cadence === "daily") return "Daily";
  if (cadence === "weekly") return "Weekly";
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
  if (!requestedVersion) return latestUserSkillVersion(skill);
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

function buildEditableTags(existing: string[], category: CategorySlug, nextTags: string[]): string[] {
  const marker = existing.includes("tracked") ? "tracked" : "community";
  const filtered = nextTags.filter((tag) => tag !== "tracked" && tag !== "community");
  return normalizeTags([category, ...filtered, marker]);
}

export function sameSourceList(left: SourceDefinition[], right: SourceDefinition[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function sameAutomation(left: SkillAutomationState, right: SkillAutomationState): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
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

// ---------------------------------------------------------------------------
// Public pure logic
// ---------------------------------------------------------------------------

/** UTC day index for weekly cadence runs (Monday = 1). */
const WEEKLY_RUN_DAY_UTC = 1;

export function isUserSkillAutomationDue(skill: UserSkillDocument, now = new Date()): boolean {
  if (!skill.automation.enabled || skill.automation.status !== "active" || skill.sources.length === 0) {
    return false;
  }

  if (skill.automation.cadence === "manual") return false;

  const failures = skill.automation.consecutiveFailures ?? 0;
  if (failures >= 3) {
    console.warn(`[automation] Skipping ${skill.slug}: ${failures} consecutive failures`);
    return false;
  }

  if (skill.automation.cadence === "weekly" && now.getUTCDay() !== WEEKLY_RUN_DAY_UTC) {
    return false;
  }

  const lastRunAt = skill.automation.lastRunAt ? new Date(skill.automation.lastRunAt) : null;
  if (!lastRunAt || Number.isNaN(lastRunAt.valueOf())) return true;

  const elapsedMs = now.valueOf() - lastRunAt.valueOf();
  const thresholdMs = skill.automation.cadence === "daily" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  return elapsedMs >= thresholdMs;
}

export function createUserSkillDocument(input: CreateUserSkillInput, now = new Date()): UserSkillDocument {
  const parsed = createUserSkillInputSchema.parse({
    ...input,
    ownerName: input.ownerName?.trim() || undefined,
    tags: normalizeTags(input.tags ?? []),
    sourceUrls: Array.from(new Set((input.sourceUrls ?? []).map((url) => url.trim()).filter(Boolean)))
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
      visibility: parsed.visibility ?? "private",
      sources,
      automation: {
        enabled: automationEnabled,
        cadence: automationEnabled ? parsed.automationCadence : "manual",
        status: automationEnabled ? "active" : "paused",
        prompt: buildAutomationPrompt(parsed, slugBase),
        preferredHour: parsed.preferredHour ?? DEFAULT_PREFERRED_HOUR,
        preferredDay: parsed.preferredDay,
      },
      updates: [],
      agentDocs: parsed.agentDocs as AgentDocs | undefined
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
    versions: [latestVersion],
    agentDocs: latestVersion.agentDocs
  };
}

/**
 * Apply user-authored edits to a skill document WITHOUT incrementing the
 * version number. Returns a new object with the same version so that callers
 * (e.g. the fused save+refresh endpoint) can pass it straight to
 * `runTrackedUserSkillUpdate`, which mints the single next version.
 */
export function applyUserEditsToSkill(
  skill: UserSkillDocument,
  input: UpdateUserSkillInput
): { skill: UserSkillDocument; changed: boolean } {
  if (input.slug !== skill.slug) {
    throw new Error("The requested skill slug does not match the current document.");
  }

  const parsed = updateUserSkillInputSchema.parse({
    ...input,
    ownerName: input.ownerName?.trim() || undefined,
    tags: normalizeTags(input.tags ?? []),
    sourceUrls: Array.from(new Set((input.sourceUrls ?? []).map((url) => url.trim()).filter(Boolean)))
  });

  const nextSources = parsed.sourceUrls.map((url) => normalizeSource(url, parsed.category));
  const automationEnabled = parsed.autoUpdate && nextSources.length > 0;
  const nextAutomation: SkillAutomationState = {
    enabled: automationEnabled,
    cadence: automationEnabled ? parsed.automationCadence : "manual",
    status: automationEnabled ? "active" : "paused",
    prompt: buildAutomationPrompt(parsed, skill.slug),
    lastRunAt: skill.automation.lastRunAt,
    preferredHour: parsed.preferredHour ?? skill.automation.preferredHour ?? DEFAULT_PREFERRED_HOUR,
    preferredDay: parsed.preferredDay ?? skill.automation.preferredDay,
  };
  const nextTags = buildEditableTags(skill.tags, parsed.category, parsed.tags);

  const priceChanged =
    JSON.stringify(skill.price ?? null) !==
    JSON.stringify(parsed.price && parsed.price.amount > 0 ? parsed.price : null);

  const changed =
    skill.title !== parsed.title ||
    skill.description !== parsed.description ||
    skill.category !== parsed.category ||
    skill.body !== parsed.body ||
    skill.ownerName !== parsed.ownerName ||
    JSON.stringify(skill.tags) !== JSON.stringify(nextTags) ||
    !sameSourceList(skill.sources, nextSources) ||
    !sameAutomation(skill.automation, nextAutomation) ||
    priceChanged;

  const skillPrice = parsed.price && parsed.price.amount > 0 ? parsed.price : null;

  const editedSkill: UserSkillDocument = {
    ...skill,
    title: parsed.title,
    description: parsed.description,
    category: parsed.category,
    body: parsed.body,
    ownerName: parsed.ownerName,
    tags: nextTags,
    sources: nextSources,
    automation: nextAutomation,
    agentDocs: (parsed.agentDocs as AgentDocs | undefined) ?? skill.agentDocs,
    price: skillPrice
  };

  return { skill: editedSkill, changed };
}

export function updateUserSkillDocument(
  skill: UserSkillDocument,
  input: UpdateUserSkillInput,
  now = new Date()
): { skill: UserSkillDocument; changed: boolean } {
  const { skill: editedSkill, changed } = applyUserEditsToSkill(skill, input);

  if (!changed) {
    return { skill, changed: false };
  }

  const updatedAt = now.toISOString();
  const nextSkill = createNextUserSkillVersion(
    skill,
    {
      title: editedSkill.title,
      description: editedSkill.description,
      category: editedSkill.category,
      body: editedSkill.body,
      ownerName: editedSkill.ownerName,
      tags: editedSkill.tags,
      visibility: editedSkill.visibility,
      sources: editedSkill.sources,
      automation: editedSkill.automation,
      updates: editedSkill.updates,
      agentDocs: editedSkill.agentDocs,
      price: editedSkill.price
    },
    updatedAt
  );

  return { skill: nextSkill, changed: true };
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
      .sort((left, right) => right.version - left.version),
    agentDocs: snapshot.agentDocs
  };
}

export function buildUserSkillAutomation(skill: UserSkillDocument): AutomationSummary | null {
  if (!skill.automation.enabled) return null;

  const hour = skill.automation.preferredHour ?? DEFAULT_PREFERRED_HOUR;
  const day = skill.automation.preferredDay;
  return {
    id: `user:${skill.slug}`,
    name: `${skill.title} refresh`,
    prompt: skill.automation.prompt,
    schedule: formatScheduleLabel(skill.automation.cadence, hour, day),
    cadence: skill.automation.cadence,
    status: skill.automation.status.toUpperCase(),
    path: `loop://skills/${skill.slug}/automation`,
    cwd: [],
    matchedSkillSlugs: [skill.slug],
    matchedCategorySlugs: [skill.category],
    preferredModel: skill.automation.preferredModel,
    preferredHour: hour,
    preferredDay: day,
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
    path: `loop://community-skills/${skill.slug}`,
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
    updates: version.updates,
    agentDocs: version.agentDocs
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

// ---------------------------------------------------------------------------
// DB-backed storage operations
// ---------------------------------------------------------------------------

export function skillRecordToUserDoc(record: SkillRecord): UserSkillDocument {
  const versions: UserSkillVersion[] = record.availableVersions.map((vRef) => ({
    version: vRef.version,
    updatedAt: vRef.updatedAt,
    title: record.title,
    description: record.description,
    category: record.category,
    body: record.body,
    ownerName: record.ownerName,
    tags: record.tags,
    visibility: record.visibility,
    sources: record.sources ?? [],
    automation: record.automation ?? {
      enabled: false,
      cadence: "manual" as UserSkillCadence,
      status: "paused" as const,
      prompt: ""
    },
    updates: record.updates ?? [],
    agentDocs: record.agentDocs
  }));

  return {
    slug: record.slug,
    title: record.title,
    description: record.description,
    category: record.category,
    body: record.body,
    ownerName: record.ownerName,
    tags: record.tags,
    visibility: record.visibility,
    createdAt: record.updatedAt,
    updatedAt: record.updatedAt,
    sources: record.sources ?? [],
    automation: record.automation ?? {
      enabled: false,
      cadence: "manual",
      status: "paused",
      prompt: ""
    },
    updates: record.updates ?? [],
    version: record.version,
    versions,
    agentDocs: record.agentDocs
  };
}

export async function listUserSkillDocuments(): Promise<UserSkillDocument[]> {
  const records = await dbListSkills({ origin: "user" });
  return records.map(skillRecordToUserDoc);
}

type SkillCreatorIdentity = {
  creatorClerkUserId?: string;
  authorId?: string;
  ownerName?: string;
};

export async function addUserSkill(
  input: CreateUserSkillInput,
  identity?: SkillCreatorIdentity
): Promise<UserSkillDocument> {
  const document = createUserSkillDocument({
    ...input,
    ownerName: identity?.ownerName ?? input.ownerName
  });
  const existing = await dbGetSkillBySlug(document.slug);
  if (existing) {
    throw new Error("A user skill with that slug already exists.");
  }

  await dbCreateSkill({
    slug: document.slug,
    title: document.title,
    description: document.description,
    category: document.category,
    body: document.body,
    visibility: document.visibility,
    origin: "user",
    tags: document.tags,
    ownerName: document.ownerName,
    sources: document.sources,
    automation: document.automation,
    updates: document.updates,
    agentDocs: document.agentDocs,
    version: 1,
    price: document.price ?? null,
    creatorClerkUserId: identity?.creatorClerkUserId,
    authorId: identity?.authorId
  });

  return document;
}

export async function addTrackedSkillFromRecord(
  skill: SkillRecord,
  categorySources: SourceDefinition[],
  now = new Date()
): Promise<UserSkillDocument> {
  const existing = await dbGetSkillBySlug(skill.slug);

  const sources = categorySources.map((source) => normalizeSource(source.url, skill.category));
  const automationEnabled = sources.length > 0;
  const automation: SkillAutomationState = {
    enabled: automationEnabled,
    cadence: automationEnabled ? "daily" : "manual",
    status: automationEnabled ? "active" : "paused",
    prompt: `Refresh $${skill.slug} from the tracked sources. Capture only concrete changes, fold them into the skill, and stay terse.`,
    preferredHour: DEFAULT_PREFERRED_HOUR,
  };

  if (existing) {
    if (existing.origin === "user" && existing.automation?.enabled) {
      return skillRecordToUserDoc(existing);
    }

    const record = await dbUpdateSkill(existing.slug, {
      origin: "user",
      tags: normalizeTags([skill.category, ...skill.tags, "tracked"]),
      sources,
      automation,
    });
    return skillRecordToUserDoc(record);
  }

  const record = await dbCreateSkill({
    slug: skill.slug,
    title: skill.title,
    description: skill.description,
    category: skill.category,
    body: skill.body,
    visibility: skill.visibility,
    origin: "user",
    tags: normalizeTags([skill.category, ...skill.tags, "tracked"]),
    ownerName: skill.ownerName,
    authorId: skill.authorId,
    sources,
    automation,
    updates: [],
    agentDocs: skill.agentDocs,
    version: 1
  });

  return skillRecordToUserDoc(record);
}

export async function saveUserSkillDocuments(skills: UserSkillDocument[]): Promise<void> {
  await Promise.all(
    skills.map(async (skill) => {
      await dbUpdateSkill(skill.slug, {
        title: skill.title,
        description: skill.description,
        category: skill.category,
        body: skill.body,
        visibility: skill.visibility,
        tags: skill.tags,
        ownerName: skill.ownerName,
        sources: skill.sources,
        automation: skill.automation,
        updates: skill.updates,
        agentDocs: skill.agentDocs,
        version: skill.version
      });

      const skillId = await getSkillIdBySlug(skill.slug);
      if (skillId) {
        const existingVersions = await dbGetSkillVersions(skillId);
        const existingVersionNumbers = new Set(existingVersions.map((v) => v.version));

        const newVersions = skill.versions.filter((v) => !existingVersionNumbers.has(v.version));
        await Promise.all(
          newVersions.map((v) =>
            dbCreateSkillVersion({
              skillId,
              version: v.version,
              title: v.title,
              description: v.description,
              category: v.category,
              body: v.body,
              tags: v.tags,
              ownerName: v.ownerName,
              visibility: v.visibility,
              sources: v.sources,
              automation: v.automation,
              updates: v.updates,
              agentDocs: v.agentDocs
            })
          )
        );
      }
    })
  );
}
