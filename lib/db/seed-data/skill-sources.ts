import { DEFAULT_PREFERRED_HOUR } from "@/lib/automation-constants";
import { computeSourceLogoUrl } from "@/lib/skill-icons";
import type { SkillAutomationState, SourceDefinition } from "@/lib/types";

// ---------------------------------------------------------------------------
// Shared source pools — reuse across skills to avoid duplication
// ---------------------------------------------------------------------------

const SRC = {
  // --- AI / LLM providers ---
  openaiNews: src("openai-news", "OpenAI News", "https://openai.com/news/rss.xml", "rss", ["openai", "llm", "agents"]),
  openaiChangelog: src(
    "openai-changelog",
    "OpenAI Platform Changelog",
    "https://platform.openai.com/docs/changelog",
    "docs-index",
    ["openai", "api", "changelog"],
    {
      mode: "discover",
      parser: "html-links",
      searchQueries: ["responses api", "agents sdk", "structured outputs", "tool calling", "mcp"],
      rationale: "Rank OpenAI changelog entries against the skill's query hints instead of trusting page order.",
    }
  ),
  anthropicNews: src(
    "anthropic-news",
    "Anthropic News",
    "https://www.anthropic.com/news",
    "docs-index",
    ["anthropic", "claude", "llm"],
    {
      mode: "discover",
      parser: "html-links",
      searchQueries: ["claude", "tool use", "mcp", "computer use", "prompting"],
    }
  ),
  anthropicDocs: src(
    "anthropic-docs",
    "Anthropic Docs Index",
    "https://docs.anthropic.com/en/sitemap.xml",
    "sitemap",
    ["anthropic", "models", "api"],
    {
      mode: "discover",
      parser: "sitemap",
      searchQueries: ["tool use", "json schema", "mcp", "prompting", "models"],
      rationale: "Use the Anthropic docs sitemap to discover newly-added docs and rank them by relevance.",
    }
  ),
  googleAi: src("google-ai-blog", "Google AI Blog", "https://blog.google/technology/ai/rss/", "rss", ["google", "gemini", "ai"]),
  googleDevAi: src(
    "google-dev-ai",
    "Google AI Dev",
    "https://ai.google.dev/",
    "docs-index",
    ["google", "gemini", "sdk"],
    {
      mode: "discover",
      parser: "html-links",
      searchQueries: ["tool calling", "structured output", "agents", "grounding", "gemini api"],
    }
  ),
  metaAi: src("meta-ai-blog", "Meta AI Blog", "https://ai.meta.com/blog/", "docs", ["meta", "llama", "ai"]),
  vercelAiSdk: src("vercel-ai-sdk", "Vercel AI SDK Releases", "https://github.com/vercel/ai/releases.atom", "atom", ["vercel", "ai-sdk", "agents"]),
  langchainBlog: src("langchain-blog", "LangChain Blog", "https://blog.langchain.dev/feed/", "rss", ["langchain", "agents", "rag"]),
  huggingFace: src("huggingface-blog", "Hugging Face Blog", "https://huggingface.co/blog/feed.xml", "rss", ["huggingface", "models", "ml"]),

  // --- Frontend ---
  vercelBlog: src("vercel-blog", "Vercel Blog", "https://vercel.com/atom", "atom", ["vercel", "next.js", "frontend"]),
  reactBlog: src("react-blog", "React Blog", "https://react.dev/rss.xml", "rss", ["react", "frontend"]),
  nextjsReleases: src("nextjs-releases", "Next.js Releases", "https://github.com/vercel/next.js/releases.atom", "atom", ["next.js", "releases"]),
  chromeDevBlog: src("chrome-dev", "Chrome Developer Blog", "https://developer.chrome.com/blog/feed.xml", "rss", ["chrome", "web-platform"]),
  webDev: src("web-dev", "web.dev", "https://web.dev/feed.xml", "rss", ["web-platform", "performance", "pwa"]),
  cssWg: src("css-wg-drafts", "CSS Drafts", "https://github.com/w3c/csswg-drafts/releases.atom", "atom", ["css", "standards"]),
  smashingMag: src("smashing-magazine", "Smashing Magazine", "https://www.smashingmagazine.com/feed/", "rss", ["frontend", "design", "ux"]),
  motionReleases: src("motion-releases", "Motion Releases", "https://github.com/motiondivision/motion/releases.atom", "atom", ["motion", "animation"]),
  gsapForum: src("gsap-forum", "GSAP Community", "https://gsap.com/community/", "docs-index", ["gsap", "animation"], {
    mode: "discover",
    parser: "html-links",
    searchQueries: ["scrolltrigger", "scrub", "pin", "lenis", "react"],
  }),
  threejsReleases: src("threejs-releases", "Three.js Releases", "https://github.com/mrdoob/three.js/releases.atom", "atom", ["threejs", "3d", "webgl"]),
  tailwindBlog: src("tailwind-blog", "Tailwind CSS Blog", "https://tailwindcss.com/blog", "docs-index", ["tailwind", "css"], {
    mode: "discover",
    parser: "html-links",
    searchQueries: ["tailwind v4", "@theme", "design tokens", "plugins", "upgrade guide"],
  }),
  tailwindReleases: src("tailwind-releases", "Tailwind Releases", "https://github.com/tailwindlabs/tailwindcss/releases.atom", "atom", ["tailwind", "releases"]),

  // --- SEO / GEO ---
  mozBlog: src("moz-blog", "Moz Blog", "https://moz.com/blog/feed", "rss", ["seo", "industry"]),
  searchEngineLand: src("search-engine-land", "Search Engine Land", "https://searchengineland.com/feed", "rss", ["seo", "industry"]),
  googleSearchCentral: src(
    "google-search-central",
    "Google Search Central",
    "https://developers.google.com/search/blog",
    "docs-index",
    ["google", "search"],
    {
      mode: "discover",
      parser: "html-links",
      searchQueries: ["search console", "structured data", "ai overviews", "ranking", "crawling"],
    }
  ),
  ahrefsBlog: src("ahrefs-blog", "Ahrefs Blog", "https://ahrefs.com/blog/feed/", "rss", ["seo", "backlinks", "research"]),
  sej: src("search-engine-journal", "Search Engine Journal", "https://www.searchenginejournal.com/feed/", "rss", ["seo", "geo"]),
  schemaOrg: src("schema-org", "Schema.org Releases", "https://github.com/schemaorg/schemaorg/releases.atom", "atom", ["schema", "structured-data"]),

  // --- Infra ---
  cloudflareBlog: src("cloudflare-blog", "Cloudflare Blog", "https://blog.cloudflare.com/rss/", "rss", ["cloudflare", "edge"]),
  kubernetesBlog: src("kubernetes-blog", "Kubernetes Blog", "https://kubernetes.io/feed.xml", "rss", ["kubernetes", "infra"]),
  supabaseBlog: src("supabase-blog", "Supabase Blog", "https://supabase.com/blog/rss.xml", "rss", ["supabase", "postgres", "database"]),
  postgresWeekly: src("postgres-weekly", "Postgres Weekly", "https://postgresweekly.com/rss/", "rss", ["postgres", "database"]),
  denoReleases: src("deno-releases", "Deno Releases", "https://github.com/denoland/deno/releases.atom", "atom", ["deno", "runtime"]),
  neonBlog: src("neon-blog", "Neon Blog", "https://neon.tech/blog/rss.xml", "rss", ["neon", "postgres", "serverless"]),

  // --- Containers ---
  dockerBlog: src("docker-blog", "Docker Blog", "https://www.docker.com/blog/feed/", "rss", ["docker", "containers"]),
  containerdReleases: src("containerd-releases", "containerd Releases", "https://github.com/containerd/containerd/releases.atom", "atom", ["containerd", "runtime"]),
  trivyReleases: src("trivy-releases", "Trivy Releases", "https://github.com/aquasecurity/trivy/releases.atom", "atom", ["trivy", "security", "scanning"]),

  // --- Security ---
  githubAdvisory: src(
    "github-advisory",
    "GitHub Security Advisories",
    "https://github.com/advisories?query=type%3Areviewed+ecosystem%3Anpm",
    "docs-index",
    ["security", "npm"],
    {
      mode: "search",
      parser: "html-links",
      searchQueries: ["critical npm advisory", "supply chain", "authentication bypass", "rce"],
      rationale: "Treat the advisory index as a search surface and bias toward high-severity npm issues.",
    }
  ),
  portswigger: src("portswigger-research", "PortSwigger Research", "https://portswigger.net/research/rss", "rss", ["security", "research"]),
  krebsSecurity: src("krebs-security", "Krebs on Security", "https://krebsonsecurity.com/feed/", "rss", ["security", "industry"]),
  snykBlog: src("snyk-blog", "Snyk Blog", "https://snyk.io/blog/feed/", "rss", ["security", "vulnerabilities"]),
  owaspBlog: src("owasp-blog", "OWASP", "https://owasp.org/feed.xml", "rss", ["owasp", "appsec"]),
  clerkChangelog: src("clerk-changelog", "Clerk Changelog", "https://clerk.com/changelog", "docs", ["clerk", "auth"]),

  // --- Ops ---
  githubBlog: src("github-blog", "GitHub Blog", "https://github.blog/feed/", "rss", ["github", "ops"]),
  githubChangelog: src("github-changelog", "GitHub Changelog", "https://github.blog/changelog/feed/", "rss", ["github", "changelog"]),
  linearChangelog: src("linear-changelog", "Linear Changelog", "https://linear.app/changelog", "docs-index", ["linear", "ops"], {
    mode: "discover",
    parser: "html-links",
    searchQueries: ["workflow", "issue", "project", "triage", "automation"],
  }),

  // --- Social / Content ---
  hnFrontpage: src("hn-frontpage", "Hacker News", "https://hnrss.org/frontpage", "rss", ["hn", "tech"]),
  productHunt: src("product-hunt", "Product Hunt", "https://www.producthunt.com/feed", "rss", ["launches", "products"]),
  indiehackers: src("indiehackers", "Indie Hackers", "https://www.indiehackers.com/feed.xml", "rss", ["growth", "building"]),

  // --- Performance / Web Platform ---
  lighthouseReleases: src("lighthouse-releases", "Lighthouse Releases", "https://github.com/GoogleChrome/lighthouse/releases.atom", "atom", ["lighthouse", "performance"]),
  v8Blog: src("v8-blog", "V8 Blog", "https://v8.dev/blog.atom", "atom", ["v8", "javascript", "performance"]),

  // --- A11y ---
  a11yProject: src("a11y-project", "The A11Y Project", "https://www.a11yproject.com/feed/feed.xml", "rss", ["accessibility", "a11y"]),
  wcagUpdates: src("wcag-updates", "W3C WAI", "https://www.w3.org/WAI/feed.xml", "rss", ["wcag", "standards"]),

  // --- MCP / Protocol ---
  mcpSpec: src("mcp-spec", "MCP Spec Releases", "https://github.com/modelcontextprotocol/specification/releases.atom", "atom", ["mcp", "protocol"]),
  mcpServers: src("mcp-servers", "MCP Servers Repo", "https://github.com/modelcontextprotocol/servers/releases.atom", "atom", ["mcp", "servers"]),
} as const;

// ---------------------------------------------------------------------------
// Per-skill source assignments
// ---------------------------------------------------------------------------

export type SkillSourceConfig = {
  slug: string;
  sources: SourceDefinition[];
  automation: SkillAutomationState;
};

export const SKILL_SOURCE_CONFIGS: SkillSourceConfig[] = [
  // =========================================================================
  // FRONTEND (10)
  // =========================================================================
  config("frontend-frontier", "daily",
    "Scrape tracked sources for new art-direction references, motion-library API changes, design-system tooling releases, and frontier CSS/JS features. If a new Tailwind, Motion, or Three.js release dropped, summarize breaking changes and update recommended patterns.",
    [SRC.vercelBlog, SRC.chromeDevBlog, SRC.smashingMag, SRC.tailwindBlog, SRC.motionReleases, SRC.threejsReleases]),

  config("motion-framer", "daily",
    "Check Motion (Framer Motion) releases for new hooks, layout animation APIs, or performance fixes. Search GitHub discussions and the Vercel blog for migration guides. Update the skill if any API surface changed or a new best-practice pattern emerged.",
    [SRC.motionReleases, SRC.vercelBlog, SRC.reactBlog, SRC.chromeDevBlog]),

  config("gsap-scrolltrigger", "weekly",
    "Scan the GSAP community forum and Chrome DevTools blog for new ScrollTrigger features, scroll-timeline CSS spec progress, or breaking changes in scroll-driven animation APIs. Update pinning, scrubbing, and parallax guidance if anything shipped.",
    [SRC.gsapForum, SRC.chromeDevBlog, SRC.webDev, SRC.smashingMag]),

  config("react-three-fiber", "weekly",
    "Check Three.js releases for WebGPU renderer progress, new geometry or material types, and breaking API changes. Scan the React blog for Suspense/RSC patterns that affect R3F. Update drei helper recommendations and performance tips.",
    [SRC.threejsReleases, SRC.reactBlog, SRC.chromeDevBlog, SRC.vercelBlog]),

  config("tailwind-design-system", "daily",
    "Check Tailwind CSS and plugin releases for @theme API changes, new utility classes, or config schema updates. Scan the CSS WG drafts for spec changes that affect token transport. Update design-token patterns and migration notes.",
    [SRC.tailwindBlog, SRC.tailwindReleases, SRC.chromeDevBlog, SRC.cssWg]),

  config("web-performance", "daily",
    "Scan for Core Web Vitals threshold changes, new Lighthouse audit rules, V8 engine optimizations, and browser API additions (e.g. Scheduler.yield, fetchLater). Update the skill with concrete before/after guidance for any metric change.",
    [SRC.webDev, SRC.chromeDevBlog, SRC.lighthouseReleases, SRC.v8Blog, SRC.vercelBlog]),

  config("accessible-ui", "weekly",
    "Check W3C WAI for WCAG 2.2+ criterion updates, new ARIA roles or attributes, and browser accessibility-tree changes. Scan The A11Y Project for practical pattern shifts. Update component-level guidance and testing recommendations.",
    [SRC.a11yProject, SRC.wcagUpdates, SRC.chromeDevBlog, SRC.webDev]),

  config("nextjs-patterns", "daily",
    "Check Next.js releases for App Router changes, new cache directives, proxy.ts updates, and Turbopack defaults. Scan the Vercel blog for platform-level changes affecting SSR/ISR/PPR. Update routing, data-fetching, and deployment patterns.",
    [SRC.nextjsReleases, SRC.vercelBlog, SRC.reactBlog, SRC.chromeDevBlog]),

  config("responsive-layouts", "weekly",
    "Scan CSS WG drafts for container-query, anchor-positioning, and viewport-unit spec changes. Check Chrome DevTools blog for new layout debugging tools. Update breakpoint strategies, fluid typography formulas, and grid/flex patterns.",
    [SRC.cssWg, SRC.chromeDevBlog, SRC.webDev, SRC.smashingMag]),

  config("component-architecture", "weekly",
    "Scan React blog for Server Component composition patterns, hook best practices, and state management recommendations. Check Vercel blog for App Router architecture guidance. Search HN for emerging component patterns gaining traction in production apps.",
    [SRC.reactBlog, SRC.vercelBlog, SRC.hnFrontpage, SRC.smashingMag]),

  // =========================================================================
  // SEO + GEO (6)
  // =========================================================================
  config("seo-geo", "daily",
    "Scan Google Search Central for algorithm updates, indexing policy changes, and rich-result requirements. Check AI search platforms (OpenAI, Perplexity) for citation behavior changes. Track schema.org releases and update entity-optimization guidance.",
    [SRC.googleSearchCentral, SRC.mozBlog, SRC.searchEngineLand, SRC.ahrefsBlog, SRC.sej, SRC.openaiNews]),

  config("schema-markup", "weekly",
    "Check schema.org GitHub releases for new types and deprecated properties. Scan Google Search Central for rich-result eligibility changes. Update structured-data templates, validation rules, and JSON-LD patterns.",
    [SRC.schemaOrg, SRC.googleSearchCentral, SRC.mozBlog, SRC.searchEngineLand]),

  config("technical-seo-audit", "weekly",
    "Scan Google Search Central for crawl-budget policy changes, indexing API updates, and Core Web Vitals threshold shifts. Check web.dev for infrastructure best practices. Update the audit checklist with any new requirements.",
    [SRC.googleSearchCentral, SRC.webDev, SRC.chromeDevBlog, SRC.mozBlog, SRC.ahrefsBlog]),

  config("ai-citability", "daily",
    "Monitor OpenAI, Anthropic, and Google for changes to how AI search cites sources. Track llms.txt adoption, grounding-API updates, and retrieval-augmented search behavior. Update citability checklist and content-optimization patterns.",
    [SRC.openaiNews, SRC.anthropicNews, SRC.googleAi, SRC.googleSearchCentral, SRC.searchEngineLand, SRC.sej]),

  config("keyword-research", "weekly",
    "Scan Ahrefs and Moz blogs for search-intent classification changes, keyword difficulty algorithm updates, and SERP feature evolution. Check Search Engine Journal for competitive analysis methodology changes. Update research workflow guidance.",
    [SRC.mozBlog, SRC.ahrefsBlog, SRC.searchEngineLand, SRC.sej]),

  config("content-seo-strategy", "weekly",
    "Scan Moz and Ahrefs for topic-cluster methodology updates, internal-linking algorithm signals, and content-freshness ranking factors. Check Smashing Magazine for editorial workflow patterns. Update the content calendar and refresh strategy guidance.",
    [SRC.mozBlog, SRC.ahrefsBlog, SRC.searchEngineLand, SRC.smashingMag]),

  // =========================================================================
  // SOCIAL (5)
  // =========================================================================
  config("social-content-os", "weekly",
    "Scrape Hacker News, Product Hunt, and Indie Hackers for trending distribution tactics and platform algorithm changes. Identify which content formats are driving engagement for technical audiences this week. Update the content operating system with new channel priorities.",
    [SRC.hnFrontpage, SRC.productHunt, SRC.indiehackers, SRC.smashingMag]),

  config("social-draft", "weekly",
    "Scan HN and Product Hunt for high-performing post formats, hook patterns, and thread structures. Identify X and LinkedIn algorithm signals that changed this week. Update the drafting templates, character-limit guidance, and engagement-bait patterns to avoid.",
    [SRC.hnFrontpage, SRC.productHunt, SRC.indiehackers, SRC.vercelBlog]),

  config("audience-growth", "weekly",
    "Scrape Indie Hackers for audience-building case studies and growth experiments. Check Product Hunt for new growth tools. Monitor HN for algorithm-change discussions on X, LinkedIn, and newsletter platforms. Update follower-growth and engagement-optimization playbooks.",
    [SRC.hnFrontpage, SRC.productHunt, SRC.indiehackers, SRC.smashingMag]),

  config("content-repurposing", "weekly",
    "Scan Product Hunt for new repurposing tools (blog-to-video, thread-to-carousel). Check Indie Hackers for multi-format distribution case studies. Monitor HN for platform-specific format requirement changes. Update the repurposing workflow and format matrix.",
    [SRC.hnFrontpage, SRC.productHunt, SRC.indiehackers, SRC.vercelBlog]),

  config("newsletter-craft", "weekly",
    "Scan Indie Hackers for newsletter growth tactics and deliverability case studies. Check Product Hunt for new email platform features. Monitor HN for email authentication requirement changes (DKIM, DMARC, BIMI). Update subject-line formulas and growth-loop patterns.",
    [SRC.hnFrontpage, SRC.indiehackers, SRC.productHunt, SRC.smashingMag]),

  // =========================================================================
  // INFRA (5)
  // =========================================================================
  config("edge-compute", "daily",
    "Check Cloudflare blog for Workers runtime changes, new binding types, and Durable Object updates. Scan Vercel blog for Edge Function and Fluid Compute changes. Monitor Deno releases for Deploy API updates. Update edge runtime comparison table and migration notes.",
    [SRC.cloudflareBlog, SRC.vercelBlog, SRC.denoReleases, SRC.chromeDevBlog]),

  config("database-patterns", "daily",
    "Check Supabase blog for new Postgres extensions, RLS pattern updates, and connection-pooling changes. Scan Neon blog for serverless Postgres features. Monitor Postgres Weekly for query-optimization techniques. Update schema-design and indexing guidance.",
    [SRC.supabaseBlog, SRC.postgresWeekly, SRC.neonBlog, SRC.vercelBlog]),

  config("observability-stack", "weekly",
    "Scan Cloudflare and Vercel blogs for logging/tracing infrastructure changes. Check GitHub blog for Actions observability features. Monitor HN for OpenTelemetry ecosystem updates. Update structured-logging patterns and alerting threshold recommendations.",
    [SRC.cloudflareBlog, SRC.vercelBlog, SRC.githubBlog, SRC.hnFrontpage]),

  config("serverless-architecture", "daily",
    "Check Vercel blog for Fluid Compute, Queues, and Function configuration changes. Scan Cloudflare blog for Workers pricing or runtime updates. Monitor Supabase for Edge Function changes. Update cold-start mitigation patterns and event-driven architecture guidance.",
    [SRC.vercelBlog, SRC.cloudflareBlog, SRC.supabaseBlog, SRC.denoReleases]),

  config("cdn-caching", "weekly",
    "Scan Cloudflare blog for cache-rule and purge-API changes. Check Vercel blog for ISR, Runtime Cache, and CDN invalidation updates. Monitor web.dev for Cache-Control best-practice revisions. Update cache-hierarchy diagrams and TTL recommendations.",
    [SRC.cloudflareBlog, SRC.vercelBlog, SRC.webDev, SRC.chromeDevBlog]),

  // =========================================================================
  // CONTAINERS (3)
  // =========================================================================
  config("dockerfile-mastery", "weekly",
    "Check Docker blog for BuildKit updates, new Dockerfile syntax directives, and multi-stage build improvements. Scan Trivy releases for image-scanning rule changes. Update Dockerfile templates, layer-caching strategies, and security-hardening patterns.",
    [SRC.dockerBlog, SRC.containerdReleases, SRC.trivyReleases, SRC.githubBlog]),

  config("kubernetes-essentials", "weekly",
    "Check Kubernetes blog for new resource types, deprecation notices, and security-policy changes. Scan containerd releases for runtime updates. Monitor Docker blog for K8s integration changes. Update deployment manifests, RBAC patterns, and upgrade-path guidance.",
    [SRC.kubernetesBlog, SRC.dockerBlog, SRC.containerdReleases, SRC.githubBlog]),

  config("container-security", "daily",
    "Scan Trivy releases for new vulnerability rules and scanning-engine updates. Check Snyk blog for container CVE advisories. Monitor GitHub Security Advisories for base-image vulnerabilities. Update image-hardening checklist and runtime-policy recommendations.",
    [SRC.trivyReleases, SRC.snykBlog, SRC.dockerBlog, SRC.githubAdvisory, SRC.containerdReleases]),

  // =========================================================================
  // A2A — AGENTS (5)
  // =========================================================================
  config("agent-orchestration", "daily",
    "Scan OpenAI, Anthropic, and Google blogs for multi-agent protocol changes, handoff-API updates, and orchestration pattern guidance. Check Vercel AI SDK releases for Agent class changes. Monitor LangChain for graph-based orchestration updates. Update the architecture decision tree and state-management patterns.",
    [SRC.openaiNews, SRC.openaiChangelog, SRC.anthropicNews, SRC.anthropicDocs, SRC.googleAi, SRC.vercelAiSdk, SRC.langchainBlog, SRC.huggingFace]),

  config("mcp-development", "daily",
    "Check MCP specification repo for protocol version bumps, new transport types, and capability changes. Scan the MCP servers repo for new reference implementations. Monitor Anthropic and OpenAI blogs for tool-protocol convergence signals. Update server scaffolding templates and auth patterns.",
    [SRC.mcpSpec, SRC.mcpServers, SRC.anthropicNews, SRC.openaiNews, SRC.vercelAiSdk]),

  config("prompt-engineering", "daily",
    "Scan OpenAI and Anthropic changelogs for model behavior changes that affect prompting (system prompt handling, structured-output schemas, reasoning-token limits). Check Google AI blog for Gemini prompting guidance. Update chain-of-thought templates, few-shot examples, and production prompt-versioning patterns.",
    [SRC.openaiNews, SRC.openaiChangelog, SRC.anthropicNews, SRC.anthropicDocs, SRC.googleAi, SRC.googleDevAi, SRC.huggingFace]),

  config("tool-use-patterns", "daily",
    "Check OpenAI and Anthropic changelogs for function-calling schema changes, parallel-tool-use updates, and output-format requirements. Scan Vercel AI SDK for inputSchema/outputSchema API changes. Update tool-definition templates, error-handling patterns, and multi-tool composition guidance.",
    [SRC.openaiNews, SRC.openaiChangelog, SRC.anthropicNews, SRC.anthropicDocs, SRC.googleDevAi, SRC.vercelAiSdk, SRC.langchainBlog]),

  config("rag-pipelines", "daily",
    "Check OpenAI for new embedding models or retrieval-API changes. Scan Hugging Face for open embedding model releases. Monitor LangChain for retriever and reranker updates. Check Supabase/Neon for pgvector improvements. Update chunking strategies, similarity-search patterns, and evaluation benchmarks.",
    [SRC.openaiNews, SRC.openaiChangelog, SRC.anthropicNews, SRC.huggingFace, SRC.langchainBlog, SRC.supabaseBlog, SRC.neonBlog]),

  // =========================================================================
  // SECURITY (4)
  // =========================================================================
  config("security-best-practices", "daily",
    "Scan GitHub Security Advisories for critical npm CVEs. Check Snyk blog for dependency vulnerability trends. Monitor PortSwigger for new web-attack techniques. Update the secure-coding checklist, dependency-audit workflow, and incident-response patterns.",
    [SRC.githubAdvisory, SRC.snykBlog, SRC.portswigger, SRC.owaspBlog, SRC.krebsSecurity]),

  config("security-threat-model", "weekly",
    "Scan OWASP for threat-modeling methodology updates and new attack-tree patterns. Check PortSwigger for novel attack vectors. Monitor Snyk for supply-chain threat intelligence. Update STRIDE/DREAD worksheets and application-boundary diagrams.",
    [SRC.owaspBlog, SRC.portswigger, SRC.snykBlog, SRC.krebsSecurity]),

  config("auth-patterns", "daily",
    "Check Clerk changelog for SDK changes, middleware patterns, and organization-feature updates. Scan OWASP for session-management and JWT security advisories. Monitor Supabase for RLS and auth-hook changes. Update auth-flow diagrams and token-handling patterns.",
    [SRC.clerkChangelog, SRC.owaspBlog, SRC.supabaseBlog, SRC.portswigger, SRC.snykBlog]),

  config("api-security", "daily",
    "Scan PortSwigger for new API attack techniques and bypass patterns. Check Snyk for API-specific CVEs. Monitor OWASP API Top 10 for guidance changes. Check Vercel blog for webhook-verification and rate-limiting updates. Update rate-limit configurations and CORS policy templates.",
    [SRC.portswigger, SRC.snykBlog, SRC.owaspBlog, SRC.githubAdvisory, SRC.vercelBlog]),

  // =========================================================================
  // OPS (2)
  // =========================================================================
  config("gh-actions-ci", "daily",
    "Check GitHub Blog and Changelog for Actions runner updates, new built-in actions, caching-API changes, and OIDC token improvements. Scan Vercel blog for deployment-integration updates. Update workflow templates, caching strategies, and secret-management patterns.",
    [SRC.githubBlog, SRC.githubChangelog, SRC.vercelBlog, SRC.hnFrontpage]),

  config("release-management", "weekly",
    "Scan GitHub Blog for release-automation features and tag-management updates. Check Linear changelog for project-management integration changes. Monitor Vercel blog for preview-deployment and promotion-flow updates. Update changelog-generation templates and feature-flag rollout patterns.",
    [SRC.githubBlog, SRC.githubChangelog, SRC.vercelBlog, SRC.linearChangelog]),
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function src(
  id: string,
  label: string,
  url: string,
  kind: SourceDefinition["kind"],
  tags: string[],
  overrides: Partial<SourceDefinition> = {}
): SourceDefinition {
  const hostname = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  })();

  const trust =
    overrides.trust ??
    (hostname.includes("w3.org") || hostname.includes("schema.org")
      ? "standards"
      : hostname.includes("github.com") ||
          hostname.includes("openai.com") ||
          hostname.includes("anthropic.com") ||
          hostname.includes("google.com") ||
          hostname.includes("react.dev") ||
          hostname.includes("tailwindcss.com") ||
          hostname.includes("vercel.com") ||
          hostname.includes("supabase.com") ||
          hostname.includes("cloudflare.com") ||
          hostname.includes("owasp.org")
        ? "official"
        : hostname.includes("moz.com") ||
            hostname.includes("ahrefs.com") ||
            hostname.includes("snyk.io") ||
            hostname.includes("clerk.com") ||
            hostname.includes("linear.app")
          ? "vendor"
          : "community");

  const mode =
    overrides.mode ??
    (kind === "github-search" || kind === "registry"
      ? "search"
      : kind === "sitemap" || kind === "docs-index" || kind === "docs"
        ? "discover"
        : "track");

  const parser =
    overrides.parser ??
    (kind === "sitemap"
      ? "sitemap"
      : kind === "docs-index" || kind === "docs" || kind === "blog"
        ? "html-links"
        : kind === "releases" || kind === "changelog"
          ? "release-feed"
          : "feed");

  const searchQueries = overrides.searchQueries ?? [
    label.toLowerCase(),
    ...tags.slice(0, 4)
  ];

  return {
    id,
    label,
    url,
    kind,
    tags,
    logoUrl: overrides.logoUrl ?? computeSourceLogoUrl(url),
    mode,
    trust,
    parser,
    searchQueries,
    rationale:
      overrides.rationale ??
      (mode === "track"
        ? "Track the canonical feed for concrete deltas."
        : "Discover fresh links from an index-like source, then rank them against the skill's query hints."),
    signalHints: overrides.signalHints ?? tags
  };
}

function config(
  slug: string,
  cadence: SkillAutomationState["cadence"],
  prompt: string,
  sources: SourceDefinition[]
): SkillSourceConfig {
  return {
    slug,
    sources,
    automation: {
      enabled: true,
      cadence,
      status: "active",
      prompt,
      preferredHour: DEFAULT_PREFERRED_HOUR,
    }
  };
}
