"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

import { ChatMessageBubble } from "@/components/chat-message-bubble";
import { ConversationHistory } from "@/components/conversation-history";
import { Button, ButtonLink } from "@/components/ui/button";
import { FieldGroup, FieldLabel, textFieldArea, textFieldBase, textFieldSelect } from "@/components/ui/field";

import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { messageToTextVerbose } from "@/lib/chat";
import { Tip } from "@/components/ui/tip";
import { cn } from "@/lib/cn";
import { formatTagLabel, getTagColorForCategory } from "@/lib/tag-utils";
import { McpIcon, SkillIcon } from "@/components/ui/skill-icon";
import type { AgentProviderPreset, ImportedMcpDocument, SkillRecord } from "@/lib/types";

type AgentStudioProps = {
  presets: AgentProviderPreset[];
  skills: SkillRecord[];
  mcps: ImportedMcpDocument[];
};

type StudioConfig = {
  agentName: string;
  providerId: string;
  model: string;
  compatibleBaseUrl: string;
  apiKeyEnvVar: string;
  headersJson: string;
  systemPrompt: string;
  selectedSkillSlugs: string[];
  selectedMcpIds: string[];
};

type ModelPayload = {
  gatewayModels: Array<{
    id: string;
    name: string;
    provider: string;
  }>;
};

const CONFIG_KEY = "loop.agent-studio.config";
const INPUT_KEY = "loop.agent-studio.input";

function createInitialConfig(presets: AgentProviderPreset[]): StudioConfig {
  const preset = presets[0];

  return {
    agentName: "Loop operator",
    providerId: preset?.id ?? "gateway",
    model: preset?.defaultModel ?? "openai/gpt-5.4-mini",
    compatibleBaseUrl: preset?.baseURL ?? "",
    apiKeyEnvVar: preset?.apiKeyEnvVar ?? "",
    headersJson: "{}",
    systemPrompt: "Be concrete. Use attached skills before improvising. When executable MCP tools are attached, prefer using them over guessing.",
    selectedSkillSlugs: [],
    selectedMcpIds: []
  };
}

function parseHeaders(value: string): Record<string, string> {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).map(([key, entry]) => [key, String(entry)]));
  } catch {
    return {};
  }
}

export function AgentStudio({ presets, skills, mcps }: AgentStudioProps) {
  const router = useRouter();
  const [isImportPending, startImportTransition] = useTransition();
  const [config, setConfig] = useState<StudioConfig>(() => createInitialConfig(presets));
  const [input, setInput] = useState("Summarize the attached skills and tell me the next 3 actions.");
  const [importKind, setImportKind] = useState<"skill" | "mcp">("skill");
  const [importUrl, setImportUrl] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [modelPayload, setModelPayload] = useState<ModelPayload>({ gatewayModels: [] });

  useEffect(() => {
    const saved = window.localStorage.getItem(CONFIG_KEY);
    if (saved) {
      try {
        setConfig((current) => ({ ...current, ...(JSON.parse(saved) as Partial<StudioConfig>) }));
      } catch {
        window.localStorage.removeItem(CONFIG_KEY);
      }
    }

    const savedInput = window.localStorage.getItem(INPUT_KEY);
    if (savedInput) {
      setInput(savedInput);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    window.localStorage.setItem(INPUT_KEY, input);
  }, [input]);

  useEffect(() => {
    fetch("/api/models")
      .then((response) => response.json())
      .then((payload) => setModelPayload({ gatewayModels: payload.gatewayModels ?? [] }))
      .catch(() => setModelPayload({ gatewayModels: [] }));
  }, []);

  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.id === config.providerId) ?? presets[0],
    [config.providerId, presets]
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agents/run",
        body: {
          agentName: config.agentName,
          providerId: config.providerId,
          model: config.model,
          compatibleBaseUrl: config.compatibleBaseUrl,
          apiKeyEnvVar: config.apiKeyEnvVar,
          headers: parseHeaders(config.headersJson),
          systemPrompt: config.systemPrompt,
          selectedSkillSlugs: config.selectedSkillSlugs,
          selectedMcpIds: config.selectedMcpIds
        }
      }),
    [config]
  );

  const { messages, sendMessage, status, error, clearError } = useChat({
    id: "loop-agent-studio",
    transport
  });

  const conversationIdRef = useRef<string | null>(null);
  const prevMessageCountRef = useRef(0);
  const timestampsRef = useRef<Map<string, string>>(new Map());

  function getTimestamp(messageId: string): string {
    let ts = timestampsRef.current.get(messageId);
    if (!ts) {
      ts = new Date().toISOString();
      timestampsRef.current.set(messageId, ts);
    }
    return ts;
  }

  useEffect(() => {
    conversationIdRef.current = window.localStorage.getItem("loop.agent-studio.conversationId");
  }, []);

  const saveConversation = useCallback(async () => {
    if (messages.length === 0) return;

    const serialized = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: messageToTextVerbose(m),
      createdAt: getTimestamp(m.id)
    }));

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: conversationIdRef.current,
          channel: "agent-studio",
          title: serialized[0]?.content.slice(0, 80) || "Agent studio session",
          messages: serialized,
          model: config.model,
          providerId: config.providerId
        })
      });

      if (response.ok) {
        const data = (await response.json()) as { id: string };
        conversationIdRef.current = data.id;
        window.localStorage.setItem("loop.agent-studio.conversationId", data.id);
      }
    } catch {
      // silent — persistence is best-effort
    }
  }, [messages, config.model, config.providerId]);

  useEffect(() => {
    if (
      status === "ready" &&
      messages.length > 0 &&
      messages.length !== prevMessageCountRef.current
    ) {
      prevMessageCountRef.current = messages.length;
      saveConversation();
    }
  }, [status, messages.length, saveConversation]);

  const gatewaySuggestions = modelPayload.gatewayModels.slice(0, 80);

  function update<K extends keyof StudioConfig>(key: K, value: StudioConfig[K]) {
    setConfig((current) => ({
      ...current,
      [key]: value
    }));
  }

  function toggleListValue(key: "selectedSkillSlugs" | "selectedMcpIds", value: string) {
    setConfig((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((entry) => entry !== value)
        : [...current[key], value]
    }));
  }

  function resetConfig() {
    const nextConfig = createInitialConfig(presets);
    setConfig(nextConfig);
    setInput("Summarize the attached skills and tell me the next 3 actions.");
    clearError();
    window.localStorage.setItem(CONFIG_KEY, JSON.stringify(nextConfig));
    window.localStorage.removeItem(INPUT_KEY);
  }

  const selectionChipClass =
    "grid min-h-[60px] cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-start gap-4 rounded-2xl border border-line p-4";

  return (
    <div className="grid gap-6">
      <Panel className="p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ink-soft">Agent lab</span>
            <h2 className="m-0 text-lg font-semibold tracking-tight text-ink">Run any agent, pick any model.</h2>
          </div>
          <Tip content={selectedPreset?.id === "gateway" ? "Using AI Gateway for multi-provider routing" : "Direct provider connection"} side="left">
            <small className="text-sm text-ink-soft">{selectedPreset?.label ?? "Custom runtime"}</small>
          </Tip>
        </div>

        <div className="grid max-lg:grid-cols-1 grid-cols-2 gap-4">
          <FieldGroup>
            <FieldLabel>Agent name</FieldLabel>
            <input
              className={textFieldBase}
              onChange={(event) => update("agentName", event.target.value)}
              value={config.agentName}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Provider</FieldLabel>
            <select
              className={cn(textFieldBase, textFieldSelect)}
              onChange={(event) => {
                const preset = presets.find((entry) => entry.id === event.target.value);
                update("providerId", event.target.value);
                if (preset) {
                  update("model", preset.defaultModel);
                  update("compatibleBaseUrl", preset.baseURL ?? "");
                  update("apiKeyEnvVar", preset.apiKeyEnvVar ?? "");
                }
              }}
              value={config.providerId}
            >
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </FieldGroup>
        </div>

        <div className="grid max-lg:grid-cols-1 grid-cols-2 gap-4">
          <FieldGroup>
            <FieldLabel>Model</FieldLabel>
            <input
              className={textFieldBase}
              list="loop-model-suggestions"
              onChange={(event) => update("model", event.target.value)}
              value={config.model}
            />
            <datalist id="loop-model-suggestions">
              {gatewaySuggestions.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </datalist>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>API key env var</FieldLabel>
            <input
              className={textFieldBase}
              onChange={(event) => update("apiKeyEnvVar", event.target.value)}
              placeholder="AI_GATEWAY_API_KEY"
              value={config.apiKeyEnvVar}
            />
          </FieldGroup>
        </div>

        <div className="grid max-lg:grid-cols-1 grid-cols-2 gap-4">
          <FieldGroup>
            <FieldLabel>Compatible base URL</FieldLabel>
            <input
              className={textFieldBase}
              onChange={(event) => update("compatibleBaseUrl", event.target.value)}
              placeholder="https://ai-gateway.vercel.sh/v1/ai"
              value={config.compatibleBaseUrl}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Extra headers JSON</FieldLabel>
            <input
              className={textFieldBase}
              onChange={(event) => update("headersJson", event.target.value)}
              placeholder='{"HTTP-Referer":"https://loop.local"}'
              value={config.headersJson}
            />
          </FieldGroup>
        </div>

        <FieldGroup>
          <FieldLabel>System prompt</FieldLabel>
          <textarea
            className={cn(textFieldBase, textFieldArea)}
            onChange={(event) => update("systemPrompt", event.target.value)}
            value={config.systemPrompt}
          />
        </FieldGroup>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ink-soft">Attachments</span>
            <h2 className="m-0 text-lg font-semibold tracking-tight text-ink">Skills and MCPs</h2>
          </div>
          <Tip content="Skills and MCPs attached to the agent context" side="left">
            <small className="text-sm text-ink-soft">
              {config.selectedSkillSlugs.length} skills · {config.selectedMcpIds.length} MCPs
            </small>
          </Tip>
        </div>

        <div className="grid max-lg:grid-cols-1 grid-cols-2 gap-4">
          <div className="grid content-start gap-4">
            <strong className="text-sm font-semibold text-ink">Skill pack</strong>
            <div className="grid max-h-[360px] gap-3 overflow-auto">
              {skills.slice(0, 32).map((skill) => (
                <label className={selectionChipClass} key={skill.slug}>
                  <input
                    checked={config.selectedSkillSlugs.includes(skill.slug)}
                    onChange={() => toggleListValue("selectedSkillSlugs", skill.slug)}
                    type="checkbox"
                  />
                  <span className="flex min-w-0 items-center gap-3">
                    <SkillIcon className="shrink-0 rounded-md" iconUrl={skill.iconUrl} size={20} slug={skill.slug} />
                    <span className="grid min-w-0 gap-1">
                      <span className="truncate text-sm">{skill.title}</span>
                      <Badge color={getTagColorForCategory(skill.category)} size="sm">
                        {formatTagLabel(skill.category)}
                      </Badge>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid content-start gap-4">
            <strong className="text-sm font-semibold text-ink">MCP registry</strong>
            <div className="grid max-h-[360px] gap-3 overflow-auto">
              {mcps.length > 0 ? (
                mcps.map((mcp) => (
                  <label className={selectionChipClass} key={mcp.id}>
                    <input
                      checked={config.selectedMcpIds.includes(mcp.id)}
                      onChange={() => toggleListValue("selectedMcpIds", mcp.id)}
                      type="checkbox"
                    />
                    <span className="flex min-w-0 items-center gap-3">
                      <McpIcon homepageUrl={mcp.homepageUrl} iconUrl={mcp.iconUrl} name={mcp.name} size={24} />
                      <span className="grid min-w-0 gap-1">
                        {mcp.name}
                        <small className="text-xs text-ink-soft">
                          {mcp.transport} ·{" "}
                          <Tip content={["stdio", "http"].includes(mcp.transport) ? "This MCP can be called at runtime in the sandbox" : "Schema-only — tools are described but not executable"} side="right">
                            <span>{["stdio", "http"].includes(mcp.transport) ? "runtime ready" : "metadata only"}</span>
                          </Tip>
                        </small>
                      </span>
                    </span>
                  </label>
                ))
              ) : (
                <div className="grid gap-2 rounded-2xl border border-line p-4">
                  <strong className="text-sm font-semibold text-ink">No MCP imported yet</strong>
                  <span className="text-sm text-ink-soft">Pull one in from a public manifest URL below.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Tip content="Reset all lab settings to defaults" side="top">
            <Button onClick={resetConfig} type="button" variant="ghost">
              Reset lab
            </Button>
          </Tip>
          {selectedPreset?.docsUrl ? (
            <ButtonLink href={selectedPreset.docsUrl} rel="noreferrer" target="_blank" variant="ghost">
              Provider docs
            </ButtonLink>
          ) : null}
        </div>
      </Panel>

      <Panel className="p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ink-soft">Remote import</span>
            <h2 className="m-0 text-lg font-semibold tracking-tight text-ink">Pull skills and MCPs from the web.</h2>
          </div>
          <small className="text-sm text-ink-soft">{isImportPending ? "Importing" : "GitHub raw, markdown, JSON, YAML"}</small>
        </div>

        <div className="grid max-lg:grid-cols-1 grid-cols-2 gap-4">
          <FieldGroup>
            <FieldLabel>Import type</FieldLabel>
            <select
              className={cn(textFieldBase, textFieldSelect)}
              onChange={(event) => setImportKind(event.target.value as "skill" | "mcp")}
              value={importKind}
            >
              <option value="skill">Skill</option>
              <option value="mcp">MCP manifest</option>
            </select>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Remote URL</FieldLabel>
            <input
              className={textFieldBase}
              onChange={(event) => setImportUrl(event.target.value)}
              placeholder="https://github.com/org/repo/blob/main/SKILL.md"
              value={importUrl}
            />
          </FieldGroup>
        </div>

        {importError ? <p className="text-sm text-danger">{importError}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Button
            disabled={!importUrl.trim() || isImportPending}
            onClick={() => {
              setImportError(null);
              startImportTransition(async () => {
                const response = await fetch("/api/imports", {
                  method: "POST",
                  headers: {
                    "content-type": "application/json"
                  },
                  body: JSON.stringify({
                    kind: importKind,
                    url: importUrl
                  })
                });
                const payload = (await response.json()) as { error?: string };
                if (!response.ok) {
                  setImportError(payload.error ?? "Import failed.");
                  return;
                }

                setImportUrl("");
                router.refresh();
              });
            }}
            type="button"
          >
            {isImportPending ? "Importing..." : `Import ${importKind}`}
          </Button>
        </div>

        <div className="grid max-lg:grid-cols-1 grid-cols-2 gap-4">
          <div className="grid content-start gap-4">
            <strong className="text-sm font-semibold text-ink">Imported skills</strong>
            <div className="grid gap-3">
              {skills
                .filter((skill) => skill.origin === "remote")
                .slice(0, 8)
                .map((skill) => (
                  <div className="grid gap-2 rounded-none border border-line p-4" key={skill.slug}>
                    <div className="flex items-center gap-2.5">
                      <SkillIcon className="shrink-0 rounded-md" iconUrl={skill.iconUrl} size={24} slug={skill.slug} />
                      <strong className="truncate text-sm font-semibold text-ink">{skill.title}</strong>
                      <Badge color={getTagColorForCategory(skill.category)} size="sm">
                        {formatTagLabel(skill.category)}
                      </Badge>
                    </div>
                    <span className="text-xs text-ink-soft">
                      {skill.versionLabel} · {skill.path}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="grid content-start gap-4">
            <strong className="text-sm font-semibold text-ink">Imported MCPs</strong>
            <div className="grid gap-3">
              {mcps.slice(0, 8).map((mcp) => (
                <div className="flex items-start gap-3 rounded-2xl border border-line p-4" key={mcp.id}>
                  <McpIcon className="mt-0.5" homepageUrl={mcp.homepageUrl} iconUrl={mcp.iconUrl} name={mcp.name} size={28} />
                  <div className="grid min-w-0 gap-1">
                    <strong className="text-sm font-semibold text-ink">{mcp.name}</strong>
                    <span className="text-sm text-ink-soft">
                      {mcp.versionLabel} · {mcp.transport} · {mcp.manifestUrl}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ink-soft">Run</span>
            <h2 className="m-0 text-lg font-semibold tracking-tight text-ink">Live transcript</h2>
          </div>
          <div className="flex items-center gap-4">
            <ConversationHistory
              channel="agent-studio"
              onSelect={async (id) => {
                try {
                  const res = await fetch(`/api/conversations/${id}`);
                  if (!res.ok) return;
                  const { conversation } = await res.json();
                  conversationIdRef.current = conversation.id;
                  window.localStorage.setItem("loop.agent-studio.conversationId", conversation.id);
                  window.location.reload();
                } catch { /* silent */ }
              }}
            />
            <Tip content={status === "submitted" ? "Agent is processing your request" : "Agent is ready — type a message and hit Run"} side="bottom">
              <small className="text-sm text-ink-soft">{status === "submitted" ? "Thinking" : selectedPreset?.label ?? "Ready"}</small>
            </Tip>
          </div>
        </div>

        <div className="chat-transcript">
          {messages.length === 0 ? (
            <div className="chat-message chat-message--assistant">
              Attach skills, attach executable MCPs, then make the agent do something useful instead of free-associating.
            </div>
          ) : null}

          {messages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              role={message.role as "user" | "assistant"}
              text={messageToTextVerbose(message)}
              createdAt={getTimestamp(message.id)}
            />
          ))}
        </div>

        {error ? <p className="text-sm text-danger">{error.message}</p> : null}

        <form
          className="chat-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!input.trim()) return;
            sendMessage({ text: input });
            setInput("");
          }}
        >
          <textarea
            className="chat-input"
            onChange={(event) => setInput(event.target.value)}
            placeholder="Draft a new operator skill from the imported frontend sources."
            rows={4}
            value={input}
          />
          <div className="chat-actions">
            <Button
              onClick={() => {
                conversationIdRef.current = null;
                prevMessageCountRef.current = 0;
                timestampsRef.current.clear();
                window.localStorage.removeItem("loop.agent-studio.conversationId");
                window.location.reload();
              }}
              type="button"
              variant="ghost"
            >
              New chat
            </Button>
            <Button onClick={() => setInput("Summarize the attached skills and tell me the next 3 actions.")} type="button" variant="ghost">
              Reset prompt
            </Button>
            <Button disabled={status === "submitted"} type="submit">
              {status === "submitted" ? "Running..." : "Run agent"}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
