import type { NextRequest } from "next/server";

const SITE_NAME = "Loop";
const DEFAULT_TITLE = "Loop – Skills that never go stale";
const DEFAULT_DESCRIPTION =
  "Loop turns your agent playbooks, updates, and source scans into a living operator desk that stays current.";
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_IMAGE_PATH = "/og.png";

export const SOCIAL_BOT_RE =
  /Twitterbot|facebookexternalhit|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|Applebot|Pinterestbot/i;

export function isSocialBot(req: NextRequest): boolean {
  return SOCIAL_BOT_RE.test(req.headers.get("user-agent") ?? "");
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

export function buildRootBotResponse(): Response {
  const origin = getSiteOrigin();
  const image = `${origin}${OG_IMAGE_PATH}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(DEFAULT_TITLE)}</title>
<meta name="description" content="${esc(DEFAULT_DESCRIPTION)}" />
<meta property="og:title" content="${esc(DEFAULT_TITLE)}" />
<meta property="og:description" content="${esc(DEFAULT_DESCRIPTION)}" />
<meta property="og:url" content="${esc(origin)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:width" content="${OG_WIDTH}" />
<meta property="og:image:height" content="${OG_HEIGHT}" />
<meta property="og:image:type" content="image/png" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${esc(SITE_NAME)}" />
<meta property="og:locale" content="en_US" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(DEFAULT_TITLE)}" />
<meta name="twitter:description" content="${esc(DEFAULT_DESCRIPTION)}" />
<meta name="twitter:image" content="${esc(image)}" />
<link rel="icon" href="/icon.svg" />
</head>
<body></body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
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
