import fs from "node:fs/promises";
import path from "node:path";

import { readLocalSnapshotFile } from "@/lib/content";
import type { SearchDocument, SearchHit, SearchIndex, SkillwireSnapshot } from "@/lib/types";

const SEARCH_INDEX_VERSION = 1;
const SEARCH_INDEX_FILE = path.join(process.cwd(), "content/generated/skillwire-search.local.json");
const SEARCH_INDEX_BLOB_PATH = "skillwire/search-index.json";

function emptyIndex(): SearchIndex {
  return {
    version: SEARCH_INDEX_VERSION,
    generatedAt: new Date(0).toISOString(),
    documents: [],
    tokens: {}
  };
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function tokenize(value: string): string[] {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2)
    )
  );
}

function toSearchDocuments(snapshot: SkillwireSnapshot): SearchDocument[] {
  const categoryDocs = snapshot.categories.map((category) => ({
    id: `category:${category.slug}`,
    kind: "category" as const,
    title: category.title,
    description: category.description,
    href: `/categories/${category.slug}`,
    category: category.slug,
    tags: [category.slug, ...category.keywords],
    updatedAt: snapshot.generatedAt,
    origin: "system" as const
  }));

  const briefDocs = snapshot.dailyBriefs.map((brief) => ({
    id: `brief:${brief.slug}`,
    kind: "brief" as const,
    title: brief.title,
    description: brief.summary,
    href: `/categories/${brief.slug}`,
    category: brief.slug,
    tags: brief.items.flatMap((item) => item.tags),
    updatedAt: brief.generatedAt,
    origin: "system" as const
  }));

  const skillDocs = snapshot.skills.map((skill) => ({
    id: `skill:${skill.slug}:${skill.version}`,
    kind: "skill" as const,
    title: skill.title,
    description: skill.description,
    href: skill.href,
    category: skill.category,
    tags: skill.tags,
    updatedAt: skill.updatedAt,
    origin: skill.origin,
    versionLabel: skill.versionLabel
  }));

  const mcpDocs = snapshot.mcps.map((mcp) => ({
    id: `mcp:${mcp.id}:${mcp.version}`,
    kind: "mcp" as const,
    title: mcp.name,
    description: mcp.description,
    href: "/agents",
    tags: mcp.tags,
    updatedAt: mcp.updatedAt,
    origin: "system" as const,
    versionLabel: mcp.versionLabel
  }));

  return [...skillDocs, ...categoryDocs, ...briefDocs, ...mcpDocs];
}

export function buildSearchIndex(snapshot: SkillwireSnapshot): SearchIndex {
  const documents = toSearchDocuments(snapshot);
  const tokens = documents.reduce<SearchIndex["tokens"]>((map, document) => {
    const weightedFields: Array<[string, number]> = [
      [document.title, 5],
      [document.tags.join(" "), 4],
      [document.description, 2],
      [document.category ?? "", 2],
      [document.versionLabel ?? "", 1]
    ];

    weightedFields.forEach(([value, weight]) => {
      tokenize(value).forEach((token) => {
        const existing = map[token] ?? [];
        const found = existing.find((entry) => entry.id === document.id);
        if (found) {
          found.score += weight;
        } else {
          existing.push({ id: document.id, score: weight });
        }
        map[token] = existing;
      });
    });

    return map;
  }, {});

  return {
    version: SEARCH_INDEX_VERSION,
    generatedAt: snapshot.generatedAt,
    documents,
    tokens
  };
}

function normalizeIndex(value: unknown): SearchIndex {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyIndex();
  }

  const input = value as Partial<SearchIndex>;
  if (!Array.isArray(input.documents) || !input.tokens || typeof input.tokens !== "object") {
    return emptyIndex();
  }

  return {
    version: SEARCH_INDEX_VERSION,
    generatedAt: typeof input.generatedAt === "string" ? input.generatedAt : new Date(0).toISOString(),
    documents: input.documents as SearchDocument[],
    tokens: input.tokens as SearchIndex["tokens"]
  };
}

async function readIndexFromBlob(): Promise<SearchIndex | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return null;
  }

  try {
    const { list } = await import("@vercel/blob");
    const result = await list({
      limit: 10,
      prefix: SEARCH_INDEX_BLOB_PATH
    });
    const blob = result.blobs.find((entry) => entry.pathname === SEARCH_INDEX_BLOB_PATH);
    if (!blob) {
      return null;
    }

    const response = await fetch(blob.url, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    return normalizeIndex(await response.json());
  } catch {
    return null;
  }
}

async function readIndexFromFile(): Promise<SearchIndex | null> {
  if (!(await pathExists(SEARCH_INDEX_FILE))) {
    return null;
  }

  try {
    return normalizeIndex(JSON.parse(await fs.readFile(SEARCH_INDEX_FILE, "utf8")));
  } catch {
    return null;
  }
}

export async function readSearchIndex(): Promise<SearchIndex | null> {
  const remote = await readIndexFromBlob();
  if (remote) {
    return remote;
  }

  return readIndexFromFile();
}

export async function writeSearchIndex(index: SearchIndex): Promise<void> {
  const payload = JSON.stringify(index, null, 2);

  await fs.mkdir(path.dirname(SEARCH_INDEX_FILE), { recursive: true });
  await fs.writeFile(SEARCH_INDEX_FILE, payload);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    await put(SEARCH_INDEX_BLOB_PATH, payload, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json"
    });
  }
}

export async function persistSearchIndex(snapshot: SkillwireSnapshot): Promise<SearchIndex> {
  const index = buildSearchIndex(snapshot);
  await writeSearchIndex(index);
  return index;
}

export async function getSearchIndex(): Promise<SearchIndex> {
  const existing = await readSearchIndex();
  if (existing && existing.documents.length > 0) {
    return existing;
  }

  const snapshot = await readLocalSnapshotFile();
  if (!snapshot) {
    return emptyIndex();
  }

  const index = buildSearchIndex(snapshot);
  await writeSearchIndex(index);
  return index;
}

export function searchIndex(
  index: SearchIndex,
  query: string,
  options: {
    kind?: SearchDocument["kind"];
    category?: SearchDocument["category"];
    limit?: number;
  } = {}
): SearchHit[] {
  const limit = options.limit ?? 12;
  const documents = index.documents.filter((document) => {
    if (options.kind && document.kind !== options.kind) {
      return false;
    }
    if (options.category && document.category !== options.category) {
      return false;
    }
    return true;
  });

  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return documents
      .slice()
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, limit)
      .map((document, indexValue) => ({
        ...document,
        score: limit - indexValue
      }));
  }

  const scores = new Map<string, number>();
  const queryTokens = tokenize(normalizedQuery);

  queryTokens.forEach((token) => {
    (index.tokens[token] ?? []).forEach((entry) => {
      scores.set(entry.id, (scores.get(entry.id) ?? 0) + entry.score);
    });
  });

  return documents
    .map((document) => {
      let score = scores.get(document.id) ?? 0;
      if (document.title.toLowerCase().includes(normalizedQuery)) {
        score += 8;
      }
      if (document.description.toLowerCase().includes(normalizedQuery)) {
        score += 3;
      }

      return {
        ...document,
        score
      };
    })
    .filter((document) => document.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return right.updatedAt.localeCompare(left.updatedAt);
    })
    .slice(0, limit);
}
