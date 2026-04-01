/**
 * Centralized brand icon helpers.
 *
 * Re-exports `lookupBrandLogoUrl` from skill-icons and adds helpers
 * for dark-background variants (hero cards) and GitHub org avatars
 * so individual files never need to hardcode icon CDN URLs.
 */

import { lookupBrandLogoUrl } from "@/lib/skill-icons";

export { lookupBrandLogoUrl };

// ---------------------------------------------------------------------------
// Local brand SVGs (brands not available on SimpleIcons CDN)
// ---------------------------------------------------------------------------

export const LOCAL_BRAND_SVGS: Record<string, string> = {
  openai: "/brands/openai.svg",
  cursor: "/brands/cursor.svg",
  mcp: "/brands/mcp.svg",
};

// ---------------------------------------------------------------------------
// GitHub org avatar helper
// ---------------------------------------------------------------------------

export function githubAvatar(org: string, size = 64): string {
  return `https://github.com/${org}.png?size=${size}`;
}

// ---------------------------------------------------------------------------
// Dark-background icon resolver (for hero cards, dark overlays, etc.)
//
// SimpleIcons URLs get `/white` appended for a pre-colored white SVG.
// Local brand SVGs (black fill) get `brightness-0 invert` applied via CSS
// by the caller – this function just returns the URL.
// ---------------------------------------------------------------------------

export function brandIconForDarkBg(key: string): string | undefined {
  const siUrl = lookupBrandLogoUrl(key);
  if (siUrl?.includes("simpleicons.org")) return `${siUrl}/white`;

  const local = LOCAL_BRAND_SVGS[key];
  if (local) return local;

  return siUrl;
}

// ---------------------------------------------------------------------------
// Resolve brand icon – tries BRAND_LOGOS first, then local SVGs
// ---------------------------------------------------------------------------

export function resolveBrandIcon(key: string): string | undefined {
  return lookupBrandLogoUrl(key) ?? LOCAL_BRAND_SVGS[key];
}
