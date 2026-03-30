import type { CategoryDefinition, CategorySlug, MembershipPlan } from "@/lib/types";
import { computeSourceLogoUrl } from "@/lib/skill-icons";

function s(id: string, label: string, url: string, kind: "rss" | "atom" | "docs", tags: string[]) {
  return { id, label, url, kind, tags, logoUrl: computeSourceLogoUrl(url) } as const;
}

export const CATEGORY_REGISTRY: CategoryDefinition[] = [
  {
    slug: "frontend",
    title: "Frontend",
    strapline: "Design engineering, motion, and signal-rich UI systems.",
    description:
      "Editorial UI craft, motion systems, design-engineering references, and production-ready frontend skills.",
    hero: "Daily frontend radar with local skills, source pulls, and reusable agent prompts.",
    accent: "signal-red",
    icon: "palette",
    status: "live",
    keywords: ["frontend", "motion", "design", "react", "next.js", "ui", "animation"],
    sources: [
      s("vercel-blog", "Vercel Blog", "https://vercel.com/atom", "atom", ["vercel", "next.js", "ai", "frontend"]),
      s("react-blog", "React", "https://react.dev/rss.xml", "rss", ["react", "frontend"]),
      s("nextjs-releases", "Next.js Releases", "https://github.com/vercel/next.js/releases.atom", "atom", ["next.js", "releases"]),
      s("hn-show", "Hacker News Show", "https://hnrss.org/show", "rss", ["hn", "show-hn"])
    ]
  },
  {
    slug: "seo-geo",
    title: "SEO + GEO",
    strapline: "Search visibility, entity coverage, and AI citability.",
    description:
      "Living operational guidance for search, generative-engine optimization, structured data, and source quality.",
    hero: "Track crawler, citation, and entity-surface shifts without drowning in acronym soup.",
    accent: "signal-blue",
    icon: "search",
    status: "live",
    keywords: ["seo", "geo", "aeo", "search", "schema", "crawler", "citability"],
    sources: [
      s("google-search-central", "Google Search Central", "https://developers.google.com/search/blog", "docs", ["google", "search"]),
      s("moz-blog", "Moz Blog", "https://moz.com/blog/feed", "rss", ["seo", "industry"]),
      s("search-engine-land", "Search Engine Land", "https://searchengineland.com/feed", "rss", ["seo", "industry"])
    ]
  },
  {
    slug: "social",
    title: "Social Systems",
    strapline: "Post operating systems, drafts, and proof-backed publishing loops.",
    description:
      "Turn signals into ranked content backlogs, sharper drafts, and repeatable publishing systems.",
    hero: "The content side of the machine: what to say, how to say it, and why anyone should care.",
    accent: "signal-gold",
    icon: "megaphone",
    status: "live",
    keywords: ["social", "content", "linkedin", "x", "post", "distribution"],
    sources: [
      s("signal-radar", "Signal Radar", "https://hnrss.org/frontpage", "rss", ["hn", "social-angle"]),
      s("product-hunt", "Product Hunt", "https://www.producthunt.com/feed", "rss", ["launches", "products"])
    ]
  },
  {
    slug: "infra",
    title: "Infra",
    strapline: "Hosting, edge compute, observability, and platform plumbing.",
    description:
      "Infra signals focused on deploy surfaces, storage, performance, and platform capability shifts.",
    hero: "For the infrastructure layer you do care about, even when you claim you do not.",
    accent: "signal-blue",
    icon: "server",
    status: "seeded",
    keywords: ["infra", "hosting", "edge", "observability", "serverless", "platform"],
    sources: [
      s("cloudflare-blog", "Cloudflare Blog", "https://blog.cloudflare.com/rss/", "rss", ["cloudflare", "edge"]),
      s("vercel-blog-infra", "Vercel Blog", "https://vercel.com/atom", "atom", ["vercel", "infra"]),
      s("kubernetes-blog", "Kubernetes", "https://kubernetes.io/feed.xml", "rss", ["kubernetes", "infra"])
    ]
  },
  {
    slug: "containers",
    title: "Containers",
    strapline: "Docker, OCI, runtime images, and container ergonomics.",
    description:
      "A dedicated lane for container signals so infra notes stop getting buried in generic ops noise.",
    hero: "Container changes worth caring about, minus the usual YAML-induced Stockholm syndrome.",
    accent: "signal-red",
    icon: "box",
    status: "seeded",
    keywords: ["container", "docker", "oci", "kubernetes", "podman"],
    sources: [
      s("docker-blog", "Docker", "https://www.docker.com/blog/feed/", "rss", ["docker", "containers"]),
      s("containerd-releases", "containerd Releases", "https://github.com/containerd/containerd/releases.atom", "atom", ["containerd", "releases"])
    ]
  },
  {
    slug: "a2a",
    title: "A2A",
    strapline: "Agents, agent-to-agent patterns, tool orchestration, and protocol watch.",
    description:
      "A daily desk for agent systems, orchestration patterns, provider changes, and protocol-level moves.",
    hero: "Where agent infrastructure, orchestration, and protocol work gets distilled into something usable.",
    accent: "signal-gold",
    icon: "brain",
    status: "seeded",
    keywords: ["agent", "a2a", "orchestration", "tools", "mcp", "sdk"],
    sources: [
      s("openai-news", "OpenAI News", "https://openai.com/news/rss.xml", "rss", ["agents", "llms"]),
      s("anthropic-news", "Anthropic News", "https://www.anthropic.com/news", "docs", ["agents", "llms"]),
      s("vercel-ai", "Vercel AI", "https://vercel.com/atom", "atom", ["ai-sdk", "agents"])
    ]
  },
  {
    slug: "security",
    title: "Security",
    strapline: "Threat models, secure defaults, and hardening playbooks.",
    description:
      "Security review and threat-model skills surfaced alongside the same daily signal machinery.",
    hero: "Because the security pass should not be the scene where everyone suddenly remembers consequences exist.",
    accent: "signal-blue",
    icon: "shield",
    status: "live",
    keywords: ["security", "threat", "auth", "abuse", "hardening"],
    sources: [
      s("github-advisory", "GitHub Security Advisories", "https://github.com/advisories?query=type%3Areviewed+ecosystem%3Anpm", "docs", ["security", "npm", "advisories"]),
      s("portswigger-research", "PortSwigger Research", "https://portswigger.net/research/rss", "rss", ["security", "research", "web"]),
      s("krebs-security", "Krebs on Security", "https://krebsonsecurity.com/feed/", "rss", ["security", "industry"])
    ]
  },
  {
    slug: "ops",
    title: "Ops",
    strapline: "GitHub, Linear, maintenance automation, and internal workflow glue.",
    description:
      "Operational skills for CI, issue triage, release hygiene, and the less glamorous parts of shipping.",
    hero: "The glue code and operational muscle memory that keeps the rest of the machine from face-planting.",
    accent: "signal-gold",
    icon: "settings",
    status: "live",
    keywords: ["ops", "github", "linear", "automation", "maintenance", "workflow"],
    sources: [
      s("github-blog", "GitHub Blog", "https://github.blog/feed/", "rss", ["github", "ops", "releases"]),
      s("github-changelog", "GitHub Changelog", "https://github.blog/changelog/feed/", "rss", ["github", "changelog"]),
      s("linear-changelog", "Linear Changelog", "https://linear.app/changelog", "docs", ["linear", "ops"])
    ]
  }
];

export const FEATURED_SKILLS = new Set([
  "frontend-frontier",
  "seo-geo",
  "social-content-os",
  "social-draft",
  "security-best-practices",
  "security-threat-model",
  "gh-fix-ci",
  "linear"
]);

export const SKILL_OVERRIDES: Partial<
  Record<
    string,
    {
      category: CategorySlug;
      accent: string;
      visibility: "public" | "member";
      tags: string[];
    }
  >
> = {
  "frontend-frontier": {
    category: "frontend",
    accent: "signal-red",
    visibility: "public",
    tags: ["featured", "editorial-ui", "motion"]
  },
  "seo-geo": {
    category: "seo-geo",
    accent: "signal-blue",
    visibility: "public",
    tags: ["featured", "citability", "schema"]
  },
  "social-content-os": {
    category: "social",
    accent: "signal-gold",
    visibility: "public",
    tags: ["content", "distribution"]
  },
  "social-draft": {
    category: "social",
    accent: "signal-gold",
    visibility: "public",
    tags: ["drafting", "copy"]
  },
  "security-best-practices": {
    category: "security",
    accent: "signal-blue",
    visibility: "member",
    tags: ["hardening", "review"]
  },
  "security-threat-model": {
    category: "security",
    accent: "signal-blue",
    visibility: "member",
    tags: ["threat-model", "appsec"]
  },
  linear: {
    category: "ops",
    accent: "signal-gold",
    visibility: "member",
    tags: ["workflow", "issues"]
  },
  "gh-fix-ci": {
    category: "ops",
    accent: "signal-gold",
    visibility: "member",
    tags: ["ci", "github"]
  }
};

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    slug: "free",
    title: "Free Signal",
    priceLabel: "$0",
    interval: "forever",
    ctaLabel: "Reading now",
    description: "Daily briefs, public skills, RSS feed, and the full editorial front page.",
    features: ["Public skills", "Daily briefs", "RSS feed", "Category browsing"]
  },
  {
    slug: "operator",
    title: "Operator",
    priceLabel: "$19",
    interval: "per month",
    ctaLabel: "Unlock operator tools",
    description: "Private in-house skills, copilot answers, premium categories, and member-only prompts.",
    features: [
      "AI skill copilot",
      "Private skill packs",
      "Prompt library",
      "Priority refresh cadence"
    ]
  }
];
