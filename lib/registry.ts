import type { CategoryDefinition, CategorySlug, MembershipPlan } from "@/lib/types";

export const CATEGORY_REGISTRY: CategoryDefinition[] = [
  {
    slug: "frontend",
    title: "Frontend",
    strapline: "Design engineering, motion, and signal-rich UI systems.",
    description:
      "Editorial UI craft, motion systems, design-engineering references, and production-ready frontend skills.",
    hero: "Daily frontend radar with local skills, source pulls, and reusable agent prompts.",
    accent: "signal-red",
    status: "live",
    keywords: ["frontend", "motion", "design", "react", "next.js", "ui", "animation"],
    sources: [
      {
        id: "vercel-blog",
        label: "Vercel Blog",
        url: "https://vercel.com/blog/rss.xml",
        kind: "rss",
        tags: ["vercel", "next.js", "ai", "frontend"]
      },
      {
        id: "react-blog",
        label: "React",
        url: "https://react.dev/rss.xml",
        kind: "rss",
        tags: ["react", "frontend"]
      },
      {
        id: "nextjs-releases",
        label: "Next.js Releases",
        url: "https://github.com/vercel/next.js/releases.atom",
        kind: "atom",
        tags: ["next.js", "releases"]
      },
      {
        id: "hn-show",
        label: "Hacker News Show",
        url: "https://hnrss.org/show",
        kind: "rss",
        tags: ["hn", "show-hn"]
      }
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
    status: "live",
    keywords: ["seo", "geo", "aeo", "search", "schema", "crawler", "citability"],
    sources: [
      {
        id: "google-search-central",
        label: "Google Search Central",
        url: "https://developers.google.com/search/blog/rss.xml",
        kind: "rss",
        tags: ["google", "search"]
      },
      {
        id: "bing-webmaster",
        label: "Bing Webmaster",
        url: "https://blogs.bing.com/webmaster/rss",
        kind: "rss",
        tags: ["bing", "search"]
      },
      {
        id: "search-engine-land",
        label: "Search Engine Land",
        url: "https://searchengineland.com/feed",
        kind: "rss",
        tags: ["seo", "industry"]
      }
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
    status: "live",
    keywords: ["social", "content", "linkedin", "x", "post", "distribution"],
    sources: [
      {
        id: "signal-radar",
        label: "Signal Radar",
        url: "https://hnrss.org/frontpage",
        kind: "rss",
        tags: ["hn", "social-angle"]
      },
      {
        id: "product-hunt",
        label: "Product Hunt",
        url: "https://www.producthunt.com/feed",
        kind: "rss",
        tags: ["launches", "products"]
      }
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
    status: "seeded",
    keywords: ["infra", "hosting", "edge", "observability", "serverless", "platform"],
    sources: [
      {
        id: "cloudflare-blog",
        label: "Cloudflare Blog",
        url: "https://blog.cloudflare.com/rss/",
        kind: "rss",
        tags: ["cloudflare", "edge"]
      },
      {
        id: "vercel-blog-infra",
        label: "Vercel Blog",
        url: "https://vercel.com/blog/rss.xml",
        kind: "rss",
        tags: ["vercel", "infra"]
      },
      {
        id: "kubernetes-blog",
        label: "Kubernetes",
        url: "https://kubernetes.io/feed.xml",
        kind: "rss",
        tags: ["kubernetes", "infra"]
      }
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
    status: "seeded",
    keywords: ["container", "docker", "oci", "kubernetes", "podman"],
    sources: [
      {
        id: "docker-blog",
        label: "Docker",
        url: "https://www.docker.com/blog/feed/",
        kind: "rss",
        tags: ["docker", "containers"]
      },
      {
        id: "containerd-releases",
        label: "containerd Releases",
        url: "https://github.com/containerd/containerd/releases.atom",
        kind: "atom",
        tags: ["containerd", "releases"]
      }
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
    status: "seeded",
    keywords: ["agent", "a2a", "orchestration", "tools", "mcp", "sdk"],
    sources: [
      {
        id: "openai-news",
        label: "OpenAI News",
        url: "https://openai.com/news/rss.xml",
        kind: "rss",
        tags: ["agents", "llms"]
      },
      {
        id: "anthropic-news",
        label: "Anthropic News",
        url: "https://www.anthropic.com/news/rss.xml",
        kind: "rss",
        tags: ["agents", "llms"]
      },
      {
        id: "vercel-ai",
        label: "Vercel AI",
        url: "https://vercel.com/blog/rss.xml",
        kind: "rss",
        tags: ["ai-sdk", "agents"]
      }
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
    status: "live",
    keywords: ["security", "threat", "auth", "abuse", "hardening"],
    sources: []
  },
  {
    slug: "ops",
    title: "Ops",
    strapline: "GitHub, Linear, maintenance automation, and internal workflow glue.",
    description:
      "Operational skills for CI, issue triage, release hygiene, and the less glamorous parts of shipping.",
    hero: "The glue code and operational muscle memory that keeps the rest of the machine from face-planting.",
    accent: "signal-gold",
    status: "live",
    keywords: ["ops", "github", "linear", "automation", "maintenance", "workflow"],
    sources: []
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
