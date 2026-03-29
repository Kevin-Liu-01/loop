import { PulseIcon, SearchIcon, TimelineIcon } from "@/components/frontier-icons";
import { EmptyCard } from "@/components/ui/empty-card";
import { Panel, PanelHead } from "@/components/ui/panel";
import {
  SimpleList,
  SimpleListBody,
  SimpleListIcon,
  SimpleListItem,
  SimpleListMeta,
  SimpleListRow
} from "@/components/ui/simple-list";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { formatUsageEvent, type SkillUsageSummary, type UsageOverview } from "@/lib/usage";

type SystemObservabilityPanelProps = {
  overview: UsageOverview;
};

type SkillObservabilityPanelProps = {
  usage: SkillUsageSummary;
};

const sectionKicker = "inline-block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft";

function formatEventDetail(details?: string) {
  if (!details) {
    return null;
  }

  return details.length > 96 ? `${details.slice(0, 93)}...` : details;
}

export function SystemObservabilityPanel({ overview }: SystemObservabilityPanelProps) {
  return (
    <Panel className="gap-[18px]">
      <PanelHead>
        <div>
          <span className={sectionKicker}>Observability</span>
          <h2 className="m-0 text-lg font-semibold tracking-[-0.03em]">Usage and route calls</h2>
        </div>
      </PanelHead>

      <div className="grid max-lg:grid-cols-1 grid-cols-4 gap-3">
        <div className="grid gap-1 rounded-2xl border border-line p-4">
          <small className="text-[0.72rem] font-medium uppercase tracking-[0.08em] text-ink-soft">views</small>
          <strong className="text-base font-semibold tracking-[-0.03em] text-ink">{overview.totals.pageViews}</strong>
        </div>
        <div className="grid gap-1 rounded-2xl border border-line p-4">
          <small className="text-[0.72rem] font-medium uppercase tracking-[0.08em] text-ink-soft">interactions</small>
          <strong className="text-base font-semibold tracking-[-0.03em] text-ink">{overview.totals.interactions}</strong>
        </div>
        <div className="grid gap-1 rounded-2xl border border-line p-4">
          <small className="text-[0.72rem] font-medium uppercase tracking-[0.08em] text-ink-soft">api calls</small>
          <strong className="text-base font-semibold tracking-[-0.03em] text-ink">{overview.totals.apiCalls}</strong>
        </div>
        <div className="grid gap-1 rounded-2xl border border-line p-4">
          <small className="text-[0.72rem] font-medium uppercase tracking-[0.08em] text-ink-soft">avg api ms</small>
          <strong className="text-base font-semibold tracking-[-0.03em] text-ink">{overview.totals.avgApiDurationMs || "0"}</strong>
        </div>
      </div>

      <div className="grid max-lg:grid-cols-1 grid-cols-2 gap-4">
        <article className="grid gap-3.5 rounded-2xl border border-line bg-paper-3 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className={sectionKicker}>Routes</span>
              <h3 className="m-0 text-base font-semibold tracking-[-0.03em]">Top route usage</h3>
            </div>
          </div>
          <SimpleList tight>
            {overview.routeUsage.length > 0 ? (
              overview.routeUsage.map((entry) => (
                <SimpleListItem key={entry.route}>
                  <SimpleListIcon>
                    <SearchIcon />
                  </SimpleListIcon>
                  <SimpleListBody>
                    <SimpleListRow>
                      <strong>{entry.route}</strong>
                      <span>{entry.count} calls</span>
                    </SimpleListRow>
                    <SimpleListMeta>
                      <span>{entry.avgDurationMs} ms avg</span>
                      <span>{entry.errorCount} errors</span>
                      <span>{formatDateTime(entry.lastAt)}</span>
                    </SimpleListMeta>
                  </SimpleListBody>
                </SimpleListItem>
              ))
            ) : (
              <EmptyCard>No route data yet.</EmptyCard>
            )}
          </SimpleList>
        </article>

        <article className="grid gap-3.5 rounded-2xl border border-line bg-paper-3 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className={sectionKicker}>Activity</span>
              <h3 className="m-0 text-base font-semibold tracking-[-0.03em]">What people do</h3>
            </div>
          </div>
          <SimpleList tight>
            {overview.activityCounts.length > 0 ? (
              overview.activityCounts.map((entry) => (
                <SimpleListItem className={cn("grid-cols-1")} key={entry.label}>
                  <SimpleListBody>
                    <SimpleListRow>
                      <strong>{entry.label}</strong>
                      <span>{entry.count}</span>
                    </SimpleListRow>
                  </SimpleListBody>
                </SimpleListItem>
              ))
            ) : (
              <EmptyCard>No activity yet.</EmptyCard>
            )}
          </SimpleList>
        </article>
      </div>

      <article className="grid gap-3.5 rounded-2xl border border-line bg-paper-3 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <span className={sectionKicker}>Recent</span>
            <h3 className="m-0 text-base font-semibold tracking-[-0.03em]">Recent activity</h3>
          </div>
        </div>
        <SimpleList tight>
          {overview.recentEvents.length > 0 ? (
            overview.recentEvents.map((event) => (
              <SimpleListItem key={event.id}>
                <SimpleListIcon>
                  <TimelineIcon />
                </SimpleListIcon>
                <SimpleListBody>
                  <SimpleListRow>
                    <strong>{formatUsageEvent(event)}</strong>
                    <span>{formatDateTime(event.at)}</span>
                  </SimpleListRow>
                  <SimpleListMeta>
                    <span>{event.kind}</span>
                    {event.status ? <span>{event.status}</span> : null}
                    {typeof event.durationMs === "number" ? <span>{event.durationMs} ms</span> : null}
                    {event.skillSlug ? <span>{event.skillSlug}</span> : null}
                  </SimpleListMeta>
                  {formatEventDetail(event.details) ? <p>{formatEventDetail(event.details)}</p> : null}
                </SimpleListBody>
              </SimpleListItem>
            ))
          ) : (
            <EmptyCard>No events yet.</EmptyCard>
          )}
        </SimpleList>
      </article>
    </Panel>
  );
}

export function SkillObservabilityPanel({ usage }: SkillObservabilityPanelProps) {
  return (
    <Panel compact className="gap-[18px]">
      <PanelHead>
        <div>
          <span className={sectionKicker}>Observability</span>
          <h2 className="m-0 text-lg font-semibold tracking-[-0.03em]">Usage for this skill</h2>
        </div>
      </PanelHead>

      <div className="grid max-lg:grid-cols-1 grid-cols-6 gap-3">
        <div className="grid gap-1 rounded-2xl border border-line p-4">
          <small className="text-[0.72rem] font-medium uppercase tracking-[0.08em] text-ink-soft">views</small>
          <strong className="text-base font-semibold tracking-[-0.03em] text-ink">{usage.pageViews}</strong>
        </div>
        <div className="grid gap-1 rounded-2xl border border-line p-4">
          <small className="text-[0.72rem] font-medium uppercase tracking-[0.08em] text-ink-soft">copies</small>
          <strong className="text-base font-semibold tracking-[-0.03em] text-ink">{usage.copies}</strong>
        </div>
        <div className="grid gap-1 rounded-2xl border border-line p-4">
          <small className="text-[0.72rem] font-medium uppercase tracking-[0.08em] text-ink-soft">saves</small>
          <strong className="text-base font-semibold tracking-[-0.03em] text-ink">{usage.saves}</strong>
        </div>
        <div className="grid gap-1 rounded-2xl border border-line p-4">
          <small className="text-[0.72rem] font-medium uppercase tracking-[0.08em] text-ink-soft">refreshes</small>
          <strong className="text-base font-semibold tracking-[-0.03em] text-ink">{usage.refreshes}</strong>
        </div>
        <div className="grid gap-1 rounded-2xl border border-line p-4">
          <small className="text-[0.72rem] font-medium uppercase tracking-[0.08em] text-ink-soft">api calls</small>
          <strong className="text-base font-semibold tracking-[-0.03em] text-ink">{usage.apiCalls}</strong>
        </div>
        <div className="grid gap-1 rounded-2xl border border-line p-4">
          <small className="text-[0.72rem] font-medium uppercase tracking-[0.08em] text-ink-soft">last seen</small>
          <strong className="text-base font-semibold tracking-[-0.03em] text-ink">
            {usage.lastSeenAt ? formatDateTime(usage.lastSeenAt) : "none"}
          </strong>
        </div>
      </div>

      <article className="grid gap-3.5 rounded-2xl border border-line bg-paper-3 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <span className={sectionKicker}>Recent</span>
            <h3 className="m-0 text-base font-semibold tracking-[-0.03em]">Latest usage</h3>
          </div>
        </div>
        <SimpleList tight>
          {usage.recentEvents.length > 0 ? (
            usage.recentEvents.map((event) => (
              <SimpleListItem key={event.id}>
                <SimpleListIcon>
                  <PulseIcon />
                </SimpleListIcon>
                <SimpleListBody>
                  <SimpleListRow>
                    <strong>{formatUsageEvent(event)}</strong>
                    <span>{formatDateTime(event.at)}</span>
                  </SimpleListRow>
                  <SimpleListMeta>
                    <span>{event.kind}</span>
                    {event.status ? <span>{event.status}</span> : null}
                    {typeof event.durationMs === "number" ? <span>{event.durationMs} ms</span> : null}
                  </SimpleListMeta>
                  {formatEventDetail(event.details) ? <p>{formatEventDetail(event.details)}</p> : null}
                </SimpleListBody>
              </SimpleListItem>
            ))
          ) : (
            <EmptyCard>No usage yet.</EmptyCard>
          )}
        </SimpleList>
      </article>
    </Panel>
  );
}
