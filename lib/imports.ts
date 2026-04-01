import matter from "gray-matter";
import YAML from "yaml";

import {
  createSkill as dbCreateSkill,
  getSkillBySlug as dbGetSkillBySlug,
  listSkills as dbListSkills,
  updateSkill as dbUpdateSkill
} from "@/lib/db/skills";
import {
  listMcps as dbListMcps,
  upsertMcp as dbUpsertMcp
} from "@/lib/db/mcps";
import { resolveAuthorIdForUrl } from "@/lib/source-authors";
import { buildVersionLabel, buildSkillVersionHref } from "@/lib/format";
import { createExcerpt, slugify, stableHash } from "@/lib/markdown";
import { CATEGORY_REGISTRY } from "@/lib/registry";
import { resolveBrandIcon, githubAvatar } from "@/lib/brand-icons";
import type {
  AgentPrompt,
  CategorySlug,
  ImportedMcpDocument,
  ImportedMcpTransport,
  ImportedMcpVersion,
  ImportedSkillDocument,
  ImportedSkillVersion,
  ReferenceDoc,
  SkillRecord,
  SourceDefinition,
  VersionReference
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function normalizeTags(input: string[]): string[] {
  return Array.from(
    new Set(
      input
        .map((tag) => slugify(tag))
        .map((tag) => tag.replace(/^-+|-+$/g, ""))
        .filter(Boolean)
    )
  ).slice(0, 10);
}

function inferTags(opts: {
  category: string;
  sourceUrl: string;
  ownerName?: string;
  title?: string;
  frontmatterTags?: string[];
}): string[] {
  const tags: string[] = [opts.category, "imported"];

  if (opts.ownerName) tags.push(opts.ownerName);

  if (opts.frontmatterTags?.length) {
    tags.push(...opts.frontmatterTags);
  }

  try {
    const parsed = new URL(opts.sourceUrl);
    const segments = parsed.pathname.split("/").filter(Boolean);

    if (
      parsed.hostname === "raw.githubusercontent.com" ||
      parsed.hostname === "github.com"
    ) {
      const [org, repo] = segments;
      if (org) tags.push(org);
      if (repo && repo !== org) tags.push(repo);
    } else {
      const hostname = parsed.hostname.replace(/^www\./, "");
      const domain = hostname.split(".").slice(0, -1).join("-");
      if (domain && domain !== "raw") tags.push(domain);
    }
  } catch { /* ignore */ }

  if (opts.title) {
    const titleWords = opts.title
      .toLowerCase()
      .split(/[\s\-_]+/)
      .filter((w) => w.length > 2 && !["the", "and", "for", "use", "with", "when", "skill"].includes(w));
    tags.push(...titleWords.slice(0, 3));
  }

  return normalizeTags(tags);
}

function toVersionReference(version: { version: number; updatedAt: string }): VersionReference {
  return {
    version: version.version,
    label: buildVersionLabel(version.version),
    updatedAt: version.updatedAt
  };
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(value: string): string {
  return decodeHtml(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/(p|div|section|article|h1|h2|h3|li|br)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
  );
}

function looksLikeHtml(raw: string, url: string): boolean {
  return raw.includes("<html") || raw.includes("<body") || /\.html?($|\?)/i.test(url);
}

function normalizeImportUrl(input: string): string {
  const url = new URL(input.trim());

  if (
    url.hostname === "github.com" &&
    url.pathname.split("/").length >= 5 &&
    url.pathname.includes("/blob/")
  ) {
    const [, owner, repo, , branch, ...rest] = url.pathname.split("/");
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${rest.join("/")}`;
  }

  return url.toString();
}

function inferCategory(title: string, content: string, url: string): CategorySlug {
  const haystack = `${title}\n${content}\n${url}`.toLowerCase();
  const matchedCategory = CATEGORY_REGISTRY.find((category) =>
    category.keywords.some((keyword) => haystack.includes(keyword))
  );

  return matchedCategory?.slug ?? "frontend";
}

function inferOwnerName(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "raw.githubusercontent.com" ||
      parsed.hostname === "github.com"
    ) {
      const org = parsed.pathname.split("/").filter(Boolean)[0];
      if (org) return org;
    }

    const hostname = parsed.hostname.replace(/^www\./, "");
    const root = hostname.split(".").slice(0, -1).join(" ");
    if (!root) return undefined;

    return root
      .split(/[-_]/g)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch {
    return undefined;
  }
}

function inferTitle(content: string, fallbackUrl: string, frontmatterName?: string): string {
  const markdownTitle = /^#\s+(.+)$/m.exec(content)?.[1]?.trim();
  if (markdownTitle) return markdownTitle;

  if (frontmatterName) return frontmatterName;

  const htmlTitle = /<title>([^<]+)<\/title>/i.exec(content)?.[1]?.trim();
  if (htmlTitle) return decodeHtml(htmlTitle);

  const pathname = new URL(fallbackUrl).pathname.split("/").filter(Boolean).pop();
  return pathname?.replace(/\.(md|markdown|txt|html)$/i, "").replace(/[-_]/g, " ") || "Imported skill";
}

function toMarkdownBody(content: string, title: string, sourceUrl: string): string {
  if (!looksLikeHtml(content, sourceUrl)) return content.trim();
  const plain = stripHtml(content);
  return [`# ${title}`, "", plain].join("\n");
}

/**
 * Parse YAML frontmatter from raw markdown.
 * Returns the frontmatter data and the body content with frontmatter stripped.
 */
function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  try {
    const parsed = matter(raw);
    return { data: parsed.data as Record<string, unknown>, content: parsed.content };
  } catch {
    return { data: {}, content: raw };
  }
}

export async function fetchRemoteText(inputUrl: string): Promise<{ raw: string; normalizedUrl: string }> {
  const normalizedUrl = normalizeImportUrl(inputUrl);
  const response = await fetch(normalizedUrl, {
    headers: { "user-agent": "LoopImporter/0.1 (+https://loop.local)" },
    signal: AbortSignal.timeout(10000),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Import failed with ${response.status}.`);
  }

  return { raw: await response.text(), normalizedUrl };
}

function buildImportedSource(skill: ImportedSkillDocument | ImportedSkillVersion): SourceDefinition {
  return {
    id: stableHash(skill.canonicalUrl),
    label: "Canonical source",
    url: skill.canonicalUrl,
    kind: "docs",
    tags: normalizeTags([skill.category, "imported"])
  };
}

function buildImportedAgent(skill: ImportedSkillDocument | ImportedSkillVersion, slug: string): AgentPrompt {
  return {
    provider: "loop-import",
    displayName: "Imported skill prompt",
    shortDescription: "Context synthesized from a remote skill import.",
    defaultPrompt: `Use $${slug}. Prefer the imported source at ${skill.canonicalUrl}.`,
    path: `loop://imports/skills/${slug}`
  };
}

function buildImportedSkillVersion(
  fields: Omit<ImportedSkillVersion, "version" | "updatedAt">,
  version: number,
  updatedAt: string
): ImportedSkillVersion {
  return { version, updatedAt, ...fields };
}

function materializeImportedSkillVersion(
  skill: ImportedSkillDocument,
  requestedVersion?: number
): ImportedSkillVersion {
  if (!requestedVersion) {
    return skill.versions.slice().sort((left, right) => right.version - left.version)[0];
  }

  return (
    skill.versions.find((version) => version.version === requestedVersion) ??
    skill.versions.slice().sort((left, right) => right.version - left.version)[0]
  );
}

function buildImportedMcpVersion(
  fields: Omit<ImportedMcpVersion, "version" | "updatedAt">,
  version: number,
  updatedAt: string
): ImportedMcpVersion {
  return { version, updatedAt, ...fields };
}

function guessTransport(config: Record<string, unknown>): ImportedMcpTransport {
  const transport = typeof config.transport === "string" ? config.transport.toLowerCase() : "";
  const endpoint = typeof config.url === "string" ? config.url.toLowerCase() : "";

  if (transport === "stdio") return "stdio";
  if (transport === "sse" || endpoint.includes("/sse")) return "sse";
  if (transport === "http" || endpoint.startsWith("http://") || endpoint.startsWith("https://")) return "http";
  if (transport === "ws" || endpoint.startsWith("ws://") || endpoint.startsWith("wss://")) return "ws";
  if (config.command) return "stdio";

  return "unknown";
}

function normalizeMcpRecord(
  name: string,
  config: Record<string, unknown>,
  manifestUrl: string,
  raw: string,
  now: string
): ImportedMcpDocument {
  const transport = guessTransport(config);
  const description =
    typeof config.description === "string"
      ? config.description
      : typeof config.summary === "string"
        ? config.summary
        : `Imported MCP server definition for ${name}.`;

  const command =
    typeof config.command === "string"
      ? config.command
      : Array.isArray(config.command)
        ? String(config.command[0] ?? "")
        : undefined;

  const args = Array.isArray(config.args)
    ? config.args.map((value) => String(value))
    : Array.isArray(config.command)
      ? config.command.slice(1).map(String)
      : [];
  const env =
    config.env && typeof config.env === "object" && !Array.isArray(config.env)
      ? Object.keys(config.env as Record<string, unknown>)
      : [];

  const version = buildImportedMcpVersion(
    {
      description,
      manifestUrl,
      homepageUrl:
        typeof config.homepage === "string"
          ? config.homepage
          : typeof config.url === "string"
            ? config.url
            : undefined,
      transport,
      url: typeof config.url === "string" ? config.url : undefined,
      command,
      args,
      envKeys: env,
      headers:
        config.headers && typeof config.headers === "object" && !Array.isArray(config.headers)
          ? Object.fromEntries(
              Object.entries(config.headers as Record<string, unknown>).map(([key, value]) => [key, String(value)])
            )
          : undefined,
      tags: normalizeTags([name, transport, new URL(manifestUrl).hostname]),
      raw
    },
    1,
    now
  );

  return {
    id: stableHash(`${manifestUrl}:${name}`),
    name,
    description: version.description,
    manifestUrl: version.manifestUrl,
    homepageUrl: version.homepageUrl,
    transport: version.transport,
    url: version.url,
    command: version.command,
    args: version.args,
    envKeys: version.envKeys,
    headers: version.headers,
    tags: version.tags,
    raw: version.raw,
    createdAt: now,
    updatedAt: now,
    version: 1,
    versionLabel: buildVersionLabel(1),
    versions: [version]
  };
}

function extractManifestCandidate(raw: string): string {
  const fencedBlocks = Array.from(raw.matchAll(/```(?:json|yaml|yml)?\n([\s\S]*?)```/g)).map(
    (match) => match[1]
  );
  return fencedBlocks[0] ?? raw;
}

function parseManifestObject(raw: string): unknown {
  const candidate = extractManifestCandidate(raw);
  try {
    return JSON.parse(candidate);
  } catch {
    try {
      return YAML.parse(candidate);
    } catch {
      return null;
    }
  }
}

// ---------------------------------------------------------------------------
// Public pure builders
// ---------------------------------------------------------------------------

export function extractMcpDocuments(raw: string, manifestUrl: string): ImportedMcpDocument[] {
  const now = new Date().toISOString();
  const parsed = parseManifestObject(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("No MCP manifest shape was found at that URL.");
  }

  const object = parsed as Record<string, unknown>;
  const recordEntries: Array<[string, Record<string, unknown>]> =
    object.mcpServers && typeof object.mcpServers === "object" && !Array.isArray(object.mcpServers)
      ? Object.entries(object.mcpServers as Record<string, unknown>).filter(
          (entry): entry is [string, Record<string, unknown>] =>
            Boolean(entry[1]) && typeof entry[1] === "object" && !Array.isArray(entry[1])
        )
      : Array.isArray(object.servers)
        ? (object.servers as Array<Record<string, unknown>>).map((server, index) => [
            typeof server.name === "string" ? server.name : `server-${index + 1}`,
            server
          ])
        : typeof object.name === "string"
          ? [[object.name, object]]
          : [];

  const mcps = recordEntries.map(([name, config]) => normalizeMcpRecord(name, config, manifestUrl, raw, now));
  if (mcps.length === 0) {
    throw new Error("The fetched file did not contain an MCP server definition.");
  }

  return mcps;
}

export function buildImportedSkillDraft(
  raw: string,
  sourceUrl: string,
  now = new Date()
): ImportedSkillDocument {
  const { data, content } = parseFrontmatter(raw);
  const fmName = typeof data.name === "string" ? data.name.split("-").map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ") : undefined;
  const fmDescription = typeof data.description === "string" ? data.description : undefined;

  const title = inferTitle(content, sourceUrl, fmName);
  const body = toMarkdownBody(content, title, sourceUrl);
  const description = fmDescription || createExcerpt(body, 180);
  const category = inferCategory(title, body, sourceUrl);
  const createdAt = now.toISOString();
  const slugBase = slugify(title) || `imported-skill-${stableHash(sourceUrl)}`;

  const version = buildImportedSkillVersion(
    {
      title,
      description,
      category,
      body,
      sourceUrl,
      canonicalUrl: sourceUrl,
      ownerName: inferOwnerName(sourceUrl),
      tags: inferTags({
        category,
        sourceUrl,
        ownerName: inferOwnerName(sourceUrl),
        title,
        frontmatterTags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
      }),
      visibility: "public",
      syncEnabled: true,
      lastSyncedAt: createdAt
    },
    1,
    createdAt
  );

  return {
    slug: `${slugBase}-${stableHash(sourceUrl).slice(0, 6)}`,
    title: version.title,
    description: version.description,
    category: version.category,
    body: version.body,
    sourceUrl: version.sourceUrl,
    canonicalUrl: version.canonicalUrl,
    ownerName: version.ownerName,
    tags: version.tags,
    visibility: version.visibility,
    createdAt,
    updatedAt: createdAt,
    syncEnabled: version.syncEnabled,
    lastSyncedAt: version.lastSyncedAt,
    version: 1,
    versions: [version]
  };
}

export function buildImportedSkillRecord(
  skill: ImportedSkillDocument,
  requestedVersion?: number
): SkillRecord {
  const version = materializeImportedSkillVersion(skill, requestedVersion);
  const source = buildImportedSource(version);
  const category = CATEGORY_REGISTRY.find((entry) => entry.slug === version.category);
  const body = [
    version.body.trim(),
    "",
    "## Import metadata",
    `- Source: [${version.canonicalUrl}](${version.canonicalUrl})`,
    `- Sync: ${version.syncEnabled ? "enabled" : "manual"}`,
    `- Last sync: ${version.lastSyncedAt ?? "not yet"}`
  ].join("\n");

  const references: ReferenceDoc[] = [
    {
      slug: source.id,
      title: "Canonical source",
      path: source.url,
      excerpt: version.description
    }
  ];

  return {
    slug: skill.slug,
    title: version.title,
    description: version.description,
    category: version.category,
    accent: category?.accent ?? "signal-red",
    featured: false,
    visibility: version.visibility,
    origin: "remote",
    href: buildSkillVersionHref(skill.slug, version.version),
    path: version.canonicalUrl,
    relativeDir: `imports/${skill.slug}`,
    updatedAt: version.updatedAt,
    tags: normalizeTags(version.tags),
    headings: [],
    body,
    excerpt: createExcerpt(body),
    references,
    agents: [buildImportedAgent(version, skill.slug)],
    automations: [],
    version: version.version,
    versionLabel: buildVersionLabel(version.version),
    availableVersions: skill.versions
      .slice()
      .sort((left, right) => right.version - left.version)
      .map(toVersionReference),
    ownerName: version.ownerName,
    authorId: skill.authorId,
    sources: [source]
  };
}

export function createNextImportedSkillVersion(
  skill: ImportedSkillDocument,
  next: Omit<ImportedSkillVersion, "version" | "updatedAt">,
  updatedAt: string
): ImportedSkillDocument {
  const versionNumber = skill.version + 1;
  const snapshot = buildImportedSkillVersion(next, versionNumber, updatedAt);

  return {
    ...skill,
    title: snapshot.title,
    description: snapshot.description,
    category: snapshot.category,
    body: snapshot.body,
    sourceUrl: snapshot.sourceUrl,
    canonicalUrl: snapshot.canonicalUrl,
    ownerName: snapshot.ownerName,
    tags: snapshot.tags,
    visibility: snapshot.visibility,
    updatedAt,
    syncEnabled: snapshot.syncEnabled,
    lastSyncedAt: snapshot.lastSyncedAt,
    version: versionNumber,
    versions: [snapshot, ...skill.versions].sort((left, right) => right.version - left.version)
  };
}

export function createNextImportedMcpVersion(
  mcp: ImportedMcpDocument,
  next: Omit<ImportedMcpVersion, "version" | "updatedAt">,
  updatedAt: string
): ImportedMcpDocument {
  const versionNumber = mcp.version + 1;
  const snapshot = buildImportedMcpVersion(next, versionNumber, updatedAt);

  return {
    ...mcp,
    description: snapshot.description,
    manifestUrl: snapshot.manifestUrl,
    homepageUrl: snapshot.homepageUrl,
    transport: snapshot.transport,
    url: snapshot.url,
    command: snapshot.command,
    args: snapshot.args,
    envKeys: snapshot.envKeys,
    headers: snapshot.headers,
    tags: snapshot.tags,
    raw: snapshot.raw,
    updatedAt,
    version: versionNumber,
    versionLabel: buildVersionLabel(versionNumber),
    versions: [snapshot, ...mcp.versions].sort((left, right) => right.version - left.version)
  };
}

export function getImportedMcpVersion(
  mcp: ImportedMcpDocument,
  requestedVersion?: number
): ImportedMcpVersion {
  if (!requestedVersion) {
    return mcp.versions.slice().sort((left, right) => right.version - left.version)[0];
  }

  return (
    mcp.versions.find((version) => version.version === requestedVersion) ??
    mcp.versions.slice().sort((left, right) => right.version - left.version)[0]
  );
}

export async function syncImportedSkill(skill: ImportedSkillDocument): Promise<ImportedSkillDocument> {
  const { raw, normalizedUrl } = await fetchRemoteText(skill.canonicalUrl);
  const refreshed = buildImportedSkillDraft(raw, normalizedUrl, new Date());
  const latest = materializeImportedSkillVersion(skill);

  const changed =
    latest.title !== refreshed.title ||
    latest.description !== refreshed.description ||
    latest.category !== refreshed.category ||
    latest.body !== refreshed.body ||
    latest.canonicalUrl !== refreshed.canonicalUrl ||
    latest.ownerName !== refreshed.ownerName ||
    JSON.stringify(latest.tags) !== JSON.stringify(refreshed.tags);

  if (!changed) {
    return {
      ...skill,
      lastSyncedAt: refreshed.lastSyncedAt,
      updatedAt: skill.updatedAt
    };
  }

  return createNextImportedSkillVersion(
    skill,
    {
      title: refreshed.title,
      description: refreshed.description,
      category: refreshed.category,
      body: refreshed.body,
      sourceUrl: refreshed.sourceUrl,
      canonicalUrl: refreshed.canonicalUrl,
      ownerName: refreshed.ownerName,
      tags: refreshed.tags,
      visibility: refreshed.visibility,
      syncEnabled: refreshed.syncEnabled,
      lastSyncedAt: refreshed.lastSyncedAt
    },
    refreshed.updatedAt
  );
}

// ---------------------------------------------------------------------------
// DB-backed storage operations
// ---------------------------------------------------------------------------

function skillRecordToImportedDoc(record: SkillRecord): ImportedSkillDocument {
  const syncEnabled = record.syncEnabled ?? true;

  const versions: ImportedSkillVersion[] = record.availableVersions.map((vRef) => ({
    version: vRef.version,
    updatedAt: vRef.updatedAt,
    title: record.title,
    description: record.description,
    category: record.category,
    body: record.body,
    sourceUrl: record.path,
    canonicalUrl: record.path,
    ownerName: record.ownerName,
    authorId: record.authorId,
    tags: record.tags,
    visibility: record.visibility,
    syncEnabled,
    lastSyncedAt: vRef.updatedAt
  }));

  return {
    slug: record.slug,
    title: record.title,
    description: record.description,
    category: record.category,
    body: record.body,
    sourceUrl: record.path,
    canonicalUrl: record.path,
    ownerName: record.ownerName,
    authorId: record.authorId,
    tags: record.tags,
    visibility: record.visibility,
    createdAt: record.updatedAt,
    updatedAt: record.updatedAt,
    syncEnabled,
    lastSyncedAt: record.updatedAt,
    version: record.version,
    versions
  };
}

export async function listImportedSkills(): Promise<ImportedSkillDocument[]> {
  const records = await dbListSkills({ origin: "remote" });
  return records.map(skillRecordToImportedDoc);
}

export async function listImportedMcps(): Promise<ImportedMcpDocument[]> {
  return dbListMcps();
}

export async function saveImportedSkills(skills: ImportedSkillDocument[]): Promise<void> {
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
        authorId: skill.authorId,
        sourceUrl: skill.sourceUrl,
        canonicalUrl: skill.canonicalUrl,
        syncEnabled: skill.syncEnabled,
        version: skill.version
      }).catch(() => {
        return dbCreateSkill({
          slug: skill.slug,
          title: skill.title,
          description: skill.description,
          category: skill.category,
          body: skill.body,
          visibility: skill.visibility,
          origin: "remote",
          tags: skill.tags,
          ownerName: skill.ownerName,
          authorId: skill.authorId,
          sourceUrl: skill.sourceUrl,
          canonicalUrl: skill.canonicalUrl,
          syncEnabled: skill.syncEnabled,
          version: skill.version
        });
      });
    })
  );
}

async function fetchSiblingAgentDocs(sourceUrl: string): Promise<Record<string, string>> {
  const isGitHubRaw = sourceUrl.includes("raw.githubusercontent.com");
  if (!isGitHubRaw) return {};

  const dirUrl = sourceUrl.replace(/\/[^/]+$/, "");
  const SIBLING_FILENAMES: Record<string, string> = {
    "AGENTS.md": "agents",
    "cursor.md": "cursor",
    "claude.md": "claude",
    "codex.md": "codex",
  };

  const docs: Record<string, string> = {};
  const fetches = Object.entries(SIBLING_FILENAMES).map(async ([filename, key]) => {
    try {
      const res = await fetch(`${dirUrl}/${filename}`, {
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });
      if (!res.ok) return;
      const text = await res.text();
      if (text.trim()) docs[key] = text.trim();
    } catch {
      // silently skip
    }
  });

  await Promise.all(fetches);
  return docs;
}

function inferIconUrlFromSource(sourceUrl: string): string | undefined {
  const lower = sourceUrl.toLowerCase();

  const knownBrands: [string, string][] = [
    ["anthropic", "anthropic"],
    ["openai", "openai"],
    ["vercel", "vercel"],
    ["supabase", "supabase"],
  ];
  for (const [pattern, brandKey] of knownBrands) {
    if (lower.includes(pattern)) {
      return resolveBrandIcon(brandKey);
    }
  }

  try {
    const { hostname } = new URL(sourceUrl);
    if (hostname === "github.com" || hostname === "raw.githubusercontent.com") {
      const parts = sourceUrl.split("/");
      const org = parts[3];
      if (org) return githubAvatar(org);
    }
  } catch {
    // ignore
  }

  return undefined;
}

export type ImportSourceMeta = {
  sourceName?: string;
  sourceIconUrl?: string;
  /** Pre-resolved verified author ID – skips URL-based author lookup when set. */
  authorId?: string;
};

export async function importRemoteSkill(
  inputUrl: string,
  sourceMeta?: ImportSourceMeta
): Promise<ImportedSkillDocument> {
  const { raw, normalizedUrl } = await fetchRemoteText(inputUrl);
  const draft = buildImportedSkillDraft(raw, normalizedUrl);

  const [agentDocs, inferredIcon, resolvedAuthorId] = await Promise.all([
    fetchSiblingAgentDocs(normalizedUrl),
    Promise.resolve(inferIconUrlFromSource(normalizedUrl)),
    sourceMeta?.authorId
      ? Promise.resolve(sourceMeta.authorId)
      : resolveAuthorIdForUrl(inputUrl),
  ]);

  const ownerName = sourceMeta?.sourceName || draft.ownerName;
  const iconUrl = sourceMeta?.sourceIconUrl || inferredIcon;
  const authorId = resolvedAuthorId || undefined;

  const hasAgentDocs = Object.keys(agentDocs).length > 0;

  await dbCreateSkill({
    slug: draft.slug,
    title: draft.title,
    description: draft.description,
    category: draft.category,
    body: draft.body,
    visibility: draft.visibility,
    origin: "remote",
    tags: draft.tags,
    ownerName,
    authorId,
    sourceUrl: draft.sourceUrl,
    canonicalUrl: draft.canonicalUrl,
    syncEnabled: draft.syncEnabled,
    agentDocs: hasAgentDocs ? agentDocs : undefined,
    iconUrl,
    version: 1,
  }).catch(async () => {
    await dbUpdateSkill(draft.slug, {
      title: draft.title,
      description: draft.description,
      category: draft.category,
      body: draft.body,
      tags: draft.tags,
      ownerName,
      authorId,
      sourceUrl: draft.sourceUrl,
      canonicalUrl: draft.canonicalUrl,
      syncEnabled: draft.syncEnabled,
      agentDocs: hasAgentDocs ? agentDocs : undefined,
      iconUrl,
    });
  });

  return { ...draft, ownerName, authorId };
}

export async function importRemoteMcps(inputUrl: string): Promise<ImportedMcpDocument[]> {
  const { raw, normalizedUrl } = await fetchRemoteText(inputUrl);
  const documents = extractMcpDocuments(raw, normalizedUrl);
  const existingMcps = await dbListMcps();

  const mergedDocuments = documents.map((incoming) => {
    const existing = existingMcps.find(
      (entry) => entry.id === incoming.id || (entry.manifestUrl === incoming.manifestUrl && entry.name === incoming.name)
    );

    if (!existing) return incoming;

    const latest = getImportedMcpVersion(existing);
    const changed =
      latest.description !== incoming.description ||
      latest.manifestUrl !== incoming.manifestUrl ||
      latest.homepageUrl !== incoming.homepageUrl ||
      latest.transport !== incoming.transport ||
      latest.url !== incoming.url ||
      latest.command !== incoming.command ||
      JSON.stringify(latest.args) !== JSON.stringify(incoming.args) ||
      JSON.stringify(latest.envKeys) !== JSON.stringify(incoming.envKeys) ||
      JSON.stringify(latest.headers ?? {}) !== JSON.stringify(incoming.headers ?? {}) ||
      JSON.stringify(latest.tags) !== JSON.stringify(incoming.tags) ||
      latest.raw !== incoming.raw;

    if (!changed) return existing;

    return createNextImportedMcpVersion(
      existing,
      {
        description: incoming.description,
        manifestUrl: incoming.manifestUrl,
        homepageUrl: incoming.homepageUrl,
        transport: incoming.transport,
        url: incoming.url,
        command: incoming.command,
        args: incoming.args,
        envKeys: incoming.envKeys,
        headers: incoming.headers,
        tags: incoming.tags,
        raw: incoming.raw
      },
      incoming.updatedAt
    );
  });

  await Promise.all(mergedDocuments.map(dbUpsertMcp));
  return mergedDocuments;
}
