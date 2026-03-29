"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

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
    <div className="grid content-start justify-items-end gap-2">
      <Button disabled={isPending} onClick={handleClick} type="button" variant="ghost">
        {isPending ? "Setting up..." : label}
      </Button>
      {showFeedback && message ? <p className="text-sm text-ink-soft">{message}</p> : null}
      {showFeedback && error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
