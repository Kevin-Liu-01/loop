/**
 * Landing page data — sourced from the real skill registry, MCP catalog, and
 * automation configs so visitors see actual platform content.
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

// ---------------------------------------------------------------------------
// Top skills — mirrors FEATURED_SKILLS from registry.ts + SKILL_SOURCE_CONFIGS
// ---------------------------------------------------------------------------

export const LANDING_SKILLS: LandingSkillRow[] = [
  {
    slug: "frontend-frontier",
    title: "Frontend Frontier",
    category: "frontend",
    versionLabel: "v7",
    tone: "fresh",
    updatedAt: "18 min ago",
    description:
      "Art-direction, design-system tokens, motion, and 3D patterns for modern frontends.",
    ownerName: "Loop",
  },
  {
    slug: "agent-orchestration",
    title: "Agent Orchestration",
    category: "a2a",
    versionLabel: "v5",
    tone: "fresh",
    updatedAt: "42 min ago",
    description:
      "Multi-agent protocol patterns, handoff APIs, and state-management architecture for orchestration.",
    ownerName: "Loop",
  },
  {
    slug: "seo-geo",
    title: "SEO + GEO",
    category: "seo-geo",
    versionLabel: "v6",
    tone: "fresh",
    updatedAt: "1h ago",
    description:
      "Search visibility, entity coverage, structured data, and AI-citability guidance.",
    ownerName: "Loop",
  },
  {
    slug: "security-best-practices",
    title: "Security Best Practices",
    category: "security",
    versionLabel: "v4",
    tone: "fresh",
    updatedAt: "2h ago",
    description:
      "Secure-coding checklist, dependency-audit workflow, and incident-response patterns.",
    ownerName: "Loop",
  },
  {
    slug: "nextjs-patterns",
    title: "Next.js Patterns",
    category: "frontend",
    versionLabel: "v8",
    tone: "fresh",
    updatedAt: "3h ago",
    description:
      "App Router, cache directives, proxy.ts, Turbopack defaults, and SSR/ISR/PPR strategies.",
    ownerName: "Loop",
  },
  {
    slug: "database-patterns",
    title: "Database Patterns",
    category: "infra",
    versionLabel: "v3",
    tone: "stale",
    updatedAt: "1d ago",
    description:
      "Postgres extensions, RLS patterns, connection-pooling, and schema-design guidance for Supabase & Neon.",
    ownerName: "Loop",
  },
  {
    slug: "prompt-engineering",
    title: "Prompt Engineering",
    category: "a2a",
    versionLabel: "v6",
    tone: "fresh",
    updatedAt: "55 min ago",
    description:
      "Chain-of-thought templates, few-shot examples, and production prompt-versioning patterns.",
    ownerName: "Loop",
  },
  {
    slug: "gh-actions-ci",
    title: "GitHub Actions CI",
    category: "ops",
    versionLabel: "v3",
    tone: "idle",
    updatedAt: "3d ago",
    description:
      "Actions runner updates, caching-API changes, secret management, and workflow templates.",
    ownerName: "Loop",
  },
];

// ---------------------------------------------------------------------------
// Automations — real schedules from SKILL_SOURCE_CONFIGS automation cadences
// Uses actual RRULE format consumed by the AutomationCalendar
// ---------------------------------------------------------------------------

export const LANDING_AUTOMATIONS: AutomationSummary[] = [
  {
    id: "auto-frontend-frontier",
    name: "Frontend Frontier refresh",
    prompt:
      "Scrape tracked sources for new art-direction references, motion-library API changes, design-system tooling releases, and frontier CSS/JS features.",
    schedule:
      "RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;BYHOUR=9;BYMINUTE=0",
    status: "ACTIVE",
    path: "/automations/frontend-frontier",
    cwd: [],
    matchedSkillSlugs: ["frontend-frontier"],
    matchedCategorySlugs: ["frontend"],
  },
  {
    id: "auto-agent-orchestration",
    name: "Agent Orchestration scan",
    prompt:
      "Scan OpenAI, Anthropic, and Google blogs for multi-agent protocol changes, handoff-API updates, and orchestration pattern guidance.",
    schedule:
      "RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;BYHOUR=9;BYMINUTE=0",
    status: "ACTIVE",
    path: "/automations/agent-orchestration",
    cwd: [],
    matchedSkillSlugs: ["agent-orchestration"],
    matchedCategorySlugs: ["a2a"],
  },
  {
    id: "auto-seo-geo",
    name: "SEO + GEO audit",
    prompt:
      "Scan Google Search Central for algorithm updates, indexing policy changes, and rich-result requirements. Track schema.org releases.",
    schedule:
      "RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;BYHOUR=9;BYMINUTE=0",
    status: "ACTIVE",
    path: "/automations/seo-geo",
    cwd: [],
    matchedSkillSlugs: ["seo-geo"],
    matchedCategorySlugs: ["seo-geo"],
  },
  {
    id: "auto-security",
    name: "Security advisory sweep",
    prompt:
      "Scan GitHub Security Advisories for critical npm CVEs. Check Snyk blog for dependency vulnerability trends. Monitor PortSwigger for new web-attack techniques.",
    schedule:
      "RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;BYHOUR=9;BYMINUTE=0",
    status: "ACTIVE",
    path: "/automations/security-best-practices",
    cwd: [],
    matchedSkillSlugs: ["security-best-practices"],
    matchedCategorySlugs: ["security"],
  },
  {
    id: "auto-nextjs",
    name: "Next.js Patterns refresh",
    prompt:
      "Check Next.js releases for App Router changes, new cache directives, proxy.ts updates, and Turbopack defaults.",
    schedule:
      "RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;BYHOUR=9;BYMINUTE=0",
    status: "ACTIVE",
    path: "/automations/nextjs-patterns",
    cwd: [],
    matchedSkillSlugs: ["nextjs-patterns"],
    matchedCategorySlugs: ["frontend"],
  },
  {
    id: "auto-prompt-engineering",
    name: "Prompt Engineering update",
    prompt:
      "Scan OpenAI and Anthropic changelogs for model behavior changes that affect prompting. Update chain-of-thought templates and few-shot examples.",
    schedule:
      "RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;BYHOUR=9;BYMINUTE=0",
    status: "ACTIVE",
    path: "/automations/prompt-engineering",
    cwd: [],
    matchedSkillSlugs: ["prompt-engineering"],
    matchedCategorySlugs: ["a2a"],
  },
  {
    id: "auto-database",
    name: "Database Patterns refresh",
    prompt:
      "Check Supabase blog for new Postgres extensions, RLS pattern updates, and connection-pooling changes. Scan Neon blog for serverless Postgres features.",
    schedule:
      "RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;BYHOUR=9;BYMINUTE=0",
    status: "ACTIVE",
    path: "/automations/database-patterns",
    cwd: [],
    matchedSkillSlugs: ["database-patterns"],
    matchedCategorySlugs: ["infra"],
  },
  {
    id: "auto-gh-actions",
    name: "GitHub Actions CI refresh",
    prompt:
      "Check GitHub Blog and Changelog for Actions runner updates, new built-in actions, caching-API changes, and OIDC token improvements.",
    schedule:
      "RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;BYHOUR=9;BYMINUTE=0",
    status: "ACTIVE",
    path: "/automations/gh-actions-ci",
    cwd: [],
    matchedSkillSlugs: ["gh-actions-ci"],
    matchedCategorySlugs: ["ops"],
  },
];

// ---------------------------------------------------------------------------
// Top MCPs — from SEED_MCP_DEFINITIONS (real catalog entries)
// ---------------------------------------------------------------------------

export type LandingMcpRow = Pick<
  ImportedMcpDocument,
  "id" | "name" | "description" | "transport" | "iconUrl" | "homepageUrl"
>;

export const LANDING_MCPS: LandingMcpRow[] = [
  {
    id: "mcp-github",
    name: "GitHub",
    description:
      "Search repos, manage issues and PRs, read files, create branches, and review Actions runs",
    transport: "stdio",
    iconUrl: "https://github.com/github.png?size=64",
    homepageUrl: "https://github.com/github/github-mcp-server",
  },
  {
    id: "mcp-vercel",
    name: "Vercel",
    description:
      "Manage deployments, domains, environment variables, and logs",
    transport: "http",
    iconUrl: "https://github.com/vercel.png?size=64",
    homepageUrl: "https://vercel.com/docs/mcp",
  },
  {
    id: "mcp-supabase",
    name: "Supabase",
    description:
      "Query databases, manage auth, inspect schemas, and deploy edge functions",
    transport: "stdio",
    iconUrl: "https://github.com/supabase.png?size=64",
    homepageUrl: "https://github.com/supabase-community/supabase-mcp",
  },
  {
    id: "mcp-stripe",
    name: "Stripe",
    description:
      "Payments, subscriptions, customers, and invoices via the Stripe API",
    transport: "http",
    iconUrl: "https://github.com/stripe.png?size=64",
    homepageUrl: "https://docs.stripe.com/mcp",
  },
  {
    id: "mcp-slack",
    name: "Slack",
    description:
      "Search messages, users, channels, and files. Send messages and manage canvases",
    transport: "http",
    iconUrl: "https://github.com/slackapi.png?size=64",
    homepageUrl: "https://api.slack.com",
  },
  {
    id: "mcp-linear",
    name: "Linear",
    description:
      "Create and update issues, manage projects and cycles, and search docs",
    transport: "http",
    iconUrl: "https://github.com/linearapp.png?size=64",
    homepageUrl: "https://linear.app/docs/mcp",
  },
  {
    id: "mcp-figma",
    name: "Figma",
    description:
      "Extract design context, generate code from frames, and write to the canvas",
    transport: "http",
    iconUrl: "https://github.com/figma.png?size=64",
    homepageUrl: "https://www.figma.com/developers/mcp",
  },
  {
    id: "mcp-notion",
    name: "Notion",
    description:
      "Create pages, query databases, search workspace, and manage content",
    transport: "http",
    iconUrl: "https://github.com/makenotion.png?size=64",
    homepageUrl: "https://developers.notion.com",
  },
  {
    id: "mcp-sentry",
    name: "Sentry",
    description:
      "Access issues, errors, projects, and AI-powered Seer analysis for debugging",
    transport: "stdio",
    iconUrl: "https://github.com/getsentry.png?size=64",
    homepageUrl: "https://docs.sentry.io/ai/mcp/",
  },
  {
    id: "mcp-playwright",
    name: "Playwright",
    description:
      "Browser automation using accessibility snapshots — navigate, fill forms, screenshot",
    transport: "stdio",
    iconUrl: "https://github.com/microsoft.png?size=64",
    homepageUrl: "https://github.com/microsoft/playwright-mcp",
  },
];
