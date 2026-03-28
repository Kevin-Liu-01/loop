import { AgentStudio } from "@/components/agent-studio";
import { RadarIcon, TimelineIcon } from "@/components/frontier-icons";
import { SiteHeader } from "@/components/site-header";
import { UsageBeacon } from "@/components/usage-beacon";
import { AGENT_PROVIDER_PRESETS } from "@/lib/agents";
import { formatDateTime } from "@/lib/format";
import { getSkillwireSnapshot } from "@/lib/refresh";
import { readSystemStateStore } from "@/lib/system-state";

export default async function AgentsPage() {
  const [snapshot, systemState] = await Promise.all([getSkillwireSnapshot(), readSystemStateStore()]);
  const executableMcps = snapshot.mcps.filter((mcp) => ["stdio", "http"].includes(mcp.transport)).length;
  const recentAgentCalls = systemState.usageEvents
    .filter((event) => event.route === "/api/agents/run")
    .slice(0, 6);

  return (
    <>
      <UsageBeacon dedupeKey="page:/agents" kind="page_view" label="Opened agents" path="/agents" />
      <SiteHeader
        sections={[
          { href: "/", label: "Catalog" },
          { href: "/skills/new", label: "Add" },
          { href: "/admin", label: "Updates" },
          { href: "/agents", label: "Agents" }
        ]}
      />
      <main className="page-shell page-shell--narrow workspace-shell">
        <section className="workspace-hero workspace-hero--compact">
          <div className="workspace-hero__copy">
            <span className="section-kicker">Agents</span>
            <h1>Run agents with the same loops.</h1>
            <p className="lede">Attach skills. Attach connectors. Keep the context versioned.</p>
          </div>
        </section>

        <section className="surface-panel surface-panel--compact">
          <div className="inline-stats inline-stats--wide">
            <div>
              <small>providers</small>
              <strong>{AGENT_PROVIDER_PRESETS.length}</strong>
            </div>
            <div>
              <small>skills</small>
              <strong>{snapshot.skills.length}</strong>
            </div>
            <div>
              <small>mcps</small>
              <strong>{snapshot.mcps.length}</strong>
            </div>
            <div>
              <small>runtime ready</small>
              <strong>{executableMcps}</strong>
            </div>
          </div>
        </section>

        <section className="workspace-secondary">
          <article className="surface-panel">
            <div className="surface-panel__head">
              <div>
                <span className="section-kicker">Studio</span>
                <h2>Agent setup</h2>
              </div>
            </div>
            <AgentStudio mcps={snapshot.mcps} presets={AGENT_PROVIDER_PRESETS} skills={snapshot.skills} />
          </article>

          <article className="surface-panel surface-panel--compact">
            <div className="surface-panel__head">
              <div>
                <span className="section-kicker">Observability</span>
                <h2>Recent agent calls</h2>
              </div>
            </div>
            <div className="simple-list simple-list--tight">
              {recentAgentCalls.length > 0 ? (
                recentAgentCalls.map((event) => (
                  <article className="simple-list__item" key={event.id}>
                    <div className="simple-list__icon">
                      {event.ok === false ? <TimelineIcon /> : <RadarIcon />}
                    </div>
                    <div className="simple-list__body">
                      <div className="simple-list__row">
                        <strong>{event.label}</strong>
                        <span>{formatDateTime(event.at)}</span>
                      </div>
                      <div className="simple-list__meta">
                        <span>{event.status ?? "200"}</span>
                        {typeof event.durationMs === "number" ? <span>{event.durationMs} ms</span> : null}
                      </div>
                      {event.details ? <p>{event.details}</p> : null}
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-card">No agent calls yet.</div>
              )}
            </div>
          </article>
        </section>
      </main>
    </>
  );
}
