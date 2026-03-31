"use client";

import { useState } from "react";

import { ChevronDownIcon, CodeIcon, FileCodeIcon, PlusIcon } from "@/components/frontier-icons";
import { Button } from "@/components/ui/button";
import { FieldGroup, textFieldBase, textFieldCode } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import type { AgentDocKey, AgentDocs } from "@/lib/types";
import { AGENT_DOC_FILENAMES } from "@/lib/types";

type AgentDocsEditorProps = {
  value: AgentDocs;
  onChange: (docs: AgentDocs) => void;
  readOnly?: boolean;
};

const AGENT_DOC_OPTIONS: { key: AgentDocKey; label: string; description: string }[] = [
  { key: "agents", label: "AGENTS.md", description: "General agent instructions" },
  { key: "cursor", label: "cursor.md", description: "Cursor-specific rules" },
  { key: "claude", label: "claude.md", description: "Claude Code instructions" },
  { key: "codex", label: "codex.md", description: "OpenAI Codex config" },
];

export function AgentDocsEditor({ value, onChange, readOnly }: AgentDocsEditorProps) {
  const [open, setOpen] = useState(false);
  const activeKeys = AGENT_DOC_OPTIONS.filter(
    (opt) => typeof value[opt.key] === "string" && value[opt.key]!.length > 0
  );
  const inactiveKeys = AGENT_DOC_OPTIONS.filter(
    (opt) => typeof value[opt.key] !== "string" || value[opt.key]!.length === 0
  );

  function addDoc(key: AgentDocKey) {
    onChange({ ...value, [key]: `# ${AGENT_DOC_FILENAMES[key]}\n\n` });
  }

  function removeDoc(key: AgentDocKey) {
    const next = { ...value };
    delete next[key];
    onChange(next);
  }

  function updateDoc(key: AgentDocKey, content: string) {
    onChange({ ...value, [key]: content });
  }

  return (
    <details
      className="grid gap-4 rounded-2xl border border-line bg-paper-3 p-4"
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      open={open}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
        <FileCodeIcon className="h-4 w-4 text-ink-soft" />
        Agent docs
        {activeKeys.length > 0 && (
          <span className="text-xs font-normal tabular-nums text-ink-faint">
            {activeKeys.length} attached
          </span>
        )}
        <ChevronDownIcon
          className={cn(
            "ml-auto h-3.5 w-3.5 text-ink-faint transition-transform",
            open && "rotate-180"
          )}
        />
      </summary>

      <p className="m-0 text-xs text-ink-soft">
        Attach agent-specific config files. These are included when the skill is used with each agent platform.
      </p>

      {activeKeys.map((opt) => (
        <FieldGroup key={opt.key}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">
              <CodeIcon className="h-3 w-3" />
              {opt.label}
            </span>
            {!readOnly && (
              <button
                className="text-xs text-danger hover:text-danger/80"
                onClick={() => removeDoc(opt.key)}
                type="button"
              >
                Remove
              </button>
            )}
          </div>
          <textarea
            className={cn(textFieldBase, textFieldCode, "min-h-[120px]")}
            onChange={(e) => updateDoc(opt.key, e.target.value)}
            readOnly={readOnly}
            value={value[opt.key] ?? ""}
          />
        </FieldGroup>
      ))}

      {!readOnly && inactiveKeys.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {inactiveKeys.map((opt) => (
            <Button
              key={opt.key}
              onClick={() => addDoc(opt.key)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <PlusIcon className="h-3 w-3" />
              {opt.label}
            </Button>
          ))}
        </div>
      )}
    </details>
  );
}
