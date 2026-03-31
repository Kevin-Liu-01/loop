import type { MetadataRoute } from "next";

import { buildMcpVersionHref } from "@/lib/format";
import { getLoopSnapshot } from "@/lib/refresh";
import { buildSiteUrl } from "@/lib/seo";
import { SETTINGS_BASE_PATH, SETTINGS_NAV_ITEMS } from "@/lib/settings-nav";

const STATIC_PATHS = [
  "/",
  "/faq",
  "/sign-in",
  "/sign-up",
  SETTINGS_BASE_PATH,
  ...SETTINGS_NAV_ITEMS.map((item) => `${SETTINGS_BASE_PATH}/${item.id}`),
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  let skillEntries: MetadataRoute.Sitemap = [];
  let mcpEntries: MetadataRoute.Sitemap = [];

  try {
    const snapshot = await getLoopSnapshot();

    skillEntries = snapshot.skills
      .filter((s) => s.visibility === "public")
      .map((s) => ({
        url: buildSiteUrl(s.href).toString(),
        lastModified: s.updatedAt ? new Date(s.updatedAt) : now,
        changeFrequency: "weekly" as const,
        priority: s.featured ? 0.85 : 0.7,
      }));

    mcpEntries = snapshot.mcps.map((mcp) => ({
      url: buildSiteUrl(buildMcpVersionHref(mcp.name, mcp.version)).toString(),
      lastModified: mcp.updatedAt ? new Date(mcp.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }));
  } catch {
    // Graceful degradation when DB/env is unavailable
  }

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: buildSiteUrl(path).toString(),
    lastModified: now,
    changeFrequency: path === "/" ? ("daily" as const) : ("monthly" as const),
    priority: path === "/" ? 1 : 0.5,
  }));

  return [...staticEntries, ...skillEntries, ...mcpEntries];
}
