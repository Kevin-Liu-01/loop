import type { Metadata } from "next";

import { buildMcpVersionHref } from "@/lib/format";
import { CATEGORY_REGISTRY } from "@/lib/registry";
import type { ImportedMcpDocument, SkillRecord } from "@/lib/types";

export const SITE_NAME = "Loop";

export const SEO_DEFAULT_TITLE = "Loop — Skills that never go stale";

export const SEO_DEFAULT_DESCRIPTION =
  "Loop turns your agent playbooks, updates, and source scans into a living operator desk that stays current.";

export const DEFAULT_OG_IMAGE_PATH = "/icon.svg";

/**
 * Public site origin with no trailing slash.
 */
export function getSiteUrlString(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");
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

export function buildDefaultOpenGraphImages(): NonNullable<Metadata["openGraph"]>["images"] {
  return [
    {
      url: buildSiteUrl(DEFAULT_OG_IMAGE_PATH).toString(),
      width: 512,
      height: 512,
      alt: `${SITE_NAME} mark`,
    },
  ];
}

export function buildDefaultTwitterImageUrls(): string[] {
  return [buildSiteUrl(DEFAULT_OG_IMAGE_PATH).toString()];
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
  const ogImages =
    skill.iconUrl
      ? [{ url: skill.iconUrl, alt: skill.title }]
      : buildDefaultOpenGraphImages();
  const twitterImages =
    skill.iconUrl ? [skill.iconUrl] : buildDefaultTwitterImageUrls();

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
      images: twitterImages,
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
    logo: buildSiteUrl(DEFAULT_OG_IMAGE_PATH).toString(),
  };
}
