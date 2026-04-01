"use client";

import { useState } from "react";

import { ChevronDownIcon } from "@/components/frontier-icons";
import { ActivityFeedImports } from "@/components/activity-feed-imports";
import { ActivityUsageToolbar } from "@/components/activity-usage-toolbar";
import { AutomationCalendar } from "@/components/automation-calendar";
import { AutomationEditModal } from "@/components/automation-edit-modal";
import { ImportSourcesList } from "@/components/import-sources-list";
import { AreaChart } from "@/components/charts/area-chart";
import { StatTile } from "@/components/charts/stat-tile";
import { useUsageComparisonMode } from "@/components/usage-comparison-context";
import { EmptyCard } from "@/components/ui/empty-card";
import { Panel } from "@/components/ui/panel";
import { StatusDot } from "@/components/ui/status-dot";
import { Tip } from "@/components/ui/tip";
import { cn } from "@/lib/cn";
import type { RecentImportItem } from "@/lib/db/recent-imports";
import { inlineSectionLabel } from "@/lib/ui-layout";
import { peakVolumeHour, sumBucketTotals } from "@/lib/usage-sidebar-insights";
import type { AutomationSummary, SkillRecord } from "@/lib/types";
import type { UsageDeltaSet, UsageOverview, UsageTotalsSnapshot } from "@/lib/usage";
import { usageStatTileValues } from "@/lib/usage";

type ActivitySidebarTab = "automations" | "imports";

type ActivityDashboardProps = {
  overview: UsageOverview;
  automations: AutomationSummary[];
  recentImports?: RecentImportItem[];
  skillMap?: Map<string, SkillRecord>;
  variant?: "default" | "sidebar";
};

type ActivitySidebarViewProps = {
  overview: UsageOverview;
  tileValues: UsageTotalsSnapshot;
  deltas: UsageDeltaSet;
  automations: AutomationSummary[];
  recentImports: RecentImportItem[];
  skillMap?: Map<string, SkillRecord>;
  viewsSpark: number[];
  interactionsSpark: number[];
  apiSpark: number[];
  latencySpark: number[];
  areaData: { label: string; value: number; secondary?: number }[];
  hasEvents: boolean;
  activeAutomations: AutomationSummary[];
  onEditAutomation?: (automation: AutomationSummary) => void;
};

function truncateRouteLabel(route: string, max = 36): string {
  const t = route.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

const IMPORTS_COLLAPSED_LIMIT = 6;

function CollapsibleImports({ imports }: { imports: RecentImportItem[] }) {
  const [expanded, setExpanded] = useState(false);
  if (imports.length === 0) return null;

  const canCollapse = imports.length > IMPORTS_COLLAPSED_LIMIT;
  const visible = canCollapse && !expanded ? imports.slice(0, IMPORTS_COLLAPSED_LIMIT) : imports;
  const hiddenCount = imports.length - IMPORTS_COLLAPSED_LIMIT;

  return (
    <div className="border-t border-line pt-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-ink-faint">
          Recently imported
        </span>
        <span className="text-[0.625rem] tabular-nums text-ink-faint/60">{imports.length}</span>
      </div>
      <ActivityFeedImports imports={visible} />
      {canCollapse && (
        <button
          className={cn(
            "mt-2 flex w-full items-center justify-center gap-1 py-1.5 text-[0.6875rem] font-medium text-ink-faint transition-colors hover:text-ink-soft",
          )}
          onClick={() => setExpanded((prev) => !prev)}
          type="button"
        >
          {expanded ? "Show less" : `Show ${hiddenCount} more`}
          <ChevronDownIcon className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
        </button>
      )}
    </div>
  );
}

function SidebarSegment({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "relative flex items-center gap-1.5 px-2.5 py-1.5 text-[0.6875rem] font-medium transition-colors",
        active
          ? "bg-paper-3 text-ink dark:bg-paper-2"
          : "bg-transparent text-ink-faint hover:text-ink-soft hover:bg-paper-3/50 dark:hover:bg-paper-2/50"
      )}
      onClick={onClick}
      type="button"
    >
      {label}
      {typeof count === "number" && count > 0 && (
        <span className="tabular-nums text-[0.6rem] text-ink-faint">{count}</span>
      )}
    </button>
  );
}

function ActivitySidebarView({
  overview,
  tileValues,
  deltas,
  automations,
  recentImports,
  skillMap,
  viewsSpark,
  interactionsSpark,
  apiSpark,
  latencySpark,
  areaData,
  hasEvents,
  activeAutomations,
  onEditAutomation,
}: ActivitySidebarViewProps) {
  const [sidebarTab, setSidebarTab] = useState<ActivitySidebarTab>("automations");
  const peak = peakVolumeHour(overview.timeSeries);
  const totalRolling = sumBucketTotals(overview.timeSeries);
  const topRoutes = overview.routeUsage.slice(0, 4);
  const mix = overview.activityCounts;

  const sectionDivider = "border-t border-line pt-5";
  const showTabs = automations.length > 0 || recentImports.length > 0;

  return (
    <div className="grid gap-5">
      {showTabs ? (
        <section className="grid gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="m-0 font-serif text-2xl font-medium tracking-[-0.03em] text-ink">
              Activity
            </h2>
            <div className="flex items-center border border-line">
              <SidebarSegment
                active={sidebarTab === "automations"}
                count={activeAutomations.length}
                label="Automations"
                onClick={() => setSidebarTab("automations")}
              />
              <SidebarSegment
                active={sidebarTab === "imports"}
                count={recentImports.length}
                label="Imports"
                onClick={() => setSidebarTab("imports")}
              />
            </div>
          </div>

          {sidebarTab === "automations" ? (
            automations.length > 0 ? (
              <AutomationCalendar automations={automations} onEditAutomation={onEditAutomation} skillMap={skillMap} variant="sidebar" />
            ) : (
              <EmptyCard className="border-dashed py-4 text-sm">No automations configured yet.</EmptyCard>
            )
          ) : (
            <div className="grid gap-4">
              <ImportSourcesList />
              <CollapsibleImports imports={recentImports} />
            </div>
          )}
        </section>
      ) : null}

      <section className={sectionDivider}>
        <ActivityUsageToolbar overview={overview} />
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <h3 className="m-0 font-serif text-lg font-medium leading-snug tracking-[-0.02em] text-ink">
              Event volume – 24h
            </h3>
            {peak ? (
              <p className="m-0 text-xs leading-relaxed text-ink-muted">
                Peak <span className="tabular-nums">{peak.label}</span> ·{" "}
                <span className="tabular-nums">{peak.count}</span> events · hover the chart for hourly
                detail
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-[0.62rem] text-ink-faint">
            <Tip content="All events: views, interactions, and API calls" side="top">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-3 rounded-full bg-accent" />
                total
              </span>
            </Tip>
            <Tip content="API calls only (skill endpoints)" side="top">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-0.5 w-3 rounded-full"
                  style={{ background: "var(--color-ink-faint)", opacity: 0.55 }}
                />
                api
              </span>
            </Tip>
          </div>
        </div>
        {hasEvents ? (
          <div className="-mx-1">
            <AreaChart id="home-events-sidebar" data={areaData} height={152} />
          </div>
        ) : (
          <EmptyCard className="rounded-none border-dashed py-5 text-sm">
            No events in the last 24 hours.
          </EmptyCard>
        )}
      </section>

      <section className={sectionDivider}>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-none border border-line bg-line/60 dark:bg-line/40">
          <StatTile
            className="border-0 rounded-none bg-paper-3 dark:bg-paper-2/90"
            delta={deltas.pageViews}
            label="views"
            size="compact"
            value={tileValues.pageViews}
            sparkData={viewsSpark}
          />
          <StatTile
            className="border-0 rounded-none bg-paper-3 dark:bg-paper-2/90"
            delta={deltas.interactions}
            label="interactions"
            size="compact"
            value={tileValues.interactions}
            sparkData={interactionsSpark}
          />
          <StatTile
            className="border-0 rounded-none bg-paper-3 dark:bg-paper-2/90"
            delta={deltas.apiCalls}
            label="api calls"
            size="compact"
            value={tileValues.apiCalls}
            sparkData={apiSpark}
          />
          <StatTile
            className="border-0 rounded-none bg-paper-3 dark:bg-paper-2/90"
            delta={deltas.avgApiDurationMs}
            label="avg api ms"
            size="compact"
            value={tileValues.avgApiDurationMs || "0"}
            sparkData={latencySpark}
          />
        </div>

        <div className="mt-5 grid gap-3 rounded-none border border-line/90 bg-paper-3 p-3 dark:bg-black/20">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="min-w-0 space-y-0.5">
              <p className={cn(inlineSectionLabel, "m-0")}>24h volume</p>
              <p className="m-0 font-semibold tabular-nums text-ink">{totalRolling}</p>
              <p className="m-0 text-xs leading-snug text-ink-soft">Events in hourly buckets</p>
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className={cn(inlineSectionLabel, "m-0")}>Peak hour</p>
              {peak ? (
                <>
                  <p className="m-0 font-semibold tabular-nums text-ink">
                    {peak.label}{" "}
                    <span className="font-medium text-ink-soft">· {peak.count}</span>
                  </p>
                  <p className="m-0 text-xs leading-snug text-ink-soft">Busiest single hour</p>
                </>
              ) : (
                <p className="m-0 text-ink-soft">No volume yet</p>
              )}
            </div>
            <div className="col-span-2 min-w-0 space-y-0.5 border-t border-line/70 pt-2">
              <p className={cn(inlineSectionLabel, "m-0")}>API health</p>
              <p className="m-0 tabular-nums text-ink">
                {overview.totalsRolling24h.errorCalls} error
                {overview.totalsRolling24h.errorCalls !== 1 ? "s" : ""}
                <span className="text-ink-soft">
                  {" "}
                  · {overview.totalsRolling24h.apiCalls} calls
                </span>
              </p>
            </div>
          </div>

          {topRoutes.length > 0 ? (
            <div className="space-y-1.5 border-t border-line/70 pt-3">
              <p className={cn(inlineSectionLabel, "m-0 font-semibold text-ink")}>Top routes</p>
              <ul className="m-0 grid list-none gap-1.5 p-0">
                {topRoutes.map((r) => (
                  <li
                    className="flex min-w-0 items-baseline justify-between gap-2 text-[0.7rem] leading-snug"
                    key={r.route}
                  >
                    <Tip content={r.route} side="left">
                      <span className="min-w-0 truncate text-ink-soft">
                        {truncateRouteLabel(r.route)}
                      </span>
                    </Tip>
                    <span className="shrink-0 tabular-nums text-ink">
                      {r.count}
                      {r.errorCount > 0 ? (
                        <span className="text-ink-faint"> · {r.errorCount} err</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {mix.length > 0 ? (
            <div className="space-y-1.5 border-t border-line/70 pt-3">
              <p className={cn(inlineSectionLabel, "m-0 font-semibold text-ink")}>Activity mix</p>
              <div className="flex flex-wrap gap-1.5">
                {mix.map((item) => (
                  <span
                    className="inline-flex items-center gap-1 rounded-none border border-line/80 bg-paper-3 px-2 py-0.5 text-[0.65rem] tabular-nums text-ink-soft dark:bg-paper-2/80"
                    key={item.label}
                  >
                    <span className="font-medium text-ink">{item.count}</span>
                    <span className="text-ink-faint">{item.label}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function linkedSkillProps(
  automation: AutomationSummary,
  skillMap?: Map<string, SkillRecord>,
): { skillSlug?: string; skillIconUrl?: string | null; skillName?: string } {
  const slug = automation.matchedSkillSlugs[0];
  if (!slug || !skillMap) return {};
  const skill = skillMap.get(slug);
  if (!skill) return {};
  return { skillSlug: skill.slug, skillIconUrl: skill.iconUrl, skillName: skill.title };
}

function hasRollingUsage(overview: UsageOverview): boolean {
  return (
    overview.totalsRolling24h.pageViews +
      overview.totalsRolling24h.interactions +
      overview.totalsRolling24h.apiCalls >
    0
  );
}

export function shouldShowActivityDashboard(
  overview: UsageOverview,
  automations: AutomationSummary[],
  recentImports?: RecentImportItem[]
): boolean {
  return hasRollingUsage(overview) || automations.length > 0 || (recentImports?.length ?? 0) > 0;
}

export function ActivityDashboard({
  overview,
  automations,
  recentImports = [],
  skillMap,
  variant = "default",
}: ActivityDashboardProps) {
  const mode = useUsageComparisonMode();
  const tileValues = usageStatTileValues(overview, mode);
  const deltas = overview.comparisons[mode];
  const [editTarget, setEditTarget] = useState<AutomationSummary | null>(null);

  const viewsSpark = overview.timeSeries.map((b) => b.views);
  const interactionsSpark = overview.timeSeries.map((b) => b.interactions);
  const apiSpark = overview.timeSeries.map((b) => b.api);
  const latencySpark = overview.latencySeries.map((b) => b.avgMs);

  const areaData = overview.timeSeries.map((b) => ({
    label: b.label,
    value: b.total,
    secondary: b.api,
  }));

  const activeAutomations = automations.filter((a) => a.status === "ACTIVE");
  const hasEvents = hasRollingUsage(overview);

  if (!shouldShowActivityDashboard(overview, automations)) return null;

  const isSidebar = variant === "sidebar";

  if (isSidebar) {
    return (
      <>
        <ActivitySidebarView
          activeAutomations={activeAutomations}
          apiSpark={apiSpark}
          areaData={areaData}
          automations={automations}
          deltas={deltas}
          hasEvents={hasEvents}
          interactionsSpark={interactionsSpark}
          latencySpark={latencySpark}
          onEditAutomation={setEditTarget}
          overview={overview}
          recentImports={recentImports}
          skillMap={skillMap}
          tileValues={tileValues}
          viewsSpark={viewsSpark}
        />
        {editTarget && (
          <AutomationEditModal
            automation={editTarget}
            initialPreferredHour={editTarget.preferredHour}
            onClose={() => setEditTarget(null)}
            open
            {...linkedSkillProps(editTarget, skillMap)}
          />
        )}
      </>
    );
  }

  return (
    <Panel square>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-none border border-line bg-line/60 dark:bg-line/40 lg:grid-cols-4">
        <StatTile
          className="border-0 rounded-none bg-paper-3 dark:bg-paper-2/90"
          delta={deltas.pageViews}
          label="views"
          value={tileValues.pageViews}
          sparkData={viewsSpark}
        />
        <StatTile
          className="border-0 rounded-none bg-paper-3 dark:bg-paper-2/90"
          delta={deltas.interactions}
          label="interactions"
          value={tileValues.interactions}
          sparkData={interactionsSpark}
        />
        <StatTile
          className="border-0 rounded-none bg-paper-3 dark:bg-paper-2/90"
          delta={deltas.apiCalls}
          label="api calls"
          value={tileValues.apiCalls}
          sparkData={apiSpark}
        />
        <StatTile
          className="border-0 rounded-none bg-paper-3 dark:bg-paper-2/90"
          delta={deltas.avgApiDurationMs}
          label="avg api ms"
          value={tileValues.avgApiDurationMs || "0"}
          sparkData={latencySpark}
        />
      </div>

      <div
        className={cn(
          "grid items-stretch gap-px overflow-hidden rounded-none border border-line bg-line/60 dark:bg-line/40",
          automations.length > 0 && "lg:grid-cols-[minmax(0,1fr)_320px]"
        )}
      >
        <article
          className={cn(
            "grid gap-3.5 border-0 bg-paper-3 p-4 dark:bg-paper-2/90",
            automations.length > 0 && "lg:border-r lg:border-line"
          )}
        >
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="m-0 font-serif text-lg font-medium leading-snug tracking-[-0.02em] text-ink">
                Event volume – 24h
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[0.65rem] text-ink-faint">
              <Tip content="All events: views, interactions, and API calls" side="top">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-3 rounded-full bg-accent" />
                  total
                </span>
              </Tip>
              <Tip content="API calls only (skill endpoints)" side="top">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-0.5 w-3 rounded-full"
                    style={{ background: "var(--color-ink-faint)", opacity: 0.5 }}
                  />
                  api
                </span>
              </Tip>
            </div>
          </div>
          {hasEvents ? (
            <AreaChart id="home-events" data={areaData} />
          ) : (
            <EmptyCard className="border-line/80 bg-transparent">No events in the last 24 hours.</EmptyCard>
          )}
        </article>

        {automations.length > 0 ? (
          <article className="grid gap-3.5 border-0 bg-paper-3 p-4 dark:bg-paper-2/90">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="m-0 font-serif text-lg font-medium leading-snug tracking-[-0.02em] text-ink">
                  Automations
                </h3>
              </div>
              <Tip content={activeAutomations.length > 0 ? `${activeAutomations.length} automation${activeAutomations.length !== 1 ? "s" : ""} running on schedule` : "No automations currently enabled"} side="left">
                <span className="flex items-center gap-1.5 text-xs text-ink-faint">
                  <StatusDot
                    tone={activeAutomations.length > 0 ? "fresh" : "idle"}
                    pulse={activeAutomations.length > 0}
                  />
                  {activeAutomations.length} active
                </span>
              </Tip>
            </div>
            <AutomationCalendar automations={automations} onEditAutomation={setEditTarget} skillMap={skillMap} />
          </article>
        ) : null}
      </div>

      {editTarget && (
        <AutomationEditModal
          automation={editTarget}
          initialPreferredHour={editTarget.preferredHour}
          onClose={() => setEditTarget(null)}
          open
          {...linkedSkillProps(editTarget, skillMap)}
        />
      )}
    </Panel>
  );
}
