"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  FlowIcon,
  SearchIcon
} from "@/components/frontier-icons";
import { buildLoopRunResult } from "@/lib/loop-updates";
import type {
  LoopRunRecord,
  LoopUpdateResult,
  LoopUpdateSourceLog,
  LoopUpdateStreamEvent,
  LoopUpdateTarget
} from "@/lib/types";

type LoopUpdateDashboardProps = {
  targets: LoopUpdateTarget[];
  runs: LoopRunRecord[];
};

const SELECTION_KEY = "loop.admin.selected-loop";

function targetKey(target: Pick<LoopUpdateTarget, "origin" | "slug">): string {
  return `${target.origin}:${target.slug}`;
}

function applySourceUpdate(current: LoopUpdateSourceLog[], next: LoopUpdateSourceLog): LoopUpdateSourceLog[] {
  if (!current.some((entry) => entry.id === next.id)) {
    return [...current, next];
  }

  return current.map((entry) => (entry.id === next.id ? next : entry));
}

function formatRelativeText(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
}

function formatTriggerLabel(trigger: LoopRunRecord["trigger"]): string {
  switch (trigger) {
    case "manual":
      return "manual";
    case "automation":
      return "automation";
    case "import-sync":
      return "import sync";
    default:
      return trigger;
  }
}

function buildPendingSources(target: LoopUpdateTarget): LoopUpdateSourceLog[] {
  return target.sources.map((source) => ({
    ...source,
    status: "pending",
    itemCount: 0,
    items: [],
    note: "Queued for scan."
  }));
}

export function LoopUpdateDashboard({ targets, runs }: LoopUpdateDashboardProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isRunning, startTransition] = useTransition();
  const [messages, setMessages] = useState<string[]>([]);
  const [sourceLogs, setSourceLogs] = useState<LoopUpdateSourceLog[]>([]);
  const [result, setResult] = useState<LoopUpdateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredTargets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return targets;
    }

    return targets.filter((target) =>
      `${target.title} ${target.category} ${target.description} ${target.origin}`.toLowerCase().includes(needle)
    );
  }, [query, targets]);

  const selectedTarget =
    filteredTargets.find((target) => targetKey(target) === selectedKey) ??
    targets.find((target) => targetKey(target) === selectedKey) ??
    filteredTargets[0] ??
    targets[0] ??
    null;

  const persistedRun = useMemo(() => {
    if (!selectedTarget) {
      return null;
    }

    return (
      runs.find((run) => run.slug === selectedTarget.slug && run.origin === selectedTarget.origin) ?? null
    );
  }, [runs, selectedTarget]);

  const persistedResult = useMemo(() => buildLoopRunResult(persistedRun), [persistedRun]);

  const visibleResult = result ?? persistedResult;
  const visibleSummary = result?.summary ?? persistedRun?.summary ?? selectedTarget?.lastSummary ?? null;
  const visibleWhatChanged = result?.whatChanged ?? persistedRun?.whatChanged ?? selectedTarget?.lastWhatChanged ?? null;
  const visibleSignals =
    result?.items ??
    persistedRun?.sources.flatMap((source) => source.items).slice(0, 4) ??
    selectedTarget?.lastSignals ??
    [];
  const visibleGeneratedAt =
    result?.updatedAt ??
    persistedRun?.finishedAt ??
    selectedTarget?.lastGeneratedAt ??
    selectedTarget?.updatedAt ??
    null;
  const visibleBodyChanged =
    result?.bodyChanged ?? persistedRun?.bodyChanged ?? selectedTarget?.lastBodyChanged ?? undefined;
  const visibleChangedSections =
    result?.changedSections ??
    persistedRun?.changedSections ??
    selectedTarget?.lastChangedSections ??
    [];
  const visibleEditorModel =
    result?.editorModel ?? persistedRun?.editorModel ?? selectedTarget?.lastEditorModel ?? null;
  const visibleMessages = messages.length > 0 ? messages : persistedRun?.messages ?? [];
  const visibleSourceLogs = sourceLogs.length > 0 ? sourceLogs : persistedRun?.sources ?? [];
  const visibleError = error ?? persistedRun?.errorMessage ?? null;
  const visibleTrigger =
    persistedRun?.trigger ?? (selectedTarget?.origin === "remote" ? "import-sync" : "automation");

  useEffect(() => {
    const saved = window.localStorage.getItem(SELECTION_KEY);
    if (!saved) {
      return;
    }

    setSelectedKey(saved);
  }, []);

  useEffect(() => {
    if (!selectedTarget) {
      return;
    }

    const nextKey = targetKey(selectedTarget);
    setSelectedKey(nextKey);
    window.localStorage.setItem(SELECTION_KEY, nextKey);
  }, [selectedTarget]);

  useEffect(() => {
    setMessages([]);
    setSourceLogs([]);
    setResult(null);
    setError(null);
  }, [selectedTarget?.origin, selectedTarget?.slug]);

  async function handleRun() {
    if (!selectedTarget) {
      return;
    }

    setError(null);
    setResult(null);
    setMessages([`Queued agent update for ${selectedTarget.title}.`]);
    setSourceLogs(buildPendingSources(selectedTarget));

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/loops/update", {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            slug: selectedTarget.slug,
            origin: selectedTarget.origin
          })
        });

        if (!response.ok || !response.body) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          setError(payload.error ?? "Unable to start the manual loop update.");
          return;
        }

        const reader = response.body.getReader();
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
            if (event.type === "start") {
              setMessages((current) => [...current, `Started agent run across ${event.loop.sources.length} tracked sources.`]);
              setSourceLogs(buildPendingSources(event.loop));
              continue;
            }

            if (event.type === "source") {
              setSourceLogs((current) => applySourceUpdate(current, event.source));
              setMessages((current) => [...current, `${event.source.label}: ${event.source.note ?? event.source.status}.`]);
              continue;
            }

            if (event.type === "analysis") {
              setMessages((current) => [...current, event.message]);
              continue;
            }

            if (event.type === "complete") {
              setResult(event.result);
              setSourceLogs(event.sources);
              setMessages((current) => [
                ...current,
                event.result.changed
                  ? `${event.result.nextVersionLabel} is live with a saved revision.`
                  : "Source fetch finished. No material diff landed."
              ]);
              setError(null);
              router.refresh();
              continue;
            }

            if (event.type === "error") {
              setError(event.message);
              setMessages((current) => [...current, event.message]);
            }
          }
        }

        if (buffer.trim()) {
          const event = JSON.parse(buffer) as LoopUpdateStreamEvent;
          if (event.type === "error") {
            setError(event.message);
            setMessages((current) => [...current, event.message]);
          }
        }
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Manual loop update failed.";
        setError(message);
        setMessages((current) => [...current, message]);
      }
    });
  }

  return (
    <section className="loop-dashboard-section">
      <div className="surface-panel__head">
        <div>
          <span className="section-kicker">Updates</span>
          <h2>Run a refresh</h2>
        </div>
        <small>{targets.length} updateable skills</small>
      </div>

      <div className="loop-dashboard-grid">
        <div className="surface-panel">
          <label className="field-group">
            <span>Search</span>
            <div className="loop-search-field">
              <SearchIcon />
              <input
                className="search-field__input"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="frontend, infra, remote"
                value={query}
              />
            </div>
          </label>

          <div className="loop-target-list">
            {filteredTargets.length > 0 ? (
              filteredTargets.map((target) => (
                <button
                  className={
                    selectedTarget && targetKey(selectedTarget) === targetKey(target)
                      ? "loop-target-card loop-target-card--active"
                      : "loop-target-card"
                  }
                  key={targetKey(target)}
                  onClick={() => setSelectedKey(targetKey(target))}
                  type="button"
                >
                  <div className="loop-target-card__meta">
                    <span className={`badge badge--${target.origin === "remote" ? "signal-gold" : "signal-blue"}`}>
                      {target.origin}
                    </span>
                    <span>{target.versionLabel}</span>
                    <span>{formatRelativeText(target.updatedAt)}</span>
                  </div>
                  <strong>{target.title}</strong>
                  <p>{target.lastWhatChanged ?? target.lastSummary ?? target.description}</p>
                  <div className="loop-target-card__stats">
                    <span>{target.category}</span>
                    <span>{target.sources.length} sources</span>
                    <span>{target.automationLabel}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="frontier-community-empty">No skills match this filter.</div>
            )}
          </div>
        </div>

        <div className="loop-dashboard-stack">
          <div className="surface-panel">
            {selectedTarget ? (
              <>
                <div className="loop-ops-head">
                  <div>
                    <div className="skill-summary__meta">
                      <span>{selectedTarget.origin}</span>
                      <span>{selectedTarget.category}</span>
                      <span>{selectedTarget.versionLabel}</span>
                    </div>
                    <h3>{selectedTarget.title}</h3>
                    <p className="section-copy">{selectedTarget.description}</p>
                    <p className="detail-note">Fetch. Analyze. Rewrite. Save.</p>
                  </div>
                  <div className="loop-ops-head__actions">
                    <button className="button" disabled={isRunning} onClick={handleRun} type="button">
                      {isRunning ? "Refreshing..." : "Run refresh"}
                    </button>
                    <Link className="button button--ghost" href={selectedTarget.href}>
                      Open detail
                    </Link>
                  </div>
                </div>

                <div className="update-pipeline update-pipeline--compact">
                  <div className="update-pipeline__step">
                    <small>sources</small>
                    <strong>{selectedTarget.sources.length}</strong>
                  </div>
                  <div className="update-pipeline__line" aria-hidden="true" />
                  <div className="update-pipeline__step">
                    <small>revision</small>
                    <strong>{visibleResult?.nextVersionLabel ?? selectedTarget.versionLabel}</strong>
                  </div>
                  <div className="update-pipeline__line" aria-hidden="true" />
                  <div className="update-pipeline__step">
                    <small>updated</small>
                    <strong>{formatRelativeText(visibleResult?.updatedAt ?? selectedTarget.updatedAt)}</strong>
                  </div>
                </div>
              </>
            ) : (
              <div className="frontier-community-empty">Add or import a skill first.</div>
            )}
          </div>

          <div className="surface-panel">
            <div className="surface-panel__head">
              <div>
                <span className="section-kicker">Summary</span>
                <h3>Latest agent summary</h3>
              </div>
              {visibleGeneratedAt ? <small>{formatRelativeText(visibleGeneratedAt)}</small> : null}
            </div>

            {selectedTarget ? (
              <div className="update-summary">
                <div className="inline-stats">
                  <div>
                    <small>mode</small>
                    <strong>fetch → rewrite</strong>
                  </div>
                  <div>
                    <small>trigger</small>
                    <strong>{formatTriggerLabel(visibleTrigger)}</strong>
                  </div>
                  <div>
                    <small>body edit</small>
                    <strong>{visibleBodyChanged === undefined ? "pending" : visibleBodyChanged ? "yes" : "no"}</strong>
                  </div>
                  <div>
                    <small>editor</small>
                    <strong>{visibleEditorModel ?? "pending"}</strong>
                  </div>
                </div>

                <div className="update-summary__copy">
                  {visibleSummary ? <p>{visibleSummary}</p> : <p>No stored update summary yet.</p>}
                  {visibleWhatChanged ? <p>{visibleWhatChanged}</p> : null}
                  {visibleChangedSections.length > 0 ? (
                    <p>Sections changed: {visibleChangedSections.join(", ")}</p>
                  ) : null}
                </div>

                {visibleSignals.length > 0 ? (
                  <div className="detail-signal-list">
                    {visibleSignals.map((item) => (
                      <a className="detail-signal-item" href={item.url} key={item.url} rel="noreferrer" target="_blank">
                        <strong>{item.title}</strong>
                        <span>{item.source}</span>
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="frontier-community-empty">Run an update to generate the first summary.</div>
            )}
          </div>

          <div className="detail-section-split loop-dashboard-split">
            <div className="surface-panel">
              <div className="surface-panel__head">
                <div>
                  <span className="section-kicker">Sources</span>
                  <h3>Sources searched</h3>
                </div>
              </div>
              <div className="loop-source-grid">
                {visibleSourceLogs.length > 0 ? (
                  visibleSourceLogs.map((source) => (
                    <article className="loop-source-card" key={source.id}>
                      <div className="loop-source-card__head">
                        <span className="loop-source-card__logo">
                          {source.logoUrl ? <img alt="" height={28} src={source.logoUrl} width={28} /> : null}
                        </span>
                        <div>
                          <strong>{source.label}</strong>
                          <small>{source.status}</small>
                        </div>
                      </div>
                      <p>{source.note ?? `${source.itemCount} items found.`}</p>
                      <div className="loop-source-card__items">
                        {source.items.slice(0, 3).map((item) => (
                          <a href={item.url} key={item.url} rel="noreferrer" target="_blank">
                            {item.title}
                          </a>
                        ))}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="frontier-community-empty">Run an update to see source activity.</div>
                )}
              </div>
            </div>

            <div className="surface-panel">
              <div className="surface-panel__head">
                <div>
                  <span className="section-kicker">Run log</span>
                  <h3>What happened</h3>
                </div>
              </div>
              <div className="frontier-log-list">
                {visibleMessages.length > 0 ? (
                  visibleMessages.map((message, index) => (
                    <article className="frontier-log-item" key={`${message}-${index}`}>
                      <div className="frontier-log-item__icon">
                        <FlowIcon />
                      </div>
                      <div>
                        <strong>Step {index + 1}</strong>
                        <span>{message}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="frontier-community-empty">The run log appears here after the first automation pass.</div>
                )}
              </div>
              {visibleError ? <p className="form-error">{visibleError}</p> : null}
            </div>
          </div>

          <div className="surface-panel">
            <div className="surface-panel__head">
              <div>
                <span className="section-kicker">Revision diff</span>
                <h3>Before vs after</h3>
              </div>
              {visibleResult ? (
                <small>
                  {visibleResult.previousVersionLabel} → {visibleResult.nextVersionLabel}
                </small>
              ) : null}
            </div>

            {visibleResult ? (
              <div className="loop-diff-stack">
                <div className="inline-stats">
                  <div>
                    <small>status</small>
                    <strong>{visibleResult.changed ? "new revision" : "no-op fetch"}</strong>
                  </div>
                  <div>
                    <small>updated</small>
                    <strong>{formatRelativeText(visibleResult.updatedAt)}</strong>
                  </div>
                  <div>
                    <small>open</small>
                    <strong>
                      <Link href={visibleResult.href}>{visibleResult.nextVersionLabel}</Link>
                    </strong>
                  </div>
                </div>
                {visibleResult.summary ? <p className="section-copy">{visibleResult.summary}</p> : null}
                {visibleResult.whatChanged ? <p className="section-copy">{visibleResult.whatChanged}</p> : null}
                <div className="loop-diff-shell">
                  {visibleResult.diffLines.map((line, index) => (
                    <div className={`loop-diff-line loop-diff-line--${line.type}`} key={`${line.type}-${index}`}>
                      <span>{line.leftNumber ?? ""}</span>
                      <span>{line.rightNumber ?? ""}</span>
                      <code>{line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}</code>
                      <code>{line.value || " "}</code>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="frontier-community-empty">Run an update to inspect the diff.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
