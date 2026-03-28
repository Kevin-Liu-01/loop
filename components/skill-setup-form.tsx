"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { EditFileIcon, RefreshIcon } from "@/components/frontier-icons";
import type { LoopUpdateStreamEvent, SkillAutomationState, SourceDefinition } from "@/lib/types";

type SkillSetupFormProps = {
  slug: string;
  title: string;
  description: string;
  category: string;
  body: string;
  versionLabel: string;
  updatedAt: string;
  tags: string[];
  ownerName?: string;
  sources: SourceDefinition[];
  automation?: SkillAutomationState;
};

type SetupState = {
  title: string;
  description: string;
  sourceUrls: string;
  cadence: "daily" | "weekly" | "manual";
  automationPrompt: string;
  body: string;
};

function buildInitialState(props: SkillSetupFormProps): SetupState {
  return {
    title: props.title,
    description: props.description,
    sourceUrls: props.sources.map((source) => source.url).join("\n"),
    cadence: props.automation?.enabled ? props.automation.cadence : "manual",
    automationPrompt: props.automation?.prompt ?? "",
    body: props.body
  };
}

export function SkillSetupForm(props: SkillSetupFormProps) {
  const router = useRouter();
  const [state, setState] = useState<SetupState>(() => buildInitialState(props));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setState(buildInitialState(props));
    setError(null);
    setNotice(null);
    setRunMessage(null);
  }, [
    props.slug,
    props.title,
    props.description,
    props.body,
    props.updatedAt,
    props.versionLabel,
    props.automation?.cadence,
    props.automation?.enabled,
    props.automation?.prompt,
    props.sources
  ]);

  const sourceCount = useMemo(
    () =>
      state.sourceUrls
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean).length,
    [state.sourceUrls]
  );

  const tagSeed = useMemo(
    () => props.tags.filter((tag) => tag !== props.category && tag !== "tracked" && tag !== "community"),
    [props.category, props.tags]
  );

  const isDirty = useMemo(() => {
    const initial = buildInitialState(props);
    return JSON.stringify(initial) !== JSON.stringify(state);
  }, [props, state]);

  function update<K extends keyof SetupState>(key: K, value: SetupState[K]) {
    setState((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function save(refreshAfter: boolean) {
    setError(null);
    setNotice(null);
    setRunMessage(refreshAfter ? "Saving changes." : null);

    const response = await fetch("/api/skills", {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        slug: props.slug,
        title: state.title,
        description: state.description,
        category: props.category,
        body: state.body,
        ownerName: props.ownerName,
        tags: tagSeed,
        sourceUrls: state.sourceUrls
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
        autoUpdate: state.cadence !== "manual",
        automationCadence: state.cadence,
        automationPrompt: state.automationPrompt
      })
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      href?: string;
      slug?: string;
      changed?: boolean;
    };

    if (!response.ok || !payload.href || !payload.slug) {
      setError(payload.error ?? "Unable to save the skill setup.");
      setRunMessage(null);
      return;
    }

    if (!refreshAfter) {
      setNotice(payload.changed ? "Saved a new version." : "No setup changes to save.");
      router.push(payload.href);
      router.refresh();
      return;
    }

    setRunMessage("Running refresh from the saved setup.");

    const updateResponse = await fetch("/api/admin/loops/update", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        slug: payload.slug,
        origin: "user"
      })
    });

    if (!updateResponse.ok || !updateResponse.body) {
      const failedPayload = (await updateResponse.json().catch(() => ({}))) as { error?: string };
      setError(failedPayload.error ?? "Unable to start the refresh.");
      setRunMessage(null);
      return;
    }

    const reader = updateResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        break;
      }

      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        const event = JSON.parse(line) as LoopUpdateStreamEvent;
        if (event.type === "analysis") {
          setRunMessage(event.message);
          continue;
        }
        if (event.type === "source") {
          setRunMessage(`${event.source.label}: ${event.source.note ?? event.source.status}`);
          continue;
        }
        if (event.type === "complete") {
          router.push(event.result.href);
          router.refresh();
          return;
        }
        if (event.type === "error") {
          setError(event.message);
          setRunMessage(null);
          return;
        }
      }
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      await save(false);
    });
  }

  function handleSaveAndRefresh() {
    startTransition(async () => {
      await save(true);
    });
  }

  return (
    <form className="surface-panel skill-setup-card" onSubmit={handleSubmit}>
      <div className="surface-panel__head">
        <div>
          <span className="section-kicker">Setup</span>
          <h2>Edit sources and refresh rules</h2>
        </div>
      </div>

      <p className="section-copy">Edit the watchlist, prompt, or skill.</p>

      <div className="setup-status">
        <div>
          <small>version</small>
          <strong>{props.versionLabel}</strong>
        </div>
        <div>
          <small>sources</small>
          <strong>{sourceCount}</strong>
        </div>
        <div>
          <small>refresh</small>
          <strong>{state.cadence === "manual" ? "manual" : state.cadence}</strong>
        </div>
        <div>
          <small>status</small>
          <strong>{props.automation?.status ?? "paused"}</strong>
        </div>
      </div>

      <div className="setup-form-grid">
        <label className="field-group">
          <span>Title</span>
          <input
            className="text-field"
            maxLength={80}
            onChange={(event) => update("title", event.target.value)}
            required
            value={state.title}
          />
        </label>

        <label className="field-group">
          <span>Description</span>
          <textarea
            className="text-field text-field--area"
            maxLength={220}
            onChange={(event) => update("description", event.target.value)}
            required
            value={state.description}
          />
        </label>

        <label className="field-group">
          <span>Source watchlist</span>
          <textarea
            className="text-field text-field--area"
            onChange={(event) => update("sourceUrls", event.target.value)}
            placeholder={"One URL per line\nhttps://react.dev/rss.xml"}
            value={state.sourceUrls}
          />
        </label>

        <div className="form-row">
          <label className="field-group">
            <span>Refresh cadence</span>
            <select
              className="text-field text-field--select"
              onChange={(event) => update("cadence", event.target.value as SetupState["cadence"])}
              value={state.cadence}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="manual">Manual</option>
            </select>
          </label>

          <label className="field-group">
            <span>Refresh prompt</span>
            <input
              className="text-field"
              maxLength={240}
              onChange={(event) => update("automationPrompt", event.target.value)}
              placeholder="What should the refresh care about?"
              value={state.automationPrompt}
            />
          </label>
        </div>

        <details className="setup-editor-disclosure">
          <summary>Edit skill markdown</summary>
          <label className="field-group">
            <span>Skill markdown</span>
            <textarea
              className="text-field text-field--code"
              onChange={(event) => update("body", event.target.value)}
              required
              value={state.body}
            />
          </label>
        </details>
      </div>

      <div className="workflow-hint">
        <span className="workflow-hint__icon">
          <EditFileIcon />
        </span>
        <div>
          <strong>Fast path</strong>
          <p>Save. Then refresh.</p>
        </div>
      </div>

      {runMessage ? <p className="form-success">{runMessage}</p> : null}
      {notice ? <p className="form-success">{notice}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="hero-actions">
        <button className="button button--ghost" disabled={isPending || !isDirty} type="submit">
          {isPending ? "Saving..." : "Save changes"}
        </button>
        <button
          className="button"
          disabled={isPending || sourceCount === 0}
          onClick={handleSaveAndRefresh}
          type="button"
        >
          <RefreshIcon />
          {isPending ? "Working..." : "Save and refresh"}
        </button>
      </div>
    </form>
  );
}
