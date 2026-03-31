"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { AutomationIcon, GlobeIcon } from "@/components/frontier-icons";
import { Button } from "@/components/ui/button";
import { FieldGroup, textFieldBase, textFieldArea, textFieldSelect } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import { cn } from "@/lib/cn";
import { formatAutomationSchedule } from "@/lib/format";
import { formatNextRun, countMonthlyRuns } from "@/lib/schedule";
import type { AutomationSummary, SourceDefinition } from "@/lib/types";
import { CADENCE_OPTIONS, cadenceToRRule, rruleToCadence } from "@/lib/automation-constants";

const MODEL_OPTIONS = [
  { value: "", label: "Default (auto)" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
  { value: "claude-haiku-3.5", label: "Claude Haiku 3.5" },
] as const;

const fieldLabel = "text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-ink-faint";

type AutomationEditModalProps = {
  automation: AutomationSummary;
  open: boolean;
  onClose: () => void;
  skillName?: string;
  skillSlug?: string;
  sources?: SourceDefinition[];
  canManage?: boolean;
  isOperator?: boolean;
};

export function AutomationEditModal({
  automation,
  open,
  onClose,
  skillName,
  skillSlug,
  sources = [],
  canManage = true,
  isOperator = false,
}: AutomationEditModalProps) {
  const router = useRouter();
  const [name, setName] = useState(automation.name);
  const [cadence, setCadence] = useState(rruleToCadence(automation.schedule));
  const [status, setStatus] = useState<"ACTIVE" | "PAUSED">(automation.status as "ACTIVE" | "PAUSED");
  const [prompt, setPrompt] = useState(automation.prompt);
  const [preferredModel, setPreferredModel] = useState(automation.preferredModel ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const linkedSkillLabel = skillName ?? automation.matchedSkillSlugs[0] ?? "";
  const linkedSlug = skillSlug ?? automation.matchedSkillSlugs[0] ?? "";
  const previewSchedule = cadenceToRRule(cadence);

  useEffect(() => {
    setName(automation.name);
    setCadence(rruleToCadence(automation.schedule));
    setStatus(automation.status as "ACTIVE" | "PAUSED");
    setPrompt(automation.prompt);
    setPreferredModel(automation.preferredModel ?? "");
    setError(null);
  }, [automation]);

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch(`/api/automations/${automation.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, cadence, status, prompt, preferredModel: preferredModel || undefined })
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to update automation.");
        return;
      }

      router.refresh();
      onClose();
    });
  }

  function handleDelete() {
    if (!confirm(`Disable automation for "${linkedSkillLabel || automation.name}"?`)) return;

    startDeleteTransition(async () => {
      const response = await fetch(`/api/automations/${automation.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Unable to disable automation.");
        return;
      }

      router.refresh();
      onClose();
    });
  }

  const now = new Date();
  const monthlyRuns = countMonthlyRuns(previewSchedule, now.getFullYear(), now.getMonth());
  const nextRunLabel = status === "PAUSED" ? "Paused" : formatNextRun(previewSchedule);
  const previewScheduleLabel = formatAutomationSchedule(previewSchedule);
  const isActive = status === "ACTIVE";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="gap-0 overflow-hidden p-0" maxWidth="2xl">
        <DialogHeader className="gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
              isActive
                ? "border-accent/25 bg-accent/[0.07] text-accent"
                : "border-line bg-paper-3 text-ink-faint"
            )}>
              <AutomationIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg">
                {canManage ? "Edit automation" : "Automation details"}
              </DialogTitle>
              <DialogDescription className="m-0 text-[0.8125rem] leading-snug text-ink-soft">
                {linkedSkillLabel ? (
                  <>
                    {linkedSlug ? (
                      <Link className="font-medium text-ink hover:text-accent transition-colors" href={`/skills/${linkedSlug}`}>
                        {linkedSkillLabel}
                      </Link>
                    ) : (
                      <span className="font-medium text-ink">{linkedSkillLabel}</span>
                    )}
                    {" · "}
                  </>
                ) : null}
                {previewScheduleLabel}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form className="flex min-h-0 flex-1 flex-col gap-0" onSubmit={handleSave}>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Stats ribbon */}
            <div className="grid grid-cols-3 divide-x divide-line border-b border-line bg-paper-2/40 dark:bg-paper-2/20">
              <StatCell label="Next run" value={nextRunLabel} muted={!isActive} />
              <StatCell label="This month" value={`${monthlyRuns} runs`} />
              <StatCell label="Status" value={isActive ? "Active" : "Paused"} accent={isActive} />
            </div>

            <div className="grid gap-6 px-6 py-5">
              {/* Two-col: Name + Schedule */}
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <FieldGroup>
                  <span className={fieldLabel}>Name</span>
                  <input
                    className={cn(textFieldBase, "min-h-11 py-3 text-sm")}
                    disabled={!canManage}
                    maxLength={80}
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                  />
                </FieldGroup>

                <FieldGroup>
                  <span className={fieldLabel}>Schedule</span>
                  <select
                    disabled={!canManage}
                    className={cn(textFieldBase, textFieldSelect, "min-h-11 py-3 text-sm")}
                    onChange={(e) => setCadence(e.target.value as typeof cadence)}
                    value={cadence}
                  >
                    {CADENCE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FieldGroup>
              </div>

              {/* Two-col: Status + AI Model */}
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <FieldGroup>
                  <span className={fieldLabel}>Status</span>
                  <select
                    disabled={!canManage}
                    className={cn(textFieldBase, textFieldSelect, "min-h-11 py-3 text-sm")}
                    onChange={(e) => setStatus(e.target.value as "ACTIVE" | "PAUSED")}
                    value={status}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                  </select>
                </FieldGroup>

                <FieldGroup>
                  <span className={fieldLabel}>
                    AI Model
                    {!isOperator && <span className="ml-1 normal-case tracking-normal text-ink-faint/60">(Operator)</span>}
                  </span>
                  <select
                    disabled={!canManage || !isOperator}
                    className={cn(textFieldBase, textFieldSelect, "min-h-11 py-3 text-sm", !isOperator && "opacity-40")}
                    onChange={(e) => setPreferredModel(e.target.value)}
                    value={preferredModel}
                  >
                    {MODEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </FieldGroup>
              </div>

              {/* Prompt */}
              <FieldGroup>
                <span className={fieldLabel}>Prompt</span>
                <textarea
                  className={cn(textFieldBase, textFieldArea, "min-h-28 py-3 text-sm leading-relaxed")}
                  maxLength={2000}
                  onChange={(e) => setPrompt(e.target.value)}
                  readOnly={!canManage}
                  rows={4}
                  value={prompt}
                />
              </FieldGroup>

              {/* Sources */}
              {sources.length > 0 && (
                <div className="grid gap-2">
                  <span className={fieldLabel}>
                    Sources
                    <span className="ml-1.5 normal-case tracking-normal text-ink-faint/60">
                      ({sources.length})
                    </span>
                  </span>
                  <div className="grid gap-1">
                    {sources.map((src) => (
                      <a
                        className="group flex min-w-0 items-center gap-2 rounded-lg border border-line/60 bg-paper-2/40 px-3 py-2 transition-colors hover:border-accent/20 hover:bg-paper-2/70 dark:bg-paper-2/20"
                        href={src.url}
                        key={src.id}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <GlobeIcon className="h-3.5 w-3.5 shrink-0 text-ink-faint group-hover:text-accent" />
                        <span className="min-w-0 truncate text-sm text-ink-soft group-hover:text-ink">
                          {src.label}
                        </span>
                        <span className="ml-auto shrink-0 text-[0.625rem] font-medium text-ink-faint/60">
                          {src.kind}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Workspaces */}
              {automation.cwd.length > 0 && (
                <div className="grid gap-2">
                  <span className={fieldLabel}>Workspaces</span>
                  <div className="grid gap-1">
                    {automation.cwd.map((dir) => (
                      <div
                        className="truncate rounded-lg border border-line/60 bg-paper-2/40 px-3 py-2 font-mono text-xs text-ink-soft dark:bg-paper-2/20"
                        key={dir}
                      >
                        {dir}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="m-0 text-sm font-medium text-danger">{error}</p>}
            </div>
          </div>

          {canManage ? (
            <DialogFooter className="justify-between sm:justify-between">
              <Button
                disabled={isDeleting || isPending}
                onClick={handleDelete}
                type="button"
                variant="danger"
                size="sm"
              >
                {isDeleting ? "Disabling…" : "Disable"}
              </Button>

              <div className="flex items-center gap-2">
                <Button onClick={onClose} type="button" variant="ghost" size="sm">
                  Cancel
                </Button>
                <Button disabled={isPending || !prompt.trim() || !name.trim()} size="sm" type="submit">
                  {isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <Button onClick={onClose} type="button" variant="ghost" size="sm">
                Close
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatCell({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="grid gap-1 px-4 py-3">
      <span className="text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-ink-faint/70">
        {label}
      </span>
      <span className={cn(
        "text-sm font-medium tabular-nums",
        accent ? "text-accent" : muted ? "text-ink-faint" : "text-ink",
      )}>
        {value}
      </span>
    </div>
  );
}
