"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { DiffViewer } from "@/components/diff-viewer";
import { AutomationIcon, RefreshIcon } from "@/components/frontier-icons";
import { RunLogModal } from "@/components/run-log-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyCard } from "@/components/ui/empty-card";
import { Panel, PanelHead } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import { formatAutomationSchedule } from "@/lib/format";
import { formatNextRun } from "@/lib/schedule";
import { applySourceUpdate, streamLoopUpdate } from "@/lib/stream-loop-update";
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

const statBox = "grid gap-1 rounded-2xl border border-line bg-paper-3 p-4";
const statLabel = "text-xs font-medium uppercase tracking-[0.08em] text-ink-soft";
const statValue = "text-sm font-semibold tracking-[-0.03em]";
const panelTitleClass = "m-0 text-lg font-semibold tracking-tight text-ink";

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

function sourceStatusIcon(status: string): string {
  switch (status) {
    case "done":
      return "done";
    case "running":
      return "running";
    case "error":
      return "error";
    default:
      return "pending";
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

function SourceCard({ source }: { source: LoopUpdateSourceLog }) {
  const icon = sourceStatusIcon(source.status);
  const metadata = [
    source.mode ? source.mode.replace(/-/g, " ") : null,
    source.trust ? source.trust.replace(/-/g, " ") : null,
    source.parser ? source.parser.replace(/-/g, " ") : null
  ].filter(Boolean);

  return (
    <article className="grid gap-1.5 rounded-xl border border-line bg-paper-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-2.5 w-2.5 shrink-0 rounded-full",
            icon === "done" && "bg-success",
            icon === "running" && "animate-pulse bg-warning",
            icon === "error" && "bg-danger",
            icon === "pending" && "bg-line-strong"
          )}
        />
        <strong className="text-sm text-ink">{source.label}</strong>
        <span className="ml-auto text-xs text-ink-faint">{source.status}</span>
      </div>
      {metadata.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {metadata.map((entry) => (
            <Badge key={entry} muted>
              {entry}
            </Badge>
          ))}
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

function RunMetadataBar({
  trigger,
  editorModel,
  startedAt,
  finishedAt,
  status
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
          {startedAt && finishedAt ? formatDuration(startedAt, finishedAt) : "running..."}
        </strong>
      </div>
      <div className={statBox}>
        <small className={statLabel}>status</small>
        <strong
          className={cn(
            statValue,
            status === "error" && "text-danger",
            status === "running" && "text-warning"
          )}
        >
          {status}
        </strong>
      </div>
    </div>
  );
}

function StepLog({ messages, isLive }: { messages: string[]; isLive: boolean }) {
  if (messages.length === 0) return null;

  return (
    <div className="grid gap-0">
      {messages.map((message, index) => (
        <article
          className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-t border-line py-3 first:border-t-0 first:pt-0"
          key={`${message}-${index}`}
        >
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-paper-3 text-ink-soft [&>svg]:h-3.5 [&>svg]:w-3.5",
              isLive && index === messages.length - 1 && "animate-pulse"
            )}
          >
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

export function SkillUpdateRunner({
  slug,
  origin,
  sourceCount,
  automation,
  latestRun,
  canManage = false
}: SkillUpdateRunnerProps) {
  const router = useRouter();
  const [isRunning, startTransition] = useTransition();
  const [messages, setMessages] = useState<string[]>([]);
  const [sourceLogs, setSourceLogs] = useState<LoopUpdateSourceLog[]>([]);
  const [reasoningSteps, setReasoningSteps] = useState<AgentReasoningStep[]>([]);
  const [result, setResult] = useState<LoopUpdateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const hasLiveState = messages.length > 0 || result !== null || error !== null;

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
    ? formatAutomationSchedule(automation.schedule)
    : origin === "remote"
      ? "Import sync"
      : "Manual";
  const nextRunLabel = automation
    ? automation.status === "PAUSED"
      ? "Paused"
      : formatNextRun(automation.schedule)
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
        await streamLoopUpdate(slug, origin, {
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
          }
        });
      } catch (caughtError) {
        const message =
          caughtError instanceof Error ? caughtError.message : "Manual loop update failed.";
        setError(message);
        setMessages((prev) => [...prev, message]);
      }
    });
  }, [slug, origin, router, startTransition]);

  const canRun = sourceCount > 0 && !isRunning && canManage;
  const buttonLabel = origin === "remote" ? "Sync from source" : "Run update now";

  return (
    <div className="grid gap-6">
      <Panel className="overflow-hidden">
        <div className="dither-gradient-orange -mx-6 -mt-6 mb-1 px-6 pb-5 pt-6">
          <PanelHead className="items-start">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-paper-3/90 text-ink-soft [&>svg]:h-4 [&>svg]:w-4 dark:bg-paper-2/50">
                <RefreshIcon className={cn(isRunning && "animate-spin")} />
              </div>
              <div>
                <h2 className={panelTitleClass}>{buttonLabel}</h2>
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
              {automation ? <Badge muted>{automation.status.toLowerCase()}</Badge> : null}
              <Button disabled={!canRun} onClick={handleRun} type="button">
                {isRunning ? "Running..." : buttonLabel}
              </Button>
            </div>
          </PanelHead>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className={statBox}>
            <small className={statLabel}>sources</small>
            <strong className={statValue}>{sourceCount}</strong>
          </div>
          <div className={statBox}>
            <small className={statLabel}>cadence</small>
            <strong className={statValue}>{scheduleLabel}</strong>
          </div>
          <div className={statBox}>
            <small className={statLabel}>next run</small>
            <strong className={statValue}>{nextRunLabel}</strong>
          </div>
          <div className={statBox}>
            <small className={statLabel}>latest</small>
            <strong
              className={cn(
                statValue,
                visibleStatus === "error" && "text-danger"
              )}
            >
              {latestOutcomeLabel}
            </strong>
          </div>
        </div>
      </Panel>

      {(visibleMessages.length > 0 || visibleSourceLogs.length > 0) ? (
        <Panel compact className="overflow-hidden">
          <PanelHead>
            <div>
              <h2 className={panelTitleClass}>Refresh trace</h2>
              <p className="m-0 text-sm text-ink-soft">
                Live reasoning, source results, and the diff that landed.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {visibleStatus === "running" ? (
                <Badge>streaming</Badge>
              ) : latestRun ? (
                <Badge muted>{new Date(latestRun.finishedAt).toLocaleString()}</Badge>
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
            editorModel={visibleEditorModel}
            finishedAt={visibleFinishedAt}
            startedAt={visibleStartedAt}
            status={visibleStatus}
            trigger={visibleTrigger}
          />

          {visibleError ? (
            <p className="m-0 text-sm text-danger">{visibleError}</p>
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

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div>
              <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
                Agent steps
              </span>
              <StepLog isLive={isRunning} messages={visibleMessages} />
            </div>

            {visibleSourceLogs.length > 0 ? (
              <div>
                <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
                  Sources
                </span>
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
        result={result}
        sourceLogs={visibleSourceLogs}
        startedAt={visibleStartedAt}
        status={visibleStatus}
        trigger={visibleTrigger}
      />
    </div>
  );
}
