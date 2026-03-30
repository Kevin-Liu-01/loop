import { searchSkills as dbSearchSkills } from "@/lib/db/search";
import { listBriefs } from "@/lib/db/briefs";
import { listCategories } from "@/lib/db/categories";
import { listMcps } from "@/lib/db/mcps";
import type { SearchHit, SkillOrigin } from "@/lib/types";

export type SearchOptions = {
  kind?: "skill" | "category" | "brief" | "mcp";
  category?: string;
  limit?: number;
};

export async function search(
  query: string,
  options: SearchOptions = {}
): Promise<SearchHit[]> {
  const limit = options.limit ?? 12;
  const normalizedQuery = query.trim().toLowerCase();

  if (!options.kind || options.kind === "skill") {
    return dbSearchSkills(query, {
      category: options.category,
      limit
    });
  }

  if (options.kind === "category") {
    const categories = await listCategories();
    return categories
      .filter((c) => !normalizedQuery || c.title.toLowerCase().includes(normalizedQuery) || c.slug.includes(normalizedQuery))
      .slice(0, limit)
      .map((c, i) => ({
        id: `category:${c.slug}`,
        kind: "category" as const,
        title: c.title,
        description: c.description,
        href: `/categories/${c.slug}`,
        category: c.slug,
        tags: c.keywords,
        updatedAt: new Date().toISOString(),
        score: limit - i
      }));
  }

  if (options.kind === "brief") {
    const briefs = await listBriefs();
    return briefs
      .filter((b) => !normalizedQuery || b.title.toLowerCase().includes(normalizedQuery) || b.summary.toLowerCase().includes(normalizedQuery))
      .slice(0, limit)
      .map((b, i) => ({
        id: `brief:${b.slug}`,
        kind: "brief" as const,
        title: b.title,
        description: b.summary,
        href: `/categories/${b.slug}`,
        category: b.slug,
        tags: b.items.flatMap((item) => item.tags),
        updatedAt: b.generatedAt,
        score: limit - i
      }));
  }

  if (options.kind === "mcp") {
    const mcps = await listMcps();
    return mcps
      .filter((m) => !normalizedQuery || m.name.toLowerCase().includes(normalizedQuery) || m.description.toLowerCase().includes(normalizedQuery))
      .slice(0, limit)
      .map((m, i) => ({
        id: `mcp:${m.id}:${m.version}`,
        kind: "mcp" as const,
        title: m.name,
        description: m.description,
        href: "/agents",
        tags: m.tags,
        updatedAt: m.updatedAt,
        origin: "system" as SkillOrigin | "system",
        versionLabel: m.versionLabel,
        score: limit - i
      }));
  }

  return [];
}

export { searchSkills } from "@/lib/db/search";
