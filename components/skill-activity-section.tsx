"use client";

import { useMemo, useState } from "react";

import { AutomationCalendar } from "@/components/automation-calendar";
import { AutomationEditModal } from "@/components/automation-edit-modal";
import { DiffViewer } from "@/components/diff-viewer";
import {
  AutomationIcon,
  ClockIcon,
  RefreshIcon,
  SearchIcon,
  SettingsIcon,
  SparkIcon,
} from "@/components/frontier-icons";
import { InlineAutomationSetup } from "@/components/inline-automation-setup";
import { RunLogModal } from "@/components/run-log-modal";
import { TrackSkillButton } from "@/components/track-skill-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyCard } from "@/components/ui/empty-card";
import { LinkButton } from "@/components/ui/link-button";
import { Panel, PanelHead } from "@/components/ui/panel";
import { Tip } from "@/components/ui/tip";
import { cn } from "@/lib/cn";
import { countMonthlyRuns, formatNextRun } from "@/lib/schedule";
import type {
  AutomationSummary,
  CategorySlug,
  DiffLine,
  LoopRunRecord,
  LoopUpdateSourceLog,
  SkillOrigin,
  SkillRecord,
  SourceDefinition,
} from "@/lib/types";

type SkillActivitySectionProps = {
  slug: string;
  skillTitle: string;
  iconUrl?: string | null;
  category?: CategorySlug;
  origin: SkillOrigin;
  sourceCount: number;
  automation?: AutomationSummary;
  latestRun?: LoopRunRecord | null;
  canManage?: boolean;
  sources?: SourceDefinition[];
};

function MetricCard({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-1 rounded-none border px-3.5 py-3",
        accent
          ? "border-accent/20 bg-accent/8"
          : "border-line bg-paper-3/90 dark:bg-paper-2/40",
      )}
    >
      <span className="flex items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-[0.08em] text-ink-soft">
        {icon}
        {label}
      </span>
      <strong className="text-sm font-semibold tracking-[-0.03em] text-ink">
        {value}
      </strong>
    </div>
  );
}

function PromptPreview({ prompt }: { prompt?: string }) {
  if (!prompt?.trim()) {
    return (
      <div className="rounded-none border border-dashed border-line bg-paper-3/70 px-4 py-3 text-sm text-ink-soft dark:bg-paper-2/30">
        No automation brief yet. Add one in Studio so refreshes optimize for the right deltas.
      </div>
    );
  }

  return (
    <div className="rounded-none border border-line bg-paper-3/90 px-4 py-3 dark:bg-paper-2/40">
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
        Automation brief
      </span>
      <p className="m-0 mt-2 line-clamp-4 text-sm leading-relaxed text-ink-soft">
        {prompt}
      </p>
    </div>
  );
}

function formatTriggerLabel(trigger: LoopRunRecord["trigger"]): string {
  switch (trigger) {
    case "manual": return "Manual";
    case "automation": return "Automation";
    case "import-sync": return "Import sync";
    default: return trigger;
  }
}

function formatDuration(startedAt: string, finishedAt: string): string {
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const statBox = "grid gap-1 rounded-2xl border border-line bg-paper-3 p-4";
const statLabel = "text-xs font-medium uppercase tracking-[0.08em] text-ink-soft";
const statValue = "text-sm font-semibold tracking-[-0.03em]";

function RunMetadataBar({
  trigger,
  editorModel,
  startedAt,
  finishedAt,
  status,
}: {
  trigger: string;
  editorModel: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  status: "success" | "error" | "running";
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className={statBox}>
        <small className={statLabel}>trigger</small>
        <strong className={statValue}>{trigger}</strong>
      </div>
      <div className={statBox}>
        <small className={statLabel}>editor</small>
        <strong className={statValue}>{editorModel ?? "pending"}</strong>
      </div>
      <div className={statBox}>
        <small className={statLabel}>duration</small>
        <strong className={statValue}>
          {startedAt && finishedAt ? formatDuration(startedAt, finishedAt) : "—"}
        </strong>
      </div>
      <div className={statBox}>
        <small className={statLabel}>status</small>
        <strong
          className={cn(
            statValue,
            status === "error" && "text-danger",
            status === "running" && "text-warning",
          )}
        >
          {status}
        </strong>
      </div>
    </div>
  );
}

function SourceCard({ source }: { source: LoopUpdateSourceLog }) {
  const statusColor =
    source.status === "done" ? "bg-success" :
    source.status === "running" ? "animate-pulse bg-warning" :
    source.status === "error" ? "bg-danger" :
    "bg-line-strong";

  return (
    <article className="grid gap-1.5 rounded-xl border border-line bg-paper-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={cn("flex h-2.5 w-2.5 shrink-0 rounded-full", statusColor)} />
        <strong className="text-sm text-ink">{source.label}</strong>
        <span className="ml-auto text-xs text-ink-faint">{source.status}</span>
      </div>
      <p className="m-0 text-sm text-ink-soft">{source.note ?? `${source.itemCount} items found.`}</p>
      {source.items.length > 0 ? (
        <div className="grid gap-1">
          {source.items.slice(0, 3).map((item) => (
            <a
              className="text-xs font-medium text-ink hover:text-ink-soft"
              href={item.url}
              key={item.url}
              rel="noreferrer"
              target="_blank"
            >
              {item.title}
            </a>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function StepLog({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;

  return (
    <div className="grid gap-0">
      {messages.map((message, index) => (
        <article
          className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-t border-line py-3 first:border-t-0 first:pt-0"
          key={`${message}-${index}`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-paper-3 text-ink-soft [&>svg]:h-3.5 [&>svg]:w-3.5">
            <AutomationIcon />
          </div>
          <div className="grid gap-0.5 pt-1">
            <span className="text-xs font-medium text-ink-faint">Step {index + 1}</span>
            <span className="text-sm text-ink-soft">{message}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

export function SkillActivitySection({
  slug,
  skillTitle,
  iconUrl,
  category,
  origin,
  sourceCount,
  automation,
  latestRun,
  canManage = false,
  sources = [],
}: SkillActivitySectionProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const isTracked = origin === "user";
  const isActive = automation?.status === "ACTIVE";
  const now = useMemo(() => new Date(), []);

  const skillMap = useMemo(
    () => new Map([[slug, { slug, iconUrl, category } as SkillRecord]]),
    [slug, iconUrl, category],
  );
  const monthlyRuns = automation
    ? countMonthlyRuns(automation.cadence, now.getFullYear(), now.getMonth(), automation.preferredDay)
    : 0;
  const nextRun = automation ? formatNextRun(automation.cadence, automation.preferredHour ?? 12, automation.preferredDay) : "On demand";
  const scheduleLabel = automation?.schedule?.trim() || "Manual only";

  const runMessages = latestRun?.messages ?? [];
  const runSourceLogs = latestRun?.sources ?? [];
  const runReasoningSteps = latestRun?.reasoningSteps ?? [];
  const runError = latestRun?.errorMessage ?? null;
  const runDiffLines: DiffLine[] = latestRun?.diffLines ?? [];
  const runTrigger = latestRun ? formatTriggerLabel(latestRun.trigger) : "—";
  const runEditorModel = latestRun?.editorModel ?? null;
  const runStatus: "success" | "error" | "running" =
    runError ? "error" : latestRun?.status ?? "success";
  const latestOutcomeLabel = latestRun
    ? latestRun.status === "error"
      ? "Needs attention"
      : latestRun.bodyChanged
        ? latestRun.nextVersionLabel ?? "Updated"
        : "No material diff"
    : "No runs yet";

  if (!isTracked) {
    return (
      <section className="grid gap-5 border-t border-line pt-8" id="activity">
        <h2 className="m-0 font-serif text-xl font-medium tracking-[-0.02em] text-ink">
          Activity
        </h2>
        <Panel className="overflow-hidden">
          <div className="dither-gradient-orange -mx-6 -mt-6 mb-1 px-6 pb-5 pt-6">
            <PanelHead className="items-start">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Badge color="orange">Track to unlock</Badge>
                  <Badge color="neutral">Featured on skill pages</Badge>
                </div>
                <h3 className="m-0 text-xl font-semibold tracking-tight text-ink">
                  Make this skill self-updating
                </h3>
                <p className="m-0 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
                  Tracking creates your editable fork with automation controls,
                  refresh traces, diffs, and schedule management.
                </p>
              </div>
              <TrackSkillButton
                label="Track and automate"
                redirectTo="detail"
                showFeedback
                size="sm"
                slug={slug}
                variant="primary"
              />
            </PanelHead>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              icon={<SearchIcon className="h-3 w-3" />}
              label="Source stack"
              value={`${sourceCount} tracked source${sourceCount === 1 ? "" : "s"}`}
            />
            <MetricCard
              accent
              icon={<ClockIcon className="h-3 w-3" />}
              label="Cadence"
              value="Visible on page"
            />
            <MetricCard
              icon={<RefreshIcon className="h-3 w-3" />}
              label="Refresh UX"
              value="Logs, diffs, history"
            />
          </div>
        </Panel>
      </section>
    );
  }

  return (
    <>
      <section className="grid gap-6 border-t border-line pt-8" id="activity">
        <h2 className="m-0 font-serif text-xl font-medium tracking-[-0.02em] text-ink">
          Activity
        </h2>

        {/* --- Inline setup when no automation exists --- */}
        {!automation && canManage ? (
          <InlineAutomationSetup
            skillTitle={skillTitle}
            slug={slug}
            sourceCount={sourceCount}
          />
        ) : null}

        {/* --- Automation status (shown when automation exists) --- */}
        {automation ? (
          <Panel className="overflow-hidden">
            <div className="dither-gradient-orange -mx-6 -mt-6 mb-1 px-6 pb-5 pt-6">
              <PanelHead className="items-start">
                <div className="grid gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge color={isActive ? "green" : "neutral"}>{isActive ? "Active" : "Paused"}</Badge>
                    <Badge color="neutral">{scheduleLabel}</Badge>
                    <Badge color="blue">{sourceCount} sources</Badge>
                  </div>
                  <h3 className="m-0 text-xl font-semibold tracking-tight text-ink">
                    Automation &amp; run history
                  </h3>
                  <p className="m-0 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
                    {canManage
                      ? "Schedule, traces, and diffs for this skill. Trigger new runs from Studio above."
                      : "Automation status and run history. Only the owner can trigger runs or edit the schedule."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canManage ? (
                    <Button onClick={() => setEditOpen(true)} size="sm" type="button">
                      <SettingsIcon className="h-3.5 w-3.5" />
                      Edit automation
                    </Button>
                  ) : null}
                  <LinkButton href="/settings/automations" size="sm" variant="soft">
                    <AutomationIcon className="h-3.5 w-3.5" />
                    {canManage ? "Automation desk" : "View automation desk"}
                  </LinkButton>
                </div>
              </PanelHead>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={<ClockIcon className="h-3 w-3" />}
                label="Next run"
                value={nextRun}
                accent={isActive}
              />
              <MetricCard
                icon={<RefreshIcon className="h-3 w-3" />}
                label="Schedule"
                value={scheduleLabel}
              />
              <MetricCard
                icon={<SparkIcon className="h-3 w-3" />}
                label="Runs this month"
                value={`${monthlyRuns}`}
              />
              <MetricCard
                icon={<SearchIcon className="h-3 w-3" />}
                label="Latest outcome"
                value={latestOutcomeLabel}
              />
            </div>

            {automation.cadence !== "manual" && (
              <AutomationCalendar automations={[automation]} skillMap={skillMap} variant="sidebar" />
            )}

            <PromptPreview prompt={automation.prompt} />
          </Panel>
        ) : null}

        {/* --- Latest run trace --- */}
        {runMessages.length > 0 || runSourceLogs.length > 0 ? (
          <Panel compact className="overflow-hidden">
            <PanelHead>
              <div>
                <h3 className="m-0 text-lg font-semibold tracking-tight text-ink">Latest refresh trace</h3>
                <p className="m-0 text-sm text-ink-soft">
                  Reasoning steps, source results, and the diff that landed.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {latestRun ? (
                  <Tip content="When this run completed" side="bottom">
                    <span><Badge color="neutral">{new Date(latestRun.finishedAt).toLocaleString()}</Badge></span>
                  </Tip>
                ) : null}
                <Button onClick={() => setModalOpen(true)} size="sm" type="button" variant="soft">
                  View details
                </Button>
              </div>
            </PanelHead>

            <RunMetadataBar
              editorModel={runEditorModel}
              finishedAt={latestRun?.finishedAt ?? null}
              startedAt={latestRun?.startedAt ?? null}
              status={runStatus}
              trigger={runTrigger}
            />

            {runError ? <p className="m-0 text-sm text-danger">{runError}</p> : null}

            {latestRun && latestRun.status === "success" ? (
              <div className="grid gap-2 rounded-xl border border-line bg-paper-3 p-4">
                <strong className="text-sm text-ink">
                  {latestRun.bodyChanged
                    ? `Revision: ${latestRun.nextVersionLabel}`
                    : "No material changes"}
                </strong>
                {latestRun.summary ? <p className="m-0 text-sm text-ink-soft">{latestRun.summary}</p> : null}
                {latestRun.whatChanged ? <p className="m-0 text-sm text-ink-soft">{latestRun.whatChanged}</p> : null}
              </div>
            ) : null}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div>
                <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
                  Agent steps
                </span>
                <StepLog messages={runMessages} />
              </div>
              {runSourceLogs.length > 0 ? (
                <div>
                  <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
                    Sources
                  </span>
                  <div className="grid gap-2">
                    {runSourceLogs.map((source) => (
                      <SourceCard key={source.id} source={source} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {runDiffLines.length > 0 ? (
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
                    Diff preview
                  </span>
                  <button
                    className="text-xs font-medium text-ink-soft transition-colors hover:text-ink"
                    onClick={() => setModalOpen(true)}
                    type="button"
                  >
                    Open full diff
                  </button>
                </div>
                <DiffViewer compact label="Latest skill diff" lines={runDiffLines} maxHeight={260} />
              </div>
            ) : null}
          </Panel>
        ) : latestRun === undefined || latestRun === null ? (
          <EmptyCard>No update runs yet. Trigger one from Studio or wait for automation.</EmptyCard>
        ) : null}
      </section>

      <RunLogModal
        diffLines={runDiffLines}
        editorModel={runEditorModel}
        error={runError}
        finishedAt={latestRun?.finishedAt ?? null}
        isLive={false}
        messages={runMessages}
        onClose={() => setModalOpen(false)}
        open={modalOpen}
        reasoningSteps={runReasoningSteps}
        result={null}
        sourceLogs={runSourceLogs}
        startedAt={latestRun?.startedAt ?? null}
        status={runStatus}
        trigger={runTrigger}
      />

      {automation ? (
        <AutomationEditModal
          automation={automation}
          canManage={canManage}
          initialPreferredHour={automation.preferredHour}
          onClose={() => setEditOpen(false)}
          open={editOpen}
          skillCategory={category}
          skillIconUrl={iconUrl}
          skillName={skillTitle}
          skillSlug={slug}
          sources={sources}
        />
      ) : null}
    </>
  );
}
