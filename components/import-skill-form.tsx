"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { DownloadIcon, LinkIcon } from "@/components/frontier-icons";
import { Panel, PanelHead } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { FieldGroup, textFieldBase } from "@/components/ui/field";
import { cn } from "@/lib/cn";

export function ImportSkillForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const importResponse = await fetch("/api/imports", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          kind: "skill",
          url
        })
      });

      const importPayload = (await importResponse.json().catch(() => ({}))) as {
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
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          slug: importPayload.skill.slug
        })
      });

      const trackPayload = (await trackResponse.json().catch(() => ({}))) as {
        error?: string;
        href?: string;
      };

      if (!trackResponse.ok || !trackPayload.href) {
        setError(trackPayload.error ?? "Imported, but could not create the editable copy.");
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
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">Import</span>
            <h2>Import your own skill</h2>
          </div>
        </PanelHead>

        <p className="text-ink-soft">Paste a markdown or README URL.</p>

        <FieldGroup>
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Skill URL</span>
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

        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-line bg-paper-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper-3 text-ink-soft">
            <DownloadIcon />
          </span>
          <div>
            <strong>What happens next</strong>
            <p>Import. Edit. Refresh.</p>
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
