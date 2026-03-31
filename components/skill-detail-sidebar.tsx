import { DiffViewer } from "@/components/diff-viewer";
import { PulseIcon, RefreshIcon, SearchIcon, SparkIcon } from "@/components/frontier-icons";
import { SidebarAutomationsPanel } from "@/components/sidebar-automations-panel";
import { SkillObservabilityPanel } from "@/components/observability-panels";
import { UseSkillPanel } from "@/components/use-skill-panel";
import { VersionTimeline } from "@/components/version-timeline";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHead } from "@/components/ui/panel";
import { SimpleList, SimpleListBody, SimpleListIcon, SimpleListItem, SimpleListRow } from "@/components/ui/simple-list";
import { cn } from "@/lib/cn";
import { formatRelativeDate } from "@/lib/format";
import type { AutomationSummary, DiffLine, LoopRunRecord, SkillUpdateEntry, VersionReference } from "@/lib/types";
import type { SkillUsageSummary } from "@/lib/usage";

const sidebarTitle = "m-0 text-sm font-semibold tracking-tight text-ink";
const metaLabel = "text-[0.65rem] font-medium uppercase tracking-[0.08em] text-ink-soft";
const metaValue = "text-sm font-semibold tracking-[-0.03em]";

type SkillDetailSidebarProps = {
  slug: string;
  currentVersion: number;
  skillHref: string;
  agentPrompt: string;
  versions: VersionReference[];
  latestRun?: LoopRunRecord | null;
  latestUpdate?: SkillUpdateEntry;
  visibleChangedSections: string[];
  diffLines: DiffLine[];
  rawDiffLength: number;
  updates?: SkillUpdateEntry[];
  automations: AutomationSummary[];
  usage: SkillUsageSummary;
};

function formatTriggerLabel(trigger: LoopRunRecord["trigger"]): string {
  switch (trigger) {
    case "manual":
      return "Manual";
    case "automation":
      return "Automation";
    case "import-sync":
      return "Import sync";
    default:
      return trigger;
  }
}

function formatDuration(startedAt: string, finishedAt: string): string {
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function SkillDetailSidebar({
  slug,
  currentVersion,
  skillHref,
  agentPrompt,
  versions,
  latestRun,
  latestUpdate,
  visibleChangedSections,
  diffLines,
  rawDiffLength,
  updates,
  automations,
  usage
}: SkillDetailSidebarProps) {
  return (
    <aside className="grid content-start gap-4">
      <UseSkillPanel
        agentPrompt={agentPrompt}
        skillHref={skillHref}
        slug={slug}
      />

      <SkillObservabilityPanel usage={usage} />

      <VersionTimeline
        currentVersion={currentVersion}
        slug={slug}
        versions={versions}
      />

      {latestUpdate || latestRun ? (
        <LatestRefreshPanel
          latestRun={latestRun}
          latestUpdate={latestUpdate}
          visibleChangedSections={visibleChangedSections}
        />
      ) : null}

      {diffLines.length > 0 ? (
        <Panel compact square>
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
              <h3 className={sidebarTitle}>Diff</h3>
              <span className="ml-auto text-xs text-ink-muted transition-transform group-open:rotate-90">▶</span>
            </summary>
            <div className="mt-3">
              <DiffViewer
                compact
                lines={diffLines}
                maxHeight={360}
                truncatedTotal={rawDiffLength > diffLines.length ? rawDiffLength : undefined}
              />
            </div>
          </details>
        </Panel>
      ) : null}

      {updates && updates.length > 1 ? (
        <Panel compact square>
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
              <h3 className={sidebarTitle}>Update history</h3>
              <Badge color="blue">{updates.length}</Badge>
              <span className="ml-auto text-xs text-ink-muted transition-transform group-open:rotate-90">▶</span>
            </summary>
            <SimpleList tight className="mt-3">
              {updates.map((entry) => (
                <SimpleListItem key={entry.generatedAt}>
                  <SimpleListIcon>
                    <PulseIcon />
                  </SimpleListIcon>
                  <SimpleListBody>
                    <SimpleListRow>
                      <strong className="text-ink">
                        {formatRelativeDate(entry.generatedAt)}
                      </strong>
                      <span className="text-xs text-ink-soft">
                        {entry.items.length} sources
                      </span>
                    </SimpleListRow>
                    <p className="m-0 text-xs text-ink-soft">
                      {entry.summary}
                    </p>
                  </SimpleListBody>
                </SimpleListItem>
              ))}
            </SimpleList>
          </details>
        </Panel>
      ) : null}

      {automations.length > 0 ? (
        <SidebarAutomationsPanel automations={automations} />
      ) : null}
    </aside>
  );
}

type LatestRefreshPanelProps = {
  latestRun?: LoopRunRecord | null;
  latestUpdate?: SkillUpdateEntry;
  visibleChangedSections: string[];
};

function LatestRefreshPanel({
  latestRun,
  latestUpdate,
  visibleChangedSections
}: LatestRefreshPanelProps) {
  const hasHighlights =
    latestUpdate?.whatChanged ||
    visibleChangedSections.length > 0 ||
    (latestRun && (latestRun.sourceCount > 0 || latestRun.signalCount > 0));

  return (
    <Panel compact square className="overflow-hidden">
      <div className="dither-gradient-orange -mx-4 -mt-4 mb-4 px-4 pb-4 pt-4">
        <PanelHead>
          <div className="flex items-center gap-2">
            <RefreshIcon className="h-3.5 w-3.5 text-accent" />
            <h3 className={sidebarTitle}>Latest refresh</h3>
          </div>
          {latestUpdate ? (
            <Badge color="neutral">{formatRelativeDate(latestUpdate.generatedAt)}</Badge>
          ) : null}
        </PanelHead>

        {latestUpdate ? (
          <p className="m-0 mt-3 text-sm font-medium leading-relaxed text-ink">
            {latestUpdate.summary}
          </p>
        ) : null}
      </div>

      {hasHighlights ? (
        <div className="grid gap-3">
          {latestUpdate?.whatChanged ? (
            <div className="rounded-none border border-line bg-paper-3/90 px-3.5 py-3 dark:bg-paper-2/40">
              <small className={metaLabel}>what changed</small>
              <p className="m-0 mt-1 text-sm leading-relaxed text-ink-soft">
                {latestUpdate.whatChanged}
              </p>
            </div>
          ) : null}

          {latestRun && (latestRun.sourceCount > 0 || latestRun.signalCount > 0) ? (
            <div className="flex flex-wrap gap-2">
              {latestRun.sourceCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-none border border-accent/25 bg-accent/8 px-2.5 py-1 text-xs font-medium text-accent">
                  <SearchIcon className="h-3 w-3" />
                  {latestRun.sourceCount} sources scanned
                </span>
              ) : null}
              {latestRun.signalCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-none border border-accent/25 bg-accent/8 px-2.5 py-1 text-xs font-medium text-accent">
                  <SparkIcon className="h-3 w-3" />
                  {latestRun.signalCount} signals found
                </span>
              ) : null}
            </div>
          ) : null}

          {visibleChangedSections.length > 0 ? (
            <div>
              <small className={cn(metaLabel, "mb-1.5 block")}>sections updated</small>
              <div className="flex flex-wrap gap-1.5">
                {visibleChangedSections.map((section) => (
                  <span
                    className="rounded-none border border-line bg-paper-2/90 px-2 py-0.5 text-[0.7rem] font-medium text-ink-soft dark:bg-paper-2/50"
                    key={section}
                  >
                    {section}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {latestRun ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-0.5 rounded-none border border-line bg-paper-3/90 px-3 py-2 dark:bg-paper-2/40">
            <small className={metaLabel}>status</small>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  latestRun.status === "error" ? "bg-danger" : "bg-accent"
                )}
              />
              <strong className={cn(metaValue, latestRun.status === "error" && "text-danger")}>
                {latestRun.status}
              </strong>
            </div>
          </div>
          <div className="grid gap-0.5 rounded-none border border-line bg-paper-3/90 px-3 py-2 dark:bg-paper-2/40">
            <small className={metaLabel}>trigger</small>
            <strong className={metaValue}>{formatTriggerLabel(latestRun.trigger)}</strong>
          </div>
          <div className="grid gap-0.5 rounded-none border border-line bg-paper-3/90 px-3 py-2 dark:bg-paper-2/40">
            <small className={metaLabel}>editor</small>
            <strong className={cn(metaValue, "truncate")}>{latestRun.editorModel ?? "—"}</strong>
          </div>
          <div className="grid gap-0.5 rounded-none border border-line bg-paper-3/90 px-3 py-2 dark:bg-paper-2/40">
            <small className={metaLabel}>duration</small>
            <strong className={metaValue}>
              {formatDuration(latestRun.startedAt, latestRun.finishedAt)}
            </strong>
          </div>
        </div>
      ) : null}

      {latestRun ? (
        <a className="text-xs font-medium text-accent hover:underline" href="#run-log">
          Jump to run log &darr;
        </a>
      ) : null}
    </Panel>
  );
}
