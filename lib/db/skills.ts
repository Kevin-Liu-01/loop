import { getServerSupabase } from "@/lib/db/client";
import { listSkillAuthorsByIds } from "@/lib/db/skill-authors";
import { buildSkillVersionHref, buildVersionLabel } from "@/lib/format";
import { createExcerpt } from "@/lib/markdown";
import type {
  AgentDocs,
  AgentPrompt,
  AutomationSummary,
  ReferenceDoc,
  SkillResearchProfile,
  SkillAutomationState,
  SkillHeading,
  SkillOrigin,
  SkillRecord,
  SkillUpdateEntry,
  SkillVisibility,
  SourceDefinition,
  VersionReference,
} from "@/lib/types";

type SkillRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  body: string;
  accent: string;
  featured: boolean;
  visibility: string;
  origin: string;
  path: string | null;
  relative_dir: string | null;
  tags: string[];
  headings: unknown;
  owner_name: string | null;
  author_id?: string | null;
  sources: unknown;
  automation: unknown;
  updates: unknown;
  agent_docs: unknown;
  references_data: unknown;
  agents_data: unknown;
  source_url: string | null;
  canonical_url: string | null;
  sync_enabled: boolean;
  last_synced_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  price?: { amount: number; currency: string } | null;
  creator_clerk_user_id?: string | null;
  icon_url?: string | null;
  featured_rank?: number;
  quality_score?: number;
  research_profile?: unknown;
  forked_from_slug?: string | null;
};

async function attachAuthors(rows: SkillRow[]): Promise<Map<string, SkillRecord["author"]>> {
  const authorIds = Array.from(
    new Set(rows.map((row) => row.author_id).filter((value): value is string => Boolean(value)))
  );

  const authors = await listSkillAuthorsByIds(authorIds);
  return new Map(authors.map((author) => [author.id, author]));
}

export function rowToSkillRecord(
  row: SkillRow,
  availableVersions?: VersionReference[],
  author?: SkillRecord["author"]
): SkillRecord {
  const version = row.version;
  const versions = availableVersions ?? [
    { version, label: buildVersionLabel(version), updatedAt: row.updated_at }
  ];

  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category as SkillRecord["category"],
    accent: row.accent,
    featured: row.featured,
    visibility: row.visibility as SkillVisibility,
    origin: row.origin as SkillOrigin,
    href: buildSkillVersionHref(row.slug, version),
    path: row.path ?? "",
    relativeDir: row.relative_dir ?? "",
    updatedAt: row.updated_at,
    tags: row.tags,
    headings: (row.headings ?? []) as SkillHeading[],
    body: row.body,
    excerpt: createExcerpt(row.body),
    references: (row.references_data ?? []) as ReferenceDoc[],
    agents: (row.agents_data ?? []) as AgentPrompt[],
    automations: [],
    version,
    versionLabel: buildVersionLabel(version),
    availableVersions: versions,
    ownerName: row.owner_name ?? undefined,
    authorId: row.author_id ?? undefined,
    author,
    sources: (row.sources ?? []) as SourceDefinition[],
    automation: (row.automation ?? undefined) as SkillAutomationState | undefined,
    updates: (row.updates ?? []) as SkillUpdateEntry[],
    agentDocs: (row.agent_docs ?? {}) as AgentDocs,
    price: row.price ?? null,
    creatorClerkUserId: row.creator_clerk_user_id ?? undefined,
    iconUrl: row.icon_url ?? undefined,
    featuredRank: row.featured_rank ?? 0,
    qualityScore: row.quality_score ?? 0,
    researchProfile: row.research_profile as SkillResearchProfile | undefined,
    forkedFromSlug: row.forked_from_slug ?? undefined
  };
}

export type CreateSkillInput = {
  slug: string;
  title: string;
  description: string;
  category: string;
  body: string;
  accent?: string;
  featured?: boolean;
  visibility?: SkillVisibility;
  origin: SkillOrigin;
  path?: string;
  relativeDir?: string;
  tags?: string[];
  headings?: SkillHeading[];
  ownerName?: string;
  authorId?: string;
  sources?: SourceDefinition[];
  automation?: SkillAutomationState;
  updates?: SkillUpdateEntry[];
  agentDocs?: AgentDocs;
  references?: ReferenceDoc[];
  agents?: AgentPrompt[];
  sourceUrl?: string;
  canonicalUrl?: string;
  syncEnabled?: boolean;
  version?: number;
  price?: { amount: number; currency: string } | null;
  creatorClerkUserId?: string;
  iconUrl?: string;
  featuredRank?: number;
  qualityScore?: number;
  researchProfile?: SkillResearchProfile;
  forkedFromSlug?: string;
};

function inputToRow(input: CreateSkillInput): Record<string, unknown> {
  const row: Record<string, unknown> = {
    slug: input.slug,
    title: input.title,
    description: input.description,
    category: input.category,
    body: input.body,
    accent: input.accent ?? "signal-red",
    featured: input.featured ?? false,
    visibility: input.visibility ?? "public",
    origin: input.origin,
    path: input.path ?? null,
    relative_dir: input.relativeDir ?? null,
    tags: input.tags ?? [],
    headings: input.headings ?? [],
    owner_name: input.ownerName ?? null,
    author_id: input.authorId ?? null,
    sources: input.sources ?? [],
    automation: input.automation ?? null,
    updates: input.updates ?? [],
    agent_docs: input.agentDocs ?? {},
    references_data: input.references ?? [],
    agents_data: input.agents ?? [],
    source_url: input.sourceUrl ?? null,
    canonical_url: input.canonicalUrl ?? null,
    sync_enabled: input.syncEnabled ?? false,
    version: input.version ?? 1
  };

  if (input.price !== undefined) row.price = input.price;
  if (input.creatorClerkUserId !== undefined) row.creator_clerk_user_id = input.creatorClerkUserId;
  if (input.iconUrl !== undefined) row.icon_url = input.iconUrl;
  if (input.featuredRank !== undefined) row.featured_rank = input.featuredRank;
  if (input.qualityScore !== undefined) row.quality_score = input.qualityScore;
  if (input.researchProfile !== undefined) row.research_profile = input.researchProfile;
  if (input.forkedFromSlug !== undefined) row.forked_from_slug = input.forkedFromSlug;

  return row;
}

export async function listSkills(filter?: {
  origin?: SkillOrigin;
  category?: string;
  visibility?: SkillVisibility;
}): Promise<SkillRecord[]> {
  const db = getServerSupabase();
  let query = db.from("skills").select("*");

  if (filter?.origin) {
    query = query.eq("origin", filter.origin);
  }
  if (filter?.category) {
    query = query.eq("category", filter.category);
  }
  if (filter?.visibility) {
    query = query.eq("visibility", filter.visibility);
  }

  const { data, error } = await query.order("title");
  if (error) throw new Error(`listSkills failed: ${error.message}`);
  const rows = data as SkillRow[];
  const authors = await attachAuthors(rows);
  return rows.map((row) =>
    rowToSkillRecord(row, undefined, row.author_id ? authors.get(row.author_id) : undefined)
  );
}

export async function getSkillBySlug(slug: string): Promise<SkillRecord | null> {
  const db = getServerSupabase();
  const { data, error } = await db
    .from("skills")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`getSkillBySlug failed: ${error.message}`);
  if (!data) return null;

  const { data: versions } = await db
    .from("skill_versions")
    .select("version, created_at")
    .eq("skill_id", (data as SkillRow).id)
    .order("version", { ascending: false });

  const row = data as SkillRow;
  const authors = await attachAuthors([row]);
  const availableVersions: VersionReference[] = [
    { version: row.version, label: buildVersionLabel(row.version), updatedAt: row.updated_at },
    ...(versions ?? [])
      .filter((v: { version: number }) => v.version !== row.version)
      .map((v: { version: number; created_at: string }) => ({
        version: v.version,
        label: buildVersionLabel(v.version),
        updatedAt: v.created_at
      }))
  ].sort((a, b) => b.version - a.version);

  return rowToSkillRecord(
    row,
    availableVersions,
    row.author_id ? authors.get(row.author_id) : undefined
  );
}

export async function getSkillAtVersion(slug: string, version: number): Promise<SkillRecord | null> {
  const db = getServerSupabase();

  const { data: skillData } = await db
    .from("skills")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!skillData) return null;
  const currentRow = skillData as SkillRow;

  if (currentRow.version === version) {
    return getSkillBySlug(slug);
  }

  const { data: versionData, error } = await db
    .from("skill_versions")
    .select("*")
    .eq("skill_id", currentRow.id)
    .eq("version", version)
    .maybeSingle();

  if (error || !versionData) return null;

  const v = versionData as {
    version: number;
    title: string;
    description: string;
    category: string;
    body: string;
    tags: string[];
    owner_name: string | null;
    visibility: string;
    sources: unknown;
    automation: unknown;
    updates: unknown;
    agent_docs: unknown;
    created_at: string;
  };

  const versionRow: SkillRow = {
    ...currentRow,
    version: v.version,
    title: v.title,
    description: v.description,
    category: v.category,
    body: v.body,
    tags: v.tags,
    owner_name: v.owner_name,
    visibility: v.visibility,
    sources: v.sources,
    automation: v.automation,
    updates: v.updates,
    agent_docs: v.agent_docs,
    updated_at: v.created_at
  };

  const authors = await attachAuthors([currentRow]);
  return rowToSkillRecord(
    versionRow,
    undefined,
    currentRow.author_id ? authors.get(currentRow.author_id) : undefined
  );
}

export async function createSkill(input: CreateSkillInput): Promise<SkillRecord> {
  const db = getServerSupabase();
  const row = inputToRow(input);

  const { data, error } = await db
    .from("skills")
    .insert(row as never)
    .select("*")
    .single();

  if (error) throw new Error(`createSkill failed: ${error.message}`);
  const skillRow = data as SkillRow;
  const authors = await attachAuthors([skillRow]);
  return rowToSkillRecord(
    skillRow,
    undefined,
    skillRow.author_id ? authors.get(skillRow.author_id) : undefined
  );
}

export async function updateSkill(
  slug: string,
  updates: Partial<CreateSkillInput>
): Promise<SkillRecord> {
  const db = getServerSupabase();
  const mapped: Record<string, unknown> = {};

  if (updates.origin !== undefined) mapped.origin = updates.origin;
  if (updates.title !== undefined) mapped.title = updates.title;
  if (updates.description !== undefined) mapped.description = updates.description;
  if (updates.category !== undefined) mapped.category = updates.category;
  if (updates.body !== undefined) mapped.body = updates.body;
  if (updates.accent !== undefined) mapped.accent = updates.accent;
  if (updates.featured !== undefined) mapped.featured = updates.featured;
  if (updates.visibility !== undefined) mapped.visibility = updates.visibility;
  if (updates.tags !== undefined) mapped.tags = updates.tags;
  if (updates.headings !== undefined) mapped.headings = updates.headings;
  if (updates.ownerName !== undefined) mapped.owner_name = updates.ownerName;
  if (updates.authorId !== undefined) mapped.author_id = updates.authorId;
  if (updates.sources !== undefined) mapped.sources = updates.sources;
  if (updates.automation !== undefined) mapped.automation = updates.automation;
  if (updates.updates !== undefined) mapped.updates = updates.updates;
  if (updates.agentDocs !== undefined) mapped.agent_docs = updates.agentDocs;
  if (updates.references !== undefined) mapped.references_data = updates.references;
  if (updates.agents !== undefined) mapped.agents_data = updates.agents;
  if (updates.sourceUrl !== undefined) mapped.source_url = updates.sourceUrl;
  if (updates.canonicalUrl !== undefined) mapped.canonical_url = updates.canonicalUrl;
  if (updates.syncEnabled !== undefined) mapped.sync_enabled = updates.syncEnabled;
  if (updates.version !== undefined) mapped.version = updates.version;
  if (updates.path !== undefined) mapped.path = updates.path;
  if (updates.relativeDir !== undefined) mapped.relative_dir = updates.relativeDir;
  if (updates.price !== undefined) mapped.price = updates.price;
  if (updates.creatorClerkUserId !== undefined) mapped.creator_clerk_user_id = updates.creatorClerkUserId;
  if (updates.iconUrl !== undefined) mapped.icon_url = updates.iconUrl;
  if (updates.featuredRank !== undefined) mapped.featured_rank = updates.featuredRank;
  if (updates.qualityScore !== undefined) mapped.quality_score = updates.qualityScore;
  if (updates.researchProfile !== undefined) mapped.research_profile = updates.researchProfile;
  if (updates.forkedFromSlug !== undefined) mapped.forked_from_slug = updates.forkedFromSlug;

  const { data, error } = await db
    .from("skills")
    .update(mapped as never)
    .eq("slug", slug)
    .select("*")
    .single();

  if (error) throw new Error(`updateSkill failed: ${error.message}`);
  const row = data as SkillRow;
  const authors = await attachAuthors([row]);
  return rowToSkillRecord(row, undefined, row.author_id ? authors.get(row.author_id) : undefined);
}

export async function deleteSkill(slug: string): Promise<void> {
  const db = getServerSupabase();
  const { error } = await db.from("skills").delete().eq("slug", slug);
  if (error) throw new Error(`deleteSkill failed: ${error.message}`);
}

export async function upsertSkillFromFilesystem(input: CreateSkillInput): Promise<SkillRecord> {
  const db = getServerSupabase();
  const row = inputToRow(input);

  const { data, error } = await db
    .from("skills")
    .upsert(row as never, { onConflict: "slug" })
    .select("*")
    .single();

  if (error) throw new Error(`upsertSkillFromFilesystem failed: ${error.message}`);
  const skillRow = data as SkillRow;
  const authors = await attachAuthors([skillRow]);
  return rowToSkillRecord(
    skillRow,
    undefined,
    skillRow.author_id ? authors.get(skillRow.author_id) : undefined
  );
}

export async function getSkillIdBySlug(slug: string): Promise<string | null> {
  const db = getServerSupabase();
  const { data, error } = await db
    .from("skills")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`getSkillIdBySlug failed: ${error.message}`);
  return (data as { id: string } | null)?.id ?? null;
}
