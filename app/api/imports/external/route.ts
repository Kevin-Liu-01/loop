import { EXTERNAL_SKILL_SOURCES, getContentsUrl, getRawUrl } from "@/lib/external-skill-sources";
import type { ExternalSkillSource } from "@/lib/external-skill-sources";

type GitHubItem = {
  name: string;
  path: string;
  type: "file" | "dir";
};

type DiscoveredSkill = {
  sourceId: string;
  sourceName: string;
  slug: string;
  path: string;
  skillMdUrl: string;
};

const GITHUB_SKILL_RE = /\[([^\]]+)\]\((https:\/\/github\.com\/[^/]+\/[^/)]+)\)/g;

async function discoverFromReadmeLinks(source: ExternalSkillSource): Promise<DiscoveredSkill[]> {
  const readmeUrl = getRawUrl(source, "README.md");
  const res = await fetch(readmeUrl, { next: { revalidate: 3600 } });
  if (!res.ok) return [];

  const text = await res.text();
  const seenUrls = new Set<string>();
  const slugCounts = new Map<string, number>();
  const skills: DiscoveredSkill[] = [];

  for (const match of text.matchAll(GITHUB_SKILL_RE)) {
    const rawLabel = match[1];
    const url = match[2];
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);

    const parts = url.replace("https://github.com/", "").split("/");
    if (parts.length < 2) continue;

    const containsHtml = /<[^>]+>/.test(rawLabel);
    const label = containsHtml ? parts[1] : rawLabel;
    let slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || parts[1];

    const count = slugCounts.get(slug) ?? 0;
    slugCounts.set(slug, count + 1);
    if (count > 0) slug = `${slug}-${parts[0]}`;

    skills.push({
      sourceId: source.id,
      sourceName: source.name,
      slug,
      path: `${parts[0]}/${parts[1]}`,
      skillMdUrl: url,
    });
  }

  return skills;
}

async function discoverFromDirectory(source: ExternalSkillSource): Promise<DiscoveredSkill[]> {
  const url = getContentsUrl(source);
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github.v3+json" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const items = (await res.json()) as GitHubItem[];

  if (source.fileExtensions?.length) {
    const files = items.filter(
      (item) =>
        item.type === "file" &&
        source.fileExtensions!.some((ext) => item.name.endsWith(ext))
    );
    return files.map((file) => {
      const slug = file.name.replace(/\.[^.]+$/, "");
      return {
        sourceId: source.id,
        sourceName: source.name,
        slug,
        path: file.path,
        skillMdUrl: getRawUrl(source, file.path),
      };
    });
  }

  const dirs = items.filter((item) => item.type === "dir" && !item.name.startsWith("."));

  return dirs.map((dir) => ({
    sourceId: source.id,
    sourceName: source.name,
    slug: dir.name,
    path: dir.path,
    skillMdUrl: getRawUrl(source, `${dir.path}/SKILL.md`),
  }));
}

function discoverSkillsFromSource(source: ExternalSkillSource): Promise<DiscoveredSkill[]> {
  if (source.skillsPath === "__readme_links__") {
    return discoverFromReadmeLinks(source);
  }
  return discoverFromDirectory(source);
}

export async function GET() {
  const results = await Promise.all(
    EXTERNAL_SKILL_SOURCES.map(async (source) => {
      const skills = await discoverSkillsFromSource(source);
      return {
        source: {
          id: source.id,
          name: source.name,
          org: source.org,
          repo: source.repo,
          iconUrl: source.iconUrl,
          description: source.description,
          homepage: source.homepage,
          trustTier: source.trustTier,
          discoveryMode: source.discoveryMode,
          searchQueries: source.searchQueries,
          discoveryRationale: source.discoveryRationale,
        },
        skills,
        count: skills.length,
      };
    })
  );

  return Response.json({
    ok: true,
    sources: results,
    totalSkills: results.reduce((sum, r) => sum + r.count, 0),
  });
}
