import type { Metadata } from "next";

import { auth } from "@clerk/nextjs/server";

import { HomeShell } from "@/components/home-shell";
import { LandingShell } from "@/components/home-landing/landing-shell";
import { UsageBeacon } from "@/components/usage-beacon";
import { listRecentImports } from "@/lib/db/recent-imports";
import {
  LANDING_AUTOMATIONS,
  LANDING_MCPS,
  LANDING_SKILLS,
} from "@/lib/home-landing/landing-data";
import { fetchLandingData } from "@/lib/home-landing/landing-queries";
import {
  buildDefaultOpenGraphImages,
  buildDefaultTwitterImageUrls,
  buildSiteUrl,
  SEO_DEFAULT_TITLE,
  SITE_NAME,
} from "@/lib/seo";
import { getUsageTimeZoneFromCookie } from "@/lib/server/usage-timezone-cookie";
import { getSystemSnapshot } from "@/lib/system-summary";
import { buildUsageOverview } from "@/lib/usage";

export const dynamic = "force-dynamic";

const LANDING_DESCRIPTION =
  "Loop monitors, evaluates, and updates your agent playbooks. Every skill stays optimal, every parameter stays current.";

export const metadata: Metadata = {
  title: { absolute: SEO_DEFAULT_TITLE },
  description: LANDING_DESCRIPTION,
  openGraph: {
    title: SEO_DEFAULT_TITLE,
    description: LANDING_DESCRIPTION,
    url: buildSiteUrl("/").toString(),
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: buildDefaultOpenGraphImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_DEFAULT_TITLE,
    description: LANDING_DESCRIPTION,
    images: buildDefaultTwitterImageUrls(),
  },
};

export default async function RootPage() {
  const { userId } = await auth();

  if (userId) {
    return <AuthenticatedDashboard />;
  }

  return <PublicLanding />;
}

async function AuthenticatedDashboard() {
  const timeZone = await getUsageTimeZoneFromCookie();
  const [{ snapshot, systemState }, recentImports] = await Promise.all([
    getSystemSnapshot({ timeZone }),
    listRecentImports(20),
  ]);
  const usageOverview = buildUsageOverview(systemState.usageEvents, { timeZone });

  return (
    <>
      <UsageBeacon
        dedupeKey="page:/"
        kind="page_view"
        label="Opened home"
        path="/"
      />
      <HomeShell
        automations={snapshot.automations}
        categories={snapshot.categories}
        loopRuns={systemState.loopRuns}
        mcps={snapshot.mcps}
        recentImports={recentImports}
        skills={snapshot.skills}
        usageOverview={usageOverview}
      />
    </>
  );
}

async function PublicLanding() {
  const live = await fetchLandingData().catch(() => null);
  const hasLiveSkills = live && live.skills.length > 0;

  return (
    <LandingShell
      automations={hasLiveSkills ? live.automations : LANDING_AUTOMATIONS}
      mcps={hasLiveSkills ? live.mcps : LANDING_MCPS}
      skills={hasLiveSkills ? live.skills : undefined}
      staticSkills={hasLiveSkills ? undefined : LANDING_SKILLS}
    />
  );
}
