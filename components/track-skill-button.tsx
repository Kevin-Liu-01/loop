"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const SELECTION_KEY = "loop.admin.selected-loop";

type TrackSkillButtonProps = {
  slug: string;
  label?: string;
  showFeedback?: boolean;
  redirectTo?: "detail" | "updates";
};

export function TrackSkillButton({
  slug,
  label = "Set up skill",
  showFeedback = false,
  redirectTo = "detail"
}: TrackSkillButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/skills/track", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ slug })
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string; href?: string };
      if (!response.ok || !payload.href) {
        setError(payload.error ?? "Unable to make this skill updateable.");
        return;
      }

      window.localStorage.setItem(SELECTION_KEY, `user:${slug}`);
      setMessage("Tracked. Opened in setup.");
      router.push(redirectTo === "updates" ? "/admin#updates" : payload.href);
      router.refresh();
    });
  }

  return (
    <div className="track-skill-button">
      <button className="button button--ghost" disabled={isPending} onClick={handleClick} type="button">
        {isPending ? "Setting up..." : label}
      </button>
      {showFeedback && message ? <p className="form-success">{message}</p> : null}
      {showFeedback && error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
