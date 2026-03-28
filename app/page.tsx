import { DeskHomeShell } from "@/components/desk-home-shell";
import { SiteHeader } from "@/components/site-header";
import { UsageBeacon } from "@/components/usage-beacon";
import { getSystemSnapshot } from "@/lib/system-summary";

export default async function HomePage() {
  const { snapshot, systemState } = await getSystemSnapshot();
  const latestRun = systemState.refreshRuns[0] ?? null;

  return (
    <>
      <UsageBeacon dedupeKey="page:/" kind="page_view" label="Opened catalog desk" path="/" />
      <SiteHeader
        sections={[
          { href: "/", label: "Catalog" },
          { href: "/skills/new", label: "Add" },
          { href: "/admin", label: "Updates" },
          { href: "/agents", label: "Agents" }
        ]}
      />
      <DeskHomeShell
        automations={snapshot.automations}
        categories={snapshot.categories}
        latestRun={latestRun}
        skills={snapshot.skills}
      />
    </>
  );
}
