"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { GitFork } from "lucide-react";
import { useAuth, SignInButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

type ForkSkillButtonProps = {
  slug: string;
  label?: string;
};

export function ForkSkillButton({
  slug,
  label = "Fork to my skills",
}: ForkSkillButtonProps) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button size="sm" type="button" variant="soft">
          <GitFork className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Sign in to fork
        </Button>
      </SignInButton>
    );
  }

  function handleFork() {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/skills/fork", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        href?: string;
      };

      if (!response.ok || !payload.href) {
        setError(payload.error ?? "Unable to fork skill.");
        return;
      }

      router.push(payload.href);
      router.refresh();
    });
  }

  return (
    <div className="grid content-start gap-1">
      <Button
        disabled={isPending}
        onClick={handleFork}
        size="sm"
        type="button"
        variant="soft"
      >
        <GitFork className="mr-1.5 h-3.5 w-3.5" aria-hidden />
        {isPending ? "Forking..." : label}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
