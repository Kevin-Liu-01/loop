import fs from "node:fs/promises";
import path from "node:path";

import YAML from "yaml";
import { z } from "zod";

import { buildVersionLabel, buildSkillVersionHref } from "@/lib/format";
import { createExcerpt, slugify, stableHash } from "@/lib/markdown";
import { CATEGORY_REGISTRY } from "@/lib/registry";
import type {
  AgentPrompt,
  CategorySlug,
  ImportedMcpDocument,
  ImportedMcpTransport,
  ImportedMcpVersion,
  ImportedResourceStore,
  ImportedSkillDocument,
  ImportedSkillVersion,
  ReferenceDoc,
  SkillRecord,
  SourceDefinition,
  VersionReference
} from "@/lib/types";

const IMPORT_STORE_VERSION = 2;
const IMPORT_STORE_FILE = path.join(process.cwd(), "content/generated/skillwire-imports.local.json");
const IMPORT_STORE_BLOB_PATH = "skillwire/imports.json";

const CATEGORY_SLUGS = CATEGORY_REGISTRY.map((category) => category.slug) as [
  CategorySlug,
  ...CategorySlug[]
];

const importedSkillVersionSchema = z.object({
  version: z.number().int().min(1),
  updatedAt: z.string().datetime(),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(CATEGORY_SLUGS),
  body: z.string().min(1),
  sourceUrl: z.string().url(),
  canonicalUrl: z.string().url(),
  ownerName: z.string().min(1).optional(),
  tags: z.array(z.string()),
  visibility: z.enum(["public", "member"]),
  syncEnabled: z.boolean(),
  lastSyncedAt: z.string().datetime().optional()
});

const importedSkillSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(CATEGORY_SLUGS),
  body: z.string().min(1),
  sourceUrl: z.string().url(),
  canonicalUrl: z.string().url(),
  ownerName: z.string().min(1).optional(),
  tags: z.array(z.string()),
  visibility: z.enum(["public", "member"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  syncEnabled: z.boolean(),
  lastSyncedAt: z.string().datetime().optional(),
  version: z.number().int().min(1),
  versions: z.array(importedSkillVersionSchema).min(1)
});

const importedMcpVersionSchema = z.object({
  version: z.number().int().min(1),
  updatedAt: z.string().datetime(),
  description: z.string(),
  manifestUrl: z.string().url(),
  homepageUrl: z.string().url().optional(),
  transport: z.enum(["stdio", "http", "sse", "ws", "unknown"]),
  url: z.string().url().optional(),
  command: z.string().optional(),
  args: z.array(z.string()),
  envKeys: z.array(z.string()),
  headers: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()),
  raw: z.string()
});

const importedMcpSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  manifestUrl: z.string().url(),
  homepageUrl: z.string().url().optional(),
  transport: z.enum(["stdio", "http", "sse", "ws", "unknown"]),
  url: z.string().url().optional(),
  command: z.string().optional(),
  args: z.array(z.string()),
  envKeys: z.array(z.string()),
  headers: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()),
  raw: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.number().int().min(1),
  versionLabel: z.string().min(2),
  versions: z.array(importedMcpVersionSchema).min(1)
});

const legacyImportedSkillSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(CATEGORY_SLUGS),
  body: z.string().min(1),
  sourceUrl: z.string().url(),
  canonicalUrl: z.string().url(),
  ownerName: z.string().min(1).optional(),
  tags: z.array(z.string()),
  visibility: z.enum(["public", "member"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  syncEnabled: z.boolean(),
  lastSyncedAt: z.string().datetime().optional()
});

const legacyImportedMcpSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  manifestUrl: z.string().url(),
  homepageUrl: z.string().url().optional(),
  transport: z.enum(["stdio", "http", "sse", "ws", "unknown"]),
  url: z.string().url().optional(),
  command: z.string().optional(),
  args: z.array(z.string()),
  envKeys: z.array(z.string()),
  headers: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()),
  raw: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function emptyStore(): ImportedResourceStore {
  return {
    version: IMPORT_STORE_VERSION,
    skills: [],
    mcps: []
  };
}

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
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  const root = hostname.split(".").slice(0, -1).join(" ");
  if (!root) {
    return undefined;
  }

  return root
    .split(/[-_]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferTitle(raw: string, fallbackUrl: string): string {
  const markdownTitle = /^#\s+(.+)$/m.exec(raw)?.[1]?.trim();
  if (markdownTitle) {
    return markdownTitle;
  }

  const htmlTitle = /<title>([^<]+)<\/title>/i.exec(raw)?.[1]?.trim();
  if (htmlTitle) {
    return decodeHtml(htmlTitle);
  }

  const pathname = new URL(fallbackUrl).pathname.split("/").filter(Boolean).pop();
  return pathname?.replace(/\.(md|markdown|txt|html)$/i, "").replace(/[-_]/g, " ") || "Imported skill";
}

function toMarkdownBody(raw: string, title: string, sourceUrl: string): string {
  if (!looksLikeHtml(raw, sourceUrl)) {
    return raw.trim();
  }

  const plain = stripHtml(raw);
  return [`# ${title}`, "", plain].join("\n");
}

export async function fetchRemoteText(inputUrl: string): Promise<{ raw: string; normalizedUrl: string }> {
  const normalizedUrl = normalizeImportUrl(inputUrl);
  const response = await fetch(normalizedUrl, {
    headers: {
      "user-agent": "SkillwireImporter/0.1 (+https://skillwire.local)"
    },
    signal: AbortSignal.timeout(10000),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Import failed with ${response.status}.`);
  }

  return {
    raw: await response.text(),
    normalizedUrl
  };
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
    provider: "skillwire-import",
    displayName: "Imported skill prompt",
    shortDescription: "Context synthesized from a remote skill import.",
    defaultPrompt: `Use $${slug}. Prefer the imported source at ${skill.canonicalUrl}.`,
    path: `skillwire://imports/skills/${slug}`
  };
}

function buildImportedSkillVersion(
  fields: Omit<ImportedSkillVersion, "version" | "updatedAt">,
  version: number,
  updatedAt: string
): ImportedSkillVersion {
  return {
    version,
    updatedAt,
    ...fields
  };
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
    sources: [source]
  };
}

function guessTransport(config: Record<string, unknown>): ImportedMcpTransport {
  const transport = typeof config.transport === "string" ? config.transport.toLowerCase() : "";
  const endpoint = typeof config.url === "string" ? config.url.toLowerCase() : "";

  if (transport === "stdio") {
    return "stdio";
  }
  if (transport === "sse" || endpoint.includes("/sse")) {
    return "sse";
  }
  if (transport === "http" || endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return "http";
  }
  if (transport === "ws" || endpoint.startsWith("ws://") || endpoint.startsWith("wss://")) {
    return "ws";
  }
  if (config.command) {
    return "stdio";
  }

  return "unknown";
}

function buildImportedMcpVersion(
  fields: Omit<ImportedMcpVersion, "version" | "updatedAt">,
  version: number,
  updatedAt: string
): ImportedMcpVersion {
  return {
    version,
    updatedAt,
    ...fields
  };
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
              Object.entries(config.headers as Record<string, unknown>).map(([key, value]) => [
                key,
                String(value)
              ])
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
  const title = inferTitle(raw, sourceUrl);
  const body = toMarkdownBody(raw, title, sourceUrl);
  const category = inferCategory(title, body, sourceUrl);
  const createdAt = now.toISOString();
  const slugBase = slugify(title) || `imported-skill-${stableHash(sourceUrl)}`;

  const version = buildImportedSkillVersion(
    {
      title,
      description: createExcerpt(body, 180),
      category,
      body,
      sourceUrl,
      canonicalUrl: sourceUrl,
      ownerName: inferOwnerName(sourceUrl),
      tags: normalizeTags([category, "imported", new URL(sourceUrl).hostname]),
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

function normalizeImportedSkillDocument(value: unknown): ImportedSkillDocument | null {
  const current = importedSkillSchema.safeParse(value);
  if (current.success) {
    const versions = current.data.versions.slice().sort((left, right) => right.version - left.version);
    const latest = versions[0];

    return {
      ...current.data,
      title: latest.title,
      description: latest.description,
      category: latest.category,
      body: latest.body,
      sourceUrl: latest.sourceUrl,
      canonicalUrl: latest.canonicalUrl,
      ownerName: latest.ownerName,
      tags: latest.tags,
      visibility: latest.visibility,
      updatedAt: latest.updatedAt,
      syncEnabled: latest.syncEnabled,
      lastSyncedAt: latest.lastSyncedAt,
      version: latest.version,
      versions
    };
  }

  const legacy = legacyImportedSkillSchema.safeParse(value);
  if (!legacy.success) {
    return null;
  }

  const version = buildImportedSkillVersion(
    {
      title: legacy.data.title,
      description: legacy.data.description,
      category: legacy.data.category,
      body: legacy.data.body,
      sourceUrl: legacy.data.sourceUrl,
      canonicalUrl: legacy.data.canonicalUrl,
      ownerName: legacy.data.ownerName,
      tags: legacy.data.tags,
      visibility: legacy.data.visibility,
      syncEnabled: legacy.data.syncEnabled,
      lastSyncedAt: legacy.data.lastSyncedAt
    },
    1,
    legacy.data.updatedAt
  );

  return {
    ...legacy.data,
    version: 1,
    versions: [version]
  };
}

function normalizeImportedMcpDocument(value: unknown): ImportedMcpDocument | null {
  const current = importedMcpSchema.safeParse(value);
  if (current.success) {
    const versions = current.data.versions.slice().sort((left, right) => right.version - left.version);
    const latest = versions[0];

    return {
      ...current.data,
      description: latest.description,
      manifestUrl: latest.manifestUrl,
      homepageUrl: latest.homepageUrl,
      transport: latest.transport,
      url: latest.url,
      command: latest.command,
      args: latest.args,
      envKeys: latest.envKeys,
      headers: latest.headers,
      tags: latest.tags,
      raw: latest.raw,
      updatedAt: latest.updatedAt,
      version: latest.version,
      versionLabel: buildVersionLabel(latest.version),
      versions
    };
  }

  const legacy = legacyImportedMcpSchema.safeParse(value);
  if (!legacy.success) {
    return null;
  }

  const version = buildImportedMcpVersion(
    {
      description: legacy.data.description,
      manifestUrl: legacy.data.manifestUrl,
      homepageUrl: legacy.data.homepageUrl,
      transport: legacy.data.transport,
      url: legacy.data.url,
      command: legacy.data.command,
      args: legacy.data.args,
      envKeys: legacy.data.envKeys,
      headers: legacy.data.headers,
      tags: legacy.data.tags,
      raw: legacy.data.raw
    },
    1,
    legacy.data.updatedAt
  );

  return {
    ...legacy.data,
    version: 1,
    versionLabel: buildVersionLabel(1),
    versions: [version]
  };
}

function normalizeStore(value: unknown): ImportedResourceStore {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyStore();
  }

  return {
    version: IMPORT_STORE_VERSION,
    skills: Array.isArray((value as { skills?: unknown[] }).skills)
      ? (value as { skills: unknown[] }).skills
          .map(normalizeImportedSkillDocument)
          .filter((skill): skill is ImportedSkillDocument => skill !== null)
      : [],
    mcps: Array.isArray((value as { mcps?: unknown[] }).mcps)
      ? (value as { mcps: unknown[] }).mcps
          .map(normalizeImportedMcpDocument)
          .filter((mcp): mcp is ImportedMcpDocument => mcp !== null)
      : []
  };
}

async function readStoreFromBlob(): Promise<ImportedResourceStore | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return null;
  }

  try {
    const { list } = await import("@vercel/blob");
    const result = await list({
      limit: 10,
      prefix: IMPORT_STORE_BLOB_PATH
    });
    const blob = result.blobs.find((entry) => entry.pathname === IMPORT_STORE_BLOB_PATH);
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

async function readStoreFromFile(): Promise<ImportedResourceStore | null> {
  if (!(await pathExists(IMPORT_STORE_FILE))) {
    return null;
  }

  try {
    return normalizeStore(JSON.parse(await fs.readFile(IMPORT_STORE_FILE, "utf8")));
  } catch {
    return null;
  }
}

export async function readImportStore(): Promise<ImportedResourceStore> {
  const remote = await readStoreFromBlob();
  if (remote) {
    return remote;
  }

  return (await readStoreFromFile()) ?? emptyStore();
}

export async function writeImportStore(store: ImportedResourceStore): Promise<void> {
  const normalized = normalizeStore(store);
  const payload = JSON.stringify(normalized, null, 2);

  await fs.mkdir(path.dirname(IMPORT_STORE_FILE), { recursive: true });
  await fs.writeFile(IMPORT_STORE_FILE, payload);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    await put(IMPORT_STORE_BLOB_PATH, payload, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json"
    });
  }
}

export async function listImportedSkills(): Promise<ImportedSkillDocument[]> {
  return [...(await readImportStore()).skills].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function listImportedMcps(): Promise<ImportedMcpDocument[]> {
  return [...(await readImportStore()).mcps].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function saveImportedSkills(skills: ImportedSkillDocument[]): Promise<void> {
  const store = await readImportStore();
  await writeImportStore({
    ...store,
    skills
  });
}

export async function saveImportedMcps(mcps: ImportedMcpDocument[]): Promise<void> {
  const store = await readImportStore();
  await writeImportStore({
    ...store,
    mcps
  });
}

export async function importRemoteSkill(inputUrl: string): Promise<ImportedSkillDocument> {
  const { raw, normalizedUrl } = await fetchRemoteText(inputUrl);
  const draft = buildImportedSkillDraft(raw, normalizedUrl);
  const store = await readImportStore();

  const nextSkills = [
    draft,
    ...store.skills.filter(
      (skill) => skill.slug !== draft.slug && skill.canonicalUrl !== draft.canonicalUrl && skill.sourceUrl !== inputUrl
    )
  ];

  await writeImportStore({
    ...store,
    skills: nextSkills
  });

  return draft;
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

export async function importRemoteMcps(inputUrl: string): Promise<ImportedMcpDocument[]> {
  const { raw, normalizedUrl } = await fetchRemoteText(inputUrl);
  const documents = extractMcpDocuments(raw, normalizedUrl);
  const store = await readImportStore();

  const mergedDocuments = documents.map((incoming) => {
    const existing = store.mcps.find(
      (entry) => entry.id === incoming.id || (entry.manifestUrl === incoming.manifestUrl && entry.name === incoming.name)
    );

    if (!existing) {
      return incoming;
    }

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

    if (!changed) {
      return existing;
    }

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

  const dedupedExisting = store.mcps.filter(
    (existing) =>
      !mergedDocuments.some(
        (incoming) => incoming.id === existing.id || (incoming.manifestUrl === existing.manifestUrl && incoming.name === existing.name)
      )
  );

  await writeImportStore({
    ...store,
    mcps: [...mergedDocuments, ...dedupedExisting]
  });

  return mergedDocuments;
}
