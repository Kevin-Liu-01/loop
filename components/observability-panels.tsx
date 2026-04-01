import { PulseIcon, TimelineIcon } from "@/components/frontier-icons";
import { AreaChart } from "@/components/charts/area-chart";
import { BarList } from "@/components/charts/bar-list";
import { StatTile } from "@/components/charts/stat-tile";
import { EmptyCard } from "@/components/ui/empty-card";
import {
  SimpleList,
  SimpleListBody,
  SimpleListIcon,
  SimpleListItem,
  SimpleListMeta,
  SimpleListRow
} from "@/components/ui/simple-list";
import { formatDateTime, formatRelativeDate } from "@/lib/format";
import { formatUsageEvent, type SkillUsageSummary, type UsageOverview } from "@/lib/usage";

type SystemObservabilityPanelProps = {
  overview: UsageOverview;
};

type SkillObservabilityPanelProps = {
  usage: SkillUsageSummary;
};

function formatEventDetail(details?: string) {
  if (!details) return null;
  return details.length > 96 ? `${details.slice(0, 93)}...` : details;
}

function SubCard({
  title,
  legend,
  children,
}: {
  title: string;
  legend?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="grid gap-3.5 rounded-none border border-line bg-paper-3/90 p-4 dark:bg-paper-2/40">
      <div className="flex items-end justify-between gap-3">
        <h3 className="m-0 text-sm font-semibold tracking-tight text-ink">{title}</h3>
        {legend ?? null}
      </div>
      {children}
    </article>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[0.65rem] text-ink-faint">
      <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export function SystemObservabilityPanel({ overview }: SystemObservabilityPanelProps) {
  const viewsSpark = overview.timeSeries.map((b) => b.views);
  const interactionsSpark = overview.timeSeries.map((b) => b.interactions);
  const apiSpark = overview.timeSeries.map((b) => b.api);
  const latencySpark = overview.latencySeries.map((b) => b.avgMs);

  const areaData = overview.timeSeries.map((b) => ({
    label: b.label,
    value: b.total,
    secondary: b.api,
  }));

  const routeItems = overview.routeUsage.map((entry) => ({
    label: entry.route,
    value: entry.count,
    secondary:
      entry.errorCount > 0
        ? `${entry.avgDurationMs}ms · ${entry.errorCount} err`
        : `${entry.avgDurationMs}ms avg`,
  }));

  const activityItems = overview.activityCounts.map((entry) => ({
    label: entry.label,
    value: entry.count,
  }));

  return (
    <div className="grid gap-5">
      <div className="grid gap-0 rounded-none border border-line bg-paper-3/92">
        <div className="flex items-center gap-3 border-b border-line p-5 sm:p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-paper-2 shadow-[0_1px_0_0_rgba(0,0,0,0.04)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)]">
            <PulseIcon className="h-4.5 w-4.5 text-ink-soft" />
          </span>
          <div>
            <p className="m-0 text-sm font-semibold tracking-tight text-ink">Usage overview</p>
            <p className="m-0 text-xs text-ink-faint">Rolling 24-hour window</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0 border-b border-line sm:grid-cols-4">
          <StatTile label="views" value={overview.totalsRolling24h.pageViews} sparkData={viewsSpark} />
          <StatTile
            label="interactions"
            value={overview.totalsRolling24h.interactions}
            sparkData={interactionsSpark}
          />
          <StatTile label="api calls" value={overview.totalsRolling24h.apiCalls} sparkData={apiSpark} />
          <StatTile
            label="avg api ms"
            value={overview.totalsRolling24h.avgApiDurationMs || "0"}
            sparkData={latencySpark}
          />
        </div>

        <div className="p-5 sm:p-6">
          <SubCard
            title="Event volume – 24h"
            legend={
              <div className="flex items-center gap-3">
                <LegendDot color="var(--color-accent)" label="total" />
                <LegendDot color="color-mix(in oklch, var(--color-ink-faint) 50%, transparent)" label="api" />
              </div>
            }
          >
            <AreaChart id="sys-events" data={areaData} />
          </SubCard>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SubCard title="Top route usage">
          {routeItems.length > 0 ? (
            <BarList items={routeItems} />
          ) : (
            <EmptyCard>No route data yet.</EmptyCard>
          )}
        </SubCard>

        <SubCard title="Activity breakdown">
          {activityItems.length > 0 ? (
            <BarList items={activityItems} />
          ) : (
            <EmptyCard>No activity yet.</EmptyCard>
          )}
        </SubCard>
      </div>

      <SubCard title="Recent activity">
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
      </SubCard>
    </div>
  );
}

export function SkillObservabilityPanel({ usage }: SkillObservabilityPanelProps) {
  const hasAnyActivity =
    usage.pageViews + usage.copies + usage.saves + usage.refreshes + usage.apiCalls > 0;

  const dc = usage.dailyCounts ?? [];
  const viewsSpark = dc.map((d) => d.views);
  const copiesSpark = dc.map((d) => d.copies);
  const savesSpark = dc.map((d) => d.saves);
  const refreshesSpark = dc.map((d) => d.refreshes);
  const apiSpark = dc.map((d) => d.apiCalls);

  return (
    <div className="grid gap-4 rounded-none border border-line bg-paper-3/92 p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="m-0 font-serif text-lg font-medium tracking-[-0.02em] text-ink">
          Usage stats
        </h2>
        {usage.lastSeenAt && (
          <span className="text-[0.625rem] text-ink-faint">
            {formatRelativeDate(usage.lastSeenAt)}
          </span>
        )}
      </div>

      {hasAnyActivity ? (
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line/60 dark:bg-line/40">
          <StatTile label="views" size="compact" sparkData={viewsSpark} value={usage.pageViews} />
          <StatTile label="copies" size="compact" sparkData={copiesSpark} value={usage.copies} />
          <StatTile label="saves" size="compact" sparkData={savesSpark} value={usage.saves} />
          <StatTile label="refreshes" size="compact" sparkData={refreshesSpark} value={usage.refreshes} />
          <StatTile className="col-span-2" label="api calls" size="compact" sparkData={apiSpark} value={usage.apiCalls} />
        </div>
      ) : (
        <div className="rounded-none border border-line/70 px-4 py-5 text-center text-xs text-ink-faint dark:border-line/50">
          No usage recorded yet
        </div>
      )}

      {usage.recentEvents.length > 0 && (
        <SubCard title="Latest usage">
          <SimpleList tight>
            {usage.recentEvents.map((event) => (
              <SimpleListItem key={event.id}>
                <SimpleListIcon>
                  <PulseIcon />
                </SimpleListIcon>
                <SimpleListBody>
                  <SimpleListRow>
                    <strong>{formatUsageEvent(event)}</strong>
                    <span>{formatRelativeDate(event.at)}</span>
                  </SimpleListRow>
                  <SimpleListMeta>
                    <span>{event.kind}</span>
                    {event.status ? <span>{event.status}</span> : null}
                    {typeof event.durationMs === "number" ? <span>{event.durationMs} ms</span> : null}
                  </SimpleListMeta>
                </SimpleListBody>
              </SimpleListItem>
            ))}
          </SimpleList>
        </SubCard>
      )}
    </div>
  );
}
