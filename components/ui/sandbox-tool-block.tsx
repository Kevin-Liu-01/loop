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
  FileIcon,
  GlobeIcon,
  SearchIcon,
  PackageIcon,
  ZapIcon,
} from "@/components/frontier-icons";
import { BrailleSpinner } from "@/components/ui/braille-spinner";
import { Tip } from "@/components/ui/tip";
import { cn } from "@/lib/cn";

type ToolState = "partial-call" | "call" | "result";

interface ToolBlockProps {
  toolName: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  state?: ToolState;
}

const TOOL_META: Record<
  string,
  { icon: typeof CodeIcon; label: string; verb: string }
> = {
  executeCode: {
    icon: CodeIcon,
    label: "Execute code",
    verb: "Executing code",
  },
  fetchUrl: { icon: GlobeIcon, label: "Fetch URL", verb: "Fetching URL" },
  httpRequest: {
    icon: GlobeIcon,
    label: "HTTP request",
    verb: "Sending request",
  },
  installPackage: {
    icon: PackageIcon,
    label: "Install package",
    verb: "Installing package",
  },
  listFiles: {
    icon: FileIcon,
    label: "List files",
    verb: "Listing files",
  },
  readFile: { icon: FileIcon, label: "Read file", verb: "Reading file" },
  runCommand: {
    icon: TerminalIcon,
    label: "Run command",
    verb: "Running command",
  },
  searchFiles: {
    icon: SearchIcon,
    label: "Search files",
    verb: "Searching files",
  },
  writeFile: {
    icon: FileCodeIcon,
    label: "Write file",
    verb: "Writing file",
  },
};

function fallbackMeta(toolName: string): {
  icon: typeof CodeIcon;
  label: string;
  verb: string;
} {
  if (toolName.startsWith("mcp_")) {
    const cleaned = toolName.replace(/^mcp_/, "").replaceAll("_", " ");
    return { icon: ZapIcon, label: cleaned, verb: cleaned };
  }
  return {
    icon: TerminalIcon,
    label: toolName.replaceAll("_", " "),
    verb: `Running ${toolName.replaceAll("_", " ")}`,
  };
}

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
  if (typeof output.text === "string" && output.text) {
    parts.push(output.text);
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
    const lang =
      typeof input.language === "string" ? `[${input.language}] ` : "";
    const line = code.split("\n")[0] ?? "";
    return lang + (line.length > 60 ? line.slice(0, 60) + "…" : line);
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
  if (toolName === "fetchUrl" || toolName === "httpRequest") {
    const url = input.url ?? input.endpoint ?? "";
    const method = typeof input.method === "string" ? `${input.method} ` : "";
    return `${method}${url}`;
  }
  if (typeof input.query === "string") {
    return input.query;
  }
  if (typeof input.name === "string") {
    return input.name;
  }
  if (typeof input.path === "string") {
    return input.path;
  }
  return "";
}

function formatInput(toolName: string, input: Record<string, unknown>): string {
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
      <span
        className={cn(
          "flex h-[18px] w-[18px] shrink-0 items-center justify-center",
          ok ? "text-success" : "text-danger"
        )}
      >
        {ok ? (
          <CheckIcon className="h-3 w-3" />
        ) : (
          <span className="h-1.5 w-1.5 bg-danger" />
        )}
      </span>
    );
  }
  return (
    <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
      <BrailleSpinner className="text-xs text-accent" />
    </span>
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
    <Tip content={copied ? "Copied!" : "Copy"} side="left">
      <button
        className="flex h-5 w-5 shrink-0 items-center justify-center text-ink-faint/40 opacity-0 transition-all group-hover/block:opacity-100 hover:text-ink-soft"
        onClick={handleCopy}
        type="button"
        aria-label="Copy output"
      >
        {copied ? (
          <CheckIcon className="h-2.5 w-2.5 text-success" />
        ) : (
          <CopyIcon className="h-2.5 w-2.5" />
        )}
      </button>
    </Tip>
  );
}

export function SandboxToolBlock({
  toolName,
  input,
  output,
  state = "result",
}: ToolBlockProps) {
  const isRunning = state !== "result";
  const [open, setOpen] = useState(false);
  const meta = TOOL_META[toolName] ?? fallbackMeta(toolName);
  const Icon = meta.icon;
  const exitCode =
    output && "exitCode" in output ? (output.exitCode as number) : undefined;
  const hasError =
    state === "result" && exitCode !== undefined && exitCode !== 0;
  const summary = formatSummary(toolName, input);
  const lang = typeof input.language === "string" ? input.language : null;
  const outputText = output ? formatOutput(output) : "";

  return (
    <div
      className={cn(
        "group/block overflow-hidden border transition-colors",
        isRunning
          ? "border-accent/20 bg-accent/[0.02]"
          : hasError
            ? "border-danger/20"
            : "border-line"
      )}
    >
      {/* Header */}
      <button
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 text-left text-[0.75rem] transition-colors",
          "bg-paper-2/40 hover:bg-paper-2/70 dark:bg-paper-2/50 dark:hover:bg-paper-2/70"
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
          <span className="bg-paper-3/80 px-1.5 py-px text-[0.5625rem] font-medium text-ink-faint ring-1 ring-line dark:bg-paper-3/40">
            {lang}
          </span>
        )}
        {summary && (
          <span className="min-w-0 flex-1 truncate font-mono text-[0.6875rem] text-ink-faint/60">
            {summary}
          </span>
        )}
        {exitCode !== undefined && (
          <span
            className={cn(
              "ml-auto shrink-0 px-1.5 py-px font-mono text-[0.5625rem] font-semibold tabular-nums",
              exitCode === 0
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            )}
          >
            exit {exitCode}
          </span>
        )}
        {open ? (
          <ChevronDownIcon className="h-3 w-3 shrink-0 text-ink-faint/40" />
        ) : (
          <ChevronRightIcon className="h-3 w-3 shrink-0 text-ink-faint/40" />
        )}
      </button>

      {open && (
        <div className="grid gap-0 border-t border-line/60">
          {/* Input */}
          <div className="relative">
            <pre className="max-h-48 overflow-auto px-3 py-2 font-mono text-[0.7rem] leading-relaxed text-ink-soft">
              {formatInput(toolName, input)}
            </pre>
          </div>

          {/* Output */}
          {output && (
            <div className="relative border-t border-line/60 bg-paper-2/25 dark:bg-paper-2/15">
              <pre
                className={cn(
                  "max-h-48 overflow-auto px-3 py-2 pr-8 font-mono text-[0.7rem] leading-relaxed",
                  hasError ? "text-danger" : "text-ink"
                )}
              >
                {outputText}
              </pre>
              <div className="absolute right-1.5 top-1.5">
                <CopyButton text={outputText} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
