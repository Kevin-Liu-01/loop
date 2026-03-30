"use client";

import { useEffect, useReducer } from "react";

import { CpuIcon, StopIcon, TerminalIcon, TimerIcon } from "@/components/frontier-icons";
import { cn } from "@/lib/cn";

type SandboxStatusBarProps = {
  sandboxId: string | null;
  runtime: string;
  status: "idle" | "creating" | "running" | "stopped" | "error";
  uptimeSeconds?: number;
  timeoutMs?: number;
  processCount?: number;
  onStop?: () => void;
  className?: string;
};

const statusLabel: Record<SandboxStatusBarProps["status"], string> = {
  idle: "No sandbox",
  creating: "Starting…",
  running: "Running",
  stopped: "Stopped",
  error: "Error",
};

const statusDotColor: Record<SandboxStatusBarProps["status"], string> = {
  idle: "bg-ink-faint/40",
  creating: "animate-pulse bg-warning",
  running: "bg-success shadow-[0_0_6px_rgba(22,163,74,0.4)]",
  stopped: "bg-ink-faint/40",
  error: "bg-danger shadow-[0_0_6px_rgba(185,28,28,0.3)]",
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function SandboxStatusBar({
  sandboxId,
  runtime,
  status,
  uptimeSeconds = 0,
  timeoutMs = 120_000,
  processCount = 0,
  onStop,
  className,
}: SandboxStatusBarProps) {
  const [, tick] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [status]);

  const timeoutSec = timeoutMs / 1000;
  const remaining = Math.max(0, timeoutSec - uptimeSeconds);

  if (status === "idle" && !sandboxId) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-1 text-[0.65rem] text-ink-faint/60",
          className,
        )}
      >
        <TerminalIcon className="h-3 w-3" />
        <span>Sandbox spins up on first message</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line/50 bg-paper-2/50 px-3.5 py-2.5 text-[0.65rem] text-ink-soft",
        "shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:bg-paper-2/40 dark:shadow-[0_1px_3px_rgba(0,0,0,0.1)]",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block h-2 w-2 shrink-0 rounded-full",
          statusDotColor[status],
        )}
      />
      <span className="font-medium text-ink">{statusLabel[status]}</span>
      <span className="text-ink-faint/60">·</span>
      <span className="font-mono text-ink-faint">{runtime}</span>

      {sandboxId && (
        <>
          <span className="text-ink-faint/40">·</span>
          <span className="max-w-[80px] truncate font-mono text-ink-faint/70">
            {sandboxId}
          </span>
        </>
      )}

      {status === "running" && uptimeSeconds > 0 && (
        <>
          <span className="text-ink-faint/40">·</span>
          <span className="flex items-center gap-1 font-mono tabular-nums text-ink-faint">
            <TimerIcon className="h-3 w-3" />
            {formatDuration(remaining)} left
          </span>
        </>
      )}

      {status === "running" && processCount > 0 && (
        <>
          <span className="text-ink-faint/40">·</span>
          <span className="flex items-center gap-1 font-mono tabular-nums text-ink-faint">
            <CpuIcon className="h-3 w-3" />
            {processCount} proc{processCount !== 1 ? "s" : ""}
          </span>
        </>
      )}

      <div className="flex-1" />

      {status === "running" && onStop && (
        <button
          className="flex h-6 items-center gap-1.5 rounded-lg border border-danger/20 bg-danger/[0.04] px-2 text-[0.6rem] font-medium text-danger transition-colors hover:border-danger/30 hover:bg-danger/[0.08] dark:bg-danger/[0.06]"
          onClick={onStop}
          type="button"
        >
          <StopIcon className="h-3 w-3" />
          Stop
        </button>
      )}
    </div>
  );
}
