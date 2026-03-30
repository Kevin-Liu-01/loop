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

import {
  SendIcon,
  TerminalIcon,
  PanelLeftIcon,
  SparkIcon,
  ClockIcon
} from "@/components/frontier-icons";
import { SandboxStatusBar } from "@/components/ui/sandbox-status-bar";
import { SandboxMessage, SavedMessage } from "@/components/sandbox-message";
import { SandboxSidebar } from "@/components/sandbox-sidebar";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { Separator } from "@/components/ui/shadcn/separator";
import { cn } from "@/lib/cn";
import type {
  AgentProviderPreset,
  ConversationMessage,
  SkillRecord
} from "@/lib/types";

type SandboxRuntime = "node24" | "python3.13";

type SandboxShellProps = {
  presets: AgentProviderPreset[];
  skills: SkillRecord[];
  initialSkillSlug?: string;
};

type SandboxState = "idle" | "creating" | "running" | "stopped" | "error";

const CONFIG_KEY = "loop.sandbox.config";
const SIDEBAR_KEY = "loop.sandbox.sidebar";

type SandboxConfig = {
  runtime: SandboxRuntime;
  providerId: string;
  model: string;
  apiKeyEnvVar: string;
  selectedSkillSlugs: string[];
};

function defaultConfig(
  presets: AgentProviderPreset[],
  initialSkillSlug?: string
): SandboxConfig {
  const preset = presets[0];
  return {
    runtime: "node24",
    providerId: preset?.id ?? "gateway",
    model: preset?.defaultModel ?? "openai/gpt-5.4-mini",
    apiKeyEnvVar: preset?.apiKeyEnvVar ?? "",
    selectedSkillSlugs: initialSkillSlug ? [initialSkillSlug] : []
  };
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
      return {
        error: body.error ?? `Sandbox creation failed (${res.status})`
      };
    }
    return (await res.json()) as { sandboxId: string };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Sandbox creation failed"
    };
  }
}

function extractTextFromParts(
  parts: Array<{ type?: string; text?: string }>
): string {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

type MessagePart = {
  type: string;
  text?: string;
  toolInvocation?: {
    toolName: string;
    args: Record<string, unknown>;
    result?: Record<string, unknown>;
    state: string;
  };
  [key: string]: unknown;
};

const SUGGESTIONS = [
  "Fetch the top HN story and analyze it",
  "Create a simple HTTP server and test it",
  "Write a Python script to process CSV data"
];

export function SandboxShell({
  presets,
  skills,
  initialSkillSlug
}: SandboxShellProps) {
  // ── Config ──
  const [config, setConfig] = useState<SandboxConfig>(() =>
    defaultConfig(presets, initialSkillSlug)
  );
  const hydratedRef = useRef(false);

  // ── Layout ──
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Sandbox session ──
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [sandboxState, setSandboxState] = useState<SandboxState>("idle");
  const [sandboxError, setSandboxError] = useState<string | null>(null);

  // ── Conversation persistence ──
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sidebarVersion, setSidebarVersion] = useState(0);
  const [viewConvo, setViewConvo] = useState<{
    messages: ConversationMessage[];
    title: string;
  } | null>(null);
  const [chatKey, setChatKey] = useState(() => String(Date.now()));

  // ── Input ──
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Refs for transport body (read at request time, never stale) ──
  const sandboxIdRef = useRef<string | null>(null);
  const configRef = useRef(config);
  configRef.current = config;
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  // ── Hydrate persisted config + sidebar state ──
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CONFIG_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<SandboxConfig>;
        setConfig((prev) => ({
          ...prev,
          runtime: saved.runtime ?? prev.runtime,
          providerId: saved.providerId ?? prev.providerId,
          model: saved.model ?? prev.model,
          apiKeyEnvVar: saved.apiKeyEnvVar ?? prev.apiKeyEnvVar,
          selectedSkillSlugs: initialSkillSlug
            ? prev.selectedSkillSlugs
            : saved.selectedSkillSlugs ?? prev.selectedSkillSlugs
        }));
      }
    } catch {
      /* ignore */
    }
    try {
      const stored = window.localStorage.getItem(SIDEBAR_KEY);
      if (stored !== null) setSidebarOpen(stored === "true");
    } catch {
      /* ignore */
    }
    hydratedRef.current = true;
  }, [initialSkillSlug]);

  // ── Persist config ──
  useEffect(() => {
    if (hydratedRef.current) {
      window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    }
  }, [config]);

  // ── Persist sidebar open/closed ──
  useEffect(() => {
    if (hydratedRef.current) {
      window.localStorage.setItem(SIDEBAR_KEY, String(sidebarOpen));
    }
  }, [sidebarOpen]);

  // ── Cleanup sandbox on page unload ──
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

  // ── Transport (stable ref, body reads current state via refs) ──
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/sandbox/run",
        body: () => ({
          sandboxId: sandboxIdRef.current ?? "",
          runtime: configRef.current.runtime,
          providerId: configRef.current.providerId,
          model: configRef.current.model,
          apiKeyEnvVar: configRef.current.apiKeyEnvVar,
          selectedSkillSlugs: configRef.current.selectedSkillSlugs
        })
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { messages, sendMessage, status, error } = useChat({
    id: `sandbox-${chatKey}`,
    transport
  });

  // Keep a mutable ref to messages for the save function
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // ── Auto-scroll on new messages ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Auto-save when streaming completes ──
  const prevStatusRef = useRef(status);
  useEffect(() => {
    const wasStreaming =
      prevStatusRef.current === "streaming" ||
      prevStatusRef.current === "submitted";
    if (wasStreaming && status === "ready" && messagesRef.current.length > 0 && !viewConvo) {
      doSave();
    }
    prevStatusRef.current = status;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function doSave() {
    const msgs = messagesRef.current;
    const firstUserMsg = msgs.find((m) => m.role === "user");
    const title = firstUserMsg
      ? extractTextFromParts(
          (firstUserMsg.parts ?? []) as Array<{
            type?: string;
            text?: string;
          }>
        ).slice(0, 100)
      : "Untitled session";

    const serialized = msgs.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: extractTextFromParts(
        (m.parts ?? []) as Array<{ type?: string; text?: string }>
      ),
      createdAt:
        (m as unknown as { createdAt?: Date }).createdAt?.toISOString() ??
        new Date().toISOString()
    }));

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: conversationIdRef.current,
          channel: "sandbox",
          title,
          messages: serialized,
          model: configRef.current.model,
          providerId: configRef.current.providerId
        })
      });
      const data = (await res.json()) as { id?: string };
      if (data.id && !conversationIdRef.current) {
        setConversationId(data.id);
      }
      setSidebarVersion((v) => v + 1);
    } catch {
      /* best effort */
    }
  }

  // ── Sandbox lifecycle ──
  const createSandbox = useCallback(async (): Promise<string | null> => {
    setSandboxState("creating");
    setSandboxError(null);
    const result = await requestSandbox(configRef.current.runtime);
    if ("error" in result) {
      setSandboxError(result.error);
      setSandboxState("error");
      return null;
    }
    sandboxIdRef.current = result.sandboxId;
    setSandboxId(result.sandboxId);
    setSandboxState("running");
    return result.sandboxId;
  }, []);

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
    setSandboxId(null);
    setSandboxState("stopped");
  }, []);

  // ── Send message ──
  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");

    if (viewConvo) {
      setViewConvo(null);
      setConversationId(null);
      setChatKey(String(Date.now()));
    }

    if (!sandboxIdRef.current) {
      const created = await createSandbox();
      if (!created) return;
    }

    sendMessage({ text });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Conversation switching ──
  async function handleSelectConversation(id: string) {
    if (id === conversationId && !viewConvo) return;
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = (await res.json()) as {
        conversation?: {
          messages: ConversationMessage[];
          title: string;
        };
      };
      if (data.conversation) {
        setViewConvo({
          messages: data.conversation.messages,
          title: data.conversation.title
        });
        setConversationId(id);
      }
    } catch {
      /* ignore */
    }
  }

  function handleNewConversation() {
    setViewConvo(null);
    setConversationId(null);
    setChatKey(String(Date.now()));
    if (sandboxIdRef.current) stopSandbox();
  }

  // ── Config helpers ──
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
  const isBusy = isStreaming || sandboxState === "creating";
  const isActive = !viewConvo;

  return (
    <div className="flex h-[calc(100dvh-5rem)]">
      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <aside className="w-[280px] shrink-0 border-r border-line bg-paper/60 max-sm:absolute max-sm:inset-y-0 max-sm:left-0 max-sm:z-30 max-sm:w-[260px] max-sm:shadow-xl">
          <SandboxSidebar
            currentId={conversationId}
            onNew={handleNewConversation}
            onSelect={handleSelectConversation}
            version={sidebarVersion}
          />
        </aside>
      )}

      {/* ── Main area ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── Header / Config bar ── */}
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
          <button
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
            onClick={() => setSidebarOpen((p) => !p)}
            type="button"
            aria-label="Toggle sidebar"
          >
            <PanelLeftIcon className="h-4 w-4" />
          </button>

          <Separator orientation="vertical" className="h-4" />

          <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
            Runtime
            <select
              className="rounded-lg border border-line bg-paper-2 px-2 py-1 text-xs text-ink outline-none"
              onChange={(e) =>
                updateConfig("runtime", e.target.value as SandboxRuntime)
              }
              value={config.runtime}
            >
              <option value="node24">Node.js 24</option>
              <option value="python3.13">Python 3.13</option>
            </select>
          </label>

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
              className="w-36 rounded-lg border border-line bg-paper-2 px-2 py-1 text-xs text-ink outline-none focus:border-line-strong"
              onChange={(e) => updateConfig("model", e.target.value)}
              placeholder={selectedPreset?.defaultModel}
              value={config.model}
            />
          </label>

          <Separator orientation="vertical" className="h-4 max-sm:hidden" />

          <div className="flex flex-wrap items-center gap-1.5 max-sm:hidden">
            <span className="text-xs font-medium text-ink-soft">Skills</span>
            {skills.slice(0, 12).map((skill) => (
              <FilterChip
                active={config.selectedSkillSlugs.includes(skill.slug)}
                className="max-w-40 truncate text-[0.6rem]! px-2! py-0.5!"
                key={skill.slug}
                onClick={() => toggleSkill(skill.slug)}
              >
                {skill.title}
              </FilterChip>
            ))}
          </div>
        </div>

        {/* ── Chat area ── */}
        <div className="flex-1 overflow-y-auto">
          {isActive && messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 px-4 text-center">
              <div className="rounded-2xl border border-line bg-paper-2/60 p-5">
                <TerminalIcon className="h-10 w-10 text-ink-faint" />
              </div>
              <div className="grid gap-2">
                <h2 className="text-xl font-semibold text-ink">
                  Sandbox Agent
                </h2>
                <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-soft">
                  Write code, run commands, and explore data in an isolated
                  sandbox. A session starts automatically when you send your
                  first message.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    className="rounded-full border border-line bg-paper-2/60 px-3.5 py-2 text-xs text-ink-soft transition-all hover:border-accent/40 hover:text-ink"
                    onClick={() => setInput(suggestion)}
                    type="button"
                  >
                    <SparkIcon className="mr-1.5 inline-block h-3 w-3 text-accent/60" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6">
              {/* Viewing a saved conversation */}
              {viewConvo && (
                <>
                  <div className="flex items-center gap-3 rounded-xl border border-line/60 bg-paper-2/40 px-4 py-3">
                    <ClockIcon className="h-4 w-4 shrink-0 text-ink-faint" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-ink">
                        {viewConvo.title || "Untitled session"}
                      </span>
                      <span className="ml-2 text-xs text-ink-faint">
                        (read-only)
                      </span>
                    </div>
                    <Button
                      onClick={handleNewConversation}
                      size="sm"
                      variant="ghost"
                    >
                      New session
                    </Button>
                  </div>
                  {viewConvo.messages.map((m) => (
                    <SavedMessage
                      key={m.id}
                      content={m.content}
                      createdAt={m.createdAt}
                      role={m.role}
                    />
                  ))}
                </>
              )}

              {/* Active conversation */}
              {isActive &&
                messages.map((message) => (
                  <SandboxMessage
                    key={message.id}
                    createdAt={
                      (message as unknown as { createdAt?: Date }).createdAt
                    }
                    parts={(message.parts ?? []) as MessagePart[]}
                    role={message.role as "user" | "assistant"}
                  />
                ))}

              {isBusy && isActive && (
                <div className="flex items-center gap-3 pl-10">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
                  <span className="text-xs text-ink-soft">
                    {sandboxState === "creating"
                      ? "Starting sandbox..."
                      : "Agent is thinking..."}
                  </span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* ── Input area ── */}
        <div className="border-t border-line px-4 py-3">
          <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                className={cn(
                  "w-full resize-none rounded-2xl border border-line bg-paper-2/80 px-4 py-3 pr-12 text-sm text-ink outline-none transition-colors",
                  "placeholder:text-ink-faint focus:border-line-strong focus:bg-paper-2"
                )}
                disabled={isBusy}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  viewConvo
                    ? "Start a new session to send messages..."
                    : "Ask the agent to do something..."
                }
                rows={2}
                value={input}
              />
              <Button
                className="absolute bottom-2.5 right-2.5"
                disabled={!input.trim() || isBusy}
                onClick={handleSend}
                size="icon-sm"
              >
                <SendIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          {(error || sandboxError) && (
            <p className="mx-auto mt-2 max-w-3xl text-xs text-red-400">
              {error?.message ?? sandboxError}
            </p>
          )}
        </div>

        {/* ── Status bar ── */}
        {isActive && (
          <SandboxStatusBar
            className="mx-4 mb-3"
            onStop={stopSandbox}
            runtime={config.runtime}
            sandboxId={sandboxId}
            status={sandboxState}
          />
        )}
      </div>
    </div>
  );
}
