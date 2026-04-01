"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ImageIcon } from "lucide-react";

import { AgentDocsEditor } from "@/components/agent-docs-editor";
import {
  ClockIcon,
  EyeIcon,
  GlobeIcon,
  HashIcon,
  PlusIcon,
  ResetIcon,
  WalletIcon,
} from "@/components/frontier-icons";
import { Panel, PanelHead } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { FieldGroup, textFieldArea, textFieldBase, textFieldCode } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { CADENCE_ALL_OPTIONS } from "@/lib/automation-constants";
import { AUTOMATION_PROMPT_MAX_LENGTH } from "@/lib/user-skills";
import type { AgentDocs, CategoryDefinition } from "@/lib/types";

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
  price: string;
  visibility: "public" | "private";
  agentDocs: AgentDocs;
};

const VISIBILITY_OPTIONS = [
  { value: "private", label: "Private \u00b7 only you can see it" },
  { value: "public", label: "Public \u00b7 visible in catalog" },
];

const STORAGE_KEY = "loop.user-skill-draft";

function createInitialState(categories: CategoryDefinition[]): FormState {
  return {
    title: "",
    description: "",
    category: categories[0]?.slug ?? "frontend",
    tags: "",
    sourceUrls: "",
    cadence: "daily",
    automationPrompt: "",
    price: "",
    visibility: "private",
    agentDocs: {},
    body: [
      "# Skill Title",
      "",
      "One-paragraph summary: what this skill does, who it's for, and when to use it.",
      "",
      "## When to use",
      "",
      "- Use this when [concrete trigger condition]",
      "- Use this when [scenario]",
      "",
      "## When NOT to use",
      "",
      "- Do not use for [anti-pattern] – reach for [alternative] instead",
      "",
      "## Core concepts",
      "",
      "| Concept | Description |",
      "|---------|-------------|",
      "| Term 1 | Definition |",
      "| Term 2 | Definition |",
      "",
      "## Workflow",
      "",
      "### Step 1: Gather context",
      "- Start with the latest sources",
      "- Pull the concrete changes only",
      "",
      "### Step 2: Apply the skill",
      "- Turn the changes into reusable guidance",
      "- Include code examples where helpful",
      "",
      "### Step 3: Verify",
      "- Check that the output meets evaluation criteria",
      "",
      "## Examples",
      "",
      "### Example 1: Basic usage",
      "",
      "```",
      "Your code or config example here",
      "```",
      "",
      "## Edge cases and gotchas",
      "",
      "1. [Non-obvious failure mode] – mitigation: [fix]",
      "",
      "## Evaluation criteria",
      "",
      "- [ ] Does the output meet quality standards?",
      "- [ ] Are edge cases handled?",
      "- [ ] Is the guidance actionable and specific?"
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
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

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

  function handleIconSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const ALLOWED = new Set(["image/png", "image/svg+xml", "image/webp", "image/jpeg"]);
    if (!ALLOWED.has(file.type) || file.size > 1_048_576) {
      setError("Icon must be PNG, SVG, WebP, or JPEG under 1 MB.");
      return;
    }

    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  }

  function resetDraft() {
    const nextState = createInitialState(categories);
    setState(nextState);
    setIconFile(null);
    setIconPreview(null);
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
          body: state.body,
          visibility: state.visibility,
          agentDocs: Object.keys(state.agentDocs).length > 0 ? state.agentDocs : undefined,
          price: state.price
            ? { amount: Math.round(parseFloat(state.price) * 100), currency: "usd" }
            : null
        })
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string; href?: string; slug?: string };
      if (!response.ok || !payload.href) {
        setError(payload.error ?? "Unable to create the skill.");
        return;
      }

      if (iconFile && payload.slug) {
        const formData = new FormData();
        formData.append("icon", iconFile);
        await fetch(`/api/skills/${encodeURIComponent(payload.slug)}/icon`, {
          method: "POST",
          body: formData,
        });
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
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">Create</span>
            <h2>Write one from scratch</h2>
          </div>
        </PanelHead>

        <p className="text-ink-soft">Start with the text. Add the watchlist.</p>

        <div className="grid grid-cols-5 gap-3 max-lg:grid-cols-2 max-md:grid-cols-1">
          <div className="grid gap-1 rounded-[14px] border border-line bg-paper-3 p-3">
            <small className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">
              <HashIcon className="h-3 w-3" />
              slug
            </small>
            <strong className="text-sm font-semibold text-ink">/{slugPreview}</strong>
          </div>
          <div className="grid gap-1 rounded-[14px] border border-line bg-paper-3 p-3">
            <small className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">
              <GlobeIcon className="h-3 w-3" />
              sources
            </small>
            <strong className="text-sm font-semibold text-ink">{sourceList.length}</strong>
          </div>
          <div className="grid gap-1 rounded-[14px] border border-line bg-paper-3 p-3">
            <small className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">
              <ClockIcon className="h-3 w-3" />
              refresh
            </small>
            <strong className="text-sm font-semibold text-ink">{state.cadence === "manual" ? "manual" : state.cadence}</strong>
          </div>
          <div className="grid gap-1 rounded-[14px] border border-line bg-paper-3 p-3">
            <small className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">
              <WalletIcon className="h-3 w-3" />
              price
            </small>
            <strong className="text-sm font-semibold text-ink">
              {state.price && parseFloat(state.price) > 0 ? `$${parseFloat(state.price).toFixed(2)}` : "Free"}
            </strong>
          </div>
          <div className="grid gap-1 rounded-[14px] border border-line bg-paper-3 p-3">
            <small className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">
              <EyeIcon className="h-3 w-3" />
              visibility
            </small>
            <strong className="text-sm font-semibold text-ink">
              {state.visibility === "public" ? "Public" : "Private"}
            </strong>
          </div>
        </div>

        <FieldGroup>
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Skill icon</span>
          <label className="flex cursor-pointer items-center gap-4 rounded-[14px] border border-dashed border-line bg-paper-3 p-4 transition-colors hover:border-ink-faint">
            {iconPreview ? (
              <img alt="Icon preview" className="h-12 w-12 shrink-0 rounded-lg object-cover" src={iconPreview} />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-paper-2">
                <ImageIcon className="h-5 w-5 text-ink-faint" />
              </span>
            )}
            <span className="grid gap-0.5">
              <span className="text-sm font-medium text-ink">{iconPreview ? "Change icon" : "Upload icon"}</span>
              <span className="text-xs text-ink-faint">Square PNG, SVG, WebP, or JPEG – max 1 MB</span>
            </span>
            <input accept="image/png,image/svg+xml,image/webp,image/jpeg" className="sr-only" onChange={handleIconSelect} type="file" />
          </label>
        </FieldGroup>

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
            <Select
              onChange={(v) => update("category", v)}
              options={categories.map((c) => ({ value: c.slug, label: c.title }))}
              value={state.category}
            />
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
            <Select
              onChange={(v) => update("cadence", v as FormState["cadence"])}
              options={CADENCE_ALL_OPTIONS}
              value={state.cadence}
            />
          </FieldGroup>

          <FieldGroup>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Visibility</span>
            <Select
              onChange={(v) => update("visibility", v as FormState["visibility"])}
              options={VISIBILITY_OPTIONS}
              value={state.visibility}
            />
          </FieldGroup>
        </div>

        <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
          <FieldGroup>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Price (USD)</span>
            <input
              className={cn(textFieldBase)}
              min="0"
              max="1000"
              onChange={(event) => update("price", event.target.value)}
              placeholder="0.00 (free)"
              step="0.01"
              type="number"
              value={state.price}
            />
          </FieldGroup>

          <FieldGroup>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Refresh prompt</span>
            <input
              className={cn(textFieldBase)}
              maxLength={AUTOMATION_PROMPT_MAX_LENGTH}
              onChange={(event) => update("automationPrompt", event.target.value)}
              placeholder="What should the updater prioritize?"
              value={state.automationPrompt}
            />
          </FieldGroup>
        </div>

        <AgentDocsEditor
          onChange={(docs) => setState((current) => ({ ...current, agentDocs: docs }))}
          value={state.agentDocs}
        />

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
            <PlusIcon className="h-3.5 w-3.5" />
            {isPending ? "Creating..." : "Create editable skill"}
          </Button>
          <Button onClick={resetDraft} type="button" variant="ghost">
            <ResetIcon className="h-3.5 w-3.5" />
            Reset draft
          </Button>
        </div>
      </form>
    </Panel>
  );
}
