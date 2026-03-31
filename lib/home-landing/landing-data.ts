/**
 * Static demo data for the landing page — shapes that match real types
 * so the landing can reuse catalog components directly.
 */

import type { AutomationSummary, ImportedMcpDocument } from "@/lib/types";

export type LandingSkillRow = {
  slug: string;
  title: string;
  category: string;
  versionLabel: string;
  tone: "fresh" | "stale" | "idle";
  updatedAt: string;
  description: string;
  iconUrl?: string;
  ownerName: string;
};

export const LANDING_SKILLS: LandingSkillRow[] = [
  {
    slug: "frontend-frontier",
    title: "Frontend Frontier",
    category: "frontend",
    versionLabel: "v7",
    tone: "fresh",
    updatedAt: "18 min ago",
    description: "Art-direction, design-system tokens, motion, and 3D patterns for modern frontends.",
    ownerName: "Loop",
  },
  {
    slug: "reasoning-agent",
    title: "Reasoning Agent",
    category: "infra",
    versionLabel: "v4",
    tone: "fresh",
    updatedAt: "2h ago",
    description: "Chain-of-thought reasoning with eval-gated deploys and source citation.",
    ownerName: "Loop",
  },
  {
    slug: "seo-auditor",
    title: "Google SEO & GEO",
    category: "seo-geo",
    versionLabel: "v3",
    tone: "stale",
    updatedAt: "3d ago",
    description: "Crawl-based SEO analysis with Core Web Vitals and structured data checks.",
    ownerName: "Loop",
  },
  {
    slug: "mcp-orchestrator",
    title: "MCP Orchestrator",
    category: "a2a",
    versionLabel: "v5",
    tone: "fresh",
    updatedAt: "45 min ago",
    description: "Routes tool calls across GitHub, Notion, and Slack MCPs in a single agent run.",
    ownerName: "Loop",
  },
  {
    slug: "clerk-auth-patterns",
    title: "Clerk Auth Patterns",
    category: "security",
    versionLabel: "v2",
    tone: "idle",
    updatedAt: "5d ago",
    description: "Middleware auth, sign-in flows, organizations, and webhook patterns for Clerk + Next.js.",
    ownerName: "Loop",
  },
];

export const LANDING_AUTOMATIONS: AutomationSummary[] = [
  {
    id: "demo-auto-1",
    name: "Frontend Frontier refresh",
    prompt: "Scrape tracked sources for new art-direction references, motion-library API changes.",
    schedule: "RRULE:FREQ=DAILY;BYHOUR=9;BYMINUTE=0;BYSECOND=0",
    status: "ACTIVE",
    path: "/automations/demo-1",
    cwd: [],
    matchedSkillSlugs: ["frontend-frontier"],
    matchedCategorySlugs: ["frontend"],
  },
  {
    id: "demo-auto-2",
    name: "SEO & GEO audit",
    prompt: "Check Google algorithm updates, schema.org changes, and Core Web Vitals thresholds.",
    schedule: "RRULE:FREQ=WEEKLY;BYDAY=MO;BYHOUR=9;BYMINUTE=0;BYSECOND=0",
    status: "ACTIVE",
    path: "/automations/demo-2",
    cwd: [],
    matchedSkillSlugs: ["seo-auditor"],
    matchedCategorySlugs: ["seo-geo"],
  },
  {
    id: "demo-auto-3",
    name: "Reasoning Agent eval",
    prompt: "Run benchmark suite, compare against previous version, auto-rollback if regression.",
    schedule: "RRULE:FREQ=DAILY;BYHOUR=6;BYMINUTE=0;BYSECOND=0",
    status: "ACTIVE",
    path: "/automations/demo-3",
    cwd: [],
    matchedSkillSlugs: ["reasoning-agent"],
    matchedCategorySlugs: ["infra"],
  },
  {
    id: "demo-auto-4",
    name: "MCP registry sync",
    prompt: "Discover new MCP servers, verify manifests, update catalog.",
    schedule: "RRULE:FREQ=WEEKLY;BYDAY=WE;BYHOUR=10;BYMINUTE=0;BYSECOND=0",
    status: "ACTIVE",
    path: "/automations/demo-4",
    cwd: [],
    matchedSkillSlugs: ["mcp-orchestrator"],
    matchedCategorySlugs: ["a2a"],
  },
];

export type LandingMcpRow = Pick<
  ImportedMcpDocument,
  "id" | "name" | "description" | "transport" | "iconUrl" | "homepageUrl"
>;

export const LANDING_MCPS: LandingMcpRow[] = [
  { id: "mcp-github", name: "GitHub", description: "Repos, issues, PRs, and Actions", transport: "stdio", iconUrl: "https://github.com/github.png?size=64", homepageUrl: "https://github.com" },
  { id: "mcp-vercel", name: "Vercel", description: "Deployments, domains, and env vars", transport: "http", iconUrl: "https://github.com/vercel.png?size=64", homepageUrl: "https://vercel.com" },
  { id: "mcp-slack", name: "Slack", description: "Messages, channels, and files", transport: "http", iconUrl: "https://github.com/slackapi.png?size=64", homepageUrl: "https://slack.com" },
  { id: "mcp-stripe", name: "Stripe", description: "Payments, subscriptions, invoices", transport: "http", iconUrl: "https://github.com/stripe.png?size=64", homepageUrl: "https://stripe.com" },
  { id: "mcp-supabase", name: "Supabase", description: "Postgres, auth, and storage", transport: "stdio", iconUrl: "https://github.com/supabase.png?size=64", homepageUrl: "https://supabase.com" },
  { id: "mcp-linear", name: "Linear", description: "Issues, projects, and team workflows", transport: "http", iconUrl: "https://github.com/linearapp.png?size=64", homepageUrl: "https://linear.app" },
  { id: "mcp-notion", name: "Notion", description: "Pages, databases, and workspaces", transport: "http", iconUrl: "https://github.com/makenotion.png?size=64", homepageUrl: "https://notion.so" },
  { id: "mcp-figma", name: "Figma", description: "Design tokens and component specs", transport: "http", iconUrl: "https://github.com/figma.png?size=64", homepageUrl: "https://figma.com" },
];
