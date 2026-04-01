"use client";

import { useState, useCallback } from "react";

import {
  ChevronDownIcon,
  ChevronRightIcon,
  CodeIcon,
  CopyIcon,
  CheckIcon,
  TerminalIcon,
  FileCodeIcon,
} from "@/components/frontier-icons";
import { Tip } from "@/components/ui/tip";
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
  executeCode: {
    icon: CodeIcon,
    label: "Execute code",
    verb: "Executing code",
  },
  runCommand: {
    icon: TerminalIcon,
    label: "Run command",
    verb: "Running command",
  },
  writeFile: { icon: FileCodeIcon, label: "Write file", verb: "Writing file" },
  readFile: { icon: FileCodeIcon, label: "Read file", verb: "Reading file" },
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
      output.success ? `wrote ${output.path}` : `failed ${output.path}`,
    );
  }
  return parts.join("\n") || JSON.stringify(output, null, 2);
}

function formatSummary(
  toolName: string,
  input: Record<string, unknown>,
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
  input: Record<string, unknown>,
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

function StatusIndicator({
  state,
  exitCode,
}: {
  state: ToolState;
  exitCode?: number;
}) {
  if (state === "result") {
    const ok = exitCode === undefined || exitCode === 0;
    return (
      <Tip content={ok ? "Completed successfully" : `Failed with exit code ${exitCode}`} side="top">
        {ok ? (
          <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-success/15">
            <CheckIcon className="h-3 w-3 text-success" />
          </span>
        ) : (
          <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-danger/15">
            <span className="h-2 w-2 rounded-full bg-danger" />
          </span>
        )}
      </Tip>
    );
  }
  return (
    <Tip content="Executing…" side="top">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-[1.5px] border-accent/20 border-t-accent" />
    </Tip>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may not be available */
    }
  }, [text]);

  return (
    <Tip content={copied ? "Copied!" : "Copy output"} side="left">
      <button
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-ink-faint/50 opacity-0 transition-all group-hover/block:opacity-100 hover:bg-paper-3/60 hover:text-ink-soft"
        onClick={handleCopy}
        type="button"
        aria-label="Copy output"
      >
        {copied ? (
          <CheckIcon className="h-3 w-3 text-success" />
        ) : (
          <CopyIcon className="h-3 w-3" />
        )}
      </button>
    </Tip>
  );
}

function languageBadge(input: Record<string, unknown>): string | null {
  if (typeof input.language === "string") return input.language;
  return null;
}

export function SandboxToolBlock({
  toolName,
  input,
  output,
  state = "result",
}: ToolBlockProps) {
  const isRunning = state !== "result";
  const [open, setOpen] = useState(true);
  const meta = TOOL_META[toolName] ?? {
    icon: TerminalIcon,
    label: toolName,
    verb: `Running ${toolName}`,
  };
  const Icon = meta.icon;
  const exitCode =
    output && "exitCode" in output ? (output.exitCode as number) : undefined;
  const hasError =
    state === "result" && exitCode !== undefined && exitCode !== 0;
  const summary = formatSummary(toolName, input);
  const lang = languageBadge(input);
  const outputText = output ? formatOutput(output) : "";

  return (
    <div
      className={cn(
        "group/block my-2.5 overflow-hidden rounded-xl border transition-all duration-200",
        isRunning
          ? "border-accent/20 shadow-[0_0_0_1px_rgba(232,101,10,0.04)]"
          : hasError
            ? "border-danger/20 shadow-[0_0_0_1px_rgba(185,28,28,0.04)]"
            : "border-line/50 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.1)]",
      )}
    >
      {/* Header bar */}
      <button
        className={cn(
          "flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs transition-colors",
          "bg-paper-2/50 hover:bg-paper-2/80 dark:bg-paper-2/60 dark:hover:bg-paper-2/80",
        )}
        onClick={() => setOpen((p) => !p)}
        type="button"
      >
        <StatusIndicator state={state} exitCode={exitCode} />
        <Icon className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
        <span className="font-medium text-ink">
          {isRunning ? meta.verb : meta.label}
        </span>
        {lang && (
          <Tip content={`Language: ${lang}`} side="top">
            <span className="rounded-md bg-paper-3/80 px-1.5 py-0.5 text-[0.55rem] font-medium text-ink-faint ring-1 ring-line/30 dark:bg-paper-3/40">
              {lang}
            </span>
          </Tip>
        )}
        {summary && (
          <span className="min-w-0 flex-1 truncate text-[0.65rem] text-ink-faint/70">
            {summary}
          </span>
        )}
        {exitCode !== undefined && (
          <Tip content={exitCode === 0 ? "Process exited cleanly" : "Non-zero exit – check stderr"} side="top">
            <span
              className={cn(
                "ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-[0.55rem] font-semibold tabular-nums",
                exitCode === 0
                  ? "bg-success/10 text-success"
                  : "bg-danger/10 text-danger",
              )}
            >
              exit {exitCode}
            </span>
          </Tip>
        )}
        {open ? (
          <ChevronDownIcon className="h-3 w-3 shrink-0 text-ink-faint/50" />
        ) : (
          <ChevronRightIcon className="h-3 w-3 shrink-0 text-ink-faint/50" />
        )}
      </button>

      {open && (
        <div className="grid gap-0 border-t border-line/30">
          {/* Input */}
          <div className="relative">
            <pre className="max-h-52 overflow-auto px-3.5 py-2.5 font-mono text-[0.7rem] leading-relaxed text-ink-soft">
              {formatInput(toolName, input)}
            </pre>
          </div>

          {/* Output */}
          {output && (
            <div className="relative border-t border-line/30 bg-paper-2/30 dark:bg-paper-2/20">
              <pre
                className={cn(
                  "max-h-52 overflow-auto px-3.5 py-2.5 pr-10 font-mono text-[0.7rem] leading-relaxed",
                  hasError ? "text-danger" : "text-ink",
                )}
              >
                {outputText}
              </pre>
              <div className="absolute right-2 top-2">
                <CopyButton text={outputText} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
