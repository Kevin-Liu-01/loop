import { cookies } from "next/headers";

import { AdminUpdateControls } from "@/components/admin-update-controls";
import { AutomationManager } from "@/components/automation-manager";
import { SystemObservabilityPanel } from "@/components/observability-panels";
import { SiteHeader } from "@/components/site-header";
import { UsageBeacon } from "@/components/usage-beacon";
import { PageShell } from "@/components/ui/page-shell";
import {
  ADMIN_SESSION_COOKIE,
  getAdminEmailFromSessionToken,
  getPrimaryAdminEmail
} from "@/lib/admin";
import { getSystemSnapshot } from "@/lib/system-summary";
import { buildUsageOverview } from "@/lib/usage";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const { snapshot, systemState } = await getSystemSnapshot();
  const currentAdminEmail = getAdminEmailFromSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  );
  const primaryAdminEmail = getPrimaryAdminEmail();
  const usageOverview = buildUsageOverview(systemState.usageEvents);

  return (
    <>
      <UsageBeacon
        dedupeKey="page:/settings"
        kind="page_view"
        label="Opened settings"
        path="/settings"
      />
      <SiteHeader />

      <PageShell narrow className="grid gap-8 pt-8 pb-16">
        <header className="grid gap-1">
          <h1 className="m-0 text-2xl font-semibold tracking-tight text-ink">
            Settings
          </h1>
          <p className="m-0 text-sm text-ink-soft">
            Session, global refresh, automations, and system health.
          </p>
        </header>

        <section id="session" className="grid gap-5">
          <h2 className="m-0 text-lg font-semibold tracking-tight text-ink">
            Session &amp; Refresh
          </h2>
          <AdminUpdateControls
            currentAdminEmail={currentAdminEmail}
            primaryAdminEmail={primaryAdminEmail}
          />
        </section>

        <section id="automations" className="grid gap-5">
          <h2 className="m-0 text-lg font-semibold tracking-tight text-ink">
            Automations
          </h2>
          <AutomationManager
            automations={snapshot.automations}
            skills={snapshot.skills}
          />
        </section>

        <section id="health" className="grid gap-5">
          <h2 className="m-0 text-lg font-semibold tracking-tight text-ink">
            System Health
          </h2>
          <SystemObservabilityPanel overview={usageOverview} />
        </section>
      </PageShell>
    </>
  );
}
