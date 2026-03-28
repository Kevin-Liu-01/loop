import { PulseIcon, SearchIcon, TimelineIcon } from "@/components/frontier-icons";
import { formatDateTime } from "@/lib/format";
import { formatUsageEvent, type SkillUsageSummary, type UsageOverview } from "@/lib/usage";

type SystemObservabilityPanelProps = {
  overview: UsageOverview;
};

type SkillObservabilityPanelProps = {
  usage: SkillUsageSummary;
};

function formatEventDetail(details?: string) {
  if (!details) {
    return null;
  }

  return details.length > 96 ? `${details.slice(0, 93)}...` : details;
}

export function SystemObservabilityPanel({ overview }: SystemObservabilityPanelProps) {
  return (
    <section className="surface-panel observability-panel">
      <div className="surface-panel__head">
        <div>
          <span className="section-kicker">Observability</span>
          <h2>Usage and route calls</h2>
        </div>
      </div>

      <div className="observability-stats">
        <div>
          <small>views</small>
          <strong>{overview.totals.pageViews}</strong>
        </div>
        <div>
          <small>interactions</small>
          <strong>{overview.totals.interactions}</strong>
        </div>
        <div>
          <small>api calls</small>
          <strong>{overview.totals.apiCalls}</strong>
        </div>
        <div>
          <small>avg api ms</small>
          <strong>{overview.totals.avgApiDurationMs || "0"}</strong>
        </div>
      </div>

      <div className="observability-grid">
        <article className="observability-block">
          <div className="observability-block__head">
            <div>
              <span className="section-kicker">Routes</span>
              <h3>Top route usage</h3>
            </div>
          </div>
          <div className="simple-list simple-list--tight">
            {overview.routeUsage.length > 0 ? (
              overview.routeUsage.map((entry) => (
                <article className="simple-list__item" key={entry.route}>
                  <div className="simple-list__icon">
                    <SearchIcon />
                  </div>
                  <div className="simple-list__body">
                    <div className="simple-list__row">
                      <strong>{entry.route}</strong>
                      <span>{entry.count} calls</span>
                    </div>
                    <div className="simple-list__meta">
                      <span>{entry.avgDurationMs} ms avg</span>
                      <span>{entry.errorCount} errors</span>
                      <span>{formatDateTime(entry.lastAt)}</span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-card">No route data yet.</div>
            )}
          </div>
        </article>

        <article className="observability-block">
          <div className="observability-block__head">
            <div>
              <span className="section-kicker">Activity</span>
              <h3>What people do</h3>
            </div>
          </div>
          <div className="simple-list simple-list--tight">
            {overview.activityCounts.length > 0 ? (
              overview.activityCounts.map((entry) => (
                <article className="simple-list__item" key={entry.label}>
                  <div className="simple-list__body">
                    <div className="simple-list__row">
                      <strong>{entry.label}</strong>
                      <span>{entry.count}</span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-card">No activity yet.</div>
            )}
          </div>
        </article>
      </div>

      <article className="observability-block">
        <div className="observability-block__head">
          <div>
            <span className="section-kicker">Recent</span>
            <h3>Recent activity</h3>
          </div>
        </div>
        <div className="simple-list simple-list--tight">
          {overview.recentEvents.length > 0 ? (
            overview.recentEvents.map((event) => (
              <article className="simple-list__item" key={event.id}>
                <div className="simple-list__icon">
                  <TimelineIcon />
                </div>
                <div className="simple-list__body">
                  <div className="simple-list__row">
                    <strong>{formatUsageEvent(event)}</strong>
                    <span>{formatDateTime(event.at)}</span>
                  </div>
                  <div className="simple-list__meta">
                    <span>{event.kind}</span>
                    {event.status ? <span>{event.status}</span> : null}
                    {typeof event.durationMs === "number" ? <span>{event.durationMs} ms</span> : null}
                    {event.skillSlug ? <span>${event.skillSlug}</span> : null}
                  </div>
                  {formatEventDetail(event.details) ? <p>{formatEventDetail(event.details)}</p> : null}
                </div>
              </article>
            ))
          ) : (
            <div className="empty-card">No events yet.</div>
          )}
        </div>
      </article>
    </section>
  );
}

export function SkillObservabilityPanel({ usage }: SkillObservabilityPanelProps) {
  return (
    <article className="surface-panel surface-panel--compact observability-panel">
      <div className="surface-panel__head">
        <div>
          <span className="section-kicker">Observability</span>
          <h2>Usage for this skill</h2>
        </div>
      </div>

      <div className="observability-stats observability-stats--skill">
        <div>
          <small>views</small>
          <strong>{usage.pageViews}</strong>
        </div>
        <div>
          <small>copies</small>
          <strong>{usage.copies}</strong>
        </div>
        <div>
          <small>saves</small>
          <strong>{usage.saves}</strong>
        </div>
        <div>
          <small>refreshes</small>
          <strong>{usage.refreshes}</strong>
        </div>
        <div>
          <small>api calls</small>
          <strong>{usage.apiCalls}</strong>
        </div>
        <div>
          <small>last seen</small>
          <strong>{usage.lastSeenAt ? formatDateTime(usage.lastSeenAt) : "none"}</strong>
        </div>
      </div>

      <article className="observability-block">
        <div className="observability-block__head">
          <div>
            <span className="section-kicker">Recent</span>
            <h3>Latest usage</h3>
          </div>
        </div>
        <div className="simple-list simple-list--tight">
          {usage.recentEvents.length > 0 ? (
            usage.recentEvents.map((event) => (
              <article className="simple-list__item" key={event.id}>
                <div className="simple-list__icon">
                  <PulseIcon />
                </div>
                <div className="simple-list__body">
                  <div className="simple-list__row">
                    <strong>{formatUsageEvent(event)}</strong>
                    <span>{formatDateTime(event.at)}</span>
                  </div>
                  <div className="simple-list__meta">
                    <span>{event.kind}</span>
                    {event.status ? <span>{event.status}</span> : null}
                    {typeof event.durationMs === "number" ? <span>{event.durationMs} ms</span> : null}
                  </div>
                  {formatEventDetail(event.details) ? <p>{formatEventDetail(event.details)}</p> : null}
                </div>
              </article>
            ))
          ) : (
            <div className="empty-card">No usage yet.</div>
          )}
        </div>
      </article>
    </article>
  );
}
