"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

import {
  SendIcon,
  TerminalIcon,
  SparkIcon,
  ClockIcon,
  PanelRightIcon,
  CodeIcon,
  PlayIcon,
  GlobeIcon,
} from "@/components/frontier-icons";
import { SandboxStatusBar } from "@/components/ui/sandbox-status-bar";
import { SandboxMessage, SavedMessage } from "@/components/sandbox-message";
import { SandboxSidebar } from "@/components/sandbox-sidebar";
import { SandboxToolbar } from "@/components/sandbox-toolbar";
import type { SandboxToolbarConfig } from "@/components/sandbox-toolbar";
import { SandboxInspector } from "@/components/sandbox-inspector";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useSandboxInspector } from "@/hooks/use-sandbox-inspector";
import type {
  AgentProviderPreset,
  ConversationMessage,
  ImportedMcpDocument,
  SkillRecord,
} from "@/lib/types";

type SandboxRuntime = "node24" | "python3.13";

type SandboxShellProps = {
  mcps: ImportedMcpDocument[];
  presets: AgentProviderPreset[];
  skills: SkillRecord[];
  initialSkillSlug?: string;
};

type SandboxState = "idle" | "creating" | "running" | "stopped" | "error";

const CONFIG_KEY = "loop.sandbox.config";
const SIDEBAR_KEY = "loop.sandbox.sidebar";
const INSPECTOR_KEY = "loop.sandbox.inspector";

function defaultConfig(
  presets: AgentProviderPreset[],
  initialSkillSlug?: string,
): SandboxToolbarConfig {
  const preset = presets[0];
  return {
    runtime: "node24",
    providerId: preset?.id ?? "gateway",
    model: preset?.defaultModel ?? "openai/gpt-5.4-mini",
    apiKeyEnvVar: preset?.apiKeyEnvVar ?? "",
    selectedSkillSlugs: initialSkillSlug ? [initialSkillSlug] : [],
    selectedMcpIds: [],
  };
}

type SandboxAuthError = {
  code: "SANDBOX_AUTH_FAILED";
  message: string;
  steps: string[];
};

type SandboxRequestResult =
  | { sandboxId: string }
  | { error: string; authError?: SandboxAuthError };

async function requestSandbox(
  runtime: SandboxRuntime,
): Promise<SandboxRequestResult> {
  try {
    const res = await fetch("/api/sandbox/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runtime }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body.code === "SANDBOX_AUTH_FAILED") {
        return {
          error: body.message,
          authError: body as SandboxAuthError,
        };
      }
      return {
        error: body.error ?? `Sandbox creation failed (${res.status})`,
      };
    }
    return (await res.json()) as { sandboxId: string };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Sandbox creation failed",
    };
  }
}

function extractTextFromParts(
  parts: Array<{ type?: string; text?: string }>,
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

const SUGGESTIONS: Array<{
  text: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { text: "Fetch the top HN story and analyze it", icon: GlobeIcon },
  { text: "Create a simple HTTP server and test it", icon: CodeIcon },
  { text: "Run a benchmark script and chart results", icon: PlayIcon },
];

export function SandboxShell({
  mcps = [],
  presets,
  skills,
  initialSkillSlug,
}: SandboxShellProps) {
  // ── Config ──
  const [config, setConfig] = useState<SandboxToolbarConfig>(() =>
    defaultConfig(presets, initialSkillSlug),
  );
  const hydratedRef = useRef(false);

  // ── Layout ──
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // ── Sandbox session ──
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [sandboxState, setSandboxState] = useState<SandboxState>("idle");
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<SandboxAuthError | null>(null);

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

  // ── Refs for transport body ──
  const sandboxIdRef = useRef<string | null>(null);
  const configRef = useRef(config);
  configRef.current = config;
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  // ── VM Inspector hook ──
  const inspector = useSandboxInspector(
    sandboxId,
    config.runtime,
    inspectorOpen && sandboxState === "running",
  );

  // ── Hydrate persisted config + panel states ──
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CONFIG_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<SandboxToolbarConfig>;
        setConfig((prev) => ({
          ...prev,
          runtime: saved.runtime ?? prev.runtime,
          providerId: saved.providerId ?? prev.providerId,
          model: saved.model ?? prev.model,
          apiKeyEnvVar: saved.apiKeyEnvVar ?? prev.apiKeyEnvVar,
          selectedSkillSlugs: initialSkillSlug
            ? prev.selectedSkillSlugs
            : saved.selectedSkillSlugs ?? prev.selectedSkillSlugs,
          selectedMcpIds: saved.selectedMcpIds ?? prev.selectedMcpIds,
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
    try {
      const stored = window.localStorage.getItem(INSPECTOR_KEY);
      if (stored !== null) setInspectorOpen(stored === "true");
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

  // ── Persist panel states ──
  useEffect(() => {
    if (hydratedRef.current) {
      window.localStorage.setItem(SIDEBAR_KEY, String(sidebarOpen));
    }
  }, [sidebarOpen]);

  useEffect(() => {
    if (hydratedRef.current) {
      window.localStorage.setItem(INSPECTOR_KEY, String(inspectorOpen));
    }
  }, [inspectorOpen]);

  // ── Cleanup sandbox on page unload ──
  useEffect(() => {
    function handleUnload() {
      if (sandboxIdRef.current) {
        fetch(`/api/sandbox/session?sandboxId=${sandboxIdRef.current}`, {
          method: "DELETE",
          keepalive: true,
        });
      }
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // ── Transport ──
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
          selectedSkillSlugs: configRef.current.selectedSkillSlugs,
          selectedMcpIds: configRef.current.selectedMcpIds,
        }),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: `sandbox-${chatKey}`,
    transport,
  });

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // ── Auto-scroll ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Auto-save when streaming completes ──
  const prevStatusRef = useRef(status);
  useEffect(() => {
    const wasStreaming =
      prevStatusRef.current === "streaming" ||
      prevStatusRef.current === "submitted";
    if (
      wasStreaming &&
      status === "ready" &&
      messagesRef.current.length > 0 &&
      !viewConvo
    ) {
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
          }>,
        ).slice(0, 100)
      : "Untitled session";

    const serialized = msgs.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: extractTextFromParts(
        (m.parts ?? []) as Array<{ type?: string; text?: string }>,
      ),
      createdAt:
        (m as unknown as { createdAt?: Date }).createdAt?.toISOString() ??
        new Date().toISOString(),
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
          providerId: configRef.current.providerId,
        }),
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
    setAuthError(null);
    const result = await requestSandbox(
      configRef.current.runtime as SandboxRuntime,
    );
    if ("error" in result) {
      setSandboxError(result.error);
      if (result.authError) setAuthError(result.authError);
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
        method: "DELETE",
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
          title: data.conversation.title,
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
        : [...prev.selectedSkillSlugs, slug],
    }));
  }

  function toggleMcp(id: string) {
    setConfig((prev) => ({
      ...prev,
      selectedMcpIds: prev.selectedMcpIds.includes(id)
        ? prev.selectedMcpIds.filter((m) => m !== id)
        : [...prev.selectedMcpIds, id],
    }));
  }

  function updateConfig<K extends keyof SandboxToolbarConfig>(
    key: K,
    value: SandboxToolbarConfig[K],
  ) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  const isStreaming = status === "submitted" || status === "streaming";
  const isBusy = isStreaming || sandboxState === "creating";
  const isActive = !viewConvo;
  const showEmptyHero = isActive && messages.length === 0;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1">
      {/* ── Left sidebar ── */}
      {sidebarOpen && (
        <aside
          className={cn(
            "flex h-full min-h-0 w-[260px] shrink-0 flex-col overflow-hidden border-r border-line/50 bg-paper-2/40 backdrop-blur-md dark:bg-paper-2/20",
            "max-sm:absolute max-sm:inset-y-0 max-sm:left-0 max-sm:z-30 max-sm:w-[min(280px,92vw)] max-sm:shadow-[4px_0_24px_-4px_rgba(0,0,0,0.12)]",
          )}
        >
          <SandboxSidebar
            currentId={conversationId}
            onNew={handleNewConversation}
            onSelect={handleSelectConversation}
            version={sidebarVersion}
          />
        </aside>
      )}

      {/* ── Center: toolbar + chat + composer ── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <SandboxToolbar
          config={config}
          presets={presets}
          skills={skills}
          mcps={mcps}
          sidebarOpen={sidebarOpen}
          inspectorOpen={inspectorOpen}
          onToggleSidebar={() => setSidebarOpen((p) => !p)}
          onToggleInspector={() => setInspectorOpen((p) => !p)}
          onUpdateConfig={updateConfig}
          onToggleSkill={toggleSkill}
          onToggleMcp={toggleMcp}
        />

        {/* Messages (scroll) */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth">
            {showEmptyHero ? (
              <div className="flex h-full flex-col items-center justify-center px-6 py-8 text-center sm:py-12">
                {/* Glow backdrop */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="absolute left-1/2 top-1/3 h-[480px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.03] blur-[100px]" />
                </div>

                <div className="relative grid max-w-lg gap-6">
                  {/* Icon */}
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-line/60 bg-paper-3 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_8px_40px_-8px_rgba(232,101,10,0.08),0_24px_80px_-16px_rgba(0,0,0,0.04)] ring-1 ring-ink/[0.02] dark:border-line/40 dark:bg-paper-3/80 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_8px_40px_-8px_rgba(232,101,10,0.12)] dark:ring-white/[0.04]">
                    <TerminalIcon className="h-7 w-7 text-accent/70" />
                  </div>

                  {/* Title + description */}
                  <div className="grid gap-2.5">
                    <h2 className="m-0 font-serif text-2xl font-medium tracking-[-0.04em] text-balance text-ink sm:text-3xl">
                      Sandbox
                    </h2>
                    <p className="m-0 mx-auto max-w-[42ch] text-pretty text-sm leading-relaxed text-ink-soft">
                      Run code, tools, and MCP servers in an isolated VM.
                      A session spins up when you send your first message.
                    </p>
                  </div>

                  {/* Suggestions */}
                  <div className="grid gap-2 sm:grid-cols-3">
                    {SUGGESTIONS.map((suggestion) => {
                      const Icon = suggestion.icon;
                      return (
                        <button
                          key={suggestion.text}
                          className="group grid gap-2 rounded-xl border border-line/50 bg-paper-3/60 p-3 text-left shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-200 hover:border-accent/25 hover:bg-paper-3 hover:shadow-[0_4px_16px_-4px_rgba(232,101,10,0.08)] dark:bg-paper-2/40 dark:hover:bg-paper-3/30"
                          onClick={() => setInput(suggestion.text)}
                          type="button"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-line/40 bg-paper-2/60 transition-colors group-hover:border-accent/20 group-hover:bg-accent/[0.06] dark:bg-paper-2/80">
                            <Icon className="h-3.5 w-3.5 text-ink-faint transition-colors group-hover:text-accent/70" />
                          </div>
                          <span className="text-[0.75rem] leading-snug text-ink-soft transition-colors group-hover:text-ink">
                            {suggestion.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto grid w-full max-w-3xl gap-5 px-4 py-8 sm:px-6">

                {viewConvo && (
                  <>
                    <div className="flex items-center gap-3 rounded-xl border border-line/60 bg-paper-3/80 px-4 py-3 shadow-sm dark:bg-paper-3/50">
                      <ClockIcon className="h-4 w-4 shrink-0 text-ink-faint" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-ink">
                          {viewConvo.title || "Untitled session"}
                        </span>
                        <span className="ml-2 text-[0.65rem] font-medium uppercase tracking-wider text-ink-faint">
                          Read-only
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
                  <div className="flex items-center gap-3 py-2 pl-11">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent [animation-delay:150ms]" />
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent [animation-delay:300ms]" />
                    </div>
                    <span className="text-xs font-medium text-ink-faint">
                      {sandboxState === "creating"
                        ? "Starting sandbox…"
                        : "Agent is thinking…"}
                    </span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Composer + status */}
        <div
          className={cn(
            "shrink-0 border-t border-line/60",
            "bg-paper-3/70 backdrop-blur-xl dark:bg-paper-2/50",
            "px-4 sm:px-6",
            "pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5",
          )}
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-2.5">
            {isActive && (
              <SandboxStatusBar
                onStop={stopSandbox}
                runtime={config.runtime}
                sandboxId={sandboxId}
                status={sandboxState}
                uptimeSeconds={inspector.data?.uptimeSeconds ?? 0}
                timeoutMs={inspector.data?.timeoutMs ?? 120_000}
                processCount={inspector.data?.processes.length ?? 0}
              />
            )}

            <div className="relative">
              <div
                className={cn(
                  "overflow-hidden rounded-2xl border border-line/80 bg-paper-3 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] transition-shadow duration-200",
                  "has-[:focus]:border-accent/30 has-[:focus]:shadow-[0_0_0_3px_rgba(232,101,10,0.06),0_4px_20px_-4px_rgba(0,0,0,0.08)]",
                  "dark:border-line/60 dark:bg-paper-3/80 dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.2)]",
                  "dark:has-[:focus]:border-accent/25 dark:has-[:focus]:shadow-[0_0_0_3px_rgba(232,101,10,0.08),0_4px_20px_-4px_rgba(0,0,0,0.3)]",
                )}
              >
                <textarea
                  ref={textareaRef}
                  className={cn(
                    "w-full resize-none bg-transparent px-3.5 py-2.5 pr-12 text-sm leading-relaxed text-ink outline-none",
                    "placeholder:text-ink-faint/70",
                  )}
                  disabled={isBusy}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    viewConvo
                      ? "Start a new session to send messages…"
                      : "Ask the agent to do something…"
                  }
                  rows={1}
                  value={input}
                />
                <div className="absolute bottom-2 right-2.5">
                  <button
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200",
                      input.trim() && !isBusy
                        ? "bg-accent text-white shadow-[0_2px_8px_-2px_rgba(232,101,10,0.3)] hover:bg-accent-hover hover:shadow-[0_4px_12px_-2px_rgba(232,101,10,0.4)]"
                        : "bg-paper-2/80 text-ink-faint dark:bg-paper-2",
                    )}
                    disabled={!input.trim() || isBusy}
                    onClick={handleSend}
                    type="button"
                    aria-label="Send message"
                  >
                    <SendIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile inspector toggle */}
            <div className="flex items-center justify-between sm:hidden">
              <span className="text-[0.6rem] font-medium uppercase tracking-wider text-ink-faint">
                VM Inspector
              </span>
              <Button
                onClick={() => setInspectorOpen((p) => !p)}
                size="icon-sm"
                variant={inspectorOpen ? "primary" : "ghost"}
                aria-label="Toggle VM inspector"
              >
                <PanelRightIcon className="h-3.5 w-3.5" />
              </Button>
            </div>

            {authError && (
              <div className="rounded-xl border border-danger/20 bg-danger/[0.04] p-4 dark:bg-danger/[0.06]">
                <p className="m-0 mb-3 text-sm font-medium text-danger">
                  {authError.message}
                </p>
                <ol className="m-0 grid gap-1.5 pl-5 text-xs leading-relaxed text-ink-soft">
                  {authError.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            {!authError && (error || sandboxError) && (
              <p className="m-0 text-xs font-medium text-danger">
                {error?.message ?? sandboxError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Right panel: VM Inspector ── */}
      {inspectorOpen && (
        <aside
          className={cn(
            "flex h-full min-h-0 w-[320px] shrink-0 flex-col overflow-hidden border-l border-line/50 bg-paper-2/40 backdrop-blur-md dark:bg-paper-2/20",
            "max-sm:absolute max-sm:inset-y-0 max-sm:right-0 max-sm:z-30 max-sm:w-[min(340px,92vw)] max-sm:shadow-[-4px_0_24px_-4px_rgba(0,0,0,0.12)]",
          )}
        >
          <SandboxInspector
            sandboxId={sandboxId}
            runtime={config.runtime}
            sandboxState={sandboxState}
            data={inspector.data}
            isLoading={inspector.isLoading}
            error={inspector.error}
            currentPath={inspector.currentPath}
            onRefresh={inspector.refresh}
            onBrowsePath={inspector.browsePath}
          />
        </aside>
      )}
    </div>
  );
}
