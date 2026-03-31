"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { TrashIcon } from "@/components/frontier-icons";
import { Button } from "@/components/ui/button";

type DeleteSkillButtonProps = {
  slug: string;
  skillTitle: string;
};

export function DeleteSkillButton({ slug, skillTitle }: DeleteSkillButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = useCallback(() => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/skills/${encodeURIComponent(slug)}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to delete skill.");
          setConfirming(false);
          return;
        }
        router.push("/");
        router.refresh();
      } catch {
        setError("Network error. Please try again.");
        setConfirming(false);
      }
    });
  }, [slug, router]);

  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        <p className="m-0 text-xs text-danger">
          Permanently delete <strong>{skillTitle}</strong>? This removes all versions,
          automations, and run history. This cannot be undone.
        </p>
        <div className="flex items-center gap-2">
          <Button
            disabled={isPending}
            onClick={handleDelete}
            size="sm"
            type="button"
            variant="danger"
          >
            {isPending ? "Deleting…" : "Yes, delete"}
          </Button>
          <Button
            disabled={isPending}
            onClick={() => setConfirming(false)}
            size="sm"
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
        </div>
        {error && <p className="m-0 text-xs text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <Button
      className="text-danger hover:text-danger"
      onClick={() => setConfirming(true)}
      size="sm"
      type="button"
      variant="ghost"
    >
      <TrashIcon className="h-3.5 w-3.5" />
      Delete skill
    </Button>
  );
}
