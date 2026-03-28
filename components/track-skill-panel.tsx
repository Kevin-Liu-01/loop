"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { FlowIcon } from "@/components/frontier-icons";

const SELECTION_KEY = "loop.admin.selected-loop";

type TrackableSkill = {
  slug: string;
  title: string;
  category: string;
};

type TrackSkillPanelProps = {
  skills: TrackableSkill[];
};

export function TrackSkillPanel({ skills }: TrackSkillPanelProps) {
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState(skills[0]?.slug ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (skills.length === 0) {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/skills/track", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          slug: selectedSlug
        })
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string; href?: string };
      if (!response.ok || !payload.href) {
        setError(payload.error ?? "Unable to make this skill updateable.");
        return;
      }

      window.localStorage.setItem(SELECTION_KEY, `user:${selectedSlug}`);
      setMessage("Tracked. Opening setup.");
      router.push(payload.href);
      router.refresh();
    });
  }

  return (
    <form className="card simple-panel track-skill-panel" onSubmit={handleSubmit}>
      <div className="section-head section-head--compact">
        <div>
          <span className="eyebrow-pill">
            <FlowIcon className="frontier-inline-icon" />
            Add from catalog
          </span>
          <h2>Make a skill editable</h2>
        </div>
      </div>

      <p className="lede">Pick one. Loop opens setup next.</p>

      <label className="field-group">
        <span>Skill</span>
        <select
          className="text-field text-field--select"
          onChange={(event) => setSelectedSlug(event.target.value)}
          value={selectedSlug}
        >
          {skills.map((skill) => (
            <option key={skill.slug} value={skill.slug}>
              {skill.title} · {skill.category}
            </option>
          ))}
        </select>
      </label>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      <div className="hero-actions">
        <button className="button" disabled={isPending || !selectedSlug} type="submit">
          {isPending ? "Creating..." : "Create editable copy"}
        </button>
      </div>
    </form>
  );
}
