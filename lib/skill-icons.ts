import type { CategorySlug } from "@/lib/types";

// ---------------------------------------------------------------------------
// Icon types — supports both Lucide icon names and external logo URLs
// ---------------------------------------------------------------------------

export type IconRef =
  | { kind: "lucide"; name: string }
  | { kind: "url"; url: string; alt: string };

// ---------------------------------------------------------------------------
// Brand logo URLs — SimpleIcons CDN first, GitHub avatar fallback
// ---------------------------------------------------------------------------

const SI = "https://cdn.simpleicons.org";
const GH = "https://github.com";

const BRAND_LOGOS = {
  // SimpleIcons — default = official brand color
  anthropic:  `${SI}/anthropic`,
  auth0:      `${SI}/auth0`,
  brave:      `${SI}/brave`,
  clerk:      `${SI}/clerk`,
  cloudflare: `${SI}/cloudflare`,
  docker:     `${SI}/docker`,
  figma:      `${SI}/figma`,
  framer:     `${SI}/framer`,
  google:     `${SI}/google`,
  github:     `${SI}/github`,
  grafana:    `${SI}/grafana`,
  gsap:       `${SI}/greensock`,
  huggingface:`${SI}/huggingface`,
  kubernetes: `${SI}/kubernetes`,
  langchain:  `${SI}/langchain`,
  linear:     `${SI}/linear`,
  nextjs:     `${SI}/nextdotjs`,
  notion:     `${SI}/notion`,
  prisma:     `${SI}/prisma`,
  react:      `${SI}/react`,
  resend:     `${SI}/resend`,
  sentry:     `${SI}/sentry`,
  snyk:       `${SI}/snyk`,
  stripe:     `${SI}/stripe`,
  supabase:   `${SI}/supabase`,
  tailwind:   `${SI}/tailwindcss`,
  terraform:  `${SI}/terraform`,
  threejs:    `${SI}/threedotjs`,
  todoist:    `${SI}/todoist`,
  turso:      `${SI}/turso`,
  upstash:    `${SI}/upstash`,
  vercel:     `${SI}/vercel`,

  slack:      `${SI}/slack`,

  // Not on SimpleIcons — GitHub avatar fallback
  aws:        `${GH}/amazon.png?size=64`,
  context7:   `${GH}/upstash.png?size=64`,
  exa:        `${GH}/exa-labs.png?size=64`,
  firecrawl:  `${GH}/firecrawl.png?size=64`,
  moz:        `${GH}/moz.png?size=64`,
  neon:       `${GH}/neondatabase.png?size=64`,
  openai:     `${GH}/openai.png?size=64`,
  playwright: `${GH}/microsoft.png?size=64`,

  // Brands without SimpleIcons or GitHub avatar
  atlassian:  `${SI}/atlassian`,
  circleci:   `${SI}/circleci`,
  crowdstrike:`${SI}/crowdstrike`,
  elastic:    `${SI}/elasticsearch`,
  firebase:   `${SI}/firebase`,
  gitlab:     `${SI}/gitlab`,
  heroku:     `${SI}/heroku`,
  honeycomb:  `${SI}/honeycomb`,
  hubspot:    `${SI}/hubspot`,
  mariadb:    `${SI}/mariadb`,
  mongodb:    `${SI}/mongodb`,
  monday:     `${SI}/mondaydotcom`,
  neo4j:      `${SI}/neo4j`,
  netlify:    `${SI}/netlify`,
  pagerduty:  `${SI}/pagerduty`,
  paypal:     `${SI}/paypal`,
  perplexity: `${SI}/perplexity`,
  posthog:    `${SI}/posthog`,
  pulumi:     `${SI}/pulumi`,
  redis:      `${SI}/redis`,
  render:     `${SI}/render`,
  semgrep:    `${SI}/semgrep`,
  sonarqube:  `${SI}/sonarqube`,
  storybook:  `${SI}/storybook`,
} as const;

function lucide(name: string): IconRef {
  return { kind: "lucide", name };
}

function brand(key: keyof typeof BRAND_LOGOS, alt: string): IconRef {
  return { kind: "url", url: BRAND_LOGOS[key], alt };
}

// ---------------------------------------------------------------------------
// Category icons (Lucide icon names)
// ---------------------------------------------------------------------------

export const CATEGORY_ICONS: Record<CategorySlug, IconRef> = {
  frontend: lucide("palette"),
  "seo-geo": lucide("search"),
  social: lucide("megaphone"),
  infra: lucide("server"),
  containers: lucide("box"),
  a2a: lucide("brain"),
  security: lucide("shield"),
  ops: lucide("settings"),
};

// ---------------------------------------------------------------------------
// Skill icons — brand logos for provider-associated skills, Lucide for generic
// ---------------------------------------------------------------------------

const SKILL_ICONS: Record<string, IconRef> = {
  // Frontend
  "frontend-frontier": lucide("palette"),
  "motion-framer": brand("framer", "Motion"),
  "gsap-scrolltrigger": brand("gsap", "GSAP"),
  "react-three-fiber": brand("threejs", "Three.js"),
  "tailwind-design-system": brand("tailwind", "Tailwind CSS"),
  "web-performance": lucide("gauge"),
  "accessible-ui": lucide("accessibility"),
  "nextjs-patterns": brand("nextjs", "Next.js"),
  "responsive-layouts": lucide("monitor-smartphone"),
  "component-architecture": brand("react", "React"),

  // SEO + GEO
  "seo-geo": lucide("search"),
  "schema-markup": lucide("braces"),
  "technical-seo-audit": lucide("scan-search"),
  "ai-citability": brand("openai", "OpenAI"),
  "keyword-research": lucide("text-search"),
  "content-seo-strategy": lucide("file-text"),

  // Social
  "social-content-os": lucide("megaphone"),
  "social-draft": lucide("pen-line"),
  "audience-growth": lucide("trending-up"),
  "content-repurposing": lucide("repeat-2"),
  "newsletter-craft": lucide("mail"),

  // Infra
  "edge-compute": brand("cloudflare", "Cloudflare"),
  "database-patterns": brand("supabase", "Supabase"),
  "observability-stack": lucide("activity"),
  "serverless-architecture": brand("vercel", "Vercel"),
  "cdn-caching": lucide("hard-drive"),

  // Containers
  "dockerfile-mastery": brand("docker", "Docker"),
  "kubernetes-essentials": brand("kubernetes", "Kubernetes"),
  "container-security": lucide("shield-check"),

  // A2A — Agents
  "agent-orchestration": lucide("brain"),
  "mcp-development": brand("anthropic", "Anthropic"),
  "prompt-engineering": brand("openai", "OpenAI"),
  "tool-use-patterns": lucide("wrench"),
  "rag-pipelines": lucide("database"),

  // Security
  "security-best-practices": lucide("shield"),
  "security-threat-model": lucide("shield-alert"),
  "auth-patterns": brand("clerk", "Clerk"),
  "api-security": lucide("lock"),

  // Ops
  "gh-actions-ci": brand("github", "GitHub"),
  "release-management": lucide("git-branch"),
};

export function getSkillIcon(slug: string): IconRef {
  return SKILL_ICONS[slug] ?? lucide("file-text");
}

export function getCategoryIcon(slug: CategorySlug): IconRef {
  return CATEGORY_ICONS[slug] ?? lucide("folder");
}

// ---------------------------------------------------------------------------
// MCP icons — brand logos for imported MCP servers, keyed by name
// ---------------------------------------------------------------------------

const MCP_ICONS: Record<string, IconRef> = {
  // Official reference
  "Everything": lucide("layers"),
  "Filesystem": lucide("folder-open"),
  "Memory": lucide("brain"),
  "Sequential Thinking": lucide("list-ordered"),
  "Fetch": lucide("globe"),
  "Git": lucide("git-branch"),

  // Dev platforms
  "GitHub": brand("github", "GitHub"),
  "GitLab": brand("gitlab", "GitLab"),
  "Vercel": brand("vercel", "Vercel"),
  "Cloudflare": brand("cloudflare", "Cloudflare"),
  "Netlify": brand("netlify", "Netlify"),
  "Heroku": brand("heroku", "Heroku"),
  "Sentry": brand("sentry", "Sentry"),
  "CircleCI": brand("circleci", "CircleCI"),
  "Storybook": brand("storybook", "Storybook"),

  // Databases
  "Supabase": brand("supabase", "Supabase"),
  "Neon": brand("neon", "Neon"),
  "Prisma": brand("prisma", "Prisma"),
  "Turso": brand("turso", "Turso"),
  "Upstash": brand("upstash", "Upstash"),
  "MongoDB": brand("mongodb", "MongoDB"),
  "ClickHouse": lucide("database"),
  "Redis": brand("redis", "Redis"),
  "Neo4j": brand("neo4j", "Neo4j"),
  "Elasticsearch": brand("elastic", "Elasticsearch"),
  "MariaDB": brand("mariadb", "MariaDB"),

  // Vector databases
  "Pinecone": lucide("database"),
  "Qdrant": lucide("database"),
  "Chroma": lucide("database"),
  "Milvus": lucide("database"),

  // Search & research
  "Context7": brand("context7", "Context7"),
  "Brave Search": brand("brave", "Brave"),
  "Exa": brand("exa", "Exa"),
  "Firecrawl": brand("firecrawl", "Firecrawl"),
  "Perplexity": brand("perplexity", "Perplexity"),
  "Apify": lucide("search"),

  // Browser
  "Playwright": brand("playwright", "Playwright"),
  "Puppeteer": brand("google", "Puppeteer"),
  "Browserbase": lucide("globe"),

  // Productivity
  "Notion": brand("notion", "Notion"),
  "Slack": brand("slack", "Slack"),
  "Linear": brand("linear", "Linear"),
  "Todoist": brand("todoist", "Todoist"),
  "Atlassian": brand("atlassian", "Atlassian"),
  "HubSpot": brand("hubspot", "HubSpot"),
  "Monday.com": brand("monday", "Monday.com"),

  // Payments
  "Stripe": brand("stripe", "Stripe"),
  "PayPal": brand("paypal", "PayPal"),

  // Design
  "Figma": brand("figma", "Figma"),
  "Cloudinary": lucide("image"),

  // Email
  "Resend": brand("resend", "Resend"),

  // Observability
  "Grafana": brand("grafana", "Grafana"),
  "PagerDuty": brand("pagerduty", "PagerDuty"),
  "PostHog": brand("posthog", "PostHog"),
  "Honeycomb": brand("honeycomb", "Honeycomb"),
  "Axiom": lucide("activity"),

  // AI
  "OpenAI Agents": brand("openai", "OpenAI"),
  "Hugging Face": brand("huggingface", "Hugging Face"),
  "E2B": lucide("box"),

  // Data
  "PostgreSQL": lucide("database"),
  "SQLite": lucide("database"),

  // Infra
  "AWS API": brand("aws", "AWS"),
  "Azure": lucide("cloud"),
  "Google Cloud Run": brand("google", "Google Cloud"),
  "Terraform": brand("terraform", "Terraform"),
  "Pulumi": brand("pulumi", "Pulumi"),
  "Docker": brand("docker", "Docker"),
  "Kubernetes": brand("kubernetes", "Kubernetes"),
  "Render": brand("render", "Render"),
  "Firebase": brand("firebase", "Firebase"),

  // Security
  "Snyk": brand("snyk", "Snyk"),
  "Auth0": brand("auth0", "Auth0"),
  "SonarQube": brand("sonarqube", "SonarQube"),
  "Semgrep": brand("semgrep", "Semgrep"),
  "CrowdStrike Falcon": brand("crowdstrike", "CrowdStrike"),

  // Utilities
  "MCP Proxy": lucide("arrow-right-left"),
  "Time": lucide("clock"),
};

// ---------------------------------------------------------------------------
// Platform doc icons — brand logos for agent doc tabs (cursor.md, claude.md…)
// ---------------------------------------------------------------------------

export type PlatformDocIcon = {
  src: string;
  alt: string;
};

export const PLATFORM_DOC_ICONS: Record<string, PlatformDocIcon> = {
  cursor: { src: "/brands/cursor.svg", alt: "Cursor" },
  claude: { src: "/brands/anthropic.svg", alt: "Anthropic / Claude" },
  codex:  { src: "/brands/openai.png", alt: "OpenAI / Codex" },
  agents: { src: "/brands/cursor.svg", alt: "AGENTS.md" },
};

export function getPlatformDocIcon(key: string): PlatformDocIcon | null {
  return PLATFORM_DOC_ICONS[key] ?? null;
}

export function getMcpIcon(name: string, homepageUrl?: string): IconRef {
  const match = MCP_ICONS[name];
  if (match) return match;
  if (homepageUrl) {
    return { kind: "url", url: computeSourceLogoUrl(homepageUrl), alt: name };
  }
  return lucide("plug");
}

// ---------------------------------------------------------------------------
// Source logo computation — precompute from URL hostname via Google favicons
// ---------------------------------------------------------------------------

export function computeSourceLogoUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
  } catch {
    return "";
  }
}
