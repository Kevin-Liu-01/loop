"use client";

import { useState } from "react";

import Image from "next/image";

import {
  ChevronDownIcon,
  CodeIcon,
  FileCodeIcon,
  PlusIcon,
  XIcon,
} from "@/components/frontier-icons";
import { Button } from "@/components/ui/button";
import { FieldGroup, textFieldBase, textFieldCode } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { getPlatformDocIcon } from "@/lib/skill-icons";
import type { AgentDocKey, AgentDocs } from "@/lib/types";
import { AGENT_DOC_FILENAMES } from "@/lib/types";

function PlatformDocFieldIcon({ docKey }: { docKey: string }) {
  const brand = getPlatformDocIcon(docKey);
  if (brand) {
    return (
      <Image
        src={brand.src}
        alt={brand.alt}
        width={14}
        height={14}
        className="shrink-0 dark:invert"
        unoptimized
      />
    );
  }
  return <CodeIcon className="h-3 w-3" />;
}

type AgentDocsEditorProps = {
  value: AgentDocs;
  onChange: (docs: AgentDocs) => void;
  readOnly?: boolean;
};

const PREDEFINED_OPTIONS: { key: AgentDocKey; label: string; description: string }[] = [
  { key: "agents", label: "AGENTS.md", description: "General agent instructions" },
  { key: "cursor", label: "cursor.md", description: "Cursor-specific rules" },
  { key: "claude", label: "claude.md", description: "Claude Code instructions" },
  { key: "codex", label: "codex.md", description: "OpenAI Codex config" },
];

const PREDEFINED_KEYS = new Set<string>(PREDEFINED_OPTIONS.map((o) => o.key));

function docLabel(key: string): string {
  if (key in AGENT_DOC_FILENAMES) return AGENT_DOC_FILENAMES[key as AgentDocKey];
  return `${key}.md`;
}

export function AgentDocsEditor({ value, onChange, readOnly }: AgentDocsEditorProps) {
  const [open, setOpen] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState("");

  const allKeys = Object.keys(value).filter(
    (k) => typeof value[k] === "string" && value[k]!.length > 0
  );
  const predefinedActiveKeys = allKeys.filter((k) => PREDEFINED_KEYS.has(k));
  const customActiveKeys = allKeys.filter((k) => !PREDEFINED_KEYS.has(k));

  const inactivePredefined = PREDEFINED_OPTIONS.filter(
    (opt) => typeof value[opt.key] !== "string" || value[opt.key]!.length === 0
  );

  function addDoc(key: string) {
    const label = key in AGENT_DOC_FILENAMES
      ? AGENT_DOC_FILENAMES[key as AgentDocKey]
      : `${key}.md`;
    onChange({ ...value, [key]: `# ${label}\n\n` });
  }

  function removeDoc(key: string) {
    const next = { ...value };
    delete next[key];
    onChange(next);
  }

  function updateDoc(key: string, content: string) {
    onChange({ ...value, [key]: content });
  }

  function handleAddCustom() {
    const trimmed = customKeyInput.trim().toLowerCase().replace(/\.md$/i, "").replace(/[^a-z0-9_-]/g, "");
    if (!trimmed || allKeys.includes(trimmed)) return;
    addDoc(trimmed);
    setCustomKeyInput("");
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
        {allKeys.length > 0 && (
          <span className="text-xs font-normal tabular-nums text-ink-faint">
            {allKeys.length} attached
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
        Attach agent-specific config files. These are included when the skill is used with each
        agent platform. Add predefined types or create custom docs for any platform.
      </p>

      {/* Predefined doc editors */}
      {predefinedActiveKeys.map((key) => {
        const opt = PREDEFINED_OPTIONS.find((o) => o.key === key);
        return (
          <FieldGroup key={key}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">
                <PlatformDocFieldIcon docKey={key} />
                {opt?.label ?? docLabel(key)}
              </span>
              {!readOnly && (
                <button
                  className="text-xs text-danger hover:text-danger/80"
                  onClick={() => removeDoc(key)}
                  type="button"
                >
                  Remove
                </button>
              )}
            </div>
            <textarea
              className={cn(textFieldBase, textFieldCode, "min-h-[120px]")}
              onChange={(e) => updateDoc(key, e.target.value)}
              readOnly={readOnly}
              value={value[key] ?? ""}
            />
          </FieldGroup>
        );
      })}

      {/* Custom doc editors */}
      {customActiveKeys.map((key) => (
        <FieldGroup key={key}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-accent">
              <PlatformDocFieldIcon docKey={key} />
              {docLabel(key)}
              <span className="rounded-sm bg-accent/10 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-accent">
                custom
              </span>
            </span>
            {!readOnly && (
              <button
                className="inline-flex items-center gap-1 text-xs text-danger hover:text-danger/80"
                onClick={() => removeDoc(key)}
                type="button"
              >
                <XIcon className="h-3 w-3" />
                Remove
              </button>
            )}
          </div>
          <textarea
            className={cn(textFieldBase, textFieldCode, "min-h-[120px]")}
            onChange={(e) => updateDoc(key, e.target.value)}
            readOnly={readOnly}
            value={value[key] ?? ""}
          />
        </FieldGroup>
      ))}

      {!readOnly && (
        <div className="grid gap-3">
          {/* Add predefined docs */}
          {inactivePredefined.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {inactivePredefined.map((opt) => (
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

          {/* Add custom doc */}
          <div className="flex items-center gap-2">
            <input
              className={cn(
                textFieldBase,
                "h-8 flex-1 text-xs placeholder:text-ink-faint"
              )}
              onChange={(e) => setCustomKeyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustom();
                }
              }}
              placeholder="Custom doc name (e.g. windsurf, aider, bolt)"
              value={customKeyInput}
            />
            <Button
              disabled={!customKeyInput.trim()}
              onClick={handleAddCustom}
              size="sm"
              type="button"
              variant="ghost"
            >
              <PlusIcon className="h-3 w-3" />
              Add custom
            </Button>
          </div>
        </div>
      )}
    </details>
  );
}
