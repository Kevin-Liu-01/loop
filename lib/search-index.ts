import { buildMcpVersionHref } from "@/lib/format";
import type {
  LoopSnapshot,
  SearchDocument,
  SearchDocumentKind,
  SearchHit,
  SearchIndex,
} from "@/lib/types";

type SearchIndexOptions = {
  kind?: SearchDocumentKind;
  limit?: number;
};

export function buildSearchIndex(snapshot: LoopSnapshot): SearchIndex {
  const documents: SearchDocument[] = [];

  for (const skill of snapshot.skills) {
    documents.push({
      id: `skill:${skill.slug}`,
      kind: "skill",
      title: skill.title,
      description: skill.description,
      href: skill.href,
      category: skill.category,
      tags: skill.tags,
      updatedAt: skill.updatedAt,
      origin: skill.origin,
      versionLabel: skill.versionLabel,
    });
  }

  for (const cat of snapshot.categories) {
    documents.push({
      id: `category:${cat.slug}`,
      kind: "category",
      title: cat.title,
      description: cat.description,
      href: `/categories/${cat.slug}`,
      category: cat.slug,
      tags: cat.keywords,
      updatedAt: snapshot.generatedAt,
    });
  }

  for (const mcp of snapshot.mcps) {
    documents.push({
      id: `mcp:${mcp.id}:${mcp.version}`,
      kind: "mcp",
      title: mcp.name,
      description: mcp.description,
      href: buildMcpVersionHref(mcp.name, mcp.version),
      tags: mcp.tags,
      updatedAt: mcp.updatedAt,
      origin: "system",
      versionLabel: mcp.versionLabel,
    });
  }

  for (const brief of snapshot.dailyBriefs) {
    documents.push({
      id: `brief:${brief.slug}`,
      kind: "brief",
      title: brief.title,
      description: brief.summary,
      href: `/categories/${brief.slug}`,
      category: brief.slug,
      tags: brief.items.flatMap((item) => item.tags),
      updatedAt: brief.generatedAt,
    });
  }

  const tokens: Record<string, Array<{ id: string; score: number }>> = {};

  for (const doc of documents) {
    const docTokens = tokenize(
      `${doc.title} ${doc.description} ${doc.tags.join(" ")}`
    );
    const seen = new Map<string, number>();
    for (const t of docTokens) {
      seen.set(t, (seen.get(t) ?? 0) + 1);
    }
    for (const [token, count] of seen) {
      const titleBoost = doc.title.toLowerCase().includes(token) ? 10 : 0;
      const score = count + titleBoost;
      if (!tokens[token]) tokens[token] = [];
      tokens[token].push({ id: doc.id, score });
    }
  }

  return {
    version: 1,
    generatedAt: snapshot.generatedAt,
    documents,
    tokens,
  };
}

export function searchIndex(
  index: SearchIndex,
  query: string,
  options: SearchIndexOptions = {}
): SearchHit[] {
  const { kind, limit = 20 } = options;

  let candidates = index.documents;
  if (kind) {
    candidates = candidates.filter((d) => d.kind === kind);
  }

  const q = query.trim().toLowerCase();
  if (!q) {
    return candidates
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, limit)
      .map((doc, i) => ({ ...doc, score: limit - i }));
  }

  const queryTokens = tokenize(q);
  const scoreMap = new Map<string, number>();

  for (const token of queryTokens) {
    const entries = index.tokens[token];
    if (!entries) continue;
    for (const entry of entries) {
      scoreMap.set(entry.id, (scoreMap.get(entry.id) ?? 0) + entry.score);
    }
  }

  const candidateIds = new Set(candidates.map((d) => d.id));
  const docMap = new Map(index.documents.map((d) => [d.id, d]));

  return [...scoreMap.entries()]
    .filter(([id]) => candidateIds.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, score]) => ({ ...docMap.get(id)!, score }));
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}
