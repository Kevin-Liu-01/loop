import { HomeShell } from "@/components/home-shell";
import { UsageBeacon } from "@/components/usage-beacon";
import { listRecentImports } from "@/lib/db/recent-imports";
import { getUsageTimeZoneFromCookie } from "@/lib/server/usage-timezone-cookie";
import { getSystemSnapshot } from "@/lib/system-summary";
import { buildUsageOverview } from "@/lib/usage";

export default async function HomePage() {
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
