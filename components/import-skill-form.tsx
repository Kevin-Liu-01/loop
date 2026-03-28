"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { DownloadIcon, LinkIcon } from "@/components/frontier-icons";

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
    <form className="surface-panel import-skill-form" id="import" onSubmit={handleSubmit}>
      <div className="surface-panel__head">
        <div>
          <span className="section-kicker">Import</span>
          <h2>Import your own skill</h2>
        </div>
      </div>

      <p className="section-copy">Paste a markdown or README URL.</p>

      <label className="field-group">
        <span>Skill URL</span>
        <div className="catalog-search">
          <LinkIcon className="catalog-search__icon" />
          <input
            className="search-field__input"
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/skill.md"
            required
            type="url"
            value={url}
          />
        </div>
      </label>

      <div className="workflow-hint">
        <span className="workflow-hint__icon">
          <DownloadIcon />
        </span>
        <div>
          <strong>What happens next</strong>
          <p>Import. Edit. Refresh.</p>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      <div className="hero-actions">
        <button className="button" disabled={isPending || !url.trim()} type="submit">
          {isPending ? "Importing..." : "Import and set up"}
        </button>
      </div>
    </form>
  );
}
