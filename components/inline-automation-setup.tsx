"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { AutomationIcon, SparkIcon } from "@/components/frontier-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldGroup, textFieldBase, textFieldArea } from "@/components/ui/field";
import { Panel, PanelHead } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { CADENCE_ALL_OPTIONS, STATUS_OPTIONS } from "@/lib/automation-constants";
import type { UserSkillCadence } from "@/lib/types";

type InlineAutomationSetupProps = {
  slug: string;
  skillTitle: string;
  sourceCount: number;
};

export function InlineAutomationSetup({
  slug,
  skillTitle,
  sourceCount,
}: InlineAutomationSetupProps) {
  const router = useRouter();
  const [cadence, setCadence] = useState<UserSkillCadence>("daily");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "PAUSED">("ACTIVE");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/automations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: `${skillTitle} refresh`,
          skillSlug: slug,
          note,
          cadence,
          status,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to create automation.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <Panel className="overflow-hidden">
      <div className="dither-gradient-orange -mx-6 -mt-6 mb-1 px-6 pb-5 pt-6">
        <PanelHead className="items-start">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Badge color="orange">No automation yet</Badge>
              <Badge color="neutral">{sourceCount} source{sourceCount === 1 ? "" : "s"}</Badge>
            </div>
            <h3 className="m-0 text-xl font-semibold tracking-tight text-ink">
              Set up automation
            </h3>
            <p className="m-0 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
              Schedule automatic refreshes to keep this skill current.
              Pick a cadence and optionally add an instruction for the refresh agent.
            </p>
          </div>
        </PanelHead>
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <FieldGroup>
            <span className="text-[0.625rem] font-medium uppercase tracking-[0.08em] text-ink-soft">
              Schedule
            </span>
            <Select
              onChange={(v) => setCadence(v as UserSkillCadence)}
              options={CADENCE_ALL_OPTIONS}
              value={cadence}
            />
          </FieldGroup>

          <FieldGroup>
            <span className="text-[0.625rem] font-medium uppercase tracking-[0.08em] text-ink-soft">
              Start as
            </span>
            <Select
              onChange={(v) => setStatus(v as "ACTIVE" | "PAUSED")}
              options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={status}
            />
          </FieldGroup>
        </div>

        <FieldGroup>
          <span className="text-[0.625rem] font-medium uppercase tracking-[0.08em] text-ink-soft">
            Instruction <span className="normal-case tracking-normal text-ink-faint/60">(optional)</span>
          </span>
          <textarea
            className={cn(textFieldBase, textFieldArea)}
            maxLength={240}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What should each refresh look for?"
            rows={3}
            value={note}
          />
        </FieldGroup>

        {error && <p className="m-0 text-sm font-medium text-danger">{error}</p>}

        {isPending && (
          <div className="grid gap-1">
            <ProgressBar rounded={false} size="sm" status="active" />
            <span className="text-xs text-ink-faint">Setting up automation...</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button disabled={isPending} onClick={handleCreate} size="sm" type="button">
            <SparkIcon className="h-3.5 w-3.5" />
            {isPending ? "Creating\u2026" : "Create automation"}
          </Button>
          {!isPending && (
            <span className="text-xs text-ink-faint">
              You can edit the schedule and prompt later.
            </span>
          )}
        </div>
      </div>
    </Panel>
  );
}
