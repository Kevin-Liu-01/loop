"use client";

import { useState, useEffect } from "react";

import {
  ChevronDownIcon,
  ChevronRightIcon,
  CodeIcon,
  TerminalIcon,
  FileCodeIcon,
  CheckIcon,
  TriangleAlertIcon
} from "@/components/frontier-icons";
import { cn } from "@/lib/cn";

type ToolState = "partial-call" | "call" | "result";

type ToolBlockProps = {
  toolName: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  state?: ToolState;
};

const TOOL_META: Record<
  string,
  { icon: typeof CodeIcon; label: string; verb: string }
> = {
  executeCode: { icon: CodeIcon, label: "Execute code", verb: "Executing code" },
  runCommand: {
    icon: TerminalIcon,
    label: "Run command",
    verb: "Running command"
  },
  writeFile: { icon: FileCodeIcon, label: "Write file", verb: "Writing file" },
  readFile: { icon: FileCodeIcon, label: "Read file", verb: "Reading file" }
};

function formatOutput(output: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof output.stdout === "string" && output.stdout) {
    parts.push(output.stdout);
  }
  if (typeof output.stderr === "string" && output.stderr) {
    parts.push(`stderr: ${output.stderr}`);
  }
  if (typeof output.content === "string" && output.content) {
    parts.push(output.content);
  }
  if ("exitCode" in output) {
    parts.push(`exit ${output.exitCode}`);
  }
  if ("success" in output && typeof output.path === "string") {
    parts.push(
      output.success ? `wrote ${output.path}` : `failed ${output.path}`
    );
  }
  return parts.join("\n") || JSON.stringify(output, null, 2);
}

function formatSummary(
  toolName: string,
  input: Record<string, unknown>
): string {
  if (toolName === "executeCode") {
    const code = typeof input.code === "string" ? input.code : "";
    const line = code.split("\n")[0] ?? "";
    return line.length > 50 ? line.slice(0, 50) + "…" : line;
  }
  if (toolName === "runCommand") {
    const cmd = input.command ?? "";
    const args = Array.isArray(input.args) ? input.args.join(" ") : "";
    return `$ ${cmd} ${args}`.trim();
  }
  if (
    (toolName === "writeFile" || toolName === "readFile") &&
    typeof input.path === "string"
  ) {
    return input.path;
  }
  return "";
}

function formatInput(
  toolName: string,
  input: Record<string, unknown>
): string {
  if (toolName === "executeCode" && typeof input.code === "string") {
    return input.code;
  }
  if (toolName === "runCommand") {
    const cmd = input.command ?? "";
    const args = Array.isArray(input.args) ? input.args.join(" ") : "";
    return `$ ${cmd} ${args}`.trim();
  }
  if (toolName === "writeFile" && typeof input.path === "string") {
    return `${input.path}\n${typeof input.content === "string" ? input.content : ""}`;
  }
  if (toolName === "readFile" && typeof input.path === "string") {
    return input.path;
  }
  return JSON.stringify(input, null, 2);
}

function StatusDot({
  state,
  exitCode
}: {
  state: ToolState;
  exitCode?: number;
}) {
  if (state === "result") {
    const ok = exitCode === undefined || exitCode === 0;
    return ok ? (
      <CheckIcon className="h-3 w-3 text-emerald-500" />
    ) : (
      <TriangleAlertIcon className="h-3 w-3 text-red-400" />
    );
  }
  return (
    <span className="inline-block h-3 w-3 animate-spin rounded-full border-[1.5px] border-accent/30 border-t-accent" />
  );
}

export function SandboxToolBlock({
  toolName,
  input,
  output,
  state = "result"
}: ToolBlockProps) {
  const isRunning = state !== "result";
  const [open, setOpen] = useState(isRunning);
  const meta = TOOL_META[toolName] ?? {
    icon: TerminalIcon,
    label: toolName,
    verb: `Running ${toolName}`
  };
  const Icon = meta.icon;
  const exitCode =
    output && "exitCode" in output ? (output.exitCode as number) : undefined;
  const hasError =
    state === "result" && exitCode !== undefined && exitCode !== 0;
  const summary = formatSummary(toolName, input);

  useEffect(() => {
    if (state === "result") {
      const timer = setTimeout(() => setOpen(false), 800);
      return () => clearTimeout(timer);
    }
    setOpen(true);
  }, [state]);

  return (
    <div
      className={cn(
        "my-2 overflow-hidden rounded-lg border transition-colors duration-200",
        isRunning
          ? "border-accent/30 bg-accent/3"
          : hasError
            ? "border-red-400/30 bg-red-400/3"
            : "border-line bg-paper-2/40"
      )}
    >
      <button
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-paper-3/40"
        onClick={() => setOpen((p) => !p)}
        type="button"
      >
        <StatusDot state={state} exitCode={exitCode} />
        <Icon className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
        <span className="font-medium text-ink-soft">
          {isRunning ? meta.verb : meta.label}
        </span>
        {summary && (
          <span className="min-w-0 flex-1 truncate font-mono text-[0.65rem] text-ink-faint">
            {summary}
          </span>
        )}
        {exitCode !== undefined && (
          <span
            className={cn(
              "ml-auto shrink-0 font-mono text-[0.6rem] tabular-nums",
              exitCode === 0 ? "text-emerald-500" : "text-red-400"
            )}
          >
            exit {exitCode}
          </span>
        )}
        {open ? (
          <ChevronDownIcon className="h-3 w-3 shrink-0 text-ink-faint" />
        ) : (
          <ChevronRightIcon className="h-3 w-3 shrink-0 text-ink-faint" />
        )}
      </button>

      {open && (
        <div className="grid gap-0 border-t border-line/40">
          <pre className="max-h-52 overflow-auto px-3 py-2 font-mono text-[0.7rem] leading-relaxed text-ink-soft">
            {formatInput(toolName, input)}
          </pre>
          {output && (
            <pre
              className={cn(
                "max-h-52 overflow-auto border-t border-line/40 px-3 py-2 font-mono text-[0.7rem] leading-relaxed",
                hasError ? "text-red-400" : "text-ink"
              )}
            >
              {formatOutput(output)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
