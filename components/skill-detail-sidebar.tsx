import { DiffViewer } from "@/components/diff-viewer";
import { LinkIcon, PlusIcon, RefreshIcon, SearchIcon, SparkIcon } from "@/components/frontier-icons";
import { OpenRunLogButton } from "@/components/open-run-log-button";
import { SidebarAutomationsPanel } from "@/components/sidebar-automations-panel";
import { SkillInstallPanel } from "@/components/skill-install-panel";
import { SkillObservabilityPanel } from "@/components/observability-panels";
import { VersionTimeline } from "@/components/version-timeline";
import { Badge } from "@/components/ui/badge";
import { FileTree, type FileTreeEntry } from "@/components/ui/file-tree";
import { PanelHead } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import { formatRelativeDate } from "@/lib/format";
import type { AgentDocs, AutomationSummary, DiffLine, LoopRunRecord, SkillRecord, SkillUpdateEntry, VersionReference } from "@/lib/types";
import type { SkillUsageSummary } from "@/lib/usage";

const sidebarSectionLabel =
  "flex items-center gap-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-ink-faint";
const sidebarTitle = "m-0 text-sm font-semibold tracking-tight text-ink";
const metaLabel = "text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-ink-faint";
const metaValue = "text-sm font-semibold tracking-[-0.03em]";

type SkillDetailSidebarProps = {
  slug: string;
  currentVersion: number;
  skillHref: string;
  agentPrompt: string;
  rawUrl: string;
  body: string;
  downloadFilename: string;
  agentDocs?: AgentDocs;
  versions: VersionReference[];
  latestRun?: LoopRunRecord | null;
  latestUpdate?: SkillUpdateEntry;
  visibleChangedSections: string[];
  diffLines: DiffLine[];
  rawDiffLength: number;
  updates?: SkillUpdateEntry[];
  automations: AutomationSummary[];
  usage: SkillUsageSummary;
  skills?: SkillRecord[];
  timeZone?: string;
};

function buildAgentFileTree(agentDocs?: AgentDocs): FileTreeEntry[] {
  const entries: FileTreeEntry[] = [
    { name: "SKILL.md", type: "file", icon: "markdown" },
  ];

  if (agentDocs) {
    for (const key of Object.keys(agentDocs)) {
      const content = agentDocs[key];
      if (content && content.trim().length > 0) {
        const filename =
          key === "agents" ? "AGENTS.md" :
          key === "cursor" ? "CURSOR.md" :
          key === "claude" ? "CLAUDE.md" :
          key === "codex" ? "CODEX.md" :
          `${key.toUpperCase()}.md`;
        entries.push({ name: filename, type: "file", icon: "markdown" });
      }
    }
  }

  return entries;
}

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
  rawUrl,
  body,
  downloadFilename,
  agentDocs,
  versions,
  latestRun,
  latestUpdate,
  visibleChangedSections,
  diffLines,
  rawDiffLength,
  updates,
  automations,
  usage,
  skills = [],
  timeZone,
}: SkillDetailSidebarProps) {
  const fileTreeEntries = buildAgentFileTree(agentDocs);

  const hasChanges =
    (latestUpdate || latestRun) || diffLines.length > 0 || (updates && updates.length > 1);

  return (
    <aside className="grid content-start gap-6">
      {/* ── Install ── */}
      <SkillInstallPanel
        agentDocs={agentDocs}
        agentPrompt={agentPrompt}
        body={body}
        downloadFilename={downloadFilename}
        rawUrl={rawUrl}
        skillHref={skillHref}
        slug={slug}
      />

      {/* ── Versions & structure ── */}
      <section className="grid gap-3">
        <VersionTimeline
          currentVersion={currentVersion}
          slug={slug}
          timeZone={timeZone}
          versions={versions}
        />
        {fileTreeEntries.length > 0 && (
          <div className="border-t border-line/60 pt-3 dark:border-line/40">
            <div className="mb-2 flex items-center justify-between">
              <span className={sidebarSectionLabel}>Included files</span>
              <span className="text-[0.625rem] tabular-nums text-ink-faint">
                {fileTreeEntries.length}
              </span>
            </div>
            <FileTree className="border-0 bg-transparent px-0 py-0 dark:bg-transparent" entries={fileTreeEntries} />
          </div>
        )}
      </section>

      {/* ── Changes (latest refresh + diff + history) ── */}
      {hasChanges && (
        <section className="grid gap-0 overflow-hidden border border-line">
          {(latestUpdate || latestRun) && (
            <LatestRefreshPanel
              latestRun={latestRun}
              latestUpdate={latestUpdate}
              timeZone={timeZone}
              visibleChangedSections={visibleChangedSections}
            />
          )}

          {diffLines.length > 0 && (
            <details className="group border-t border-line/60 dark:border-line/40">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 bg-paper-3 px-3 py-2.5 transition-colors hover:bg-paper-2/40 dark:bg-paper-2/60 dark:hover:bg-paper-3/40 [&::-webkit-details-marker]:hidden">
                <span className={sidebarSectionLabel}>Diff</span>
                <span className="text-[0.5rem] text-ink-faint transition-transform group-open:rotate-90">▶</span>
              </summary>
              <div className="border-t border-line/40 bg-paper-3 px-3 pb-3 pt-2 dark:bg-paper-2/40">
                <DiffViewer
                  compact
                  lines={diffLines}
                  maxHeight={360}
                  truncatedTotal={rawDiffLength > diffLines.length ? rawDiffLength : undefined}
                />
              </div>
            </details>
          )}

          {updates && updates.length > 0 && (
            <details className="group border-t border-line/60 dark:border-line/40">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 bg-paper-3 px-3 py-2.5 transition-colors hover:bg-paper-2/40 dark:bg-paper-2/60 dark:hover:bg-paper-3/40 [&::-webkit-details-marker]:hidden">
                <span className={cn(sidebarSectionLabel, "gap-2")}>
                  Update history
                  <span className="tabular-nums text-ink-faint">{updates.length}</span>
                </span>
                <span className="text-[0.5rem] text-ink-faint transition-transform group-open:rotate-90">▶</span>
              </summary>
              <div className="grid gap-0 border-t border-line/40 dark:border-line/30">
                {updates.map((entry) => (
                  <div
                    className="grid gap-1 border-b border-line/30 bg-paper-3 px-3 py-2.5 last:border-b-0 dark:bg-paper-2/40"
                    key={entry.generatedAt}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[0.6875rem] font-semibold tabular-nums text-ink">
                        {formatRelativeDate(entry.generatedAt, timeZone)}
                      </span>
                      <span className="text-[0.625rem] tabular-nums text-ink-faint">
                        {entry.items.length} source{entry.items.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="m-0 line-clamp-2 text-[0.6875rem] leading-relaxed text-ink-soft">
                      {entry.summary}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </section>
      )}

      {/* ── Automations ── */}
      {automations.length > 0 && (
        <SidebarAutomationsPanel automations={automations} skills={skills} />
      )}

      {/* ── Usage ── */}
      <SkillObservabilityPanel timeZone={timeZone} usage={usage} />
    </aside>
  );
}

type LatestRefreshPanelProps = {
  latestRun?: LoopRunRecord | null;
  latestUpdate?: SkillUpdateEntry;
  visibleChangedSections: string[];
  timeZone?: string;
};

function LatestRefreshPanel({
  latestRun,
  latestUpdate,
  timeZone,
  visibleChangedSections,
}: LatestRefreshPanelProps) {
  const hasHighlights =
    latestUpdate?.whatChanged ||
    visibleChangedSections.length > 0 ||
    (latestRun && (latestRun.sourceCount > 0 || latestRun.signalCount > 0));

  return (
    <div className="grid gap-4 bg-paper-3 dark:bg-paper-2/60">
      <div className="dither-gradient-orange px-4 pb-3 pt-4">
        <PanelHead>
          <div className="flex items-center gap-2">
            <RefreshIcon className="h-3.5 w-3.5 text-accent" />
            <h3 className={sidebarTitle}>Latest refresh</h3>
          </div>
          {latestUpdate && (
            <Badge color="neutral" size="sm">{formatRelativeDate(latestUpdate.generatedAt, timeZone)}</Badge>
          )}
        </PanelHead>

        {latestUpdate && (
          <p className="m-0 mt-2.5 text-sm font-medium leading-relaxed text-ink">
            {latestUpdate.summary}
          </p>
        )}
      </div>

      {hasHighlights && (
        <div className="grid gap-3 px-4">
          {latestUpdate?.whatChanged && (
            <div className="border border-line/60 bg-paper-2/50 px-3.5 py-3 dark:border-line/40 dark:bg-paper-3/30">
              <small className={metaLabel}>what changed</small>
              <p className="m-0 mt-1 text-sm leading-relaxed text-ink-soft">
                {latestUpdate.whatChanged}
              </p>
            </div>
          )}

          {latestRun && (latestRun.sourceCount > 0 || latestRun.signalCount > 0 || latestRun.searchesUsed || latestRun.addedSources?.length) && (
            <div className="flex flex-wrap gap-1.5">
              {latestRun.sourceCount > 0 && (
                <span className="inline-flex items-center gap-1.5 border border-accent/20 bg-accent/6 px-2 py-0.5 text-[0.6875rem] font-medium text-accent">
                  <SearchIcon className="h-3 w-3" />
                  {latestRun.sourceCount} sources scanned
                </span>
              )}
              {latestRun.signalCount > 0 && (
                <span className="inline-flex items-center gap-1.5 border border-accent/20 bg-accent/6 px-2 py-0.5 text-[0.6875rem] font-medium text-accent">
                  <SparkIcon className="h-3 w-3" />
                  {latestRun.signalCount} signals found
                </span>
              )}
              {(latestRun.searchesUsed ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 border border-sky-500/20 bg-sky-500/6 px-2 py-0.5 text-[0.6875rem] font-medium text-sky-600 dark:text-sky-400">
                  <LinkIcon className="h-3 w-3" />
                  {latestRun.searchesUsed} web search{latestRun.searchesUsed === 1 ? "" : "es"}
                </span>
              )}
              {(latestRun.addedSources?.length ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 border border-emerald-500/20 bg-emerald-500/6 px-2 py-0.5 text-[0.6875rem] font-medium text-emerald-600 dark:text-emerald-400">
                  <PlusIcon className="h-3 w-3" />
                  {latestRun.addedSources!.length} source{latestRun.addedSources!.length === 1 ? "" : "s"} discovered
                </span>
              )}
            </div>
          )}

          {visibleChangedSections.length > 0 && (
            <div>
              <small className={cn(metaLabel, "mb-1.5 block")}>sections updated</small>
              <div className="flex flex-wrap gap-1">
                {visibleChangedSections.map((section) => (
                  <span
                    className="border border-line/50 bg-paper-2/80 px-2 py-0.5 text-[0.65rem] font-medium text-ink-soft dark:border-line/40 dark:bg-paper-3/40"
                    key={section}
                  >
                    {section}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {latestRun && (
        <div className="grid grid-cols-2 gap-px overflow-hidden border-t border-line/60 bg-line/50 dark:border-line/40 dark:bg-line/30">
          <div className="grid gap-0.5 bg-paper-3 px-3 py-2 dark:bg-paper-2/60">
            <small className={metaLabel}>status</small>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  latestRun.status === "error" ? "bg-danger" : "bg-success"
                )}
              />
              <strong className={cn(metaValue, latestRun.status === "error" && "text-danger")}>
                {latestRun.status}
              </strong>
            </div>
          </div>
          <div className="grid gap-0.5 bg-paper-3 px-3 py-2 dark:bg-paper-2/60">
            <small className={metaLabel}>trigger</small>
            <strong className={metaValue}>{formatTriggerLabel(latestRun.trigger)}</strong>
          </div>
          <div className="grid gap-0.5 bg-paper-3 px-3 py-2 dark:bg-paper-2/60">
            <small className={metaLabel}>editor</small>
            <strong className={cn(metaValue, "truncate")}>{latestRun.editorModel ?? "–"}</strong>
          </div>
          <div className="grid gap-0.5 bg-paper-3 px-3 py-2 dark:bg-paper-2/60">
            <small className={metaLabel}>duration</small>
            <strong className={metaValue}>
              {formatDuration(latestRun.startedAt, latestRun.finishedAt)}
            </strong>
          </div>
        </div>
      )}

      {latestRun && (
        <div className="px-4 pb-4">
          <OpenRunLogButton>
            <RefreshIcon className="h-3 w-3" />
            View full run log
          </OpenRunLogButton>
        </div>
      )}
    </div>
  );
}
