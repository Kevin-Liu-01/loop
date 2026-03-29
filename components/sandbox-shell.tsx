"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

import { SendIcon, TerminalIcon } from "@/components/frontier-icons";
import { SandboxStatusBar } from "@/components/ui/sandbox-status-bar";
import { SandboxToolBlock } from "@/components/ui/sandbox-tool-block";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { cn } from "@/lib/cn";
import type { AgentProviderPreset, SkillRecord } from "@/lib/types";

type SandboxRuntime = "node24" | "python3.13";

type SandboxShellProps = {
  presets: AgentProviderPreset[];
  skills: SkillRecord[];
  initialSkillSlug?: string;
};

type SandboxState = "idle" | "creating" | "running" | "stopped" | "error";

const CONFIG_KEY = "loop.sandbox.config";

type SandboxConfig = {
  runtime: SandboxRuntime;
  providerId: string;
  model: string;
  apiKeyEnvVar: string;
  selectedSkillSlugs: string[];
};

function loadPersistedConfig(
  presets: AgentProviderPreset[],
  initialSkillSlug?: string
): SandboxConfig {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(CONFIG_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<SandboxConfig>;
        return {
          runtime: saved.runtime ?? "node24",
          providerId: saved.providerId ?? presets[0]?.id ?? "gateway",
          model: saved.model ?? presets[0]?.defaultModel ?? "openai/gpt-5.4-mini",
          apiKeyEnvVar: saved.apiKeyEnvVar ?? presets[0]?.apiKeyEnvVar ?? "",
          selectedSkillSlugs: initialSkillSlug
            ? [initialSkillSlug]
            : saved.selectedSkillSlugs ?? []
        };
      }
    } catch {
      /* ignore */
    }
  }
  const preset = presets[0];
  return {
    runtime: "node24",
    providerId: preset?.id ?? "gateway",
    model: preset?.defaultModel ?? "openai/gpt-5.4-mini",
    apiKeyEnvVar: preset?.apiKeyEnvVar ?? "",
    selectedSkillSlugs: initialSkillSlug ? [initialSkillSlug] : []
  };
}

function renderMessageParts(
  parts: Array<{
    type: string;
    text?: string;
    toolInvocation?: {
      toolName: string;
      args: Record<string, unknown>;
      result?: Record<string, unknown>;
      state: string;
    };
    [key: string]: unknown;
  }>
): React.ReactNode[] {
  return parts.map((part, i) => {
    if (part.type === "text" && part.text) {
      return (
        <span key={i} className="whitespace-pre-wrap">
          {part.text}
        </span>
      );
    }
    if (part.type === "tool-invocation" && part.toolInvocation) {
      const { toolName, args, result, state } = part.toolInvocation;
      return (
        <SandboxToolBlock
          key={i}
          toolName={toolName}
          input={args}
          output={
            state === "result" ? (result as Record<string, unknown>) : undefined
          }
          defaultOpen={state !== "result"}
        />
      );
    }
    return null;
  });
}

async function requestSandbox(
  runtime: SandboxRuntime
): Promise<{ sandboxId: string } | { error: string }> {
  try {
    const res = await fetch("/api/sandbox/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runtime })
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      return { error: body.error ?? `Sandbox creation failed (${res.status})` };
    }
    return (await res.json()) as { sandboxId: string };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Sandbox creation failed"
    };
  }
}

export function SandboxShell({
  presets,
  skills,
  initialSkillSlug
}: SandboxShellProps) {
  const [config, setConfig] = useState<SandboxConfig>(() =>
    loadPersistedConfig(presets, initialSkillSlug)
  );
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [sandboxState, setSandboxState] = useState<SandboxState>("idle");
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sandboxIdRef = useRef<string | null>(null);
  const bootedRuntimeRef = useRef<SandboxRuntime | null>(null);

  useEffect(() => {
    window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  // Auto-create sandbox on mount so the transport has sandboxId before
  // the user ever sends a message. This avoids the race condition where
  // useChat's sendMessage captures a stale transport with sandboxId="".
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setSandboxState("creating");
      setSandboxError(null);
      const result = await requestSandbox(config.runtime);

      if (cancelled) return;

      if ("error" in result) {
        setSandboxError(result.error);
        setSandboxState("error");
        return;
      }

      sandboxIdRef.current = result.sandboxId;
      bootedRuntimeRef.current = config.runtime;
      setSandboxId(result.sandboxId);
      setSandboxState("running");
    }

    boot();

    return () => {
      cancelled = true;
    };
    // Only boot once on mount — runtime changes are handled by restart
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup sandbox on page unload
  useEffect(() => {
    function handleUnload() {
      if (sandboxIdRef.current) {
        fetch(`/api/sandbox/session?sandboxId=${sandboxIdRef.current}`, {
          method: "DELETE",
          keepalive: true
        });
      }
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/sandbox/run",
        body: {
          sandboxId: sandboxId ?? "",
          runtime: config.runtime,
          providerId: config.providerId,
          model: config.model,
          apiKeyEnvVar: config.apiKeyEnvVar,
          selectedSkillSlugs: config.selectedSkillSlugs
        }
      }),
    [sandboxId, config]
  );

  const { messages, sendMessage, status, error } = useChat({
    id: "loop-sandbox",
    transport
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const retrySandbox = useCallback(async () => {
    setSandboxState("creating");
    setSandboxError(null);
    const result = await requestSandbox(config.runtime);
    if ("error" in result) {
      setSandboxError(result.error);
      setSandboxState("error");
      return;
    }
    sandboxIdRef.current = result.sandboxId;
    bootedRuntimeRef.current = config.runtime;
    setSandboxId(result.sandboxId);
    setSandboxState("running");
  }, [config.runtime]);

  const stopSandbox = useCallback(async () => {
    const id = sandboxIdRef.current;
    if (!id) return;
    try {
      await fetch(`/api/sandbox/session?sandboxId=${id}`, {
        method: "DELETE"
      });
    } catch {
      /* best effort */
    }
    sandboxIdRef.current = null;
    bootedRuntimeRef.current = null;
    setSandboxId(null);
    setSandboxState("stopped");
  }, []);

  // Restart sandbox when runtime changes (if one was already running)
  const restartSandbox = useCallback(async () => {
    if (sandboxIdRef.current) {
      fetch(`/api/sandbox/session?sandboxId=${sandboxIdRef.current}`, {
        method: "DELETE",
        keepalive: true
      });
    }
    sandboxIdRef.current = null;
    setSandboxId(null);
    setSandboxState("creating");
    setSandboxError(null);
    const result = await requestSandbox(config.runtime);
    if ("error" in result) {
      setSandboxError(result.error);
      setSandboxState("error");
      return;
    }
    sandboxIdRef.current = result.sandboxId;
    bootedRuntimeRef.current = config.runtime;
    setSandboxId(result.sandboxId);
    setSandboxState("running");
  }, [config.runtime]);

  function handleSend() {
    const text = input.trim();
    if (!text || !sandboxId) return;
    setInput("");
    sendMessage({ text });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function toggleSkill(slug: string) {
    setConfig((prev) => ({
      ...prev,
      selectedSkillSlugs: prev.selectedSkillSlugs.includes(slug)
        ? prev.selectedSkillSlugs.filter((s) => s !== slug)
        : [...prev.selectedSkillSlugs, slug]
    }));
  }

  function updateConfig<K extends keyof SandboxConfig>(
    key: K,
    value: SandboxConfig[K]
  ) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  const selectedPreset = presets.find((p) => p.id === config.providerId);
  const isStreaming = status === "submitted" || status === "streaming";
  const sandboxReady = sandboxState === "running" && !!sandboxId;
  const canSend = sandboxReady && !isStreaming && input.trim().length > 0;

  return (
    <div className="grid h-[calc(100vh-120px)] grid-rows-[auto_1fr_auto_auto] gap-0">
      {/* ── Config bar ── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
            Runtime
            <select
              className="rounded-lg border border-line bg-paper-2 px-2 py-1 text-xs text-ink outline-none"
              onChange={(e) => {
                const next = e.target.value as SandboxRuntime;
                updateConfig("runtime", next);
                if (bootedRuntimeRef.current && bootedRuntimeRef.current !== next) {
                  restartSandbox();
                }
              }}
              value={config.runtime}
            >
              <option value="node24">Node.js 24</option>
              <option value="python3.13">Python 3.13</option>
            </select>
          </label>
        </div>

        <span className="h-4 w-px bg-line" aria-hidden />

        <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
          Provider
          <select
            className="rounded-lg border border-line bg-paper-2 px-2 py-1 text-xs text-ink outline-none"
            onChange={(e) => {
              const preset = presets.find((p) => p.id === e.target.value);
              updateConfig("providerId", e.target.value);
              if (preset) {
                updateConfig("model", preset.defaultModel);
                updateConfig("apiKeyEnvVar", preset.apiKeyEnvVar ?? "");
              }
            }}
            value={config.providerId}
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
          Model
          <input
            className="w-40 rounded-lg border border-line bg-paper-2 px-2 py-1 text-xs text-ink outline-none focus:border-line-strong"
            onChange={(e) => updateConfig("model", e.target.value)}
            value={config.model}
            placeholder={selectedPreset?.defaultModel}
          />
        </label>

        <span className="h-4 w-px bg-line" aria-hidden />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-ink-soft">Skills</span>
          {skills.slice(0, 20).map((skill) => (
            <FilterChip
              active={config.selectedSkillSlugs.includes(skill.slug)}
              className="text-[0.65rem]! px-2! py-0.5!"
              key={skill.slug}
              onClick={() => toggleSkill(skill.slug)}
            >
              {skill.title}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-2xl border border-line bg-paper-2/60 p-4">
              <TerminalIcon className="h-8 w-8 text-ink-faint" />
            </div>
            <div className="grid gap-1.5">
              <h2 className="text-lg font-semibold text-ink">
                Sandbox Agent
              </h2>
              <p className="max-w-md text-sm text-ink-soft">
                {sandboxState === "creating"
                  ? "Starting sandbox..."
                  : sandboxState === "error"
                    ? "Sandbox failed to start."
                    : `Ask the agent to write code, run commands, or explore data. It has a live ${config.runtime === "node24" ? "Node.js 24" : "Python 3.13"} environment.`}
              </p>
              {sandboxState === "error" && (
                <Button
                  className="mx-auto mt-2"
                  onClick={retrySandbox}
                  size="sm"
                  variant="ghost"
                >
                  Retry
                </Button>
              )}
            </div>
            {sandboxReady && (
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "Fetch the top HN story and analyze it",
                  "Create a simple HTTP server and test it",
                  "Write a Python script to process CSV data"
                ].map((suggestion) => (
                  <button
                    className="rounded-xl border border-line bg-paper-2/80 px-3 py-2 text-xs text-ink-soft transition-colors hover:border-accent hover:text-ink"
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mx-auto grid w-full max-w-3xl gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "grid gap-1",
                message.role === "user" && "justify-end"
              )}
            >
              <div
                className={cn(
                  "max-w-full rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  message.role === "user"
                    ? "ml-auto max-w-[80%] bg-accent text-white"
                    : "bg-paper-2/80 text-ink"
                )}
              >
                {Array.isArray(message.parts) && message.parts.length > 0
                  ? renderMessageParts(
                      message.parts as Array<{
                        type: string;
                        text?: string;
                        toolInvocation?: {
                          toolName: string;
                          args: Record<string, unknown>;
                          result?: Record<string, unknown>;
                          state: string;
                        };
                      }>
                    )
                  : null}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex items-center gap-2 text-xs text-ink-soft">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
              Agent is working...
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ── Input area ── */}
      <div className="border-t border-line px-4 py-3">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
          <textarea
            className="flex-1 resize-none rounded-xl border border-line bg-paper-2 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-line-strong"
            disabled={isStreaming || !sandboxReady}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              sandboxReady
                ? "Ask the agent to do something in the sandbox..."
                : sandboxState === "creating"
                  ? "Starting sandbox..."
                  : "Sandbox not available"
            }
            rows={2}
            value={input}
          />
          <Button
            className="shrink-0"
            disabled={!canSend}
            onClick={handleSend}
            size="sm"
          >
            <SendIcon className="h-3.5 w-3.5" />
            <span className="max-sm:hidden">Send</span>
          </Button>
        </div>
        {(error || sandboxError) && (
          <p className="mx-auto mt-2 max-w-3xl text-xs text-red-400">
            {error?.message ?? sandboxError}
          </p>
        )}
      </div>

      {/* ── Status bar ── */}
      <SandboxStatusBar
        className="mx-4 mb-3"
        onStop={stopSandbox}
        runtime={config.runtime}
        sandboxId={sandboxId}
        status={sandboxState}
      />
    </div>
  );
}
