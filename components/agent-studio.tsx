"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

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

const CONFIG_KEY = "skillwire.agent-studio.config";
const INPUT_KEY = "skillwire.agent-studio.input";

function createInitialConfig(presets: AgentProviderPreset[]): StudioConfig {
  const preset = presets[0];

  return {
    agentName: "Skillwire operator",
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

function messageToText(message: { content?: unknown; parts?: Array<{ type?: string; text?: string }> }): string {
  if (typeof message.content === "string") {
    return message.content;
  }

  if (Array.isArray(message.parts)) {
    return message.parts
      .map((part) => {
        if (part.type === "text") {
          return part.text ?? "";
        }

        return JSON.stringify(part, null, 2);
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
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
    id: "skillwire-agent-studio",
    transport
  });

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

  return (
    <div className="agent-studio">
      <section className="card">
        <div className="section-head">
          <div>
            <span className="eyebrow">Agent lab</span>
            <h2>Run any agent, pick any model.</h2>
          </div>
          <small>{selectedPreset?.label ?? "Custom runtime"}</small>
        </div>

        <div className="form-row">
          <label className="field-group">
            <span>Agent name</span>
            <input
              className="text-field"
              onChange={(event) => update("agentName", event.target.value)}
              value={config.agentName}
            />
          </label>

          <label className="field-group">
            <span>Provider</span>
            <select
              className="text-field text-field--select"
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
          </label>
        </div>

        <div className="form-row">
          <label className="field-group">
            <span>Model</span>
            <input
              className="text-field"
              list="skillwire-model-suggestions"
              onChange={(event) => update("model", event.target.value)}
              value={config.model}
            />
            <datalist id="skillwire-model-suggestions">
              {gatewaySuggestions.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </datalist>
          </label>

          <label className="field-group">
            <span>API key env var</span>
            <input
              className="text-field"
              onChange={(event) => update("apiKeyEnvVar", event.target.value)}
              placeholder="AI_GATEWAY_API_KEY"
              value={config.apiKeyEnvVar}
            />
          </label>
        </div>

        <div className="form-row">
          <label className="field-group">
            <span>Compatible base URL</span>
            <input
              className="text-field"
              onChange={(event) => update("compatibleBaseUrl", event.target.value)}
              placeholder="https://ai-gateway.vercel.sh/v1/ai"
              value={config.compatibleBaseUrl}
            />
          </label>

          <label className="field-group">
            <span>Extra headers JSON</span>
            <input
              className="text-field"
              onChange={(event) => update("headersJson", event.target.value)}
              placeholder='{"HTTP-Referer":"https://skillwire.local"}'
              value={config.headersJson}
            />
          </label>
        </div>

        <label className="field-group">
          <span>System prompt</span>
          <textarea
            className="text-field text-field--area"
            onChange={(event) => update("systemPrompt", event.target.value)}
            value={config.systemPrompt}
          />
        </label>

        <div className="section-head">
          <div>
            <span className="eyebrow">Attachments</span>
            <h2>Skills and MCPs</h2>
          </div>
          <small>
            {config.selectedSkillSlugs.length} skills · {config.selectedMcpIds.length} MCPs
          </small>
        </div>

        <div className="grid-two">
          <div className="selection-panel">
            <strong>Skill pack</strong>
            <div className="selection-stack">
              {skills.slice(0, 32).map((skill) => (
                <label className="selection-chip" key={skill.slug}>
                  <input
                    checked={config.selectedSkillSlugs.includes(skill.slug)}
                    onChange={() => toggleListValue("selectedSkillSlugs", skill.slug)}
                    type="checkbox"
                  />
                  <span>
                    {skill.title}
                    <small>{skill.category}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="selection-panel">
            <strong>MCP registry</strong>
            <div className="selection-stack">
              {mcps.length > 0 ? (
                mcps.map((mcp) => (
                  <label className="selection-chip" key={mcp.id}>
                    <input
                      checked={config.selectedMcpIds.includes(mcp.id)}
                      onChange={() => toggleListValue("selectedMcpIds", mcp.id)}
                      type="checkbox"
                    />
                    <span>
                      {mcp.name}
                      <small>
                        {mcp.transport} · {["stdio", "http"].includes(mcp.transport) ? "runtime ready" : "metadata only"}
                      </small>
                    </span>
                  </label>
                ))
              ) : (
                <div className="signal-item signal-item--static">
                  <strong>No MCP imported yet</strong>
                  <span>Pull one in from a public manifest URL below.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hero-actions">
          <button className="button button--ghost" onClick={resetConfig} type="button">
            Reset lab
          </button>
          {selectedPreset?.docsUrl ? (
            <a className="button button--ghost" href={selectedPreset.docsUrl} rel="noreferrer" target="_blank">
              Provider docs
            </a>
          ) : null}
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <div>
            <span className="eyebrow">Remote import</span>
            <h2>Pull skills and MCPs from the web.</h2>
          </div>
          <small>{isImportPending ? "Importing" : "GitHub raw, markdown, JSON, YAML"}</small>
        </div>

        <div className="form-row">
          <label className="field-group">
            <span>Import type</span>
            <select
              className="text-field text-field--select"
              onChange={(event) => setImportKind(event.target.value as "skill" | "mcp")}
              value={importKind}
            >
              <option value="skill">Skill</option>
              <option value="mcp">MCP manifest</option>
            </select>
          </label>

          <label className="field-group">
            <span>Remote URL</span>
            <input
              className="text-field"
              onChange={(event) => setImportUrl(event.target.value)}
              placeholder="https://github.com/org/repo/blob/main/SKILL.md"
              value={importUrl}
            />
          </label>
        </div>

        {importError ? <p className="form-error">{importError}</p> : null}

        <div className="hero-actions">
          <button
            className="button"
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
          </button>
        </div>

        <div className="grid-two">
          <div className="selection-panel">
            <strong>Imported skills</strong>
            <div className="signal-stack">
              {skills.filter((skill) => skill.origin === "remote").slice(0, 8).map((skill) => (
                <div className="signal-item signal-item--static" key={skill.slug}>
                  <strong>{skill.title}</strong>
                  <span>
                    {skill.versionLabel} · {skill.path}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="selection-panel">
            <strong>Imported MCPs</strong>
            <div className="signal-stack">
              {mcps.slice(0, 8).map((mcp) => (
                <div className="signal-item signal-item--static" key={mcp.id}>
                  <strong>{mcp.name}</strong>
                  <span>
                    {mcp.versionLabel} · {mcp.transport} · {mcp.manifestUrl}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <div>
            <span className="eyebrow">Run</span>
            <h2>Live transcript</h2>
          </div>
          <small>{status === "submitted" ? "Thinking" : selectedPreset?.label ?? "Ready"}</small>
        </div>

        <div className="chat-transcript">
          {messages.length === 0 ? (
            <div className="chat-message chat-message--assistant">
              Attach skills, attach executable MCPs, then make the agent do something useful instead of free-associating.
            </div>
          ) : null}

          {messages.map((message) => (
            <div
              className={`chat-message ${
                message.role === "user" ? "chat-message--user" : "chat-message--assistant"
              }`}
              key={message.id}
            >
              {messageToText(message)}
            </div>
          ))}
        </div>

        {error ? <p className="form-error">{error.message}</p> : null}

        <form
          className="chat-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!input.trim()) {
              return;
            }

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
            <button
              className="button button--ghost"
              onClick={() => setInput("Summarize the attached skills and tell me the next 3 actions.")}
              type="button"
            >
              Reset prompt
            </button>
            <button className="button" disabled={status === "submitted"} type="submit">
              {status === "submitted" ? "Running..." : "Run agent"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
