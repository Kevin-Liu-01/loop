"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { DownloadIcon, LinkIcon } from "@/components/frontier-icons";
import { Panel, PanelHead } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldLabel, textFieldBase } from "@/components/ui/field";
import { cn } from "@/lib/cn";

export function ImportSkillForm({
  onSuccess,
}: { onSuccess?: () => void } = {}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    onSuccess?.();

    startTransition(async () => {
      const importResponse = await fetch("/api/imports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "skill", url }),
      });

      const importPayload = (await importResponse
        .json()
        .catch(() => ({}))) as {
        error?: string;
        skill?: { slug?: string };
      };

      if (!importResponse.ok || !importPayload.skill?.slug) {
        setError(importPayload.error ?? "Unable to import that skill.");
        return;
      }

      setMessage("Imported. Creating an editable copy.");

      const trackResponse = await fetch("/api/skills/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: importPayload.skill.slug }),
      });

      const trackPayload = (await trackResponse
        .json()
        .catch(() => ({}))) as {
        error?: string;
        href?: string;
      };

      if (!trackResponse.ok || !trackPayload.href) {
        setError(
          trackPayload.error ??
            "Imported, but could not create the editable copy.",
        );
        return;
      }

      router.push(trackPayload.href);
      router.refresh();
    });
  }

  return (
    <Panel className="grid gap-5 content-start">
      <form className="contents" id="import" onSubmit={handleSubmit}>
        <PanelHead>
          <div>
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-ink-faint">
              Import
            </span>
            <h2 className="m-0 font-serif text-xl font-medium tracking-[-0.02em] text-ink">
              Import your own skill
            </h2>
          </div>
        </PanelHead>

        <p className="text-sm text-ink-soft">
          Paste a markdown or README URL.
        </p>

        <FieldGroup>
          <FieldLabel>Skill URL</FieldLabel>
          <div className="relative">
            <LinkIcon className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-soft" />
            <input
              className={cn(textFieldBase, "pl-11")}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/skill.md"
              required
              type="url"
              value={url}
            />
          </div>
        </FieldGroup>

        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border border-line bg-paper-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center border border-line bg-paper-2 text-ink-soft">
            <DownloadIcon />
          </span>
          <div>
            <strong className="text-sm font-semibold text-ink">
              What happens next
            </strong>
            <p className="m-0 text-sm text-ink-soft">
              Import. Edit. Refresh.
            </p>
          </div>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {message ? <p className="text-sm text-ink-soft">{message}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Button disabled={isPending || !url.trim()} type="submit">
            {isPending ? "Importing..." : "Import and set up"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
