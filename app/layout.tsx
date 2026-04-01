import type { Metadata } from "next";

import { ClerkProvider } from "@clerk/nextjs";
import { ui } from "@clerk/ui";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "next-themes";

import { ActiveOperationsProvider } from "@/components/active-operations-provider";
import { CommandPalette } from "@/components/command-palette";
import { NewSkillModal } from "@/components/new-skill-modal";
import { SeoJsonLd } from "@/components/seo-json-ld";
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

export const metadata: Metadata = {
  metadataBase: buildSiteUrl(),
  title: {
    default: SEO_DEFAULT_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SEO_DEFAULT_DESCRIPTION,
  keywords: buildRootKeywords(),
  openGraph: {
    title: SEO_DEFAULT_TITLE,
    description: SEO_DEFAULT_DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    url: buildSiteUrl("/").toString(),
    images: buildDefaultOpenGraphImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_DEFAULT_TITLE,
    description: SEO_DEFAULT_DESCRIPTION,
    images: buildDefaultTwitterImageUrls(),
  },
  alternates: {
    canonical: buildSiteUrl("/").toString(),
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let paletteItems: { label: string; href: string; section: string; hint: string }[] = [];
  let snapshotCategories: Awaited<ReturnType<typeof getLoopSnapshot>>["categories"] = [];

  try {
    const snapshot = await getLoopSnapshot();
    snapshotCategories = snapshot.categories;

    paletteItems = [
      ...snapshot.skills.slice(0, 30).map((skill) => ({
        label: skill.title,
        href: skill.href,
        section: "Skill",
        hint: skill.versionLabel,
      })),
      ...snapshot.categories.map((category) => ({
        label: category.title,
        href: `/?category=${category.slug}`,
        section: "Category",
        hint: category.status === "live" ? "Live" : "Seeded",
      })),
      {
        label: "Sandbox",
        href: "/sandbox",
        section: "Action",
        hint: "Agent environment",
      },
      {
        label: "Settings",
        href: "/settings",
        section: "Action",
        hint: "Ops",
      },
      ...snapshot.mcps.slice(0, 20).map((mcp) => ({
        label: mcp.name,
        href: buildMcpVersionHref(mcp.name, mcp.version),
        section: "MCP",
        hint: mcp.transport,
      })),
    ];
  } catch {
    // Gracefully degrade when env vars are unavailable (e.g. landing pages)
  }

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
            <TooltipProvider delayDuration={300}>
              <ActiveOperationsProvider>
                <CommandPalette items={paletteItems} />
                <NewSkillModal categories={snapshotCategories} />
                {children}
              </ActiveOperationsProvider>
            </TooltipProvider>
          </ThemeProvider>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
