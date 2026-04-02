import type { NextRequest } from "next/server";

const SITE_NAME = "Loop";
const DEFAULT_TITLE = "Loop | Skills that never go stale";
const DEFAULT_DESCRIPTION =
  "Loop turns your agent playbooks, updates, and source scans into a living operator desk that stays current.";
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const STATIC_OG_IMAGE_PATH = "/og";

export const SOCIAL_BOT_RE =
  /Twitterbot|facebookexternalhit|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|Applebot|Pinterestbot/i;

const BOT_BYPASS_PREFIXES = ["/api/", "/trpc/", "/sign-in", "/sign-up"];

export function isSocialBot(req: NextRequest): boolean {
  return SOCIAL_BOT_RE.test(req.headers.get("user-agent") ?? "");
}

export function shouldServeBotHtml(pathname: string): boolean {
  return !BOT_BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

interface PageMeta {
  title: string;
  description: string;
  ogImagePath: string;
  ogImageAlt: string;
  ogType: string;
  canonicalPath: string;
}

function slugToTitle(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolvePageMeta(pathname: string): PageMeta {
  const skillMatch = pathname.match(/^\/skills\/([^/]+)(?:\/[^/]+)?$/);
  if (skillMatch) {
    const name = slugToTitle(skillMatch[1]);
    return {
      title: `${name} · ${SITE_NAME}`,
      description: `Skill details for ${name} on ${SITE_NAME}.`,
      ogImagePath: `/og?title=${encodeURIComponent(name)}&category=Skill`,
      ogImageAlt: name,
      ogType: "article",
      canonicalPath: pathname,
    };
  }

  const mcpMatch = pathname.match(/^\/mcps\/([^/]+)(?:\/[^/]+)?$/);
  if (mcpMatch) {
    const name = decodeURIComponent(mcpMatch[1]);
    return {
      title: `${name} · ${SITE_NAME}`,
      description: `MCP server details for ${name} on ${SITE_NAME}.`,
      ogImagePath: `/og?title=${encodeURIComponent(name)}&category=MCP`,
      ogImageAlt: name,
      ogType: "article",
      canonicalPath: pathname,
    };
  }

  if (pathname === "/faq") {
    return {
      title: `FAQ · ${SITE_NAME}`,
      description: DEFAULT_DESCRIPTION,
      ogImagePath: STATIC_OG_IMAGE_PATH,
      ogImageAlt: `${SITE_NAME} | operator desk for self-updating agent skills`,
      ogType: "website",
      canonicalPath: "/faq",
    };
  }

  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    ogImagePath: STATIC_OG_IMAGE_PATH,
    ogImageAlt: `${SITE_NAME} | operator desk for self-updating agent skills`,
    ogType: "website",
    canonicalPath: "/",
  };
}

function getSiteOrigin(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];
  for (const raw of candidates) {
    const trimmed = raw?.trim();
    if (trimmed) return trimmed.replace(/\/+$/, "");
  }
  return "http://localhost:3000";
}

export function buildBotResponse(req: NextRequest): Response {
  const origin = getSiteOrigin();
  const meta = resolvePageMeta(req.nextUrl.pathname);
  const image = `${origin}${meta.ogImagePath}`;
  const url = `${origin}${meta.canonicalPath}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}" />
<meta property="og:title" content="${esc(meta.title)}" />
<meta property="og:description" content="${esc(meta.description)}" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:width" content="${OG_WIDTH}" />
<meta property="og:image:height" content="${OG_HEIGHT}" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:alt" content="${esc(meta.ogImageAlt)}" />
<meta property="og:type" content="${meta.ogType}" />
<meta property="og:site_name" content="${esc(SITE_NAME)}" />
<meta property="og:locale" content="en_US" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(meta.title)}" />
<meta name="twitter:description" content="${esc(meta.description)}" />
<meta name="twitter:image" content="${esc(image)}" />
<meta name="twitter:image:alt" content="${esc(meta.ogImageAlt)}" />
<link rel="icon" href="/icon.svg" />
</head>
<body></body>
</html>`;

  const body = new TextEncoder().encode(html);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Length": String(body.byteLength),
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      Vary: "User-Agent",
    },
  });
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
