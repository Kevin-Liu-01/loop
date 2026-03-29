"use client";

import { StopIcon, TerminalIcon } from "@/components/frontier-icons";
import { cn } from "@/lib/cn";

type SandboxStatusBarProps = {
  sandboxId: string | null;
  runtime: string;
  status: "idle" | "creating" | "running" | "stopped" | "error";
  onStop?: () => void;
  className?: string;
};

const statusLabel: Record<SandboxStatusBarProps["status"], string> = {
  idle: "No sandbox",
  creating: "Starting...",
  running: "Running",
  stopped: "Stopped",
  error: "Error"
};

const statusColor: Record<SandboxStatusBarProps["status"], string> = {
  idle: "bg-zinc-400",
  creating: "bg-amber-400 animate-pulse",
  running: "bg-emerald-500",
  stopped: "bg-zinc-400",
  error: "bg-red-500"
};

export function SandboxStatusBar({
  sandboxId,
  runtime,
  status,
  onStop,
  className
}: SandboxStatusBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-line bg-paper-2/80 px-3 py-2 text-xs text-ink-soft",
        className
      )}
    >
      <span
        aria-hidden
        className={cn("inline-block h-2 w-2 shrink-0 rounded-full", statusColor[status])}
      />
      <span className="font-medium">{statusLabel[status]}</span>
      <span className="text-ink-faint">{runtime}</span>
      {sandboxId && (
        <span className="max-w-[120px] truncate font-mono text-ink-faint">
          {sandboxId}
        </span>
      )}
      <div className="flex-1" />
      {status === "running" && onStop && (
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-red-400 hover:text-red-400"
          onClick={onStop}
          type="button"
        >
          <StopIcon className="h-3 w-3" />
          Stop
        </button>
      )}
      {!sandboxId && (
        <span className="flex items-center gap-1.5 text-ink-faint">
          <TerminalIcon className="h-3 w-3" />
          Sandbox auto-creates on first message
        </span>
      )}
    </div>
  );
}
