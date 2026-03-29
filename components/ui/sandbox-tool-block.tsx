"use client";

import { useState } from "react";

import {
  ChevronDownIcon,
  ChevronRightIcon,
  CodeIcon,
  TerminalIcon
} from "@/components/frontier-icons";
import { cn } from "@/lib/cn";

type ToolBlockProps = {
  toolName: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  defaultOpen?: boolean;
};

const toolMeta: Record<string, { icon: typeof CodeIcon; label: string }> = {
  executeCode: { icon: CodeIcon, label: "Execute code" },
  runCommand: { icon: TerminalIcon, label: "Run command" },
  writeFile: { icon: CodeIcon, label: "Write file" },
  readFile: { icon: CodeIcon, label: "Read file" }
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
    parts.push(`exit: ${output.exitCode}`);
  }
  if ("success" in output && typeof output.path === "string") {
    parts.push(output.success ? `wrote ${output.path}` : `failed ${output.path}`);
  }
  return parts.join("\n") || JSON.stringify(output, null, 2);
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

export function SandboxToolBlock({
  toolName,
  input,
  output,
  defaultOpen = false
}: ToolBlockProps) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = toolMeta[toolName] ?? { icon: TerminalIcon, label: toolName };
  const Icon = meta.icon;
  const exitCode =
    output && "exitCode" in output ? (output.exitCode as number) : undefined;

  return (
    <div className="my-2 overflow-hidden rounded-xl border border-line bg-paper-2/60">
      <button
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-ink-soft transition-colors hover:text-ink"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        {open ? (
          <ChevronDownIcon className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronRightIcon className="h-3 w-3 shrink-0" />
        )}
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{meta.label}</span>
        {exitCode !== undefined && (
          <span
            className={cn(
              "ml-auto tabular-nums",
              exitCode === 0 ? "text-emerald-500" : "text-red-400"
            )}
          >
            exit {exitCode}
          </span>
        )}
      </button>

      {open && (
        <div className="grid gap-0 border-t border-line">
          <pre className="max-h-48 overflow-auto px-3 py-2 font-mono text-[0.72rem] leading-relaxed text-ink-soft">
            {formatInput(toolName, input)}
          </pre>
          {output && (
            <pre className="max-h-48 overflow-auto border-t border-line/60 bg-paper-3/40 px-3 py-2 font-mono text-[0.72rem] leading-relaxed text-ink">
              {formatOutput(output)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
