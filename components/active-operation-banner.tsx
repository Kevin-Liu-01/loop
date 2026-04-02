"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useActiveOperations } from "@/components/active-operations-provider";
import { AutomationIcon, RefreshIcon, ArrowRightIcon, CheckIcon, XIcon } from "@/components/frontier-icons";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StepIndicatorCompact } from "@/components/ui/step-indicator";
import { Tip } from "@/components/ui/tip";
import { cn } from "@/lib/cn";
import { computeElapsedLabel, isTerminalStatus } from "@/lib/active-operations";
import type { ActiveOperation, ActiveOperationKind } from "@/lib/active-operations";

function KindIcon({ kind, className }: { kind: ActiveOperationKind; className?: string }) {
  switch (kind) {
    case "skill-update":
    case "automation-run":
      return <AutomationIcon className={className} />;
    case "refresh":
      return <RefreshIcon className={className} />;
    case "mcp-upload":
    case "skill-import":
      return <RefreshIcon className={className} />;
  }
}

function kindLabel(kind: ActiveOperationKind): string {
  switch (kind) {
    case "skill-update":
      return "Updating";
    case "mcp-upload":
      return "Uploading MCP";
    case "skill-import":
      return "Importing";
    case "automation-run":
      return "Running automation";
    case "refresh":
      return "Refreshing";
  }
}

function statusBadge(op: ActiveOperation): { color: "blue" | "green" | "orange" | "neutral"; label: string } {
  switch (op.status) {
    case "queued":
      return { color: "neutral", label: "queued" };
    case "running":
      return { color: "blue", label: "running" };
    case "completing":
      return { color: "orange", label: "finishing" };
    case "done":
      return { color: "green", label: "done" };
    case "error":
      return { color: "orange", label: "error" };
  }
}

function toProgressBarStatus(status: ActiveOperation["status"]): "active" | "done" | "error" {
  if (status === "done") return "done";
  if (status === "error") return "error";
  return "active";
}

function ElapsedTimer({ startedAt }: { startedAt: number }) {
  const [label, setLabel] = useState(() => computeElapsedLabel(startedAt));

  useEffect(() => {
    const interval = setInterval(() => setLabel(computeElapsedLabel(startedAt)), 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return <span className="tabular-nums">{label}</span>;
}

function OperationRow({ op }: { op: ActiveOperation }) {
  const badge = statusBadge(op);
  const isActive = !isTerminalStatus(op.status);
  const isDone = op.status === "done";
  const isError = op.status === "error";

  const stepsLabel =
    op.totalSteps > 0
      ? `${op.completedSteps}/${op.totalSteps} sources`
      : null;

  return (
    <article
      className={cn(
        "group relative grid gap-2 rounded-xl border px-4 py-3 transition-all duration-300",
        isActive && "border-accent/25 bg-accent/[0.04] shadow-[0_0_0_1px_var(--color-accent)/0.06]",
        isDone && "border-success/25 bg-success/[0.04]",
        isError && "border-danger/25 bg-danger/[0.04]"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-ink-soft [&>svg]:h-3.5 [&>svg]:w-3.5",
            isActive && "border-accent/20 bg-accent/10 operation-icon-pulse",
            isDone && "border-success/20 bg-success/10",
            isError && "border-danger/20 bg-danger/10"
          )}
        >
          {isDone ? (
            <CheckIcon className="h-3.5 w-3.5 text-success" />
          ) : isError ? (
            <XIcon className="h-3.5 w-3.5 text-danger" />
          ) : (
            <KindIcon className={cn("h-3.5 w-3.5", isActive && "animate-spin")} kind={op.kind} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-ink">
              {kindLabel(op.kind)} {op.label}
            </span>
            <Tip content={`Operation is ${badge.label}`} side="top">
              <span><Badge color={badge.color} size="sm">{badge.label}</Badge></span>
            </Tip>
            {op.trigger === "automation" && (
              <Tip content="Triggered by a scheduled automation" side="top">
                <span><Badge color="indigo" size="sm">auto</Badge></span>
              </Tip>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-faint">
            {stepsLabel && <span className="tabular-nums">{stepsLabel}</span>}
            {stepsLabel && <span>·</span>}
            <ElapsedTimer startedAt={op.startedAt} />
            {op.latestMessage && (
              <>
                <span>·</span>
                <span className="truncate">{op.latestMessage}</span>
              </>
            )}
          </div>
        </div>

        {op.href && (
          <Link
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
            href={op.href}
          >
            View
            <ArrowRightIcon className="h-3 w-3" />
          </Link>
        )}
      </div>

      {op.totalSteps > 1 && (
        <StepIndicatorCompact
          className="px-1"
          completed={op.completedSteps}
          hasError={isError}
          total={op.totalSteps}
        />
      )}
      <ProgressBar
        progress={op.progress || undefined}
        status={toProgressBarStatus(op.status)}
      />

      {isError && op.errorMessage && (
        <p className="m-0 text-xs text-danger">{op.errorMessage}</p>
      )}
    </article>
  );
}

export function ActiveOperationBanner() {
  const { operations, clearCompleted } = useActiveOperations();

  if (operations.length === 0) return null;

  const hasCompleted = operations.some((op) => isTerminalStatus(op.status));

  return (
    <section aria-label="Active operations" className="grid gap-2">
      {operations.length > 1 && hasCompleted && (
        <div className="flex justify-end">
          <Tip content="Remove finished and errored operations from this list" side="left">
            <button
              className="text-[0.65rem] font-medium text-ink-faint transition-colors hover:text-ink-soft"
              onClick={clearCompleted}
              type="button"
            >
              Clear completed
            </button>
          </Tip>
        </div>
      )}
      {operations.map((op) => (
        <OperationRow key={op.id} op={op} />
      ))}
    </section>
  );
}
