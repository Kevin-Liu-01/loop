import { NextResponse } from "next/server";

import { getLoopSnapshot } from "@/lib/refresh";
import { getSiteUrlString } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Public index of every skill and MCP on Loop as plain text.
 * Designed for agents to discover and browse the catalog.
 */
export async function GET() {
  const siteUrl = getSiteUrlString();

  let snapshot: Awaited<ReturnType<typeof getLoopSnapshot>>;
  try {
    snapshot = await getLoopSnapshot();
  } catch {
    return NextResponse.json(
      { error: "Failed to load catalog" },
      { status: 500 }
    );
  }

  const publicSkills = snapshot.skills.filter((s) => s.visibility === "public");
  const mcps = snapshot.mcps;

  const lines: string[] = [
    "# Loop Skill & MCP Catalog",
    "",
    `Total skills: ${publicSkills.length}`,
    `Total MCPs: ${mcps.length}`,
    `Generated: ${new Date().toISOString()}`,
    "",
    "---",
    "",
    "## Skills",
    "",
  ];

  for (const skill of publicSkills) {
    const rawUrl = `${siteUrl}/api/skills/${skill.slug}/raw`;
    lines.push(`### ${skill.title}`);
    lines.push(`- Slug: ${skill.slug}`);
    lines.push(`- Category: ${skill.category}`);
    lines.push(`- Tags: ${skill.tags.join(", ") || "none"}`);
    lines.push(`- Description: ${skill.description}`);
    lines.push(`- Version: ${skill.versionLabel}`);
    lines.push(`- Updated: ${skill.updatedAt}`);
    lines.push(`- Raw URL: ${rawUrl}`);
    lines.push(`- Detail: ${siteUrl}${skill.href}`);
    if (skill.ownerName) lines.push(`- Author: ${skill.ownerName}`);
    lines.push("");
  }

  lines.push("---", "", "## MCP Servers", "");

  for (const mcp of mcps) {
    lines.push(`### ${mcp.name}`);
    lines.push(`- Description: ${mcp.description}`);
    lines.push(`- Transport: ${mcp.transport}`);
    lines.push(`- Tags: ${mcp.tags.join(", ") || "none"}`);
    if (mcp.manifestUrl) lines.push(`- Manifest: ${mcp.manifestUrl}`);
    if (mcp.homepageUrl) lines.push(`- Homepage: ${mcp.homepageUrl}`);
    lines.push("");
  }

  const body = lines.join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
