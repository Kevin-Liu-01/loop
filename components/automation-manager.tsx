"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FlowIcon, TimelineIcon } from "@/components/frontier-icons";
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
    <section className="ops-section">
      <div className="section-head section-head--compact">
        <div>
          <span className="eyebrow-pill">Automations</span>
          <h2>Automations</h2>
        </div>
        <small>{automations.length} total</small>
      </div>

      <div className="ops-automation-grid">
        <div className="card simple-panel">
          <label className="field-group">
            <span>Filter</span>
            <input
              className="text-field"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="frontend, refresh, weekly"
              value={query}
            />
          </label>

          <div className="simple-list">
            {filteredAutomations.length > 0 ? (
              filteredAutomations.map((automation) => {
                const linkedSkill = automation.matchedSkillSlugs[0]
                  ? skillMap.get(automation.matchedSkillSlugs[0])
                  : null;

                return (
                  <article className="simple-list__item" key={automation.id}>
                    <div className="simple-list__icon">
                      <TimelineIcon />
                    </div>
                    <div className="simple-list__body">
                      <div className="simple-list__row">
                        <strong>{automation.name}</strong>
                        <span className={`badge ${automation.status === "ACTIVE" ? "badge--signal-blue" : ""}`}>
                          {automation.status.toLowerCase()}
                        </span>
                      </div>
                      <div className="simple-list__meta">
                        <span>{formatAutomationSchedule(automation.schedule)}</span>
                        <span>{linkedSkill ? linkedSkill.versionLabel : "unlinked"}</span>
                      </div>
                      {linkedSkill ? (
                        <Link className="link-inline" href={linkedSkill.href}>
                          {linkedSkill.title}
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="empty-card">No automations match this filter.</div>
            )}
          </div>
        </div>

        <form className="card simple-panel automation-form" onSubmit={handleSubmit}>
          <div className="section-head section-head--compact">
            <div>
              <span className="eyebrow-pill">
                <FlowIcon className="frontier-inline-icon" />
                New automation
              </span>
              <h3>Add a schedule</h3>
            </div>
          </div>

          <label className="field-group">
            <span>Skill</span>
            <select
              className="text-field text-field--select"
              onChange={(event) => handleSkillChange(event.target.value)}
              value={selectedSkillSlug}
            >
              {skills.map((skill) => (
                <option key={skill.slug} value={skill.slug}>
                  {skill.title}
                </option>
              ))}
            </select>
          </label>

          <label className="field-group">
            <span>Name</span>
            <input
              className="text-field"
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              placeholder="Frontend refresh"
              required
              value={name}
            />
          </label>

          <div className="form-row">
            <label className="field-group">
              <span>Schedule</span>
              <select
                className="text-field text-field--select"
                onChange={(event) => setCadence(event.target.value as (typeof CADENCE_OPTIONS)[number]["value"])}
                value={cadence}
              >
                {CADENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-group">
              <span>Status</span>
              <select
                className="text-field text-field--select"
                onChange={(event) => setStatus(event.target.value as "ACTIVE" | "PAUSED")}
                value={status}
              >
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
              </select>
            </label>
          </div>

          <label className="field-group">
            <span>Instruction</span>
            <textarea
              className="text-field text-field--area"
              maxLength={240}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What should this run look for?"
              value={note}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}
          {message ? <p className="form-success">{message}</p> : null}

          <div className="hero-actions">
            <button className="button" disabled={isPending || !selectedSkillSlug} type="submit">
              {isPending ? "Creating..." : "Create automation"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
