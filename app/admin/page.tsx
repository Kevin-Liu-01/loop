import Link from "next/link";
import { cookies } from "next/headers";

import { AdminUpdateControls } from "@/components/admin-update-controls";
import { AutomationManager } from "@/components/automation-manager";
import { LoopUpdateDashboard } from "@/components/loop-update-dashboard";
import { SystemObservabilityPanel } from "@/components/observability-panels";
import { TrackSkillPanel } from "@/components/track-skill-panel";
import { SiteHeader } from "@/components/site-header";
import { UsageBeacon } from "@/components/usage-beacon";
import { ADMIN_SESSION_COOKIE, getAdminEmailFromSessionToken, getPrimaryAdminEmail } from "@/lib/admin";
import { buildLoopUpdateTarget } from "@/lib/loop-updates";
import { getSystemSnapshot } from "@/lib/system-summary";
import { buildUsageOverview } from "@/lib/usage";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const { snapshot, systemState } = await getSystemSnapshot();
  const currentAdminEmail = getAdminEmailFromSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  const primaryAdminEmail = getPrimaryAdminEmail();
  const trackableSkills = snapshot.skills
    .filter((skill) => skill.origin === "repo" || skill.origin === "codex")
    .sort((left, right) => left.title.localeCompare(right.title))
    .map((skill) => ({
      slug: skill.slug,
      title: skill.title,
      category: skill.category
    }));
  const loopTargets = snapshot.skills
    .filter((skill) => skill.origin === "user" || skill.origin === "remote")
    .map(buildLoopUpdateTarget)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const usageOverview = buildUsageOverview(systemState.usageEvents);

  return (
    <>
      <UsageBeacon dedupeKey="page:/admin" kind="page_view" label="Opened updates desk" path="/admin" />
      <SiteHeader
        sections={[
          { href: "/", label: "Catalog" },
          { href: "/skills/new", label: "Add" },
          { href: "/admin", label: "Updates" },
          { href: "/agents", label: "Agents" }
        ]}
      />

      <main className="page-shell page-shell--narrow">
        <section className="workspace-hero workspace-hero--compact">
          <div className="workspace-hero__copy">
            <span className="section-kicker">Updates</span>
            <h1>Refresh tracked skills.</h1>
            <p className="lede">Select one. Run it. Read the diff.</p>
          </div>

          <div className="workspace-actions">
            <Link className="button" href="/skills/new">
              Add skill
            </Link>
            <Link className="button button--ghost" href="#automations">
              Automations
            </Link>
            <Link className="button button--ghost" href="/">
              Catalog
            </Link>
          </div>
        </section>

        <section className="journey-strip journey-strip--dense" aria-label="Update flow">
          <article className="journey-step">
            <div>
              <strong>1</strong>
              <p>Choose a tracked skill.</p>
            </div>
          </article>
          <article className="journey-step">
            <div>
              <strong>2</strong>
              <p>Run the agent refresh.</p>
            </div>
          </article>
          <article className="journey-step">
            <div>
              <strong>3</strong>
              <p>Read logs and diff.</p>
            </div>
          </article>
        </section>

        <AdminUpdateControls currentAdminEmail={currentAdminEmail} primaryAdminEmail={primaryAdminEmail} />
        {trackableSkills.length > 0 ? <TrackSkillPanel skills={trackableSkills} /> : null}
        <div id="updates">
          <LoopUpdateDashboard runs={systemState.loopRuns} targets={loopTargets} />
        </div>
        <div id="automations">
          <AutomationManager automations={snapshot.automations} skills={snapshot.skills} />
        </div>
        <SystemObservabilityPanel overview={usageOverview} />
      </main>
    </>
  );
}
