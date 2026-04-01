import { cn } from "@/lib/cn";

/** Horizontal padding for AppGridShell inset routes (home, skill detail, settings body, etc.). */
export const pageInsetPadX = "px-4 sm:px-5 lg:px-6";

/** Primary column vertical padding for home-style scroll regions. */
export const pageInsetPadY = "py-4 lg:py-5";

export function pageInsetColumnClass(extra?: string) {
  return cn(pageInsetPadX, pageInsetPadY, extra);
}

/**
 * Secondary line under page or column titles (context, metrics).
 * Higher contrast than body faint text; relaxed measure for scanability.
 */
export const pageHeaderSub =
  "m-0 max-w-[min(100%,44ch)] text-pretty text-sm leading-relaxed text-ink-muted";

/** Small label inside a surface (e.g. prompt box header) – not an eyebrow above a page title. */
export const inlineSectionLabel = "text-xs font-medium text-ink-muted";

/** Site header height in px (banner min-h-[52px] + py-2.5 + border-b ≈ 57px). */
export const SITE_HEADER_HEIGHT_PX = 57;
