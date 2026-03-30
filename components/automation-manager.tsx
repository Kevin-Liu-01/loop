"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AutomationCalendar } from "@/components/automation-calendar";
import { AutomationEditModal } from "@/components/automation-edit-modal";
import { FlowIcon, TimelineIcon } from "@/components/frontier-icons";
import { Badge, EyebrowPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyCard } from "@/components/ui/empty-card";
import { FieldGroup, textFieldBase, textFieldArea, textFieldSelect } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import { Panel, PanelHead } from "@/components/ui/panel";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/cn";
import { CADENCE_OPTIONS } from "@/lib/automation-constants";
import { formatAutomationSchedule } from "@/lib/format";
import { formatNextRun, countMonthlyRuns } from "@/lib/schedule";
import type { AutomationSummary, SkillRecord } from "@/lib/types";

type AutomationManagerProps = {
  automations: AutomationSummary[];
  skills: SkillRecord[];
};

export function AutomationManager({ automations, skills }: AutomationManagerProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AutomationSummary | null>(null);

  const skillMap = useMemo(() => new Map(skills.map((s) => [s.slug, s])), [skills]);

  const filteredAutomations = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return automations;

    return automations.filter((a) =>
      `${a.name} ${a.prompt} ${a.schedule} ${a.matchedSkillSlugs.join(" ")}`
        .toLowerCase()
        .includes(needle)
    );
  }, [automations, query]);

  const activeCount = automations.filter((a) => a.status === "ACTIVE").length;
  const now = new Date();

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="flex items-center gap-3">
            <span className="text-sm tabular-nums text-ink-faint">{automations.length} total</span>
            <span className="h-1 w-1 rounded-full bg-line-strong" />
            <span className="flex items-center gap-1.5 text-sm text-ink-faint">
              <StatusDot tone={activeCount > 0 ? "fresh" : "idle"} pulse={activeCount > 0} />
              {activeCount} active
            </span>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <FlowIcon className="h-3.5 w-3.5" />
          New automation
        </Button>
      </div>

      {automations.length > 0 && (
        <Panel>
          <PanelHead>
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">
                Monthly schedule
              </span>
              <p className="mt-1 text-sm text-ink-faint">
                {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
          </PanelHead>
          <AutomationCalendar automations={automations} />
        </Panel>
      )}

      {automations.length > 3 && (
        <FieldGroup>
          <input
            className={cn(textFieldBase, "min-h-10! rounded-xl! py-2! text-sm")}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter automations..."
            value={query}
          />
        </FieldGroup>
      )}

      <div className="grid gap-3">
        {filteredAutomations.length > 0 ? (
          filteredAutomations.map((automation) => (
            <AutomationCard
              automation={automation}
              key={automation.id}
              onEdit={() => setEditTarget(automation)}
              skillMap={skillMap}
            />
          ))
        ) : automations.length === 0 ? (
          <EmptyCard>
            No automations yet. Create one to keep your skills up to date on a schedule.
          </EmptyCard>
        ) : (
          <EmptyCard>No automations match this filter.</EmptyCard>
        )}
      </div>

      <CreateAutomationModal
        onClose={() => setCreateOpen(false)}
        open={createOpen}
        skills={skills}
      />

      {editTarget && (
        <AutomationEditModal
          automation={editTarget}
          onClose={() => setEditTarget(null)}
          open
        />
      )}
    </section>
  );
}

type AutomationCardProps = {
  automation: AutomationSummary;
  skillMap: Map<string, SkillRecord>;
  onEdit: () => void;
};

function AutomationCard({ automation, skillMap, onEdit }: AutomationCardProps) {
  const linkedSkill = automation.matchedSkillSlugs[0]
    ? skillMap.get(automation.matchedSkillSlugs[0])
    : null;

  const isActive = automation.status === "ACTIVE";
  const now = new Date();
  const monthRuns = countMonthlyRuns(automation.schedule, now.getFullYear(), now.getMonth());

  return (
    <article
      className={cn(
        "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-4 rounded-2xl border border-line bg-paper-3/60 p-4 transition-colors",
        isActive
          ? "hover:border-accent/20 hover:bg-paper-3"
          : "opacity-60 hover:opacity-80"
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-paper-2 text-ink-soft [&>svg]:h-4 [&>svg]:w-4">
        <TimelineIcon />
      </div>

      <div className="grid min-w-0 gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="truncate text-sm">{automation.name}</strong>
          <Badge muted={!isActive}>
            <StatusDot
              className="mr-1"
              tone={isActive ? "fresh" : "idle"}
              pulse={isActive}
            />
            {automation.status.toLowerCase()}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
          <span className="flex items-center gap-1.5">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {formatAutomationSchedule(automation.schedule)}
          </span>
          <span className="tabular-nums">Next: {formatNextRun(automation.schedule)}</span>
          <span className="tabular-nums">{monthRuns} runs/mo</span>
        </div>

        {linkedSkill && (
          <Link
            className="mt-0.5 text-xs font-medium text-ink-soft transition-colors hover:text-accent"
            href={linkedSkill.href}
          >
            {linkedSkill.title} · {linkedSkill.versionLabel}
          </Link>
        )}
      </div>

      <Button
        className="opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onEdit}
        size="icon-sm"
        type="button"
        variant="soft"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </Button>
    </article>
  );
}

type CreateAutomationModalProps = {
  open: boolean;
  onClose: () => void;
  skills: SkillRecord[];
};

function CreateAutomationModal({ open, onClose, skills }: CreateAutomationModalProps) {
  const router = useRouter();
  const [selectedSkillSlug, setSelectedSkillSlug] = useState(skills[0]?.slug ?? "");
  const [name, setName] = useState(skills[0] ? `${skills[0].title} refresh` : "");
  const [note, setNote] = useState("");
  const [cadence, setCadence] = useState<(typeof CADENCE_OPTIONS)[number]["value"]>("daily-9");
  const [status, setStatus] = useState<"ACTIVE" | "PAUSED">("ACTIVE");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const skillMap = useMemo(() => new Map(skills.map((s) => [s.slug, s])), [skills]);

  function handleSkillChange(nextSlug: string) {
    setSelectedSkillSlug(nextSlug);
    const skill = skillMap.get(nextSlug);
    if (skill) setName(`${skill.title} refresh`);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/automations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, skillSlug: selectedSkillSlug, note, cadence, status })
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string; id?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to create automation.");
        return;
      }

      const skill = skillMap.get(selectedSkillSlug);
      setMessage(`${payload.id ?? "automation"} created${skill ? ` for ${skill.title}` : ""}.`);
      setNote("");
      router.refresh();
      setTimeout(() => onClose(), 1200);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent maxWidth="lg">
        <DialogHeader>
          <DialogTitle>New Automation</DialogTitle>
        </DialogHeader>
        <form className="grid gap-0" onSubmit={handleSubmit}>
          <div className="grid gap-5 p-5">
          <FieldGroup>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Skill</span>
            <select
              className={cn(textFieldBase, textFieldSelect)}
              onChange={(e) => handleSkillChange(e.target.value)}
              value={selectedSkillSlug}
            >
              {skills.map((skill) => (
                <option key={skill.slug} value={skill.slug}>
                  {skill.title}
                </option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Name</span>
            <input
              className={cn(textFieldBase)}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              placeholder="Frontend refresh"
              required
              value={name}
            />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <FieldGroup>
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Schedule</span>
              <select
                className={cn(textFieldBase, textFieldSelect)}
                onChange={(e) => setCadence(e.target.value as (typeof CADENCE_OPTIONS)[number]["value"])}
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
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Instruction</span>
            <textarea
              className={cn(textFieldBase, textFieldArea)}
              maxLength={240}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What should this run look for?"
              value={note}
            />
          </FieldGroup>

          {error && <p className="text-sm text-danger">{error}</p>}
          {message && <p className="text-sm text-emerald-500">{message}</p>}
        </div>

          <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4">
            <Button onClick={onClose} type="button" variant="ghost" size="sm">
              Cancel
            </Button>
            <Button disabled={isPending || !selectedSkillSlug} size="sm" type="submit">
              {isPending ? "Creating..." : "Create automation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
