import { ClerkProvider } from "@clerk/nextjs";
import { ui } from "@clerk/ui";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";

import { ActiveOperationsProvider } from "@/components/active-operations-provider";
import { CommandPalette } from "@/components/command-palette";
import { NewSkillModal } from "@/components/new-skill-modal";
import { SeoJsonLd } from "@/components/seo-json-ld";
import { TimezoneProvider } from "@/components/timezone-provider";
import { TooltipProvider } from "@/components/ui/shadcn/tooltip";

import "@/app/globals.css";
import { clerkAppearance } from "@/lib/clerk-theme";
import { buildMcpVersionHref } from "@/lib/format";
import { getLoopSnapshot } from "@/lib/refresh";
import {
  buildDefaultOpenGraphImages,
  buildDefaultTwitterImageUrls,
  buildOrganizationJsonLd,
  buildRootKeywords,
  buildSiteUrl,
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_TITLE,
  SITE_NAME,
} from "@/lib/seo";
import { getUsageTimeZoneFromCookie } from "@/lib/server/usage-timezone-cookie";

export const metadata: Metadata = {
  alternates: {
    canonical: buildSiteUrl("/").toString(),
  },
  description: SEO_DEFAULT_DESCRIPTION,
  keywords: buildRootKeywords(),
  metadataBase: buildSiteUrl(),
  openGraph: {
    description: SEO_DEFAULT_DESCRIPTION,
    images: buildDefaultOpenGraphImages(),
    locale: "en_US",
    siteName: SITE_NAME,
    title: SEO_DEFAULT_TITLE,
    type: "website",
    url: buildSiteUrl("/").toString(),
  },
  title: {
    default: SEO_DEFAULT_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  twitter: {
    card: "summary_large_image",
    description: SEO_DEFAULT_DESCRIPTION,
    images: buildDefaultTwitterImageUrls(),
    title: SEO_DEFAULT_TITLE,
  },
};

async function DeferredGlobals() {
  let paletteItems: {
    label: string;
    href: string;
    section: string;
    hint: string;
  }[] = [];
  let snapshotCategories: Awaited<
    ReturnType<typeof getLoopSnapshot>
  >["categories"] = [];

  try {
    const snapshot = await getLoopSnapshot();
    snapshotCategories = snapshot.categories;

    paletteItems = [
      ...snapshot.skills.slice(0, 30).map((skill) => ({
        hint: skill.versionLabel,
        href: skill.href,
        label: skill.title,
        section: "Skill",
      })),
      ...snapshot.categories.map((category) => ({
        hint: category.status === "live" ? "Live" : "Seeded",
        href: `/?category=${category.slug}`,
        label: category.title,
        section: "Category",
      })),
      {
        hint: "Agent environment",
        href: "/sandbox",
        label: "Sandbox",
        section: "Action",
      },
      {
        hint: "Ops",
        href: "/settings",
        label: "Settings",
        section: "Action",
      },
      ...snapshot.mcps.slice(0, 20).map((mcp) => ({
        hint: mcp.transport,
        href: buildMcpVersionHref(mcp.name, mcp.version),
        label: mcp.name,
        section: "MCP",
      })),
    ];
  } catch {
    // Gracefully degrade when env vars are unavailable (e.g. landing pages)
  }

  return (
    <>
      <CommandPalette items={paletteItems} />
      <NewSkillModal categories={snapshotCategories} />
    </>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const serverTimeZone = await getUsageTimeZoneFromCookie();

  return (
    <ClerkProvider appearance={clerkAppearance} ui={ui}>
      <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning>
          <SeoJsonLd data={buildOrganizationJsonLd()} />
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TimezoneProvider serverTimeZone={serverTimeZone}>
              <TooltipProvider delayDuration={300}>
                <ActiveOperationsProvider>
                  <Suspense>
                    <DeferredGlobals />
                  </Suspense>
                  {children}
                </ActiveOperationsProvider>
              </TooltipProvider>
            </TimezoneProvider>
          </ThemeProvider>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
