"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { AutomationCalendar } from "@/components/automation-calendar";
import { AutomationEditModal } from "@/components/automation-edit-modal";
import { AutomationIcon, TimelineIcon } from "@/components/frontier-icons";
import { SkillInline } from "@/components/skill-inline";
import { Badge } from "@/components/ui/badge";
import { SkillIcon } from "@/components/ui/skill-icon";
import { Button } from "@/components/ui/button";
import { EmptyCard } from "@/components/ui/empty-card";
import { FieldGroup, textFieldBase, textFieldArea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import { Panel, PanelHead } from "@/components/ui/panel";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/cn";
import { CADENCE_SIMPLE_OPTIONS, STATUS_OPTIONS } from "@/lib/automation-constants";
import { formatNextRun, countMonthlyRuns } from "@/lib/schedule";
import type { AutomationSummary, SkillRecord, UserSkillCadence } from "@/lib/types";

type AutomationManagerProps = {
  automations: AutomationSummary[];
  skills: SkillRecord[];
  manageableSkillSlugs: string[];
};

export function AutomationManager({ automations, skills, manageableSkillSlugs }: AutomationManagerProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<{
    automation: AutomationSummary;
    canManage: boolean;
  } | null>(null);

  const skillMap = useMemo(() => new Map(skills.map((s) => [s.slug, s])), [skills]);
  const manageableSkillSlugSet = useMemo(() => new Set(manageableSkillSlugs), [manageableSkillSlugs]);
  const manageableSkills = useMemo(
    () => skills.filter((skill) => manageableSkillSlugSet.has(skill.slug)),
    [manageableSkillSlugSet, skills]
  );

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
  const handleOpenAutomationModal = (automation: AutomationSummary) => {
    const skillSlug = automation.matchedSkillSlugs[0];
    setSelectedAutomation({
      automation,
      canManage: skillSlug ? manageableSkillSlugSet.has(skillSlug) : false,
    });
  };

  return (
    <section className="grid gap-6">
      <div className="grid gap-0 rounded-none border border-line bg-paper-3/92">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-paper-2 shadow-[0_1px_0_0_rgba(0,0,0,0.04)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)]">
              <AutomationIcon className="h-4.5 w-4.5 text-ink-soft" />
            </span>
            <div>
              <p className="m-0 text-sm font-semibold tracking-tight text-ink">
                {automations.length === 0
                  ? "No automations"
                  : `${automations.length} automation${automations.length !== 1 ? "s" : ""}`}
              </p>
              <p className="m-0 flex items-center gap-1.5 text-xs text-ink-faint">
                <StatusDot tone={activeCount > 0 ? "fresh" : "idle"} pulse={activeCount > 0} />
                {activeCount} active
              </p>
            </div>
          </div>
          <Button disabled={manageableSkills.length === 0} onClick={() => setCreateOpen(true)} size="sm">
            <AutomationIcon className="h-3.5 w-3.5" />
            {manageableSkills.length === 0 ? "No editable skills" : "New automation"}
          </Button>
        </div>

        {automations.length > 0 ? (
          <div className="p-5 sm:p-6">
            <Panel square compact>
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
              <AutomationCalendar automations={automations} onEditAutomation={handleOpenAutomationModal} skillMap={skillMap} />
            </Panel>
          </div>
        ) : null}
      </div>

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
              canManage={
                automation.matchedSkillSlugs[0]
                  ? manageableSkillSlugSet.has(automation.matchedSkillSlugs[0])
                  : false
              }
              key={automation.id}
              onEdit={() => handleOpenAutomationModal(automation)}
              skillMap={skillMap}
            />
          ))
        ) : automations.length === 0 ? (
          <EmptyCard icon={<AutomationIcon className="h-5 w-5" />}>
            <p className="m-0 text-sm">No automations yet.</p>
            <p className="m-0 text-xs text-ink-faint">Create one to keep your skills up to date on a schedule.</p>
          </EmptyCard>
        ) : (
          <EmptyCard>No automations match this filter.</EmptyCard>
        )}
      </div>

      <CreateAutomationModal
        onClose={() => setCreateOpen(false)}
        open={createOpen}
        skills={manageableSkills}
      />

      {selectedAutomation && (() => {
        const linkedSlug = selectedAutomation.automation.matchedSkillSlugs[0];
        const linkedSkill = linkedSlug ? skillMap.get(linkedSlug) : undefined;
        return (
          <AutomationEditModal
            automation={selectedAutomation.automation}
            canManage={selectedAutomation.canManage}
            initialPreferredHour={selectedAutomation.automation.preferredHour}
            onClose={() => setSelectedAutomation(null)}
            open
            skillCategory={linkedSkill?.category}
            skillIconUrl={linkedSkill?.iconUrl}
            skillName={linkedSkill?.title}
            skillSlug={linkedSkill?.slug}
            sources={linkedSkill?.sources}
          />
        );
      })()}
    </section>
  );
}

type AutomationCardProps = {
  automation: AutomationSummary;
  canManage: boolean;
  skillMap: Map<string, SkillRecord>;
  onEdit: () => void;
};

function AutomationCard({ automation, canManage, skillMap, onEdit }: AutomationCardProps) {
  const linkedSkill = automation.matchedSkillSlugs[0]
    ? skillMap.get(automation.matchedSkillSlugs[0])
    : null;

  const isActive = automation.status === "ACTIVE";
  const now = new Date();
  const monthRuns = countMonthlyRuns(automation.cadence, now.getFullYear(), now.getMonth(), automation.preferredDay);

  return (
    <article
      className={cn(
        "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-4 border border-line bg-paper-3/60 p-4 transition-colors",
        isActive
          ? "hover:border-accent/20 hover:bg-paper-3"
          : "opacity-60 hover:opacity-80"
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-line bg-paper-2 text-ink-soft [&>svg]:h-4 [&>svg]:w-4">
        {linkedSkill ? (
          <SkillIcon iconUrl={linkedSkill.iconUrl} size={24} slug={linkedSkill.slug} />
        ) : (
          <TimelineIcon />
        )}
      </div>

      <div className="grid min-w-0 gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="truncate text-sm">{automation.name}</strong>
          <Badge color={isActive ? "green" : "neutral"}>
            <StatusDot
              className="mr-1"
              tone={isActive ? "fresh" : "idle"}
              pulse={isActive}
            />
            {automation.status.toLowerCase()}
          </Badge>
          {!canManage ? <Badge color="neutral">read only</Badge> : null}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
          <span className="flex items-center gap-1.5">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {automation.schedule}
          </span>
          <span className="tabular-nums">Next: {formatNextRun(automation.cadence, automation.preferredHour ?? 12, automation.preferredDay)}</span>
          <span className="tabular-nums">{monthRuns} runs/mo</span>
        </div>

        {linkedSkill && (
          <SkillInline
            category={linkedSkill.category}
            href={linkedSkill.href}
            iconUrl={linkedSkill.iconUrl}
            size="sm"
            slug={linkedSkill.slug}
            title={linkedSkill.title}
            versionLabel={linkedSkill.versionLabel}
          />
        )}
      </div>

      <Button
        aria-label={canManage ? "Edit automation" : "View automation details"}
        className="opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onEdit}
        size="icon-sm"
        type="button"
        variant="soft"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          {canManage ? (
            <>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </>
          ) : (
            <>
              <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
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
  const [cadence, setCadence] = useState<UserSkillCadence>("daily");
  const [status, setStatus] = useState<"ACTIVE" | "PAUSED">("ACTIVE");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const skillMap = useMemo(() => new Map(skills.map((s) => [s.slug, s])), [skills]);

  useEffect(() => {
    const nextSkill = skills[0];
    setSelectedSkillSlug(nextSkill?.slug ?? "");
    setName(nextSkill ? `${nextSkill.title} refresh` : "");
  }, [skills]);

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
      <DialogContent className="gap-0 overflow-hidden p-0" maxWidth="lg">
        <DialogHeader>
          <DialogTitle>New automation</DialogTitle>
          <DialogDescription>
            {skills.length > 0
              ? "Pick a skill you own, set a cadence, and add a short instruction for each run."
              : "You do not currently own any skills with editable automation."}
          </DialogDescription>
        </DialogHeader>
        <form className="flex min-h-0 flex-1 flex-col gap-0" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-5">
          {skills.length === 0 ? (
            <div className="rounded-xl border border-line bg-paper-2/60 px-4 py-3 text-sm text-ink-soft">
              Track a skill or open one you own to manage its automation.
            </div>
          ) : null}
          <FieldGroup>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Skill</span>
            <Select
              disabled={skills.length === 0}
              onChange={handleSkillChange}
              options={skills.map((skill) => ({ value: skill.slug, label: skill.title }))}
              value={selectedSkillSlug}
            />
            {(() => {
              const selected = skillMap.get(selectedSkillSlug);
              if (!selected) return null;
              return (
                <div className="flex items-start gap-3 rounded-none border border-line bg-paper-2/40 px-3 py-2.5">
                  <SkillInline
                    category={selected.category}
                    iconUrl={selected.iconUrl}
                    slug={selected.slug}
                    title={selected.title}
                    versionLabel={selected.versionLabel}
                  />
                  {selected.description ? (
                    <p className="m-0 hidden line-clamp-1 text-xs text-ink-soft sm:block">
                      {selected.description}
                    </p>
                  ) : null}
                </div>
              );
            })()}
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
              <Select
                onChange={(v) => setCadence(v as UserSkillCadence)}
                options={CADENCE_SIMPLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                value={cadence}
              />
            </FieldGroup>

            <FieldGroup>
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Status</span>
              <Select
                onChange={(v) => setStatus(v as "ACTIVE" | "PAUSED")}
                options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                value={status}
              />
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
          {message && <p className="text-sm text-success">{message}</p>}
          </div>
        </div>

          <DialogFooter>
            <Button onClick={onClose} type="button" variant="ghost" size="sm">
              Cancel
            </Button>
            <Button disabled={isPending || !selectedSkillSlug || skills.length === 0} size="sm" type="submit">
              {isPending ? "Creating..." : "Create automation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
