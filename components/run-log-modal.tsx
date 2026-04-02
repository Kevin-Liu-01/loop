"use client";

import { useEffect, useState } from "react";

import { DiffViewer } from "@/components/diff-viewer";
import { AutomationIcon, ClockIcon, CpuIcon, SearchIcon, SparkIcon } from "@/components/frontier-icons";
import { Badge } from "@/components/ui/badge";
import { RunMetadataBar } from "@/components/ui/run-metadata-bar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import { ScrollArea } from "@/components/ui/shadcn/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/shadcn/tabs";
import { useAppTimezone } from "@/hooks/use-app-timezone";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/format";
import type {
  AgentReasoningStep,
  DiffLine,
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

const SECTION_LABEL = "text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-ink-soft";

function formatDuration(startedAt: string, finishedAt: string): string {
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  analyze_signals: "Analyze signals",
  read_current_skill: "Read skill",
  web_search: "Web search",
  fetch_page: "Fetch page",
  add_source: "Discover source",
  revise_skill: "Revise skill",
  finalize: "Finalize",
};

function toolDisplayName(name: string): string {
  return TOOL_DISPLAY_NAMES[name] ?? name.replace(/_/g, " ");
}

const TOOL_DOT_COLORS: Record<string, string> = {
  web_search: "bg-sky-500",
  fetch_page: "bg-indigo-500",
  add_source: "bg-emerald-500",
  revise_skill: "bg-accent",
  finalize: "bg-success",
};

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
      <h3 className={cn(SECTION_LABEL, "mb-2")}>Agent steps</h3>
      <div className="grid gap-0">
        {steps.map((step) => {
          const isCurrent = step.index === selectedIndex;
          const hasDiff = step.diffLines && step.diffLines.length > 0;
          const isLatestLive = isLive && step.index === steps.length - 1;
          const toolName = step.toolCall?.name;
          const dotColor = toolName ? TOOL_DOT_COLORS[toolName] ?? "bg-ink-muted" : "bg-ink-muted";

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
              <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                <span
                  className={cn(
                    "absolute inset-0 rounded-full opacity-20 transition-colors",
                    isCurrent ? dotColor : "bg-transparent"
                  )}
                />
                <span
                  className={cn(
                    "relative flex h-5 w-5 items-center justify-center border text-[0.6rem] font-bold",
                    isCurrent
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-paper-3 text-ink-muted",
                    isLatestLive && "animate-pulse"
                  )}
                >
                  {step.index + 1}
                </span>
              </span>
              <span className="min-w-0 flex-1 truncate">
                {step.toolCall ? toolDisplayName(step.toolCall.name) : "Reasoning"}
              </span>
              {toolName && (
                <span className={cn("ml-auto h-1.5 w-1.5 shrink-0 rounded-full", dotColor)} />
              )}
              {hasDiff ? (
                <span className="h-2 w-2 shrink-0 rounded-full bg-success" />
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
        <span className="ml-auto text-xs tabular-nums text-ink-faint">
          {source.itemCount} signal{source.itemCount === 1 ? "" : "s"} · {source.status}
        </span>
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


function StepDetail({ step, timeZone }: { step: AgentReasoningStep; timeZone: string }) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center border border-line bg-paper-3 text-ink-soft [&>svg]:h-3.5 [&>svg]:w-3.5">
          <AutomationIcon />
        </span>
        <span className="text-sm font-semibold text-ink">
          Step {step.index + 1}
          {step.toolCall ? ` – ${toolDisplayName(step.toolCall.name)}` : " – Reasoning"}
        </span>
        <span className="ml-auto text-[0.65rem] tabular-nums text-ink-muted">
          {formatTime(step.timestamp, timeZone)}
        </span>
      </div>

      {step.reasoning ? (
        <div className="border border-line bg-paper-3 p-4">
          <h4 className={cn(SECTION_LABEL, "mb-2")}>Agent reasoning</h4>
          <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
            {step.reasoning}
          </p>
        </div>
      ) : null}

      {step.toolCall ? (
        <div className="border border-line bg-paper-3 p-4">
          <h4 className={cn(SECTION_LABEL, "mb-2")}>Tool call</h4>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Badge color="indigo">{step.toolCall.name}</Badge>
            </div>
            <details className="group">
              <summary className="cursor-pointer text-xs font-medium text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-1">
                  Arguments
                  <span className="text-ink-muted transition-transform group-open:rotate-90">&#9654;</span>
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
          <h4 className={cn(SECTION_LABEL, "mb-2")}>Tool result</h4>
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
        <h4 className={cn(SECTION_LABEL, "mb-2")}>Agent steps</h4>
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
  const { timeZone } = useAppTimezone();
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const hasReasoningSteps = reasoningSteps.length > 0;
  const selectedStep = reasoningSteps[selectedStepIndex] ?? null;
  const totalSignals = sourceLogs.reduce((acc, s) => acc + s.itemCount, 0);
  const totalSteps = hasReasoningSteps ? reasoningSteps.length : messages.length;
  const addedCount = diffLines.filter((l) => l.type === "added").length;
  const removedCount = diffLines.filter((l) => l.type === "removed").length;

  useEffect(() => {
    if (selectedStepIndex >= reasoningSteps.length) {
      setSelectedStepIndex(Math.max(reasoningSteps.length - 1, 0));
    }
  }, [reasoningSteps, selectedStepIndex]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="gap-0 overflow-hidden p-0" maxWidth="4xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-line bg-paper-3 text-ink-soft [&>svg]:h-4 [&>svg]:w-4">
              <AutomationIcon />
            </span>
            <div className="grid gap-0.5">
              <DialogTitle>Run log</DialogTitle>
              <DialogDescription>
                Trace, sources, diffs, and agent steps for this execution.
              </DialogDescription>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge color={status === "error" ? "red" : status === "running" ? "amber" : "green"}>
              {status}
            </Badge>
            <Badge color="neutral">
              <ClockIcon className="mr-1 h-3 w-3" />
              {startedAt && finishedAt ? formatDuration(startedAt, finishedAt) : "running..."}
            </Badge>
            <Badge color="blue">
              <SearchIcon className="mr-1 h-3 w-3" />
              {sourceLogs.length} source{sourceLogs.length === 1 ? "" : "s"}
            </Badge>
            <Badge color="teal">
              <SparkIcon className="mr-1 h-3 w-3" />
              {totalSignals} signal{totalSignals === 1 ? "" : "s"}
            </Badge>
            <Badge color="neutral">
              <CpuIcon className="mr-1 h-3 w-3" />
              {totalSteps} step{totalSteps === 1 ? "" : "s"}
            </Badge>
          </div>
        </DialogHeader>
        <ScrollArea className="min-h-0 flex-1">
        <div className="px-6 py-5">
        <div className="grid gap-6">
          <RunMetadataBar
            addedSourceCount={result?.addedSources?.length}
            editorModel={editorModel}
            finishedAt={finishedAt}
            searchesUsed={result?.searchesUsed}
            sourceLogs={sourceLogs}
            startedAt={startedAt}
            status={status}
            trigger={trigger}
            variant="full"
          />

          <Tabs className="grid gap-4" defaultValue="steps">
            <TabsList className="w-fit">
              <TabsTrigger value="steps">
                Steps
                {totalSteps > 0 ? <span className="ml-1 tabular-nums text-ink-faint">({totalSteps})</span> : null}
              </TabsTrigger>
              <TabsTrigger value="diff">
                Diff
                {diffLines.length > 0 ? (
                  <span className="ml-1 tabular-nums text-ink-faint">
                    (+{addedCount} −{removedCount})
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="sources">
                Sources
                {sourceLogs.length > 0 ? <span className="ml-1 tabular-nums text-ink-faint">({sourceLogs.length})</span> : null}
              </TabsTrigger>
            </TabsList>

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
                      <StepDetail step={selectedStep} timeZone={timeZone} />
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
          </Tabs>
        </div>
      </div>
      </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
