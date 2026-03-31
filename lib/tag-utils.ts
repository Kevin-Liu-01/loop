import type { CategorySlug } from "@/lib/types";

// ---------------------------------------------------------------------------
// Tag color system
// ---------------------------------------------------------------------------

export type TagColor =
  | "red"
  | "orange"
  | "amber"
  | "green"
  | "teal"
  | "blue"
  | "indigo"
  | "purple"
  | "pink"
  | "neutral";

const CATEGORY_COLORS: Record<CategorySlug, TagColor> = {
  frontend: "orange",
  "seo-geo": "blue",
  social: "pink",
  infra: "teal",
  containers: "indigo",
  a2a: "purple",
  security: "red",
  ops: "amber",
};

const ORIGIN_COLORS: Record<string, TagColor> = {
  repo: "teal",
  codex: "purple",
  user: "blue",
  remote: "green",
  imported: "green",
  system: "neutral",
};

const STATUS_COLORS: Record<string, TagColor> = {
  active: "green",
  paused: "neutral",
  streaming: "blue",
  live: "green",
  seeded: "neutral",
};

const TRANSPORT_COLORS: Record<string, TagColor> = {
  stdio: "indigo",
  sse: "teal",
  http: "blue",
  streamable_http: "blue",
};

export function getTagColorForCategory(slug: CategorySlug): TagColor {
  return CATEGORY_COLORS[slug] ?? "neutral";
}

export function getTagColorForOrigin(origin: string): TagColor {
  return ORIGIN_COLORS[origin.toLowerCase()] ?? "neutral";
}

export function getTagColorForStatus(status: string): TagColor {
  return STATUS_COLORS[status.toLowerCase()] ?? "neutral";
}

export function getTagColorForTransport(transport: string): TagColor {
  return TRANSPORT_COLORS[transport.toLowerCase()] ?? "neutral";
}

// ---------------------------------------------------------------------------
// Tag CSS class map (pairs with globals.css --color-tag-* tokens)
// ---------------------------------------------------------------------------

export const TAG_COLOR_CLASSES: Record<TagColor, string> = {
  red: "border-[var(--color-tag-red)]/25 bg-[var(--color-tag-red)]/[0.07] text-[var(--color-tag-red)]",
  orange: "border-[var(--color-tag-orange)]/25 bg-[var(--color-tag-orange)]/[0.07] text-[var(--color-tag-orange)]",
  amber: "border-[var(--color-tag-amber)]/25 bg-[var(--color-tag-amber)]/[0.07] text-[var(--color-tag-amber)]",
  green: "border-[var(--color-tag-green)]/25 bg-[var(--color-tag-green)]/[0.07] text-[var(--color-tag-green)]",
  teal: "border-[var(--color-tag-teal)]/25 bg-[var(--color-tag-teal)]/[0.07] text-[var(--color-tag-teal)]",
  blue: "border-[var(--color-tag-blue)]/25 bg-[var(--color-tag-blue)]/[0.07] text-[var(--color-tag-blue)]",
  indigo: "border-[var(--color-tag-indigo)]/25 bg-[var(--color-tag-indigo)]/[0.07] text-[var(--color-tag-indigo)]",
  purple: "border-[var(--color-tag-purple)]/25 bg-[var(--color-tag-purple)]/[0.07] text-[var(--color-tag-purple)]",
  pink: "border-[var(--color-tag-pink)]/25 bg-[var(--color-tag-pink)]/[0.07] text-[var(--color-tag-pink)]",
  neutral: "border-line bg-paper-2 text-ink-faint",
};

// ---------------------------------------------------------------------------
// Smart tag label formatting
// ---------------------------------------------------------------------------

const ALWAYS_UPPER = new Set([
  "ai", "a2a", "ci", "cd", "ui", "ux", "api", "sdk", "seo", "geo", "aeo",
  "rss", "ssr", "ssg", "isr", "ppr", "css", "html", "svg", "jwt", "oci",
  "npm", "hn", "mcp", "llm", "llms", "pnpm", "sql", "http", "grpc",
  "dns", "tls", "oauth", "cors", "rbac", "xss", "csrf",
]);

const BRAND_CASING: Record<string, string> = {
  "next.js": "Next.js",
  nextjs: "Next.js",
  "react": "React",
  vercel: "Vercel",
  github: "GitHub",
  docker: "Docker",
  kubernetes: "Kubernetes",
  cloudflare: "Cloudflare",
  linear: "Linear",
  supabase: "Supabase",
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  stripe: "Stripe",
  clerk: "Clerk",
  containerd: "containerd",
  podman: "Podman",
  portswigger: "PortSwigger",
  webgl: "WebGL",
  webgpu: "WebGPU",
  webxr: "WebXR",
  threejs: "Three.js",
  gsap: "GSAP",
  typescript: "TypeScript",
  javascript: "JavaScript",
  graphql: "GraphQL",
  postgresql: "PostgreSQL",
  mongodb: "MongoDB",
  redis: "Redis",
  webpack: "webpack",
  turbopack: "Turbopack",
  turborepo: "Turborepo",
  lottie: "Lottie",
  pixijs: "PixiJS",
  "seo-geo": "SEO + GEO",
};

export function formatTagLabel(raw: string): string {
  const lower = raw.toLowerCase().trim();

  if (BRAND_CASING[lower]) return BRAND_CASING[lower];

  if (ALWAYS_UPPER.has(lower)) return lower.toUpperCase();

  return lower
    .split(/[-_]/)
    .map((word) => {
      if (ALWAYS_UPPER.has(word)) return word.toUpperCase();
      if (BRAND_CASING[word]) return BRAND_CASING[word];
      if (word.length <= 1) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
