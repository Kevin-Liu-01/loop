"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SkillVisibility } from "@/lib/types";

type SkillVisibilityToggleProps = {
  slug: string;
  currentVisibility: SkillVisibility;
  canEdit: boolean;
};

export function SkillVisibilityToggle({
  slug,
  currentVisibility,
  canEdit,
}: SkillVisibilityToggleProps) {
  const router = useRouter();
  const [visibility, setVisibility] = useState(currentVisibility);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isPublic = visibility === "public";
  const label = isPublic ? "Public" : "Private";
  const nextVisibility = isPublic ? "private" : "public";

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      const response = await fetch(
        `/api/skills/${encodeURIComponent(slug)}/visibility`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ visibility: nextVisibility }),
        }
      );

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        visibility?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to update visibility.");
        return;
      }

      setVisibility(nextVisibility);
      router.refresh();
    });
  }

  if (!canEdit) {
    return (
      <Badge color={isPublic ? "green" : "neutral"}>{label}</Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge color={isPublic ? "green" : "neutral"}>{label}</Badge>
      <Button
        disabled={isPending}
        onClick={handleToggle}
        size="sm"
        type="button"
        variant="soft"
      >
        {isPending ? "Updating..." : `Make ${nextVisibility}`}
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
