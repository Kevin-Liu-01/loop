"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { CategoryDefinition } from "@/lib/types";

type UserSkillFormProps = {
  categories: CategoryDefinition[];
};

type FormState = {
  title: string;
  description: string;
  category: string;
  tags: string;
  sourceUrls: string;
  cadence: "daily" | "weekly" | "manual";
  automationPrompt: string;
  body: string;
};

const STORAGE_KEY = "skillwire.user-skill-draft";

function createInitialState(categories: CategoryDefinition[]): FormState {
  return {
    title: "",
    description: "",
    category: categories[0]?.slug ?? "frontend",
    tags: "",
    sourceUrls: "",
    cadence: "daily",
    automationPrompt: "",
    body: [
      "# Goal",
      "",
      "What should this skill help an agent do?",
      "",
      "## Workflow",
      "",
      "1. Start with the latest sources.",
      "2. Pull the concrete changes only.",
      "3. Turn the changes into reusable guidance."
    ].join("\n")
  };
}

function slugifyPreview(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function UserSkillForm({ categories }: UserSkillFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<FormState>(() => createInitialState(categories));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<FormState>;
      setState((current) => ({ ...current, ...parsed }));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const sourceList = useMemo(
    () =>
      state.sourceUrls
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
    [state.sourceUrls]
  );
  const tagList = useMemo(
    () =>
      state.tags
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [state.tags]
  );
  const slugPreview = useMemo(() => slugifyPreview(state.title) || "your-skill-slug", [state.title]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((current) => ({
      ...current,
      [key]: value
    }));
  }

  function resetDraft() {
    const nextState = createInitialState(categories);
    setState(nextState);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/skills", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          title: state.title,
          description: state.description,
          category: state.category,
          ownerName: "",
          tags: tagList,
          sourceUrls: sourceList,
          autoUpdate: state.cadence !== "manual",
          automationCadence: state.cadence,
          automationPrompt: state.automationPrompt,
          body: state.body
        })
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string; href?: string };
      if (!response.ok || !payload.href) {
        setError(payload.error ?? "Unable to create the skill.");
        return;
      }

      window.localStorage.removeItem(STORAGE_KEY);
      router.push(payload.href);
      router.refresh();
    });
  }

  return (
    <form className="surface-panel user-skill-form user-skill-form--single" id="create" onSubmit={handleSubmit}>
      <div className="surface-panel__head">
        <div>
          <span className="section-kicker">Create</span>
          <h2>Write one from scratch</h2>
        </div>
      </div>

      <p className="section-copy">Start with the text. Add the watchlist.</p>

      <div className="setup-status">
        <div>
          <small>slug</small>
          <strong>/{slugPreview}</strong>
        </div>
        <div>
          <small>sources</small>
          <strong>{sourceList.length}</strong>
        </div>
        <div>
          <small>refresh</small>
          <strong>{state.cadence === "manual" ? "manual" : state.cadence}</strong>
        </div>
      </div>

      <label className="field-group">
        <span>Title</span>
        <input
          className="text-field"
          maxLength={80}
          onChange={(event) => update("title", event.target.value)}
          placeholder="Frontend research loop"
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
          placeholder="What this skill does and what makes it useful."
          required
          value={state.description}
        />
      </label>

      <div className="form-row">
        <label className="field-group">
          <span>Category</span>
          <select
            className="text-field text-field--select"
            onChange={(event) => update("category", event.target.value)}
            value={state.category}
          >
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.title}
              </option>
            ))}
          </select>
        </label>

        <label className="field-group">
          <span>Tags</span>
          <input
            className="text-field"
            onChange={(event) => update("tags", event.target.value)}
            placeholder="seo, schema, frontend"
            value={state.tags}
          />
        </label>
      </div>

      <label className="field-group">
        <span>Source watchlist</span>
        <textarea
          className="text-field text-field--area"
          onChange={(event) => update("sourceUrls", event.target.value)}
          placeholder={"One URL per line\nhttps://react.dev/rss.xml\nhttps://vercel.com/blog/rss.xml"}
          value={state.sourceUrls}
        />
      </label>

      <div className="form-row">
        <label className="field-group">
          <span>Refresh cadence</span>
          <select
            className="text-field text-field--select"
            onChange={(event) => update("cadence", event.target.value as FormState["cadence"])}
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
            placeholder="What should the updater prioritize?"
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

      {error ? <p className="form-error">{error}</p> : null}

      <div className="hero-actions">
        <button className="button" disabled={isPending} type="submit">
          {isPending ? "Creating..." : "Create editable skill"}
        </button>
        <button className="button button--ghost" onClick={resetDraft} type="button">
          Reset draft
        </button>
      </div>
    </form>
  );
}
