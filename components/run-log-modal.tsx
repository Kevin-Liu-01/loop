"use client";

import { useEffect, useState } from "react";

import { DiffViewer } from "@/components/diff-viewer";
import { AutomationIcon } from "@/components/frontier-icons";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import { ScrollArea } from "@/components/ui/shadcn/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/shadcn/tabs";
import { cn } from "@/lib/cn";
import type {
  AgentReasoningStep,
  DiffLine,
  LoopRunRecord,
  LoopUpdateResult,
  LoopUpdateSourceLog
} from "@/lib/types";

type RunLogModalProps = {
  open: boolean;
  onClose: () => void;
  isLive: boolean;
  trigger: string;
  editorModel: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  status: "success" | "error" | "running";
  messages: string[];
  sourceLogs: LoopUpdateSourceLog[];
  reasoningSteps: AgentReasoningStep[];
  result: LoopUpdateResult | null;
  diffLines: DiffLine[];
  error: string | null;
};

const statBox = "grid gap-1 border border-line bg-paper-3 p-3";
const statLabel = "text-[0.65rem] font-medium uppercase tracking-[0.08em] text-ink-soft";
const statValue = "text-sm font-semibold tracking-[-0.03em]";
const sectionLabel = "text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft";

function formatDuration(startedAt: string, finishedAt: string): string {
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function toolDisplayName(name: string): string {
  return name.replace(/_/g, " ");
}

function StepTimeline({
  steps,
  selectedIndex,
  onSelect,
  isLive
}: {
  steps: AgentReasoningStep[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  isLive: boolean;
}) {
  return (
    <nav className="grid gap-0">
      <h3 className={cn(sectionLabel, "mb-2")}>Agent steps</h3>
      <div className="grid gap-0">
        {steps.map((step) => {
          const isCurrent = step.index === selectedIndex;
          const hasDiff = step.diffLines && step.diffLines.length > 0;
          const isLatestLive = isLive && step.index === steps.length - 1;

          return (
            <button
              className={cn(
                "flex items-center gap-2 border-l-2 py-2 pl-3 pr-1 text-left text-sm transition-colors",
                isCurrent
                  ? "border-accent bg-paper-3 font-semibold text-ink"
                  : "border-line text-ink-soft hover:border-ink-muted hover:text-ink"
              )}
              key={step.index}
              onClick={() => onSelect(step.index)}
              type="button"
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center border text-[0.6rem] font-bold",
                  isCurrent
                    ? "border-accent bg-accent text-white"
                    : "border-line bg-paper-3 text-ink-muted",
                  isLatestLive && "animate-pulse"
                )}
              >
                {step.index + 1}
              </span>
              <span className="min-w-0 truncate">
                {step.toolCall ? toolDisplayName(step.toolCall.name) : "Reasoning"}
              </span>
              {hasDiff ? (
                <span className="ml-auto flex h-2 w-2 shrink-0 rounded-full bg-success" />
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function SourceCardFull({ source }: { source: LoopUpdateSourceLog }) {
  const statusColor =
    source.status === "done"
      ? "bg-success"
      : source.status === "running"
        ? "animate-pulse bg-warning"
        : source.status === "error"
          ? "bg-danger"
          : "bg-line-strong";

  return (
    <article className="grid gap-2 border border-line bg-paper-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={cn("flex h-2.5 w-2.5 shrink-0 rounded-full", statusColor)} />
        <strong className="text-sm text-ink">{source.label}</strong>
        <span className="ml-auto text-xs text-ink-faint">{source.status}</span>
      </div>
      {source.note ? (
        <p className="m-0 text-sm text-ink-soft">{source.note}</p>
      ) : null}
      {source.items.length > 0 ? (
        <div className="grid gap-1.5">
          {source.items.map((item) => (
            <a
              className="grid gap-0.5 border border-line bg-paper px-3 py-2 transition-colors hover:border-ink-muted"
              href={item.url}
              key={item.url}
              rel="noreferrer"
              target="_blank"
            >
              <span className="text-xs font-medium text-ink">{item.title}</span>
              <span className="text-[0.65rem] text-ink-muted">
                {item.source} · {item.publishedAt}
              </span>
              {item.summary ? (
                <span className="text-xs text-ink-soft">{item.summary}</span>
              ) : null}
            </a>
          ))}
        </div>
      ) : null}
    </article>
  );
}


function StepDetail({ step }: { step: AgentReasoningStep }) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center border border-line bg-paper-3 text-ink-soft [&>svg]:h-3.5 [&>svg]:w-3.5">
          <AutomationIcon />
        </span>
        <span className="text-sm font-semibold text-ink">
          Step {step.index + 1}
          {step.toolCall ? ` — ${toolDisplayName(step.toolCall.name)}` : " — Reasoning"}
        </span>
        <span className="ml-auto text-[0.65rem] text-ink-muted">
          {new Date(step.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {step.reasoning ? (
        <div className="border border-line bg-paper-3 p-4">
          <h4 className={cn(sectionLabel, "mb-2")}>Agent reasoning</h4>
          <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
            {step.reasoning}
          </p>
        </div>
      ) : null}

      {step.toolCall ? (
        <div className="border border-line bg-paper-3 p-4">
          <h4 className={cn(sectionLabel, "mb-2")}>Tool call</h4>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Badge>{step.toolCall.name}</Badge>
            </div>
            <details className="group">
              <summary className="cursor-pointer text-xs font-medium text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-1">
                  Arguments
                  <span className="text-ink-muted transition-transform group-open:rotate-90">▶</span>
                </span>
              </summary>
              <pre className="mt-2 max-h-60 overflow-auto bg-paper p-3 font-mono text-xs text-ink-soft">
                {JSON.stringify(step.toolCall.args, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      ) : null}

      {step.toolResult ? (
        <div className="border border-line bg-paper-3 p-4">
          <h4 className={cn(sectionLabel, "mb-2")}>Tool result</h4>
          <pre className="max-h-40 overflow-auto bg-paper p-3 font-mono text-xs text-ink-soft">
            {step.toolResult}
          </pre>
        </div>
      ) : null}

      {step.diffLines && step.diffLines.length > 0 ? (
        <DiffViewer compact label="Diff produced" lines={step.diffLines} maxHeight={320} />
      ) : null}
    </div>
  );
}

function LegacyStepView({ messages, diffLines }: { messages: string[]; diffLines: DiffLine[] }) {
  return (
    <div className="grid gap-4">
      <div>
        <h4 className={cn(sectionLabel, "mb-2")}>Agent steps</h4>
        <div className="grid gap-0">
          {messages.map((message, index) => (
            <article
              className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-t border-line py-3 first:border-t-0 first:pt-0"
              key={`${message}-${index}`}
            >
              <span className="flex h-7 w-7 items-center justify-center border border-line bg-paper-3 text-[0.6rem] font-bold text-ink-muted">
                {index + 1}
              </span>
              <span className="pt-1 text-sm text-ink-soft">{message}</span>
            </article>
          ))}
        </div>
      </div>

      {diffLines.length > 0 ? (
        <DiffViewer label="Diff" lines={diffLines} />
      ) : null}
    </div>
  );
}

function ResultSummary({
  result,
  error
}: {
  result: LoopUpdateResult | null;
  error: string | null;
}) {
  if (!result && !error) {
    return (
      <div className="border border-line bg-paper-3 p-4">
        <p className="m-0 text-sm text-ink-soft">
          No structured result yet. Open the steps tab for the raw trace.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 border border-line bg-paper-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-sm text-ink">
          {result
            ? result.changed
              ? `New revision: ${result.nextVersionLabel}`
              : "No material changes"
            : "Run error"}
        </strong>
        {result?.changedSections?.length ? <Badge>{result.changedSections.length} sections</Badge> : null}
      </div>

      {result?.summary ? <p className="m-0 text-sm text-ink-soft">{result.summary}</p> : null}
      {result?.whatChanged ? <p className="m-0 text-sm text-ink-soft">{result.whatChanged}</p> : null}

      {result?.changedSections?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {result.changedSections.map((section) => (
            <span
              className="rounded-none border border-line bg-paper px-2 py-0.5 text-[0.7rem] font-medium text-ink-soft"
              key={section}
            >
              {section}
            </span>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="m-0 border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function StepOverview({
  isLive,
  messages,
  reasoningSteps
}: {
  isLive: boolean;
  messages: string[];
  reasoningSteps: AgentReasoningStep[];
}) {
  if (reasoningSteps.length > 0) {
    return (
      <div className="grid gap-2">
        {reasoningSteps.slice(-5).map((step) => (
          <article
            className="grid gap-1 rounded-none border border-line bg-paper-3 px-3 py-2"
            key={`${step.index}-${step.timestamp}`}
          >
            <div className="flex items-center gap-2 text-xs text-ink-faint">
              <span className="font-semibold text-ink">Step {step.index + 1}</span>
              <span>{step.toolCall ? toolDisplayName(step.toolCall.name) : "Reasoning"}</span>
              <span className="ml-auto">{new Date(step.timestamp).toLocaleTimeString()}</span>
            </div>
            <p className="m-0 line-clamp-3 text-sm text-ink-soft">
              {step.reasoning || step.toolResult || "Waiting for more detail."}
            </p>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {messages.map((message, index) => (
        <article
          className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-none border border-line bg-paper-3 px-3 py-2"
          key={`${message}-${index}`}
        >
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-sm border border-line bg-paper text-[0.65rem] font-semibold text-ink-muted",
              isLive && index === messages.length - 1 && "animate-pulse"
            )}
          >
            {index + 1}
          </span>
          <p className="m-0 pt-0.5 text-sm text-ink-soft">{message}</p>
        </article>
      ))}
    </div>
  );
}

export function RunLogModal({
  open,
  onClose,
  isLive,
  trigger,
  editorModel,
  startedAt,
  finishedAt,
  status,
  messages,
  sourceLogs,
  reasoningSteps,
  result,
  diffLines,
  error
}: RunLogModalProps) {
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const hasReasoningSteps = reasoningSteps.length > 0;
  const selectedStep = reasoningSteps[selectedStepIndex] ?? null;

  useEffect(() => {
    if (selectedStepIndex >= reasoningSteps.length) {
      setSelectedStepIndex(Math.max(reasoningSteps.length - 1, 0));
    }
  }, [reasoningSteps, selectedStepIndex]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="gap-0 overflow-hidden p-0" maxWidth="6xl">
        <DialogHeader>
          <DialogTitle>Run log</DialogTitle>
          <DialogDescription>
            Trace, sources, diffs, and agent steps for this execution.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="min-h-0 flex-1">
        <div className="px-6 py-5">
        <div className="grid gap-6">
          {/* Metadata bar */}
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

          <Tabs className="grid gap-4" defaultValue="overview">
            <TabsList className="w-fit">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
              <TabsTrigger value="steps">Steps</TabsTrigger>
              <TabsTrigger value="diff">Diff</TabsTrigger>
            </TabsList>

            <TabsContent className="grid gap-5" value="overview">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
                <div className="grid gap-5">
                  <ResultSummary error={error} result={result} />
                  {diffLines.length > 0 ? (
                    <DiffViewer compact label="Diff preview" lines={diffLines} maxHeight={280} />
                  ) : null}
                </div>

                <div className="grid content-start gap-5">
                  <div>
                    <h3 className={cn(sectionLabel, "mb-2")}>Recent steps</h3>
                    <StepOverview isLive={isLive} messages={messages} reasoningSteps={reasoningSteps} />
                  </div>

                  {sourceLogs.length > 0 ? (
                    <div>
                      <h3 className={cn(sectionLabel, "mb-2")}>
                        Source signals ({sourceLogs.length})
                      </h3>
                      <div className="grid gap-2">
                        {sourceLogs.slice(0, 3).map((source) => (
                          <SourceCardFull key={source.id} source={source} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </TabsContent>

            <TabsContent className="grid gap-4" value="sources">
              {sourceLogs.length > 0 ? (
                <div className="grid gap-2">
                  {sourceLogs.map((source) => (
                    <SourceCardFull key={source.id} source={source} />
                  ))}
                </div>
              ) : (
                <div className="border border-line bg-paper-3 p-4 text-sm text-ink-soft">
                  No source logs were recorded for this run.
                </div>
              )}
            </TabsContent>

            <TabsContent className="grid gap-4" value="steps">
              {hasReasoningSteps ? (
                <div className="grid grid-cols-[240px_minmax(0,1fr)] items-start gap-6 max-lg:grid-cols-1">
                  <StepTimeline
                    isLive={isLive}
                    onSelect={setSelectedStepIndex}
                    selectedIndex={selectedStepIndex}
                    steps={reasoningSteps}
                  />

                  <div className="grid content-start gap-5">
                    {selectedStep ? (
                      <StepDetail step={selectedStep} />
                    ) : (
                      <p className="text-sm text-ink-soft">Select a step to view details.</p>
                    )}
                  </div>
                </div>
              ) : (
                <LegacyStepView diffLines={diffLines} messages={messages} />
              )}
            </TabsContent>

            <TabsContent className="grid gap-4" value="diff">
              {diffLines.length > 0 ? (
                <DiffViewer label="Full skill diff" lines={diffLines} />
              ) : (
                <div className="border border-line bg-paper-3 p-4 text-sm text-ink-soft">
                  No diff was produced for this run.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
