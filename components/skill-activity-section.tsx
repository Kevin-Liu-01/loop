"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

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
import { BrailleSpinner } from "@/components/ui/braille-spinner";
import { Button } from "@/components/ui/button";
import { EmptyCard } from "@/components/ui/empty-card";
import { LinkButton } from "@/components/ui/link-button";
import { Panel, PanelHead } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RunMetadataBar } from "@/components/ui/run-metadata-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import { Tip } from "@/components/ui/tip";
import { useAppTimezone } from "@/hooks/use-app-timezone";
import { useTrackedLoopUpdate } from "@/hooks/use-tracked-loop-update";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { buildLoopRunResult } from "@/lib/loop-updates";
import { countMonthlyRuns, formatNextRun } from "@/lib/schedule";
import { applySourceUpdate } from "@/lib/stream-loop-update";
import type {
  AgentReasoningStep,
  AutomationSummary,
  CategorySlug,
  DiffLine,
  LoopRunRecord,
  LoopUpdateResult,
  LoopUpdateSourceLog,
  LoopUpdateTarget,
  SkillOrigin,
  SkillRecord,
  SourceDefinition,
} from "@/lib/types";

interface SkillActivitySectionProps {
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
}

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
          : "border-line bg-paper-3/90 dark:bg-paper-2/40"
      )}
    >
      <span className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
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
        No automation brief yet. Add one in Studio so refreshes optimize for the
        right deltas.
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
    case "manual": {
      return "Manual";
    }
    case "automation": {
      return "Automation";
    }
    case "import-sync": {
      return "Import sync";
    }
    default: {
      return trigger;
    }
  }
}

function SourceCard({ source }: { source: LoopUpdateSourceLog }) {
  const statusColor =
    source.status === "done"
      ? "bg-success"
      : source.status === "running"
        ? "animate-pulse bg-warning"
        : source.status === "error"
          ? "bg-danger"
          : "bg-line-strong";

  return (
    <article className="grid gap-1.5 rounded-none border border-line bg-paper-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={cn("flex h-2.5 w-2.5 shrink-0 rounded-full", statusColor)}
        />
        <strong className="text-sm text-ink">{source.label}</strong>
        <span className="ml-auto text-xs text-ink-faint">{source.status}</span>
      </div>
      <p className="m-0 text-sm text-ink-soft">
        {source.note ?? `${source.itemCount} items found.`}
      </p>
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
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-0">
      {messages.map((message, index) => (
        <article
          className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-t border-line py-3 first:border-t-0 first:pt-0"
          key={`${message}-${index}`}
        >
          <div className="flex h-8 w-8 items-center justify-center border border-line bg-paper-3 text-ink-soft [&>svg]:h-3.5 [&>svg]:w-3.5">
            <AutomationIcon />
          </div>
          <div className="grid gap-0.5 pt-1">
            <span className="text-xs font-medium text-ink-faint">
              Step {index + 1}
            </span>
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
  const { timeZone } = useAppTimezone();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [isRunning, startTransition] = useTransition();
  const [liveMessages, setLiveMessages] = useState<string[]>([]);
  const [liveSourceLogs, setLiveSourceLogs] = useState<LoopUpdateSourceLog[]>(
    []
  );
  const [liveReasoningSteps, setLiveReasoningSteps] = useState<
    AgentReasoningStep[]
  >([]);
  const [liveResult, setLiveResult] = useState<LoopUpdateResult | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const { run: runTrackedUpdate } = useTrackedLoopUpdate();

  const hasLiveState =
    liveMessages.length > 0 || liveResult !== null || liveError !== null;

  const handleRunUpdate = useCallback(() => {
    setLiveError(null);
    setLiveResult(null);
    setLiveMessages(["Queued agent update."]);
    setLiveSourceLogs([]);
    setLiveReasoningSteps([]);
    setModalOpen(true);

    startTransition(async () => {
      try {
        await runTrackedUpdate({
          callbacks: {
            onComplete(
              completeResult: LoopUpdateResult,
              completeSources: LoopUpdateSourceLog[]
            ) {
              setLiveResult(completeResult);
              setLiveSourceLogs(completeSources);
              setLiveMessages((prev) => [
                ...prev,
                completeResult.changed
                  ? `${completeResult.nextVersionLabel} is live.`
                  : "No material diff landed.",
              ]);
              setLiveError(null);
              router.refresh();
            },
            onError(message: string) {
              setLiveError(message);
              setLiveMessages((prev) => [...prev, message]);
            },
            onMessage(message: string) {
              setLiveMessages((prev) => [...prev, message]);
            },
            onReasoningStep(step: AgentReasoningStep) {
              setLiveReasoningSteps((prev) => [...prev, step]);
            },
            onSource(source: LoopUpdateSourceLog) {
              setLiveSourceLogs((prev) => applySourceUpdate(prev, source));
              setLiveMessages((prev) => [
                ...prev,
                `${source.label}: ${source.note ?? source.status}.`,
              ]);
            },
            onStart(loop: LoopUpdateTarget) {
              setLiveMessages((prev) => [
                ...prev,
                `Started agent run across ${loop.sources.length} tracked sources.`,
              ]);
              setLiveSourceLogs(
                loop.sources.map((s) => ({
                  ...s,
                  itemCount: 0,
                  items: [],
                  note: "Queued for scan.",
                  status: "pending",
                }))
              );
            },
          },
          href: `/skills/${slug}`,
          label: slug,
          origin,
          slug,
          trigger: "manual",
        });
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Manual update failed.";
        setLiveError(message);
        setLiveMessages((prev) => [...prev, message]);
      }
    });
  }, [slug, origin, router, startTransition, runTrackedUpdate]);

  useEffect(() => {
    const openHandler = () => setModalOpen(true);
    window.addEventListener("open-run-log", openHandler);
    return () => window.removeEventListener("open-run-log", openHandler);
  }, []);

  useEffect(() => {
    const triggerHandler = () => {
      if (canManage && sourceCount > 0 && !isRunning) {
        handleRunUpdate();
      }
    };
    window.addEventListener("loop:trigger-refresh", triggerHandler);
    return () =>
      window.removeEventListener("loop:trigger-refresh", triggerHandler);
  }, [canManage, sourceCount, isRunning, handleRunUpdate]);

  const isTracked = origin === "user";
  const isActive = automation?.status === "ACTIVE";
  const canRun = canManage && sourceCount > 0 && !isRunning;
  const now = useMemo(() => new Date(), []);

  const skillMap = useMemo(
    () => new Map([[slug, { category, iconUrl, slug } as SkillRecord]]),
    [slug, iconUrl, category]
  );
  const monthlyRuns = automation
    ? countMonthlyRuns(
        automation.cadence,
        now.getFullYear(),
        now.getMonth(),
        automation.preferredDay
      )
    : 0;
  const nextRun = automation
    ? formatNextRun(
        automation.cadence,
        automation.preferredHour ?? 12,
        automation.preferredDay
      )
    : "On demand";
  const scheduleLabel = automation?.schedule?.trim() || "Manual only";

  const runMessages = hasLiveState ? liveMessages : (latestRun?.messages ?? []);
  const runSourceLogs = hasLiveState
    ? liveSourceLogs
    : (latestRun?.sources ?? []);
  const runReasoningSteps = hasLiveState
    ? liveReasoningSteps
    : (latestRun?.reasoningSteps ?? []);
  const runError = hasLiveState ? liveError : (latestRun?.errorMessage ?? null);
  const runDiffLines: DiffLine[] = hasLiveState
    ? (liveResult?.diffLines ?? [])
    : (latestRun?.diffLines ?? []);
  const runTrigger = hasLiveState
    ? "Manual"
    : latestRun
      ? formatTriggerLabel(latestRun.trigger)
      : "–";
  const runEditorModel =
    liveResult?.editorModel ?? latestRun?.editorModel ?? null;
  const runStatus: "success" | "error" | "running" = isRunning
    ? "running"
    : runError
      ? "error"
      : liveResult
        ? "success"
        : (latestRun?.status ?? "success");
  const historicalResult = useMemo(
    () => buildLoopRunResult(latestRun),
    [latestRun]
  );
  const runResult = liveResult ?? historicalResult;
  const latestOutcomeLabel = latestRun
    ? latestRun.status === "error"
      ? "Needs attention"
      : latestRun.bodyChanged
        ? (latestRun.nextVersionLabel ?? "Updated")
        : "No material diff"
    : "No runs yet";

  if (!isTracked) {
    return (
      <section className="grid gap-5 border-t border-line pt-8" id="activity">
        <SectionHeading icon={<AutomationIcon />} title="Activity" />
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
        <SectionHeading icon={<AutomationIcon />} title="Activity" />

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
                    <Badge color={isActive ? "green" : "neutral"}>
                      {isActive ? "Active" : "Paused"}
                    </Badge>
                    <Badge color="neutral">{scheduleLabel}</Badge>
                    <Badge color="blue">{sourceCount} sources</Badge>
                  </div>
                  <h3 className="m-0 text-xl font-semibold tracking-tight text-ink">
                    Automation &amp; run history
                  </h3>
                  <p className="m-0 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
                    {canManage
                      ? "Schedule, traces, and diffs for this skill."
                      : "Automation status and run history. Only the owner can trigger runs or edit the schedule."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canManage ? (
                    <Button
                      disabled={!canRun}
                      onClick={handleRunUpdate}
                      size="sm"
                      type="button"
                    >
                      {isRunning ? (
                        <BrailleSpinner className="text-sm" />
                      ) : (
                        <RefreshIcon className="h-3.5 w-3.5" />
                      )}
                      {isRunning ? "Running..." : "Run update now"}
                    </Button>
                  ) : null}
                  {canManage ? (
                    <Button
                      onClick={() => setEditOpen(true)}
                      size="sm"
                      type="button"
                      variant="soft"
                    >
                      <SettingsIcon className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  ) : null}
                  <LinkButton
                    href="/settings/automations"
                    size="sm"
                    variant="soft"
                  >
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
              <AutomationCalendar
                automations={[automation]}
                skillMap={skillMap}
                variant="sidebar"
              />
            )}

            <PromptPreview prompt={automation.prompt} />
          </Panel>
        ) : null}

        {/* --- Latest run trace --- */}
        {runMessages.length > 0 || runSourceLogs.length > 0 ? (
          <Panel compact className="overflow-hidden">
            {isRunning && (
              <ProgressBar
                className="-mx-6 -mt-6 mb-4"
                rounded={false}
                size="sm"
                status="active"
              />
            )}
            {!isRunning && runStatus === "success" && hasLiveState && (
              <ProgressBar
                className="-mx-6 -mt-6 mb-4"
                progress={100}
                rounded={false}
                size="sm"
                status="done"
              />
            )}
            {!isRunning && runStatus === "error" && hasLiveState && (
              <ProgressBar
                className="-mx-6 -mt-6 mb-4"
                progress={100}
                rounded={false}
                size="sm"
                status="error"
              />
            )}
            <PanelHead>
              <div>
                <h3 className="m-0 text-lg font-semibold tracking-tight text-ink">
                  {isRunning ? "Live refresh trace" : "Latest refresh trace"}
                </h3>
                <p className="m-0 text-sm text-ink-soft">
                  Reasoning steps, source results, and the diff that landed.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isRunning ? (
                  <Tip
                    content="Results are streaming in real time"
                    side="bottom"
                  >
                    <span>
                      <Badge color="blue">streaming</Badge>
                    </span>
                  </Tip>
                ) : latestRun ? (
                  <Tip content="When this run completed" side="bottom">
                    <span>
                      <Badge color="neutral">
                        {formatDateTime(latestRun.finishedAt, timeZone)}
                      </Badge>
                    </span>
                  </Tip>
                ) : null}
                <Button
                  onClick={() => setModalOpen(true)}
                  size="sm"
                  type="button"
                  variant="soft"
                >
                  View details
                </Button>
              </div>
            </PanelHead>

            <RunMetadataBar
              addedSourceCount={
                liveResult?.addedSources?.length ??
                latestRun?.addedSources?.length
              }
              editorModel={runEditorModel}
              finishedAt={hasLiveState ? null : (latestRun?.finishedAt ?? null)}
              searchesUsed={liveResult?.searchesUsed ?? latestRun?.searchesUsed}
              startedAt={hasLiveState ? null : (latestRun?.startedAt ?? null)}
              status={runStatus}
              trigger={runTrigger}
              variant="compact"
            />

            {runError ? (
              <p className="m-0 text-sm text-danger">{runError}</p>
            ) : null}

            {latestRun && latestRun.status === "success" ? (
              <div className="grid gap-2 rounded-none border border-line bg-paper-3 p-4">
                <strong className="text-sm text-ink">
                  {latestRun.bodyChanged
                    ? `Revision: ${latestRun.nextVersionLabel}`
                    : "No material changes"}
                </strong>
                {latestRun.summary ? (
                  <p className="m-0 text-sm text-ink-soft">
                    {latestRun.summary}
                  </p>
                ) : null}
                {latestRun.whatChanged ? (
                  <p className="m-0 text-sm text-ink-soft">
                    {latestRun.whatChanged}
                  </p>
                ) : null}
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
                <DiffViewer
                  compact
                  label="Latest skill diff"
                  lines={runDiffLines}
                  maxHeight={260}
                />
              </div>
            ) : null}
          </Panel>
        ) : latestRun === undefined || latestRun === null ? (
          <EmptyCard>
            <span>No update runs yet.</span>
            {canManage && sourceCount > 0 ? (
              <Button
                className="mt-3"
                disabled={!canRun}
                onClick={handleRunUpdate}
                size="sm"
                type="button"
              >
                {isRunning ? (
                  <BrailleSpinner className="text-sm" />
                ) : (
                  <RefreshIcon className="h-3.5 w-3.5" />
                )}
                {isRunning ? "Running..." : "Run first update"}
              </Button>
            ) : (
              <span className="mt-1 block text-xs text-ink-faint">
                Add sources and set up automation to get started.
              </span>
            )}
          </EmptyCard>
        ) : null}
      </section>

      <RunLogModal
        diffLines={runDiffLines}
        editorModel={runEditorModel}
        error={runError}
        finishedAt={hasLiveState ? null : (latestRun?.finishedAt ?? null)}
        isLive={isRunning}
        messages={runMessages}
        onClose={() => setModalOpen(false)}
        open={modalOpen}
        reasoningSteps={runReasoningSteps}
        result={runResult}
        sourceLogs={runSourceLogs}
        startedAt={hasLiveState ? null : (latestRun?.startedAt ?? null)}
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
