"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { AnimatePresence, motion } from "motion/react";
import { ImageIcon, Loader2Icon } from "lucide-react";

import { AgentDocsEditor } from "@/components/agent-docs-editor";
import { SkillAuthorBadge } from "@/components/skill-author-badge";
import {
  CheckIcon,
  ChevronDownIcon,
  RefreshIcon,
  TriangleAlertIcon,
} from "@/components/frontier-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FieldGroup, textFieldArea, textFieldBase, textFieldCode, textFieldSelect } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { CATEGORY_REGISTRY } from "@/lib/registry";
import { AUTOMATION_PROMPT_MAX_LENGTH } from "@/lib/user-skills";
import type { AgentDocs, LoopUpdateStreamEvent, SkillRecord } from "@/lib/types";

const BODY_MAX_CHARS = 24_000;

type FeedbackBarProps = {
  variant: "error" | "success" | "progress";
  children: React.ReactNode;
};

function FeedbackBar({ variant, children }: FeedbackBarProps) {
  const styles = {
    error:
      "border-red-500/25 bg-red-500/8 text-red-600 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-400",
    success:
      "border-accent/25 bg-accent/8 text-accent dark:border-accent/20 dark:bg-accent/10",
    progress:
      "border-sky-500/25 bg-sky-500/8 text-sky-600 dark:border-sky-400/20 dark:bg-sky-950/30 dark:text-sky-400",
  };
  const icons = {
    error: <TriangleAlertIcon className="h-3.5 w-3.5 shrink-0" />,
    success: <CheckIcon className="h-3.5 w-3.5 shrink-0" />,
    progress: <Loader2Icon className="h-3.5 w-3.5 shrink-0 animate-spin" />,
  };
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-none border px-3.5 py-2.5 text-sm font-medium",
        styles[variant]
      )}
    >
      {icons[variant]}
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}

type CollapsibleSectionProps = {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

function CollapsibleSection({
  title,
  summary,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  return (
    <details
      className="group border-t border-line"
      open={defaultOpen || undefined}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 py-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
        <ChevronDownIcon className="h-3.5 w-3.5 text-ink-faint transition-transform group-open:rotate-180" />
        {title}
        {summary && (
          <span className="ml-auto text-xs font-normal text-ink-faint">
            {summary}
          </span>
        )}
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}

type SkillAuthorStudioProps = {
  skill: SkillRecord;
};

type AuthorStudioState = {
  title: string;
  description: string;
  category: SkillRecord["category"];
  tags: string;
  sourceUrls: string;
  cadence: "daily" | "weekly" | "manual";
  automationPrompt: string;
  body: string;
  ownerName: string;
  agentDocs: AgentDocs;
};

function buildInitialState(skill: SkillRecord): AuthorStudioState {
  return {
    title: skill.title,
    description: skill.description,
    category: skill.category,
    tags: skill.tags
      .filter((tag) => tag !== skill.category && tag !== "tracked" && tag !== "community")
      .join(", "),
    sourceUrls: (skill.sources ?? []).map((source) => source.url).join("\n"),
    cadence: skill.automation?.enabled ? skill.automation.cadence : "manual",
    automationPrompt: skill.automation?.prompt ?? "",
    body: skill.body,
    ownerName: skill.ownerName ?? "",
    agentDocs: skill.agentDocs ?? {}
  };
}

export function SkillAuthorStudio({ skill }: SkillAuthorStudioProps) {
  const router = useRouter();
  const [state, setState] = useState<AuthorStudioState>(() => buildInitialState(skill));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(skill.iconUrl ?? null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setState(buildInitialState(skill));
    setIconFile(null);
    setIconPreview(skill.iconUrl ?? null);
    setError(null);
    setNotice(null);
    setRunMessage(null);
  }, [
    skill.slug,
    skill.title,
    skill.description,
    skill.category,
    skill.body,
    skill.updatedAt,
    skill.versionLabel,
    skill.ownerName,
    skill.iconUrl,
    skill.tags,
    skill.sources,
    skill.automation?.cadence,
    skill.automation?.enabled,
    skill.automation?.prompt
  ]);

  const sourceCount = useMemo(
    () =>
      state.sourceUrls
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean).length,
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

  const isDirty = useMemo(
    () => JSON.stringify(buildInitialState(skill)) !== JSON.stringify(state) || iconFile !== null,
    [iconFile, skill, state]
  );

  function update<K extends keyof AuthorStudioState>(key: K, value: AuthorStudioState[K]) {
    setState((current) => ({
      ...current,
      [key]: value
    }));
  }

  function handleIconSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const allowedTypes = new Set(["image/png", "image/svg+xml", "image/webp", "image/jpeg"]);
    if (!allowedTypes.has(file.type) || file.size > 1_048_576) {
      setError("Icon must be PNG, SVG, WebP, or JPEG under 1 MB.");
      return;
    }

    setError(null);
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  }

  async function uploadIcon() {
    if (!iconFile) {
      return;
    }

    const formData = new FormData();
    formData.append("icon", iconFile);

    const response = await fetch(`/api/skills/${encodeURIComponent(skill.slug)}/icon`, {
      method: "POST",
      body: formData
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to upload the icon.");
    }
  }

  function buildFormPayload() {
    return {
      title: state.title,
      description: state.description,
      category: state.category,
      body: state.body,
      ownerName: state.ownerName,
      tags: tagList,
      sourceUrls: state.sourceUrls
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
      autoUpdate: state.cadence !== "manual",
      automationCadence: state.cadence,
      automationPrompt: state.automationPrompt,
      agentDocs: Object.keys(state.agentDocs).length > 0 ? state.agentDocs : undefined
    };
  }

  async function consumeNdjsonStream(body: ReadableStream<Uint8Array>) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;

      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;

        const event = JSON.parse(line) as LoopUpdateStreamEvent;
        if (event.type === "analysis") {
          setRunMessage(event.message);
        } else if (event.type === "source") {
          setRunMessage(`${event.source.label}: ${event.source.note ?? event.source.status}`);
        } else if (event.type === "complete") {
          router.push(event.result.href);
          router.refresh();
          return;
        } else if (event.type === "error") {
          setError(event.message);
          setRunMessage(null);
          return;
        }
      }
    }
  }

  async function save(refreshAfter: boolean) {
    setError(null);
    setNotice(null);

    if (refreshAfter) {
      setRunMessage("Saving edits and running refresh.");

      try {
        await uploadIcon();
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Unable to upload the icon.");
        setRunMessage(null);
        return;
      }

      const response = await fetch(`/api/skills/${encodeURIComponent(skill.slug)}/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildFormPayload())
      });

      if (!response.ok || !response.body) {
        const failedPayload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(failedPayload.error ?? "Unable to start the refresh.");
        setRunMessage(null);
        return;
      }

      await consumeNdjsonStream(response.body);
      return;
    }

    const response = await fetch(`/api/skills/${encodeURIComponent(skill.slug)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildFormPayload())
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      href?: string;
      slug?: string;
      changed?: boolean;
    };

    if (!response.ok || !payload.href || !payload.slug) {
      setError(payload.error ?? "Unable to save the skill.");
      return;
    }

    try {
      await uploadIcon();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload the icon.");
      return;
    }

    const wroteBranding = iconFile !== null;
    setNotice(
      payload.changed
        ? "Saved a new version."
        : wroteBranding
          ? "Updated branding."
          : "No changes to save."
    );
    router.push(payload.href);
    router.refresh();
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

  const agentDocCount = Object.values(state.agentDocs).filter(
    (v) => typeof v === "string" && v.length > 0
  ).length;

  const automationSummary = [
    state.cadence !== "manual" ? state.cadence : null,
    sourceCount > 0 ? `${sourceCount} source${sourceCount === 1 ? "" : "s"}` : null,
  ]
    .filter(Boolean)
    .join(" · ") || "manual";

  const brandingSummary = [
    iconPreview ? "icon" : null,
    state.ownerName ? "attribution" : null,
  ]
    .filter(Boolean)
    .join(" + ") || "none";

  return (
    <form className="grid gap-0" onSubmit={handleSubmit}>
      {/* ── Header row ── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-paper-3/60 px-4 py-3 dark:bg-paper-2/25">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
          Author studio
        </span>
        <Badge color="neutral" size="sm">{skill.versionLabel}</Badge>

        <AnimatePresence>
          {isDirty && (
            <motion.span
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 text-xs font-medium text-orange-500"
              exit={{ opacity: 0, x: -4 }}
              initial={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.2 }}
            >
              <motion.span
                animate={{ scale: [1, 1.4, 1] }}
                className="h-1.5 w-1.5 rounded-full bg-orange-500"
                transition={{ duration: 0.5, repeat: 0 }}
              />
              unsaved
            </motion.span>
          )}
        </AnimatePresence>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button disabled={isPending || !isDirty} size="sm" type="submit" variant="ghost">
            {isPending ? "Saving\u2026" : "Save"}
          </Button>
          <Button
            disabled={isPending || sourceCount === 0}
            onClick={handleSaveAndRefresh}
            size="sm"
            type="button"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            {isPending ? "Working\u2026" : "Save + refresh"}
          </Button>
        </div>
      </div>

      {/* ── Feedback bars ── */}
      {runMessage && <FeedbackBar variant="progress">{runMessage}</FeedbackBar>}
      {notice && <FeedbackBar variant="success">{notice}</FeedbackBar>}
      {error && <FeedbackBar variant="error">{error}</FeedbackBar>}

      <div className="grid gap-0 px-4 pt-4 pb-5">
        {/* ── Overview fields ── */}
        <div className="grid gap-4 pb-5">
          <div className="grid gap-4 xl:grid-cols-2">
            <FieldGroup>
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Title</span>
              <input
                className={cn(textFieldBase)}
                maxLength={80}
                onChange={(event) => update("title", event.target.value)}
                required
                value={state.title}
              />
            </FieldGroup>

            <FieldGroup>
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Category</span>
              <select
                className={cn(textFieldBase, textFieldSelect)}
                onChange={(event) => update("category", event.target.value as SkillRecord["category"])}
                value={state.category}
              >
                {CATEGORY_REGISTRY.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.title}
                  </option>
                ))}
              </select>
            </FieldGroup>
          </div>

          <FieldGroup>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Description</span>
            <textarea
              className={cn(textFieldBase, textFieldArea)}
              maxLength={220}
              onChange={(event) => update("description", event.target.value)}
              required
              value={state.description}
            />
          </FieldGroup>

          <FieldGroup>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Tags</span>
            <input
              className={cn(textFieldBase)}
              onChange={(event) => update("tags", event.target.value)}
              placeholder="nextjs, app-router, caching"
              value={state.tags}
            />
          </FieldGroup>
        </div>

        {/* ── Body editor ── */}
        <div className="grid gap-2 border-t border-line pt-5 pb-1">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
              Skill body
            </span>
            <span className="text-xs tabular-nums text-ink-faint">
              {state.body.length.toLocaleString()}/{BODY_MAX_CHARS.toLocaleString()}
            </span>
          </div>
          <textarea
            className={cn(textFieldBase, textFieldCode, "min-h-[420px]")}
            maxLength={BODY_MAX_CHARS}
            onChange={(event) => update("body", event.target.value)}
            required
            value={state.body}
          />
        </div>

        {/* ── Collapsible sections ── */}
        <CollapsibleSection summary={automationSummary} title="Automation">
          <div className="grid gap-4">
            <FieldGroup>
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Source watchlist</span>
              <textarea
                className={cn(textFieldBase, textFieldArea, "min-h-48")}
                onChange={(event) => update("sourceUrls", event.target.value)}
                placeholder={"One URL per line\nhttps://react.dev/rss.xml"}
                value={state.sourceUrls}
              />
            </FieldGroup>

            <div className="grid gap-4 xl:grid-cols-2">
              <FieldGroup>
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Refresh cadence</span>
                <select
                  className={cn(textFieldBase, textFieldSelect)}
                  onChange={(event) => update("cadence", event.target.value as AuthorStudioState["cadence"])}
                  value={state.cadence}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="manual">Manual</option>
                </select>
              </FieldGroup>

              <FieldGroup>
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Refresh prompt</span>
                <textarea
                  className={cn(textFieldBase, textFieldArea)}
                  maxLength={AUTOMATION_PROMPT_MAX_LENGTH}
                  onChange={(event) => update("automationPrompt", event.target.value)}
                  placeholder="What should the refresh care about?"
                  rows={5}
                  value={state.automationPrompt}
                />
              </FieldGroup>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          summary={agentDocCount > 0 ? `${agentDocCount} attached` : "none"}
          title="Agent docs"
        >
          <AgentDocsEditor
            onChange={(docs) => setState((current) => ({ ...current, agentDocs: docs }))}
            value={state.agentDocs}
          />
        </CollapsibleSection>

        <CollapsibleSection summary={brandingSummary} title="Branding">
          <div className="grid gap-4">
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
                  <span className="text-xs text-ink-faint">Square PNG, SVG, WebP, or JPEG. Max 1 MB.</span>
                </span>
                <input
                  accept="image/png,image/svg+xml,image/webp,image/jpeg"
                  className="sr-only"
                  onChange={handleIconSelect}
                  type="file"
                />
              </label>
            </FieldGroup>

            <FieldGroup>
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Attribution line</span>
              <input
                className={cn(textFieldBase)}
                onChange={(event) => update("ownerName", event.target.value)}
                placeholder="Shown when no verified author profile is attached."
                value={state.ownerName}
              />
            </FieldGroup>

            <div className="grid gap-2 rounded-none border border-line bg-paper-2/90 p-3 dark:bg-paper-2/40">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">Published as</span>
              <SkillAuthorBadge author={skill.author} ownerName={state.ownerName || skill.ownerName} />
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </form>
  );
}
