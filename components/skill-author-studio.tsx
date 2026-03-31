"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ImageIcon } from "lucide-react";

import { AgentDocsEditor } from "@/components/agent-docs-editor";
import { SkillAuthorBadge } from "@/components/skill-author-badge";
import { SkillVisibilityToggle } from "@/components/skill-visibility-toggle";
import { RefreshIcon } from "@/components/frontier-icons";
import { Button } from "@/components/ui/button";
import { FieldGroup, textFieldArea, textFieldBase, textFieldCode, textFieldSelect } from "@/components/ui/field";
import { Panel, PanelHead } from "@/components/ui/panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/shadcn/tabs";
import { cn } from "@/lib/cn";
import { CATEGORY_REGISTRY } from "@/lib/registry";
import type { AgentDocs, LoopUpdateStreamEvent, SkillRecord } from "@/lib/types";

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

  async function save(refreshAfter: boolean) {
    setError(null);
    setNotice(null);
    setRunMessage(refreshAfter ? "Saving author changes." : null);

    const response = await fetch(`/api/skills/${encodeURIComponent(skill.slug)}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
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
      })
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      href?: string;
      slug?: string;
      changed?: boolean;
    };

    if (!response.ok || !payload.href || !payload.slug) {
      setError(payload.error ?? "Unable to save the skill.");
      setRunMessage(null);
      return;
    }

    try {
      await uploadIcon();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload the icon.");
      setRunMessage(null);
      return;
    }

    if (!refreshAfter) {
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
      return;
    }

    setRunMessage("Running refresh from the updated draft.");

    const updateResponse = await fetch("/api/admin/loops/update", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        slug: payload.slug,
        origin: skill.origin === "remote" ? "remote" : "user"
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
    <Panel className="grid gap-5 content-start">
      <PanelHead>
        <div>
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
            Author studio
          </span>
          <h2>Publish edits from here</h2>
        </div>
      </PanelHead>

      <div className="grid gap-3 md:grid-cols-5">
        <div className="grid gap-1 rounded-[14px] border border-line bg-paper-3 p-3">
          <small className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">version</small>
          <strong className="text-sm font-semibold text-ink">{skill.versionLabel}</strong>
        </div>
        <div className="grid gap-1 rounded-[14px] border border-line bg-paper-3 p-3">
          <small className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">publisher</small>
          <SkillAuthorBadge author={skill.author} compact ownerName={state.ownerName || skill.ownerName} />
        </div>
        <div className="grid gap-1 rounded-[14px] border border-line bg-paper-3 p-3">
          <small className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">sources</small>
          <strong className="text-sm font-semibold text-ink">{sourceCount}</strong>
        </div>
        <div className="grid gap-1 rounded-[14px] border border-line bg-paper-3 p-3">
          <small className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">refresh</small>
          <strong className="text-sm font-semibold text-ink">
            {state.cadence === "manual" ? "manual" : state.cadence}
          </strong>
        </div>
        <div className="grid gap-1 rounded-[14px] border border-line bg-paper-3 p-3">
          <small className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">visibility</small>
          <SkillVisibilityToggle
            canEdit
            currentVisibility={skill.visibility}
            slug={skill.slug}
          />
        </div>
      </div>

      <div className="rounded-none border border-line bg-paper-3/80 p-4 text-sm leading-relaxed text-ink-soft dark:bg-paper-2/35">
        Edit metadata, markdown, sources, cadence, and branding in one place. Save a clean version,
        then optionally kick the refresh engine from the same surface.
      </div>

      <form className="grid gap-6" onSubmit={handleSubmit}>
        <Tabs className="grid gap-4" defaultValue="overview">
          <TabsList className="h-auto w-full justify-start gap-1 bg-paper-2/70 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="agent-docs">Agent docs</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
          </TabsList>

          <TabsContent className="mt-0" value="overview">
            <div className="grid gap-5 rounded-none border border-line bg-paper-3/70 p-4 dark:bg-paper-2/30">
              <div className="grid gap-5 xl:grid-cols-2">
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
          </TabsContent>

          <TabsContent className="mt-0" value="content">
            <div className="grid gap-4 rounded-none border border-line bg-paper-3/70 p-4 dark:bg-paper-2/30">
              <div className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
                  Skill markdown
                </span>
                <p className="m-0 text-sm text-ink-faint">
                  This is the actual published skill body. Save creates a new version when the text changes.
                </p>
              </div>
              <textarea
                className={cn(textFieldBase, textFieldCode)}
                onChange={(event) => update("body", event.target.value)}
                required
                value={state.body}
              />
            </div>
          </TabsContent>

          <TabsContent className="mt-0" value="automation">
            <div className="grid gap-5 rounded-none border border-line bg-paper-3/70 p-4 dark:bg-paper-2/30">
              <FieldGroup>
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Source watchlist</span>
                <textarea
                  className={cn(textFieldBase, textFieldArea, "min-h-48")}
                  onChange={(event) => update("sourceUrls", event.target.value)}
                  placeholder={"One URL per line\nhttps://react.dev/rss.xml"}
                  value={state.sourceUrls}
                />
              </FieldGroup>

              <div className="grid gap-5 xl:grid-cols-2">
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
                    maxLength={240}
                    onChange={(event) => update("automationPrompt", event.target.value)}
                    placeholder="What should the refresh care about?"
                    rows={5}
                    value={state.automationPrompt}
                  />
                </FieldGroup>
              </div>

              <div className="grid gap-2 rounded-none border border-line bg-paper-2/90 p-4 dark:bg-paper-2/40">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">Refresh notes</span>
                <p className="m-0 text-sm text-ink-soft">
                  Daily is for fast-moving official docs. Weekly is for slower ecosystems. Manual keeps the
                  skill stable until you explicitly run the updater.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent className="mt-0" value="agent-docs">
            <div className="grid gap-4 rounded-none border border-line bg-paper-3/70 p-4 dark:bg-paper-2/30">
              <div className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
                  Agent config files
                </span>
                <p className="m-0 text-sm text-ink-faint">
                  Attach platform-specific agent configuration. These are bundled with the skill when used in each agent environment.
                </p>
              </div>
              <AgentDocsEditor
                onChange={(docs) => setState((current) => ({ ...current, agentDocs: docs }))}
                value={state.agentDocs}
              />
            </div>
          </TabsContent>

          <TabsContent className="mt-0" value="branding">
            <div className="grid gap-5 rounded-none border border-line bg-paper-3/70 p-4 dark:bg-paper-2/30">
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

              <div className="grid gap-2 rounded-none border border-line bg-paper-2/90 p-4 dark:bg-paper-2/40">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">Published as</span>
                <SkillAuthorBadge author={skill.author} ownerName={state.ownerName || skill.ownerName} />
                <p className="m-0 text-sm text-ink-soft">
                  Verified publisher profiles are the source of truth. The attribution line is only a fallback.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {runMessage ? <p className="text-sm text-ink-soft">{runMessage}</p> : null}
        {notice ? <p className="text-sm text-ink-soft">{notice}</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-none border border-line bg-paper-3/75 p-4 dark:bg-paper-2/30">
          <p className="m-0 text-sm text-ink-soft">
            Save a clean version, or save and immediately run the refresh engine from this exact draft.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button disabled={isPending || !isDirty} type="submit" variant="ghost">
              {isPending ? "Saving..." : "Save changes"}
            </Button>
            <Button disabled={isPending || sourceCount === 0} onClick={handleSaveAndRefresh} type="button">
              <RefreshIcon />
              {isPending ? "Working..." : "Save and refresh"}
            </Button>
          </div>
        </div>
      </form>
    </Panel>
  );
}
