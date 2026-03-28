import { getSkillwireSnapshot } from "@/lib/refresh";
import { buildSearchIndex, getSearchIndex, searchIndex, writeSearchIndex } from "@/lib/search";
import { CATEGORY_REGISTRY } from "@/lib/registry";
import { logUsageEvent, withApiUsage } from "@/lib/usage-server";
import type { CategorySlug, SearchDocumentKind } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  return withApiUsage(
    {
      route: "/api/search",
      method: "GET",
      label: "Catalog search",
      details: query ? `q=${query.slice(0, 80)}` : "latest"
    },
    async () => {
      const categoryValue = searchParams.get("category") || undefined;
      const category = CATEGORY_REGISTRY.some((entry) => entry.slug === categoryValue)
        ? (categoryValue as CategorySlug)
        : undefined;
      const kind = (searchParams.get("kind") as SearchDocumentKind | null) ?? undefined;
      const limitParam = Number(searchParams.get("limit") ?? "12");
      const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(200, limitParam)) : 12;

      let index = await getSearchIndex();
      if (index.documents.length === 0) {
        const snapshot = await getSkillwireSnapshot();
        index = buildSearchIndex(snapshot);
        await writeSearchIndex(index);
      }

      const hits = searchIndex(index, query, {
        category,
        kind,
        limit
      });

      if (query.trim()) {
        await logUsageEvent({
          kind: "search",
          source: "api",
          label: "Searched catalog",
          details: query.trim().slice(0, 120),
          categorySlug: category
        });
      }

      return Response.json({
        ok: true,
        generatedAt: index.generatedAt,
        count: hits.length,
        hits
      });
    }
  );
}
