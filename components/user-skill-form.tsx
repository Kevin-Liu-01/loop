"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Panel, PanelHead } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { FieldGroup, textFieldArea, textFieldBase, textFieldCode, textFieldSelect } from "@/components/ui/field";
import { cn } from "@/lib/cn";
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
    <Panel className="grid gap-5 content-start">
      <form className="contents" id="create" onSubmit={handleSubmit}>
        <PanelHead>
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">Create</span>
            <h2>Write one from scratch</h2>
          </div>
        </PanelHead>

        <p className="text-ink-soft">Start with the text. Add the watchlist.</p>

        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-1 max-md:grid-cols-1">
          <div className="grid gap-1 rounded-[14px] border border-line bg-paper-3 p-3">
            <small className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">slug</small>
            <strong className="text-sm font-semibold text-ink">/{slugPreview}</strong>
          </div>
          <div className="grid gap-1 rounded-[14px] border border-line bg-paper-3 p-3">
            <small className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">sources</small>
            <strong className="text-sm font-semibold text-ink">{sourceList.length}</strong>
          </div>
          <div className="grid gap-1 rounded-[14px] border border-line bg-paper-3 p-3">
            <small className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">refresh</small>
            <strong className="text-sm font-semibold text-ink">{state.cadence === "manual" ? "manual" : state.cadence}</strong>
          </div>
        </div>

        <FieldGroup>
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Title</span>
          <input
            className={cn(textFieldBase)}
            maxLength={80}
            onChange={(event) => update("title", event.target.value)}
            placeholder="Frontend research loop"
            required
            value={state.title}
          />
        </FieldGroup>

        <FieldGroup>
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Description</span>
          <textarea
            className={cn(textFieldBase, textFieldArea)}
            maxLength={220}
            onChange={(event) => update("description", event.target.value)}
            placeholder="What this skill does and what makes it useful."
            required
            value={state.description}
          />
        </FieldGroup>

        <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
          <FieldGroup>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Category</span>
            <select
              className={cn(textFieldBase, textFieldSelect)}
              onChange={(event) => update("category", event.target.value)}
              value={state.category}
            >
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.title}
                </option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Tags</span>
            <input
              className={cn(textFieldBase)}
              onChange={(event) => update("tags", event.target.value)}
              placeholder="seo, schema, frontend"
              value={state.tags}
            />
          </FieldGroup>
        </div>

        <FieldGroup>
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Source watchlist</span>
          <textarea
            className={cn(textFieldBase, textFieldArea)}
            onChange={(event) => update("sourceUrls", event.target.value)}
            placeholder={"One URL per line\nhttps://react.dev/rss.xml\nhttps://vercel.com/blog/rss.xml"}
            value={state.sourceUrls}
          />
        </FieldGroup>

        <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
          <FieldGroup>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Refresh cadence</span>
            <select
              className={cn(textFieldBase, textFieldSelect)}
              onChange={(event) => update("cadence", event.target.value as FormState["cadence"])}
              value={state.cadence}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="manual">Manual</option>
            </select>
          </FieldGroup>

          <FieldGroup>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Refresh prompt</span>
            <input
              className={cn(textFieldBase)}
              maxLength={240}
              onChange={(event) => update("automationPrompt", event.target.value)}
              placeholder="What should the updater prioritize?"
              value={state.automationPrompt}
            />
          </FieldGroup>
        </div>

        <details className="grid gap-4 rounded-2xl border border-line bg-paper-3 p-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
            Edit skill markdown
          </summary>
          <FieldGroup>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Skill markdown</span>
            <textarea
              className={cn(textFieldBase, textFieldCode)}
              onChange={(event) => update("body", event.target.value)}
              required
              value={state.body}
            />
          </FieldGroup>
        </details>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Button disabled={isPending} type="submit">
            {isPending ? "Creating..." : "Create editable skill"}
          </Button>
          <Button onClick={resetDraft} type="button" variant="ghost">
            Reset draft
          </Button>
        </div>
      </form>
    </Panel>
  );
}
