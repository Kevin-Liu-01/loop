"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { EditFileIcon, RefreshIcon } from "@/components/frontier-icons";
import { Panel, PanelHead } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { FieldGroup, textFieldArea, textFieldBase, textFieldCode, textFieldSelect } from "@/components/ui/field";
import { cn } from "@/lib/cn";
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
    <Panel className="grid gap-5 content-start">
      <form className="contents" onSubmit={handleSubmit}>
        <PanelHead>
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">Setup</span>
            <h2>Edit sources and refresh rules</h2>
          </div>
        </PanelHead>

        <p className="text-ink-soft">Edit the watchlist, prompt, or skill.</p>

        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-1 max-md:grid-cols-1">
          <div className="grid gap-1 rounded-[14px] border border-line bg-paper-3 p-3">
            <small className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">version</small>
            <strong className="text-sm font-semibold text-ink">{props.versionLabel}</strong>
          </div>
          <div className="grid gap-1 rounded-[14px] border border-line bg-paper-3 p-3">
            <small className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">sources</small>
            <strong className="text-sm font-semibold text-ink">{sourceCount}</strong>
          </div>
          <div className="grid gap-1 rounded-[14px] border border-line bg-paper-3 p-3">
            <small className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">refresh</small>
            <strong className="text-sm font-semibold text-ink">{state.cadence === "manual" ? "manual" : state.cadence}</strong>
          </div>
          <div className="grid gap-1 rounded-[14px] border border-line bg-paper-3 p-3">
            <small className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">status</small>
            <strong className="text-sm font-semibold text-ink">{props.automation?.status ?? "paused"}</strong>
          </div>
        </div>

        <div className="grid gap-6">
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
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Source watchlist</span>
            <textarea
              className={cn(textFieldBase, textFieldArea)}
              onChange={(event) => update("sourceUrls", event.target.value)}
              placeholder={"One URL per line\nhttps://react.dev/rss.xml"}
              value={state.sourceUrls}
            />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
            <FieldGroup>
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Refresh cadence</span>
              <select
                className={cn(textFieldBase, textFieldSelect)}
                onChange={(event) => update("cadence", event.target.value as SetupState["cadence"])}
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
                placeholder="What should the refresh care about?"
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
        </div>

        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-line bg-paper-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper-3 text-ink-soft">
            <EditFileIcon />
          </span>
          <div>
            <strong>Fast path</strong>
            <p>Save. Then refresh.</p>
          </div>
        </div>

        {runMessage ? <p className="text-sm text-ink-soft">{runMessage}</p> : null}
        {notice ? <p className="text-sm text-ink-soft">{notice}</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Button disabled={isPending || !isDirty} type="submit" variant="ghost">
            {isPending ? "Saving..." : "Save changes"}
          </Button>
          <Button disabled={isPending || sourceCount === 0} onClick={handleSaveAndRefresh} type="button">
            <RefreshIcon />
            {isPending ? "Working..." : "Save and refresh"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
