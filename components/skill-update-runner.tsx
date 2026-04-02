"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { DiffViewer } from "@/components/diff-viewer";
import {
  AutomationIcon,
  CheckIcon,
  CpuIcon,
  RefreshIcon,
  SearchIcon,
  TriangleAlertIcon,
} from "@/components/frontier-icons";
import { RunLogModal } from "@/components/run-log-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyCard } from "@/components/ui/empty-card";
import { Panel, PanelHead } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RunMetadataBar } from "@/components/ui/run-metadata-bar";
import { StepIndicatorCompact } from "@/components/ui/step-indicator";
import { useAppTimezone } from "@/hooks/use-app-timezone";
import { useTrackedLoopUpdate } from "@/hooks/use-tracked-loop-update";
import { Tip } from "@/components/ui/tip";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { buildLoopRunResult } from "@/lib/loop-updates";
import { formatNextRun } from "@/lib/schedule";
import { applySourceUpdate } from "@/lib/stream-loop-update";
import type {
  AgentReasoningStep,
  AutomationSummary,
  LoopRunRecord,
  LoopUpdateResult,
  LoopUpdateSourceLog,
  LoopUpdateTarget,
  LoopUpdateTargetOrigin
} from "@/lib/types";

type SkillUpdateRunnerProps = {
  slug: string;
  origin: LoopUpdateTargetOrigin;
  sourceCount: number;
  automation?: AutomationSummary;
  latestRun?: LoopRunRecord | null;
  canManage?: boolean;
};

const STAT_BOX = "grid gap-1 rounded-2xl border border-line bg-paper-3 p-4";
const STAT_LABEL = "text-xs font-medium uppercase tracking-[0.08em] text-ink-soft";
const STAT_VALUE = "text-sm font-semibold tracking-[-0.03em]";
const PANEL_TITLE = "m-0 text-lg font-semibold tracking-tight text-ink";
const SECTION_LABEL = "mb-2 inline-block text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft";

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

type StepMessageKind = "source" | "reasoning" | "done" | "error" | "generic";

function classifyMessage(message: string): StepMessageKind {
  const lower = message.toLowerCase();
  if (lower.includes("error") || lower.includes("failed")) return "error";
  if (lower.includes("is live") || lower.includes("finished") || lower.includes("no material diff")) return "done";
  if (lower.includes("source") || lower.includes("scanning") || lower.includes("queued")) return "source";
  if (lower.includes("agent") || lower.includes("reasoning") || lower.includes("started agent")) return "reasoning";
  return "generic";
}

function StepIcon({ kind, isLast, isLive }: { kind: StepMessageKind; isLast: boolean; isLive: boolean }) {
  const baseClass = "h-3.5 w-3.5";
  const wrapClass = cn(
    "flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-paper-3 text-ink-soft [&>svg]:h-3.5 [&>svg]:w-3.5",
    isLast && isLive && "animate-pulse"
  );
  switch (kind) {
    case "source":
      return <div className={wrapClass}><SearchIcon className={baseClass} /></div>;
    case "reasoning":
      return <div className={wrapClass}><CpuIcon className={baseClass} /></div>;
    case "done":
      return <div className={cn(wrapClass, "border-success/30 bg-success/10 text-success")}><CheckIcon className={baseClass} /></div>;
    case "error":
      return <div className={cn(wrapClass, "border-danger/30 bg-danger/10 text-danger")}><TriangleAlertIcon className={baseClass} /></div>;
    default:
      return <div className={wrapClass}><AutomationIcon className={baseClass} /></div>;
  }
}

function buildPendingSourcesFromTarget(loop: LoopUpdateTarget): LoopUpdateSourceLog[] {
  return loop.sources.map((source) => ({
    ...source,
    status: "pending",
    itemCount: 0,
    items: [],
    note: "Queued for scan.",
    reasoning:
      source.mode === "discover"
        ? "Scanning an index-style source and ranking discovered links against the skill's query hints."
        : source.mode === "search"
          ? "Biasing discovery toward the source's query hints instead of static navigation links."
          : "Tracking the canonical source for fresh deltas."
  }));
}

const SOURCE_DOT_CLASSES: Record<string, string> = {
  done: "bg-success",
  running: "animate-pulse bg-warning",
  error: "bg-danger",
};

function SourceCard({ source }: { source: LoopUpdateSourceLog }) {
  const metadata = [
    source.mode ? source.mode.replace(/-/g, " ") : null,
    source.trust ? source.trust.replace(/-/g, " ") : null,
    source.parser ? source.parser.replace(/-/g, " ") : null
  ].filter(Boolean);

  return (
    <article className="grid gap-1.5 rounded-xl border border-line bg-paper-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <Tip content={source.status} side="left">
          <span
            className={cn(
              "flex h-2.5 w-2.5 shrink-0 rounded-full",
              SOURCE_DOT_CLASSES[source.status] ?? "bg-line-strong"
            )}
          />
        </Tip>
        <strong className="text-sm text-ink">{source.label}</strong>
        <span className="ml-auto text-xs text-ink-faint">{source.status}</span>
      </div>
      {metadata.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {metadata.map((entry, idx) => {
            const hints = ["Discovery mode", "Trust tier", "Parser type"];
            return (
              <Tip content={hints[idx] ?? entry} key={entry} side="top">
                <span><Badge color="neutral">{entry}</Badge></span>
              </Tip>
            );
          })}
        </div>
      ) : null}
      <p className="m-0 text-sm text-ink-soft">{source.note ?? `${source.itemCount} items found.`}</p>
      {source.reasoning ? (
        <p className="m-0 text-xs leading-relaxed text-ink-faint">{source.reasoning}</p>
      ) : null}
      {source.searchQueries && source.searchQueries.length > 0 ? (
        <p className="m-0 text-xs text-ink-faint">
          Queries: {source.searchQueries.slice(0, 3).join(" · ")}
        </p>
      ) : null}
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

function StepLog({ messages, isLive }: { messages: string[]; isLive: boolean }) {
  if (messages.length === 0) return null;

  return (
    <div className="grid gap-0">
      {messages.map((message, index) => {
        const kind = classifyMessage(message);
        const isLast = index === messages.length - 1;
        return (
          <article
            className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-t border-line py-3 first:border-t-0 first:pt-0"
            key={`${message}-${index}`}
          >
            <StepIcon isLast={isLast} isLive={isLive} kind={kind} />
            <div className="grid gap-0.5 pt-1">
              <span className="text-xs font-medium text-ink-faint">Step {index + 1}</span>
              <span className={cn(
                "text-sm text-ink-soft",
                kind === "error" && "text-danger",
                kind === "done" && "text-success"
              )}>
                {message}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function SkillUpdateRunner({
  slug,
  origin,
  sourceCount,
  automation,
  latestRun,
  canManage = false
}: SkillUpdateRunnerProps) {
  const { timeZone } = useAppTimezone();
  const router = useRouter();
  const [isRunning, startTransition] = useTransition();
  const [messages, setMessages] = useState<string[]>([]);
  const [sourceLogs, setSourceLogs] = useState<LoopUpdateSourceLog[]>([]);
  const [reasoningSteps, setReasoningSteps] = useState<AgentReasoningStep[]>([]);
  const { run: runTrackedUpdate } = useTrackedLoopUpdate();
  const [result, setResult] = useState<LoopUpdateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const hasLiveState = messages.length > 0 || result !== null || error !== null;
  const historicalResult = useMemo(() => buildLoopRunResult(latestRun), [latestRun]);
  const sourcesDoneCount = useMemo(
    () => (hasLiveState ? sourceLogs : latestRun?.sources ?? []).filter((s) => s.status === "done").length,
    [hasLiveState, sourceLogs, latestRun]
  );

  const visibleMessages = hasLiveState ? messages : latestRun?.messages ?? [];
  const visibleSourceLogs = hasLiveState ? sourceLogs : latestRun?.sources ?? [];
  const visibleReasoningSteps = hasLiveState ? reasoningSteps : latestRun?.reasoningSteps ?? [];
  const visibleError = hasLiveState ? error : latestRun?.errorMessage ?? null;
  const visibleDiffLines = hasLiveState
    ? (result?.diffLines ?? [])
    : latestRun?.diffLines ?? [];
  const visibleTrigger = hasLiveState
    ? "Manual"
    : latestRun
      ? formatTriggerLabel(latestRun.trigger)
      : origin === "remote"
        ? "Import sync"
        : "Automation";
  const visibleEditorModel = result?.editorModel ?? latestRun?.editorModel ?? null;
  const visibleStartedAt = hasLiveState ? null : latestRun?.startedAt ?? null;
  const visibleFinishedAt = hasLiveState ? null : latestRun?.finishedAt ?? null;
  const visibleStatus: "success" | "error" | "running" = isRunning
    ? "running"
    : visibleError
      ? "error"
      : result
        ? "success"
        : latestRun?.status ?? "success";
  const scheduleLabel = automation
    ? automation.schedule
    : origin === "remote"
      ? "Import sync"
      : "Manual";
  const nextRunLabel = automation
    ? automation.status === "PAUSED"
      ? "Paused"
      : formatNextRun(automation.cadence, automation.preferredHour ?? 12, automation.preferredDay)
    : origin === "remote"
      ? "On source change"
      : "On demand";
  const latestOutcomeLabel = result
    ? result.changed
      ? result.nextVersionLabel
      : "No material diff"
    : latestRun
      ? latestRun.status === "error"
        ? "Needs attention"
        : latestRun.bodyChanged
          ? latestRun.nextVersionLabel
          : "No material diff"
      : "No runs yet";

  const handleRun = useCallback(() => {
    setError(null);
    setResult(null);
    setMessages(["Queued agent update."]);
    setSourceLogs([]);
    setReasoningSteps([]);

    startTransition(async () => {
      try {
        await runTrackedUpdate({
          slug,
          origin,
          label: slug,
          href: `/skills/${slug}`,
          trigger: "manual",
          callbacks: {
            onStart(loop) {
              setMessages((prev) => [
                ...prev,
                `Started agent run across ${loop.sources.length} tracked sources.`
              ]);
              setSourceLogs(buildPendingSourcesFromTarget(loop));
            },
            onSource(source) {
              setSourceLogs((prev) => applySourceUpdate(prev, source));
              setMessages((prev) => [
                ...prev,
                `${source.label}: ${source.note ?? source.status}.`
              ]);
            },
            onMessage(message) {
              setMessages((prev) => [...prev, message]);
            },
            onReasoningStep(step) {
              setReasoningSteps((prev) => [...prev, step]);
            },
            onComplete(completeResult, sources) {
              setResult(completeResult);
              setSourceLogs(sources);
              setMessages((prev) => [
                ...prev,
                completeResult.changed
                  ? `${completeResult.nextVersionLabel} is live with a saved revision.`
                  : "Source fetch finished. No material diff landed."
              ]);
              setError(null);
              router.refresh();
            },
            onError(message) {
              setError(message);
              setMessages((prev) => [...prev, message]);
            },
          },
        });
      } catch (caughtError) {
        const message =
          caughtError instanceof Error ? caughtError.message : "Manual loop update failed.";
        setError(message);
        setMessages((prev) => [...prev, message]);
      }
    });
  }, [slug, origin, router, startTransition, runTrackedUpdate]);

  const canRun = sourceCount > 0 && !isRunning && canManage;
  const buttonLabel = origin === "remote" ? "Sync from source" : "Run automation now";

  return (
    <div className="grid gap-6">
      <Panel className="overflow-hidden">
        <div className="dither-gradient-orange -mx-6 -mt-6 mb-1 px-6 pb-5 pt-6">
          <PanelHead className="items-start">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-paper-3/90 text-ink-soft [&>svg]:h-4 [&>svg]:w-4 dark:bg-paper-2/50">
                <AutomationIcon className={cn(isRunning && "animate-spin")} />
              </div>
              <div>
                <h2 className={PANEL_TITLE}>{buttonLabel}</h2>
                <p className="m-0 max-w-[56ch] text-sm leading-relaxed text-ink-soft">
                  {!canManage
                    ? "Only the skill owner can trigger manual refreshes. You can still inspect the trace and latest diff."
                    : sourceCount > 0
                    ? `Fetch ${sourceCount} sources, rank fresh leads, and rewrite the skill with a visible trace.`
                    : "Add sources in Setup to enable updates."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {automation ? (
        <Tip content={automation.status === "ACTIVE" ? "Automation runs on schedule" : "Automation is paused"} side="bottom">
          <span><Badge color={automation.status === "ACTIVE" ? "green" : "neutral"}>{automation.status.toLowerCase()}</Badge></span>
        </Tip>
      ) : null}
              <Button disabled={!canRun} onClick={handleRun} type="button">
                {isRunning ? "Running..." : buttonLabel}
              </Button>
            </div>
          </PanelHead>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Tip content="Number of tracked URLs the agent scans" side="bottom">
            <div className={STAT_BOX}>
              <small className={STAT_LABEL}>sources</small>
              <strong className={STAT_VALUE}>{sourceCount}</strong>
            </div>
          </Tip>
          <Tip content="How often the automation runs" side="bottom">
            <div className={STAT_BOX}>
              <small className={STAT_LABEL}>cadence</small>
              <strong className={STAT_VALUE}>{scheduleLabel}</strong>
            </div>
          </Tip>
          <Tip content="When the next scheduled run fires" side="bottom">
            <div className={STAT_BOX}>
              <small className={STAT_LABEL}>next run</small>
              <strong className={STAT_VALUE}>{nextRunLabel}</strong>
            </div>
          </Tip>
          <Tip content="Outcome of the most recent run" side="bottom">
            <div className={STAT_BOX}>
              <small className={STAT_LABEL}>latest</small>
              <strong
                className={cn(
                  STAT_VALUE,
                  visibleStatus === "error" && "text-danger"
                )}
              >
                {latestOutcomeLabel}
              </strong>
            </div>
          </Tip>
        </div>
      </Panel>

      {(visibleMessages.length > 0 || visibleSourceLogs.length > 0) ? (
        <Panel compact className="overflow-hidden">
          {isRunning && (
            <ProgressBar
              className="-mx-6 -mt-6 mb-4"
              progress={sourcesDoneCount > 0 ? Math.round((sourcesDoneCount / Math.max(visibleSourceLogs.length, 1)) * 100) : undefined}
              rounded={false}
              size="sm"
              status="active"
            />
          )}
          {!isRunning && visibleStatus === "success" && (
            <ProgressBar
              className="-mx-6 -mt-6 mb-4"
              progress={100}
              rounded={false}
              size="sm"
              status="done"
            />
          )}
          {!isRunning && visibleStatus === "error" && (
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
              <h2 className={PANEL_TITLE}>Refresh trace</h2>
              <p className="m-0 text-sm text-ink-soft">
                Live reasoning, source results, and the diff that landed.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {visibleStatus === "running" ? (
                <Tip content="Results are streaming in real time" side="bottom">
                  <span><Badge color="blue">streaming</Badge></span>
                </Tip>
              ) : latestRun ? (
                <Tip content="When this run completed" side="bottom">
                  <span><Badge color="neutral">{formatDateTime(latestRun.finishedAt, timeZone)}</Badge></span>
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
            addedSourceCount={result?.addedSources?.length ?? latestRun?.addedSources?.length}
            editorModel={visibleEditorModel}
            finishedAt={visibleFinishedAt}
            searchesUsed={result?.searchesUsed ?? latestRun?.searchesUsed}
            startedAt={visibleStartedAt}
            status={visibleStatus}
            trigger={visibleTrigger}
          />

          {visibleError ? (
            <div className="flex items-start gap-2 border border-danger/25 bg-danger/[0.04] p-3">
              <TriangleAlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
              <p className="m-0 text-sm text-danger">{visibleError}</p>
            </div>
          ) : null}

          {result ? (
            <div className="grid gap-2 rounded-xl border border-line bg-paper-3 p-4">
              <strong className="text-sm text-ink">
                {result.changed
                  ? `New revision: ${result.nextVersionLabel}`
                  : "No material changes"}
              </strong>
              {result.summary ? (
                <p className="m-0 text-sm text-ink-soft">{result.summary}</p>
              ) : null}
              {result.whatChanged ? (
                <p className="m-0 text-sm text-ink-soft">{result.whatChanged}</p>
              ) : null}
            </div>
          ) : null}

          {isRunning && visibleSourceLogs.length > 1 && (
            <div className="flex items-center gap-3">
              <StepIndicatorCompact
                completed={sourcesDoneCount}
                total={visibleSourceLogs.length}
              />
              <span className="text-xs tabular-nums text-ink-faint">
                {sourcesDoneCount}/{visibleSourceLogs.length} sources
              </span>
            </div>
          )}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div>
              <span className={SECTION_LABEL}>Agent steps</span>
              <StepLog isLive={isRunning} messages={visibleMessages} />
            </div>

            {visibleSourceLogs.length > 0 ? (
              <div>
                <span className={SECTION_LABEL}>Sources</span>
                <div className="grid gap-2">
                  {visibleSourceLogs.map((source) => (
                    <SourceCard key={source.id} source={source} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {visibleDiffLines.length > 0 ? (
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
              <DiffViewer compact label="Latest skill diff" lines={visibleDiffLines} maxHeight={260} />
            </div>
          ) : null}
        </Panel>
      ) : latestRun === undefined || latestRun === null ? (
        <EmptyCard>No update runs yet. Trigger one above or wait for automation.</EmptyCard>
      ) : null}

      <RunLogModal
        diffLines={visibleDiffLines}
        editorModel={visibleEditorModel}
        error={visibleError}
        finishedAt={visibleFinishedAt}
        isLive={isRunning}
        messages={visibleMessages}
        onClose={() => setModalOpen(false)}
        open={modalOpen}
        reasoningSteps={visibleReasoningSteps}
        result={result ?? historicalResult}
        sourceLogs={visibleSourceLogs}
        startedAt={visibleStartedAt}
        status={visibleStatus}
        trigger={visibleTrigger}
      />
    </div>
  );
}
