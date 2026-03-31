import { getSkillBySlug, getSkillAtVersion } from "@/lib/db/skills";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const versionParam = searchParams.get("v");

  let skill;
  if (versionParam) {
    const version = Number(versionParam);
    if (!Number.isInteger(version) || version < 1) {
      return new Response("Invalid version parameter.", { status: 400 });
    }
    skill = await getSkillAtVersion(slug, version);
  } else {
    skill = await getSkillBySlug(slug);
  }

  if (!skill || skill.visibility !== "public") {
    return new Response("Skill not found.", { status: 404 });
  }

  const frontmatter = [
    "---",
    `title: "${skill.title.replace(/"/g, '\\"')}"`,
    `slug: ${skill.slug}`,
    `version: v${skill.version}`,
    `category: ${skill.category}`,
    `updated: ${skill.updatedAt}`,
    skill.tags.length > 0 ? `tags: [${skill.tags.join(", ")}]` : null,
    "---",
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");

  const body = `${frontmatter}${skill.body}`;

  return new Response(body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=3600",
      "x-skill-version": String(skill.version),
    },
  });
}
