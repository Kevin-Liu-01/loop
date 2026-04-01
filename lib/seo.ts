import type { Metadata } from "next";

import { buildMcpVersionHref } from "@/lib/format";
import { CATEGORY_REGISTRY } from "@/lib/registry";
import type { ImportedMcpDocument, SkillRecord } from "@/lib/types";

export const SITE_NAME = "Loop";

export const SEO_DEFAULT_TITLE = "Loop — Skills that never go stale";

export const SEO_DEFAULT_DESCRIPTION =
  "Loop turns your agent playbooks, updates, and source scans into a living operator desk that stays current.";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export const DEFAULT_OG_IMAGE_PATH = "/og.png";
export const LOGO_ICON_PATH = "/icon.svg";

/**
 * Public site origin with no trailing slash.
 * Checks NEXT_PUBLIC_SITE_URL, then Vercel-provided env vars, then localhost.
 */
export function getSiteUrlString(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined,
  ];
  for (const raw of candidates) {
    const trimmed = raw?.trim();
    if (trimmed) return trimmed.replace(/\/+$/, "");
  }
  return "http://localhost:3000";
}

function normalizeAppPath(path: string): string {
  const withLeading = path.startsWith("/") ? path : `/${path}`;
  const segments = withLeading.split("/").filter(Boolean);
  return `/${segments.map((s) => encodeURIComponent(decodeURIComponent(s))).join("/")}`;
}

export function buildSiteUrl(path?: string): URL {
  const base = getSiteUrlString();
  const normalized = path && path !== "/" ? normalizeAppPath(path) : "/";
  return new URL(normalized, `${base}/`);
}

export function buildOgImageUrl(params?: {
  title?: string;
  description?: string;
  category?: string;
}): string {
  if (!params?.title && !params?.description && !params?.category) {
    return DEFAULT_OG_IMAGE_PATH;
  }
  const url = new URL("/og", "https://n");
  if (params?.title) url.searchParams.set("title", params.title);
  if (params?.description) url.searchParams.set("description", params.description);
  if (params?.category) url.searchParams.set("category", params.category);
  return `${url.pathname}${url.search}`;
}

export function buildDefaultOpenGraphImages(): NonNullable<Metadata["openGraph"]>["images"] {
  return [
    {
      url: DEFAULT_OG_IMAGE_PATH,
      type: "image/png",
      width: OG_WIDTH,
      height: OG_HEIGHT,
      alt: `${SITE_NAME} — operator desk for self-updating agent skills`,
    },
  ];
}

export function buildDefaultTwitterImageUrls(): string[] {
  return [DEFAULT_OG_IMAGE_PATH];
}

export function buildRootKeywords(): string[] {
  const fromCategories = CATEGORY_REGISTRY.flatMap((c) => c.keywords);
  const fixed = [
    "AI agents",
    "agent skills",
    "MCP",
    "Model Context Protocol",
    "playbooks",
    "automation",
    "operator desk",
  ];
  return Array.from(new Set([...fromCategories, ...fixed]));
}

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  const out = { ...value };
  for (const key of Object.keys(out)) {
    if (out[key as keyof T] === undefined) delete out[key as keyof T];
  }
  return out;
}

export function buildSkillMetadata(skill: SkillRecord): Metadata {
  const canonical = buildSiteUrl(skill.href).toString();
  const title = `${skill.title} · ${SITE_NAME}`;
  const description = (
    skill.excerpt?.trim() ||
    skill.description?.trim() ||
    SEO_DEFAULT_DESCRIPTION
  ).slice(0, 320);
  const indexable = skill.visibility === "public";

  const ogImageUrl = buildOgImageUrl({
    title: skill.title,
    description,
    category: skill.category,
  });
  const ogImages = [{ url: ogImageUrl, type: "image/png", width: OG_WIDTH, height: OG_HEIGHT, alt: skill.title }];

  return {
    title,
    description,
    keywords: Array.from(new Set([skill.category, ...skill.tags].filter(Boolean))),
    alternates: { canonical },
    robots: indexable ? undefined : { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      siteName: SITE_NAME,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export function buildMcpMetadata(mcp: ImportedMcpDocument): Metadata {
  const canonical = buildSiteUrl(buildMcpVersionHref(mcp.name, mcp.version)).toString();
  const title = `${mcp.name} · ${SITE_NAME}`;
  const description = (mcp.description?.trim() || SEO_DEFAULT_DESCRIPTION).slice(0, 320);

  const ogImageUrl = buildOgImageUrl({
    title: mcp.name,
    description,
    category: "MCP",
  });
  const ogImages = [{ url: ogImageUrl, type: "image/png", width: OG_WIDTH, height: OG_HEIGHT, alt: mcp.name }];

  return {
    title,
    description,
    keywords: Array.from(new Set(["MCP", "Model Context Protocol", ...mcp.tags].filter(Boolean))),
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      siteName: SITE_NAME,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export function buildSkillJsonLd(skill: SkillRecord): Record<string, unknown> {
  return stripUndefined({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: skill.title,
    description: skill.description || skill.excerpt || SEO_DEFAULT_DESCRIPTION,
    url: buildSiteUrl(skill.href).toString(),
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    keywords: skill.tags.join(", "),
    offers:
      skill.price
        ? {
            "@type": "Offer",
            price: skill.price.amount,
            priceCurrency: skill.price.currency,
          }
        : undefined,
  });
}

export function buildMcpJsonLd(mcp: ImportedMcpDocument): Record<string, unknown> {
  return stripUndefined({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: mcp.name,
    description: mcp.description || SEO_DEFAULT_DESCRIPTION,
    url: buildSiteUrl(buildMcpVersionHref(mcp.name, mcp.version)).toString(),
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Model Context Protocol server",
    operatingSystem: "Any",
    keywords: mcp.tags.join(", "),
  });
}

export function buildOrganizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: buildSiteUrl("/").toString(),
    description: SEO_DEFAULT_DESCRIPTION,
    logo: buildSiteUrl(LOGO_ICON_PATH).toString(),
  };
}
