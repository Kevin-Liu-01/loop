"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FieldGroup, textFieldBase, textFieldArea, textFieldSelect } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import { Separator } from "@/components/ui/shadcn/separator";
import { cn } from "@/lib/cn";
import { formatAutomationSchedule } from "@/lib/format";
import { formatNextRun, countMonthlyRuns } from "@/lib/schedule";
import type { AutomationSummary } from "@/lib/types";
import { CADENCE_OPTIONS, rruleToCadence } from "@/lib/automation-constants";

type AutomationEditModalProps = {
  automation: AutomationSummary;
  open: boolean;
  onClose: () => void;
};

export function AutomationEditModal({ automation, open, onClose }: AutomationEditModalProps) {
  const router = useRouter();
  const [name, setName] = useState(automation.name);
  const [cadence, setCadence] = useState(rruleToCadence(automation.schedule));
  const [status, setStatus] = useState<"ACTIVE" | "PAUSED">(automation.status as "ACTIVE" | "PAUSED");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch(`/api/automations/${automation.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, cadence, status })
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
    if (!confirm(`Delete "${automation.name}"? This cannot be undone.`)) return;

    startDeleteTransition(async () => {
      const response = await fetch(`/api/automations/${automation.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Unable to delete automation.");
        return;
      }

      router.refresh();
      onClose();
    });
  }

  const now = new Date();
  const monthlyRuns = countMonthlyRuns(automation.schedule, now.getFullYear(), now.getMonth());

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Automation</DialogTitle>
        </DialogHeader>
        <form className="grid gap-0" onSubmit={handleSave}>
          <div className="grid gap-5 p-5">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-paper-2/60 px-4 py-3">
            <div className="grid flex-1 gap-0.5">
              <span className="text-xs text-ink-faint">Next run</span>
              <span className="text-sm font-medium tabular-nums text-ink">
                {formatNextRun(automation.schedule)}
              </span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="grid flex-1 gap-0.5">
              <span className="text-xs text-ink-faint">This month</span>
              <span className="text-sm font-medium tabular-nums text-ink">{monthlyRuns} runs</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="grid flex-1 gap-0.5">
              <span className="text-xs text-ink-faint">Schedule</span>
              <span className="text-sm font-medium text-ink">
                {formatAutomationSchedule(automation.schedule)}
              </span>
            </div>
          </div>

          <FieldGroup>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Name</span>
            <input
              className={cn(textFieldBase)}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              required
              value={name}
            />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <FieldGroup>
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Schedule</span>
              <select
                className={cn(textFieldBase, textFieldSelect)}
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

            <FieldGroup>
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Status</span>
              <select
                className={cn(textFieldBase, textFieldSelect)}
                onChange={(e) => setStatus(e.target.value as "ACTIVE" | "PAUSED")}
                value={status}
              >
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
              </select>
            </FieldGroup>
          </div>

          <FieldGroup>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Prompt</span>
            <textarea
              className={cn(textFieldBase, textFieldArea, "cursor-not-allowed opacity-60")}
              readOnly
              value={automation.prompt}
            />
          </FieldGroup>

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

          <div className="flex items-center justify-between border-t border-line px-5 py-4">
            <Button
              disabled={isDeleting || isPending}
              onClick={handleDelete}
              type="button"
              variant="danger"
              size="sm"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>

            <div className="flex items-center gap-2">
              <Button onClick={onClose} type="button" variant="ghost" size="sm">
                Cancel
              </Button>
              <Button disabled={isPending || !name.trim()} size="sm" type="submit">
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
