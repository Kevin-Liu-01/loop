"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FlowIcon, TimelineIcon } from "@/components/frontier-icons";
import { Badge, EyebrowPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyCard } from "@/components/ui/empty-card";
import { FieldGroup, textFieldArea, textFieldBase, textFieldSelect } from "@/components/ui/field";
import { Panel, PanelHead } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import { formatAutomationSchedule } from "@/lib/format";
import type { AutomationSummary, SkillRecord } from "@/lib/types";

type AutomationManagerProps = {
  automations: AutomationSummary[];
  skills: SkillRecord[];
};

const CADENCE_OPTIONS = [
  { value: "daily-9", label: "Daily · 9:00 AM" },
  { value: "weekdays-9", label: "Weekdays · 9:00 AM" },
  { value: "weekly-mon", label: "Monday · 9:00 AM" },
  { value: "hourly-6", label: "Every 6 hours" }
] as const;

export function AutomationManager({ automations, skills }: AutomationManagerProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedSkillSlug, setSelectedSkillSlug] = useState(skills[0]?.slug ?? "");
  const [name, setName] = useState(skills[0] ? `${skills[0].title} refresh` : "");
  const [note, setNote] = useState("");
  const [cadence, setCadence] = useState<(typeof CADENCE_OPTIONS)[number]["value"]>("daily-9");
  const [status, setStatus] = useState<"ACTIVE" | "PAUSED">("ACTIVE");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const skillMap = useMemo(() => new Map(skills.map((skill) => [skill.slug, skill])), [skills]);
  const filteredAutomations = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return automations;
    }

    return automations.filter((automation) =>
      `${automation.name} ${automation.prompt} ${automation.schedule} ${automation.matchedSkillSlugs.join(" ")}`
        .toLowerCase()
        .includes(needle)
    );
  }, [automations, query]);

  function handleSkillChange(nextSlug: string) {
    setSelectedSkillSlug(nextSlug);
    const selectedSkill = skillMap.get(nextSlug);
    if (!selectedSkill) {
      return;
    }

    setName(`${selectedSkill.title} refresh`);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/automations", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          name,
          skillSlug: selectedSkillSlug,
          note,
          cadence,
          status
        })
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string; id?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to create automation.");
        return;
      }

      const selectedSkill = skillMap.get(selectedSkillSlug);
      setMessage(`${payload.id ?? "automation"} created${selectedSkill ? ` for ${selectedSkill.title}` : ""}.`);
      setNote("");
      router.refresh();
    });
  }

  return (
    <section>
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <EyebrowPill>Automations</EyebrowPill>
          <h2>Automations</h2>
        </div>
        <small className="text-ink-soft">{automations.length} total</small>
      </div>

      <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
        <Panel>
          <FieldGroup>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Filter</span>
            <input
              className={cn(textFieldBase)}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="frontend, refresh, weekly"
              value={query}
            />
          </FieldGroup>

          <div className="grid gap-0">
            {filteredAutomations.length > 0 ? (
              filteredAutomations.map((automation) => {
                const linkedSkill = automation.matchedSkillSlugs[0]
                  ? skillMap.get(automation.matchedSkillSlugs[0])
                  : null;

                return (
                  <article
                    className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 border-t border-line py-4 first:border-t-0 first:pt-0"
                    key={automation.id}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-paper-3 text-ink-soft [&>svg]:h-4 [&>svg]:w-4">
                      <TimelineIcon />
                    </div>
                    <div className="grid min-w-0 flex-1 gap-1.5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <strong>{automation.name}</strong>
                        <Badge muted={automation.status !== "ACTIVE"}>{automation.status.toLowerCase()}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink-soft">
                        <span>{formatAutomationSchedule(automation.schedule)}</span>
                        <span>{linkedSkill ? linkedSkill.versionLabel : "unlinked"}</span>
                      </div>
                      {linkedSkill ? (
                        <Link className="text-sm font-medium text-ink hover:text-ink-soft" href={linkedSkill.href}>
                          {linkedSkill.title}
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <EmptyCard>No automations match this filter.</EmptyCard>
            )}
          </div>
        </Panel>

        <form className="contents" onSubmit={handleSubmit}>
          <Panel className="grid gap-5 content-start">
            <PanelHead className="mb-1 items-start">
              <div>
                <EyebrowPill>
                  <FlowIcon className="h-4 w-4" />
                  New automation
                </EyebrowPill>
                <h3>Add a schedule</h3>
              </div>
            </PanelHead>

            <FieldGroup>
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Skill</span>
              <select
                className={cn(textFieldBase, textFieldSelect)}
                onChange={(event) => handleSkillChange(event.target.value)}
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
                onChange={(event) => setName(event.target.value)}
                placeholder="Frontend refresh"
                required
                value={name}
              />
            </FieldGroup>

            <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
              <FieldGroup>
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Schedule</span>
                <select
                  className={cn(textFieldBase, textFieldSelect)}
                  onChange={(event) => setCadence(event.target.value as (typeof CADENCE_OPTIONS)[number]["value"])}
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
                  onChange={(event) => setStatus(event.target.value as "ACTIVE" | "PAUSED")}
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
                onChange={(event) => setNote(event.target.value)}
                placeholder="What should this run look for?"
                value={note}
              />
            </FieldGroup>

            {error ? <p className="text-sm text-danger">{error}</p> : null}
            {message ? <p className="text-sm text-ink-soft">{message}</p> : null}

            <div className="flex flex-wrap gap-3">
              <Button disabled={isPending || !selectedSkillSlug} type="submit">
                {isPending ? "Creating..." : "Create automation"}
              </Button>
            </div>
          </Panel>
        </form>
      </div>
    </section>
  );
}
