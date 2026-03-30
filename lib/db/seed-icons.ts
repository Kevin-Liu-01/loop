/**
 * One-time migration script: populate icon_url for all skills and MCPs.
 *
 * Downloads brand SVGs from SimpleIcons CDN and uploads them to
 * Supabase Storage (`skill-icons` bucket), then sets each row's
 * `icon_url` to the resulting public URL.
 *
 * Run: npx tsx lib/db/seed-icons.ts
 */

import { createClient } from "@supabase/supabase-js";

// -------------------------------------------------------------------------
// Configuration
// -------------------------------------------------------------------------

const BUCKET = "skill-icons";
const SIMPLEICONS_CDN = "https://cdn.simpleicons.org";

function getEnvOrThrow(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

// -------------------------------------------------------------------------
// SimpleIcons slug → brand mapping for skills
// -------------------------------------------------------------------------

const SKILL_ICON_MAP: Record<string, { simpleIcon?: string; color?: string; fallbackUrl?: string }> = {
  "frontend-frontier": { simpleIcon: "figma" },
  "motion-framer": { simpleIcon: "framer" },
  "gsap-scrolltrigger": { simpleIcon: "greensock" },
  "react-three-fiber": { simpleIcon: "threedotjs" },
  "tailwind-design-system": { simpleIcon: "tailwindcss" },
  "web-performance": { simpleIcon: "lighthouse" },
  "accessible-ui": { fallbackUrl: "https://www.google.com/s2/favicons?domain=w3.org&sz=64" },
  "nextjs-patterns": { simpleIcon: "nextdotjs" },
  "responsive-layouts": { simpleIcon: "css" },
  "component-architecture": { simpleIcon: "react" },

  "seo-geo": { simpleIcon: "google" },
  "schema-markup": { fallbackUrl: "https://www.google.com/s2/favicons?domain=schema.org&sz=64" },
  "technical-seo-audit": { simpleIcon: "google" },
  "ai-citability": { fallbackUrl: "https://www.google.com/s2/favicons?domain=openai.com&sz=64" },
  "keyword-research": { simpleIcon: "semrush" },
  "content-seo-strategy": { simpleIcon: "google" },

  "social-content-os": { simpleIcon: "x" },
  "social-draft": { simpleIcon: "buffer" },
  "audience-growth": { simpleIcon: "youtube" },
  "content-repurposing": { simpleIcon: "notion" },
  "newsletter-craft": { simpleIcon: "substack" },

  "edge-compute": { simpleIcon: "cloudflare" },
  "database-patterns": { simpleIcon: "supabase" },
  "observability-stack": { simpleIcon: "grafana" },
  "serverless-architecture": { simpleIcon: "vercel" },
  "cdn-caching": { simpleIcon: "cloudflare" },

  "dockerfile-mastery": { simpleIcon: "docker" },
  "kubernetes-essentials": { simpleIcon: "kubernetes" },
  "container-security": { simpleIcon: "snyk" },

  "agent-orchestration": { fallbackUrl: "https://www.google.com/s2/favicons?domain=openai.com&sz=64" },
  "mcp-development": { simpleIcon: "anthropic" },
  "prompt-engineering": { fallbackUrl: "https://www.google.com/s2/favicons?domain=openai.com&sz=64" },
  "tool-use-patterns": { simpleIcon: "anthropic" },
  "rag-pipelines": { fallbackUrl: "https://www.google.com/s2/favicons?domain=openai.com&sz=64" },

  "security-best-practices": { simpleIcon: "owasp" },
  "security-threat-model": { simpleIcon: "owasp" },
  "auth-patterns": { simpleIcon: "clerk" },
  "api-security": { simpleIcon: "auth0" },

  "gh-actions-ci": { simpleIcon: "githubactions" },
  "release-management": { simpleIcon: "github" },
};

// -------------------------------------------------------------------------
// SimpleIcons slug → brand mapping for MCPs
// -------------------------------------------------------------------------

const MCP_ICON_MAP: Record<string, { simpleIcon?: string; color?: string; fallbackUrl?: string }> = {
  "Filesystem": { simpleIcon: "files" },
  "Memory": { simpleIcon: "databricks" },
  "Sequential Thinking": { simpleIcon: "openmined" },
  "Fetch": { simpleIcon: "curl" },
  "Git": { simpleIcon: "git" },

  "GitHub": { simpleIcon: "github" },
  "Vercel": { simpleIcon: "vercel" },
  "Cloudflare": { simpleIcon: "cloudflare" },
  "Sentry": { simpleIcon: "sentry" },

  "Supabase": { simpleIcon: "supabase" },
  "Neon": { fallbackUrl: "https://www.google.com/s2/favicons?domain=neon.tech&sz=64" },
  "Prisma": { simpleIcon: "prisma" },
  "Turso": { simpleIcon: "turso" },
  "Upstash": { simpleIcon: "upstash" },

  "Context7": { fallbackUrl: "https://www.google.com/s2/favicons?domain=context7.com&sz=64" },
  "Brave Search": { simpleIcon: "brave" },
  "Exa": { fallbackUrl: "https://www.google.com/s2/favicons?domain=exa.ai&sz=64" },
  "Firecrawl": { fallbackUrl: "https://www.google.com/s2/favicons?domain=firecrawl.dev&sz=64" },

  "Playwright": { fallbackUrl: "https://www.google.com/s2/favicons?domain=playwright.dev&sz=64" },
  "Puppeteer": { simpleIcon: "puppeteer" },

  "Notion": { simpleIcon: "notion" },
  "Slack": { fallbackUrl: "https://www.google.com/s2/favicons?domain=slack.com&sz=64" },
  "Linear": { simpleIcon: "linear" },
  "Todoist": { simpleIcon: "todoist" },

  "Stripe": { simpleIcon: "stripe" },

  "Figma": { simpleIcon: "figma" },

  "Resend": { fallbackUrl: "https://www.google.com/s2/favicons?domain=resend.com&sz=64" },

  "Grafana": { simpleIcon: "grafana" },

  "OpenAI Agents": { fallbackUrl: "https://www.google.com/s2/favicons?domain=openai.com&sz=64" },

  "PostgreSQL": { simpleIcon: "postgresql" },
  "SQLite": { simpleIcon: "sqlite" },

  "AWS": { fallbackUrl: "https://www.google.com/s2/favicons?domain=aws.amazon.com&sz=64" },
  "AWS API": { fallbackUrl: "https://www.google.com/s2/favicons?domain=aws.amazon.com&sz=64" },
  "Terraform": { simpleIcon: "terraform" },
  "Docker": { simpleIcon: "docker" },
  "Kubernetes": { simpleIcon: "kubernetes" },

  "Snyk": { simpleIcon: "snyk" },

  "MCP Proxy": { simpleIcon: "fastapi" },
  "Time": { simpleIcon: "clockify" },
};

// -------------------------------------------------------------------------
// Core logic
// -------------------------------------------------------------------------

async function fetchSvg(simpleIcon: string, color?: string): Promise<Buffer | null> {
  const url = color
    ? `${SIMPLEICONS_CDN}/${simpleIcon}/${color}`
    : `${SIMPLEICONS_CDN}/${simpleIcon}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  ⚠ SimpleIcons returned ${res.status} for ${simpleIcon}`);
      return null;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.warn(`  ⚠ Failed to fetch ${simpleIcon}:`, err);
    return null;
  }
}

async function fetchFallback(fallbackUrl: string): Promise<Buffer | null> {
  try {
    const res = await fetch(fallbackUrl);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function main() {
  const supabaseUrl = getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = getEnvOrThrow("SUPABASE_SERVICE_ROLE_KEY");
  const db = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("🔧 Ensuring storage bucket exists...");
  const { error: bucketErr } = await db.storage.createBucket(BUCKET, {
    public: true,
    allowedMimeTypes: ["image/svg+xml", "image/png", "image/webp", "image/jpeg"],
    fileSizeLimit: 1_048_576,
  });
  if (bucketErr && !bucketErr.message.includes("already exists")) {
    throw new Error(`Bucket creation failed: ${bucketErr.message}`);
  }

  // --- Skills ---
  console.log("\n📦 Migrating skill icons...");
  let skillCount = 0;
  for (const [slug, mapping] of Object.entries(SKILL_ICON_MAP)) {
    let buffer: Buffer | null = null;
    let ext = "svg";
    let contentType = "image/svg+xml";

    if (mapping.simpleIcon) {
      buffer = await fetchSvg(mapping.simpleIcon, mapping.color);
    }
    if (!buffer && mapping.fallbackUrl) {
      buffer = await fetchFallback(mapping.fallbackUrl);
      ext = "png";
      contentType = "image/png";
    }
    if (!buffer) {
      console.log(`  ⏭ ${slug}: no icon source available`);
      continue;
    }

    const path = `skills/${slug}/icon.${ext}`;
    const { error: uploadErr } = await db.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: true });

    if (uploadErr) {
      console.warn(`  ⚠ ${slug}: upload failed — ${uploadErr.message}`);
      continue;
    }

    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);

    const { error: updateErr } = await db
      .from("skills")
      .update({ icon_url: urlData.publicUrl })
      .eq("slug", slug);

    if (updateErr) {
      console.warn(`  ⚠ ${slug}: DB update failed — ${updateErr.message}`);
    } else {
      console.log(`  ✓ ${slug}`);
      skillCount++;
    }
  }

  // --- MCPs ---
  console.log("\n📦 Migrating MCP icons...");
  let mcpCount = 0;
  for (const [name, mapping] of Object.entries(MCP_ICON_MAP)) {
    let buffer: Buffer | null = null;
    let ext = "svg";
    let contentType = "image/svg+xml";

    if (mapping.simpleIcon) {
      buffer = await fetchSvg(mapping.simpleIcon, mapping.color);
    }
    if (!buffer && mapping.fallbackUrl) {
      buffer = await fetchFallback(mapping.fallbackUrl);
      ext = "png";
      contentType = "image/png";
    }
    if (!buffer) {
      console.log(`  ⏭ ${name}: no icon source available`);
      continue;
    }

    const safeName = name.toLowerCase().replace(/\s+/g, "-");
    const path = `mcps/${safeName}/icon.${ext}`;
    const { error: uploadErr } = await db.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: true });

    if (uploadErr) {
      console.warn(`  ⚠ ${name}: upload failed — ${uploadErr.message}`);
      continue;
    }

    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);

    const { error: updateErr } = await db
      .from("imported_mcps")
      .update({ icon_url: urlData.publicUrl })
      .eq("name", name);

    if (updateErr) {
      console.warn(`  ⚠ ${name}: DB update failed — ${updateErr.message}`);
    } else {
      console.log(`  ✓ ${name}`);
      mcpCount++;
    }
  }

  console.log(`\n✅ Done — ${skillCount} skills, ${mcpCount} MCPs updated.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
