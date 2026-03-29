import { HomeShell } from "@/components/home-shell";
import { UsageBeacon } from "@/components/usage-beacon";
import { getSystemSnapshot } from "@/lib/system-summary";

export default async function HomePage() {
  const { snapshot, systemState } = await getSystemSnapshot();

  return (
    <>
      <UsageBeacon
        dedupeKey="page:/"
        kind="page_view"
        label="Opened home"
        path="/"
      />
      <HomeShell
        categories={snapshot.categories}
        loopRuns={systemState.loopRuns}
        skills={snapshot.skills}
      />
    </>
  );
}
