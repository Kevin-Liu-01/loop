"use client";

import { ImageIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { AgentDocsEditor } from "@/components/agent-docs-editor";
import {
  CheckIcon,
  ChevronDownIcon,
  RefreshIcon,
  TriangleAlertIcon,
} from "@/components/frontier-icons";
import { SkillAuthorBadge } from "@/components/skill-author-badge";
import { Badge } from "@/components/ui/badge";
import { BrailleSpinner } from "@/components/ui/braille-spinner";
import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  textFieldArea,
  textFieldBase,
  textFieldCode,
} from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import {
  CADENCE_ALL_OPTIONS,
  DAY_OF_WEEK_OPTIONS,
  DEFAULT_PREFERRED_DAY,
  DEFAULT_PREFERRED_HOUR,
  PREFERRED_HOUR_SELECT_OPTIONS,
} from "@/lib/automation-constants";
import { cn } from "@/lib/cn";
import { CATEGORY_REGISTRY } from "@/lib/registry";
import type { AgentDocs, SkillRecord } from "@/lib/types";
import { AUTOMATION_PROMPT_MAX_LENGTH } from "@/lib/user-skills";

const BODY_MAX_CHARS = 24_000;

const fieldLabel =
  "text-[0.625rem] font-medium uppercase tracking-[0.08em] text-ink-faint";

interface FeedbackBarProps {
  variant: "error" | "success" | "progress";
  children: React.ReactNode;
}

function FeedbackBar({ variant, children }: FeedbackBarProps) {
  const styles = {
    error:
      "border-red-500/25 bg-red-500/8 text-red-600 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-400",
    progress:
      "border-sky-500/25 bg-sky-500/8 text-sky-600 dark:border-sky-400/20 dark:bg-sky-950/30 dark:text-sky-400",
    success:
      "border-accent/25 bg-accent/8 text-accent dark:border-accent/20 dark:bg-accent/10",
  };
  const icons = {
    error: <TriangleAlertIcon className="h-3.5 w-3.5 shrink-0" />,
    progress: <BrailleSpinner className="shrink-0 text-sm" />,
    success: <CheckIcon className="h-3.5 w-3.5 shrink-0" />,
  };
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-none border px-3.5 py-2 text-xs font-medium",
        styles[variant]
      )}
    >
      {icons[variant]}
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  summary,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  return (
    <details
      className="group border-t border-line/60 dark:border-line/40"
      open={defaultOpen || undefined}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 py-3 text-[0.625rem] font-medium uppercase tracking-[0.08em] text-ink-faint transition-colors hover:text-ink-soft [&::-webkit-details-marker]:hidden">
        <ChevronDownIcon className="h-3 w-3 transition-transform group-open:rotate-180" />
        {title}
        {summary && (
          <span className="ml-auto font-normal normal-case tracking-normal text-ink-faint">
            {summary}
          </span>
        )}
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  );
}

interface SkillAuthorStudioProps {
  skill: SkillRecord;
}

interface AuthorStudioState {
  title: string;
  description: string;
  category: SkillRecord["category"];
  tags: string;
  sourceUrls: string;
  cadence: "daily" | "weekly" | "manual";
  preferredHour: number;
  preferredDay: number;
  automationPrompt: string;
  body: string;
  ownerName: string;
  agentDocs: AgentDocs;
}

function buildInitialState(skill: SkillRecord): AuthorStudioState {
  return {
    agentDocs: skill.agentDocs ?? {},
    automationPrompt: skill.automation?.prompt ?? "",
    body: skill.body,
    cadence: skill.automation?.enabled ? skill.automation.cadence : "manual",
    category: skill.category,
    description: skill.description,
    ownerName: skill.ownerName ?? "",
    preferredDay: skill.automation?.preferredDay ?? DEFAULT_PREFERRED_DAY,
    preferredHour: skill.automation?.preferredHour ?? DEFAULT_PREFERRED_HOUR,
    sourceUrls: (skill.sources ?? []).map((source) => source.url).join("\n"),
    tags: skill.tags
      .filter(
        (tag) =>
          tag !== skill.category && tag !== "tracked" && tag !== "community"
      )
      .join(", "),
    title: skill.title,
  };
}

export function SkillAuthorStudio({ skill }: SkillAuthorStudioProps) {
  const router = useRouter();
  const [state, setState] = useState<AuthorStudioState>(() =>
    buildInitialState(skill)
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(
    skill.iconUrl ?? null
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setState(buildInitialState(skill));
    setIconFile(null);
    setIconPreview(skill.iconUrl ?? null);
    setError(null);
    setNotice(null);
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
    skill.automation?.prompt,
    skill.automation?.preferredHour,
    skill.automation?.preferredDay,
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
    () =>
      JSON.stringify(buildInitialState(skill)) !== JSON.stringify(state) ||
      iconFile !== null,
    [iconFile, skill, state]
  );

  function update<K extends keyof AuthorStudioState>(
    key: K,
    value: AuthorStudioState[K]
  ) {
    setState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleIconSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const allowedTypes = new Set([
      "image/png",
      "image/svg+xml",
      "image/webp",
      "image/jpeg",
    ]);
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

    const response = await fetch(
      `/api/skills/${encodeURIComponent(skill.slug)}/icon`,
      {
        body: formData,
        method: "POST",
      }
    );

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to upload the icon.");
    }
  }

  function buildFormPayload() {
    return {
      agentDocs:
        Object.keys(state.agentDocs).length > 0 ? state.agentDocs : undefined,
      autoUpdate: state.cadence !== "manual",
      automationCadence: state.cadence,
      automationPrompt: state.automationPrompt,
      body: state.body,
      category: state.category,
      description: state.description,
      ownerName: state.ownerName,
      preferredDay: state.preferredDay,
      preferredHour: state.preferredHour,
      sourceUrls: state.sourceUrls
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
      tags: tagList,
      title: state.title,
    };
  }

  async function save(): Promise<boolean> {
    setError(null);
    setNotice(null);

    const response = await fetch(
      `/api/skills/${encodeURIComponent(skill.slug)}`,
      {
        body: JSON.stringify(buildFormPayload()),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }
    );

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      href?: string;
      slug?: string;
      changed?: boolean;
    };

    if (!response.ok || !payload.href || !payload.slug) {
      setError(payload.error ?? "Unable to save the skill.");
      return false;
    }

    try {
      await uploadIcon();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload the icon."
      );
      return false;
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
    return true;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      await save();
    });
  }

  function handleSaveAndRefresh() {
    startTransition(async () => {
      const ok = await save();
      if (ok) {
        window.dispatchEvent(new Event("loop:trigger-refresh"));
      }
    });
  }

  const agentDocCount = Object.values(state.agentDocs).filter(
    (v) => typeof v === "string" && v.length > 0
  ).length;

  const automationSummary =
    [
      state.cadence !== "manual" ? state.cadence : null,
      sourceCount > 0
        ? `${sourceCount} source${sourceCount === 1 ? "" : "s"}`
        : null,
    ]
      .filter(Boolean)
      .join(" · ") || "manual";

  const brandingSummary =
    [iconPreview ? "icon" : null, state.ownerName ? "attribution" : null]
      .filter(Boolean)
      .join(" + ") || "none";

  return (
    <form className="grid gap-0 border border-line" onSubmit={handleSubmit}>
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2.5 border-b border-line bg-paper-3/95 px-4 py-2.5 backdrop-blur-sm dark:bg-paper-2/90">
        <span className="text-[0.625rem] font-medium uppercase tracking-[0.08em] text-ink-faint">
          Author studio
        </span>
        <Badge color="neutral" size="sm">
          {skill.versionLabel}
        </Badge>

        <AnimatePresence>
          {isDirty && (
            <motion.span
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 text-[0.625rem] font-medium text-accent"
              exit={{ opacity: 0, x: -4 }}
              initial={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.2 }}
            >
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                className="h-1.5 w-1.5 rounded-full bg-accent"
                transition={{ duration: 0.4, repeat: 0 }}
              />
              unsaved
            </motion.span>
          )}
        </AnimatePresence>

        <div className="ml-auto flex items-center gap-2">
          <Button
            disabled={isPending || !isDirty}
            size="sm"
            type="submit"
            variant="ghost"
          >
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

      {/* ── Feedback ── */}
      {(notice || error) && (
        <div className="grid gap-0 border-b border-line/60">
          {notice && <FeedbackBar variant="success">{notice}</FeedbackBar>}
          {error && <FeedbackBar variant="error">{error}</FeedbackBar>}
        </div>
      )}

      {/* ── Form body ── */}
      <div className="grid gap-0 px-4 pt-3.5 pb-4">
        {/* Overview fields */}
        <div className="grid gap-3 pb-4">
          <div className="grid gap-3 xl:grid-cols-2">
            <FieldGroup>
              <span className={fieldLabel}>Title</span>
              <input
                className={textFieldBase}
                maxLength={80}
                onChange={(event) => update("title", event.target.value)}
                required
                value={state.title}
              />
            </FieldGroup>

            <FieldGroup>
              <span className={fieldLabel}>Category</span>
              <Select
                onChange={(v) =>
                  update("category", v as SkillRecord["category"])
                }
                options={CATEGORY_REGISTRY.map((c) => ({
                  label: c.title,
                  value: c.slug,
                }))}
                value={state.category}
              />
            </FieldGroup>
          </div>

          <FieldGroup>
            <span className={fieldLabel}>Description</span>
            <textarea
              className={cn(textFieldBase, "min-h-16 resize-y")}
              maxLength={220}
              onChange={(event) => update("description", event.target.value)}
              required
              rows={2}
              value={state.description}
            />
          </FieldGroup>

          <FieldGroup>
            <span className={fieldLabel}>Tags</span>
            <input
              className={textFieldBase}
              onChange={(event) => update("tags", event.target.value)}
              placeholder="nextjs, app-router, caching"
              value={state.tags}
            />
          </FieldGroup>
        </div>

        {/* Skill body */}
        <div className="grid gap-1.5 border-t border-line/60 pt-4 pb-1 dark:border-line/40">
          <div className="flex items-baseline justify-between">
            <span className={fieldLabel}>Skill body</span>
            <span className="text-[0.625rem] tabular-nums text-ink-faint">
              {state.body.length.toLocaleString()}/
              {BODY_MAX_CHARS.toLocaleString()}
            </span>
          </div>
          <textarea
            className={cn(textFieldBase, textFieldCode, "min-h-[280px]")}
            maxLength={BODY_MAX_CHARS}
            onChange={(event) => update("body", event.target.value)}
            required
            value={state.body}
          />
        </div>

        {/* Collapsible sections */}
        <CollapsibleSection summary={automationSummary} title="Automation">
          <div className="grid gap-3">
            <FieldGroup>
              <span className={fieldLabel}>Source watchlist</span>
              <textarea
                className={cn(textFieldBase, textFieldArea)}
                onChange={(event) => update("sourceUrls", event.target.value)}
                placeholder={"One URL per line\nhttps://react.dev/rss.xml"}
                value={state.sourceUrls}
              />
            </FieldGroup>

            <div
              className={cn(
                "grid gap-3",
                state.cadence === "weekly" ? "xl:grid-cols-3" : "xl:grid-cols-2"
              )}
            >
              <FieldGroup>
                <span className={fieldLabel}>Refresh cadence</span>
                <Select
                  onChange={(v) =>
                    update("cadence", v as AuthorStudioState["cadence"])
                  }
                  options={CADENCE_ALL_OPTIONS}
                  value={state.cadence}
                />
              </FieldGroup>

              {state.cadence === "weekly" && (
                <FieldGroup>
                  <span className={fieldLabel}>Day of week</span>
                  <Select
                    onChange={(v) => update("preferredDay", Number(v))}
                    options={DAY_OF_WEEK_OPTIONS.map((o) => ({
                      label: o.label,
                      value: o.value,
                    }))}
                    value={String(state.preferredDay)}
                  />
                </FieldGroup>
              )}

              <FieldGroup>
                <span className={fieldLabel}>Preferred time (UTC)</span>
                <Select
                  onChange={(v) => update("preferredHour", Number(v))}
                  options={PREFERRED_HOUR_SELECT_OPTIONS}
                  value={String(state.preferredHour)}
                />
              </FieldGroup>
            </div>

            <FieldGroup>
              <span className={fieldLabel}>Refresh prompt</span>
              <textarea
                className={cn(textFieldBase, textFieldArea)}
                maxLength={AUTOMATION_PROMPT_MAX_LENGTH}
                onChange={(event) =>
                  update("automationPrompt", event.target.value)
                }
                placeholder="What should the refresh care about?"
                rows={3}
                value={state.automationPrompt}
              />
            </FieldGroup>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          summary={agentDocCount > 0 ? `${agentDocCount} attached` : "none"}
          title="Agent docs"
        >
          <AgentDocsEditor
            embedded
            onChange={(docs) =>
              setState((current) => ({ ...current, agentDocs: docs }))
            }
            value={state.agentDocs}
          />
        </CollapsibleSection>

        <CollapsibleSection summary={brandingSummary} title="Branding">
          <div className="grid gap-3">
            <FieldGroup>
              <span className={fieldLabel}>Skill icon</span>
              <label className="flex cursor-pointer items-center gap-3 border border-dashed border-line bg-paper-2/50 px-3 py-3 transition-colors hover:border-ink-faint dark:bg-paper-3/20">
                {iconPreview ? (
                  <img
                    alt="Icon preview"
                    className="h-10 w-10 shrink-0 object-cover"
                    src={iconPreview}
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-paper-2 dark:bg-paper-3/40">
                    <ImageIcon className="h-4 w-4 text-ink-faint" />
                  </span>
                )}
                <span className="grid gap-0.5">
                  <span className="text-xs font-medium text-ink">
                    {iconPreview ? "Change icon" : "Upload icon"}
                  </span>
                  <span className="text-[0.625rem] text-ink-faint">
                    PNG, SVG, WebP, JPEG · max 1 MB
                  </span>
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
              <span className={fieldLabel}>Attribution line</span>
              <input
                className={textFieldBase}
                onChange={(event) => update("ownerName", event.target.value)}
                placeholder="Shown when no verified author profile is attached."
                value={state.ownerName}
              />
            </FieldGroup>

            <div className="grid gap-1.5 border border-line/60 bg-paper-2/50 p-3 dark:border-line/40 dark:bg-paper-3/20">
              <span className={fieldLabel}>Published as</span>
              <SkillAuthorBadge
                author={skill.author}
                ownerName={state.ownerName || skill.ownerName}
                iconUrl={skill.iconUrl}
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </form>
  );
}
