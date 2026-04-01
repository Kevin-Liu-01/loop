/**
 * Registry of external skill repositories that Loop imports from.
 * Each source defines a GitHub repo and how to discover skills within it.
 */

import { resolveBrandIcon } from "@/lib/brand-icons";

export type ExternalSkillSource = {
  id: string;
  name: string;
  org: string;
  repo: string;
  branch: string;
  skillsPath: string;
  /** When set, discover individual files matching these extensions instead of sub-directories. */
  fileExtensions?: string[];
  iconUrl: string;
  description: string;
  homepage: string;
  trustTier: "official" | "community";
  discoveryMode: "canonical" | "lead-list";
  searchQueries: string[];
  discoveryRationale: string;
  /** Slug in `skill_authors` table – skills from this source get linked to the verified author. */
  authorSlug?: string;
};

export const EXTERNAL_SKILL_SOURCES: ExternalSkillSource[] = [
  {
    id: "anthropic-skills",
    name: "Anthropic Skills",
    org: "anthropics",
    repo: "skills",
    branch: "main",
    skillsPath: "skills",
    iconUrl: resolveBrandIcon("anthropic")!,
    description: "Official Claude agent skills from Anthropic – PDF generation, MCP building, frontend design, and more.",
    homepage: "https://github.com/anthropics/skills",
    trustTier: "official",
    discoveryMode: "canonical",
    searchQueries: ["anthropic skills github", "claude skills official"],
    discoveryRationale: "Canonical upstream repo. Import bodies directly from the maintained skills directory.",
    authorSlug: "anthropic",
  },
  {
    id: "openai-skills",
    name: "OpenAI Skills",
    org: "openai",
    repo: "skills",
    branch: "main",
    skillsPath: "skills/.curated",
    iconUrl: resolveBrandIcon("openai")!,
    description: "Official Codex agent skills from OpenAI – curated skills for coding, research, and development.",
    homepage: "https://github.com/openai/skills",
    trustTier: "official",
    discoveryMode: "canonical",
    searchQueries: ["openai skills github", "codex skills official"],
    discoveryRationale: "Canonical upstream repo. Pull from the curated skills directory instead of scraping mirrors.",
    authorSlug: "openai",
  },
  {
    id: "awesome-agent-skills",
    name: "Awesome Agent Skills",
    org: "heilcheng",
    repo: "awesome-agent-skills",
    branch: "main",
    skillsPath: "__readme_links__",
    iconUrl: resolveBrandIcon("github")!,
    description: "Community-curated list of agent skill repos – links parsed from the README.",
    homepage: "https://github.com/heilcheng/awesome-agent-skills",
    trustTier: "community",
    discoveryMode: "lead-list",
    searchQueries: ["awesome agent skills github", "mcp skills repos"],
    discoveryRationale: "Lead-generation surface only. Use it to discover candidates, then verify and transplant from canonical upstreams.",
    authorSlug: "awesome-agent-skills",
  },
  {
    id: "cursor-directory",
    name: "Cursor Directory",
    org: "leerob",
    repo: "directories",
    branch: "main",
    skillsPath: "src/data/rules",
    fileExtensions: [".ts"],
    iconUrl: resolveBrandIcon("cursor")!,
    description: "Community-curated Cursor rules from cursor.directory – the largest public collection of .cursorrules files.",
    homepage: "https://cursor.directory",
    trustTier: "community",
    discoveryMode: "canonical",
    searchQueries: ["cursor.directory rules github", "cursor rules community"],
    discoveryRationale: "Canonical upstream for the cursor.directory community collection. Import rules directly from the rules directory.",
    authorSlug: "cursor-directory",
  },
  {
    id: "awesome-mcp-servers",
    name: "Awesome MCP Servers",
    org: "appcypher",
    repo: "awesome-mcp-servers",
    branch: "main",
    skillsPath: "__readme_links__",
    iconUrl: resolveBrandIcon("mcp")!,
    description: "Community-curated list of MCP servers – the definitive awesome-list for Model Context Protocol integrations.",
    homepage: "https://github.com/appcypher/awesome-mcp-servers",
    trustTier: "community",
    discoveryMode: "lead-list",
    searchQueries: ["awesome mcp servers", "model context protocol servers list"],
    discoveryRationale: "Lead list for MCP server discovery. Parse README links to find repos with SKILL.md or MCP definitions.",
    authorSlug: "awesome-mcp-servers",
  },
];

export function getContentsUrl(source: ExternalSkillSource): string {
  const base = `https://api.github.com/repos/${source.org}/${source.repo}/contents`;
  return source.skillsPath ? `${base}/${source.skillsPath}` : base;
}

export function getRawUrl(source: ExternalSkillSource, path: string): string {
  return `https://raw.githubusercontent.com/${source.org}/${source.repo}/${source.branch}/${path}`;
}

/**
 * Match a URL to a known external skill source by GitHub org/repo.
 * Returns `undefined` when no source matches.
 */
export function findSourceForUrl(url: string): ExternalSkillSource | undefined {
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname !== "github.com" && hostname !== "raw.githubusercontent.com") {
      return undefined;
    }
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length < 2) return undefined;
    const [org, repo] = segments;
    return EXTERNAL_SKILL_SOURCES.find(
      (s) => s.org.toLowerCase() === org.toLowerCase() && s.repo.toLowerCase() === repo.toLowerCase(),
    );
  } catch {
    return undefined;
  }
}
