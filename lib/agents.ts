import { createGateway, type LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import type {
  AgentProviderKind,
  AgentProviderPreset,
  ImportedMcpDocument,
  SkillRecord,
  LoopSnapshot
} from "@/lib/types";

export const AGENT_PROVIDER_PRESETS: AgentProviderPreset[] = [
  {
    id: "gateway",
    label: "Vercel AI Gateway",
    kind: "gateway",
    apiKeyEnvVar: "AI_GATEWAY_API_KEY",
    docsUrl: "https://vercel.com/docs/ai-gateway",
    supportsModelListing: true,
    defaultModel: "openai/gpt-5.4-mini"
  },
  {
    id: "openai",
    label: "OpenAI",
    kind: "openai",
    apiKeyEnvVar: "OPENAI_API_KEY",
    baseURL: "https://api.openai.com/v1",
    docsUrl: "https://platform.openai.com/docs/models",
    defaultModel: "gpt-5.4-mini"
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    kind: "compatible",
    apiKeyEnvVar: "OPENROUTER_API_KEY",
    baseURL: "https://openrouter.ai/api/v1",
    docsUrl: "https://openrouter.ai/models",
    defaultModel: "openai/gpt-5"
  },
  {
    id: "groq",
    label: "Groq",
    kind: "compatible",
    apiKeyEnvVar: "GROQ_API_KEY",
    baseURL: "https://api.groq.com/openai/v1",
    docsUrl: "https://console.groq.com/docs/models",
    defaultModel: "llama-3.3-70b-versatile"
  },
  {
    id: "together",
    label: "Together",
    kind: "compatible",
    apiKeyEnvVar: "TOGETHER_API_KEY",
    baseURL: "https://api.together.xyz/v1",
    docsUrl: "https://docs.together.ai/docs/inference-models",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo"
  },
  {
    id: "ollama",
    label: "Ollama",
    kind: "compatible",
    apiKeyEnvVar: "",
    baseURL: "http://127.0.0.1:11434/v1",
    docsUrl: "https://ollama.com/library",
    defaultModel: "llama3.2"
  }
];

export type AgentRunInput = {
  agentName?: string;
  systemPrompt?: string;
  providerId: string;
  model: string;
  compatibleBaseUrl?: string;
  apiKeyEnvVar?: string;
  headers?: Record<string, string>;
  selectedSkillSlugs?: string[];
  selectedMcpIds?: string[];
};

function getPreset(providerId: string): AgentProviderPreset | undefined {
  return AGENT_PROVIDER_PRESETS.find((preset) => preset.id === providerId);
}

function resolveProviderKind(providerId: string): AgentProviderKind {
  return getPreset(providerId)?.kind ?? "compatible";
}

export function getProviderPreset(providerId: string): AgentProviderPreset | undefined {
  return getPreset(providerId);
}

export function resolveLanguageModel(input: AgentRunInput): LanguageModel {
  const preset = getPreset(input.providerId);
  const kind = resolveProviderKind(input.providerId);

  if (!input.model.trim()) {
    throw new Error("A model id is required.");
  }

  if (kind === "gateway") {
    const apiKey = process.env[input.apiKeyEnvVar || preset?.apiKeyEnvVar || "AI_GATEWAY_API_KEY"];
    const provider = createGateway(apiKey ? { apiKey } : undefined);
    return provider(input.model);
  }

  const baseURL = input.compatibleBaseUrl?.trim() || preset?.baseURL;
  if (!baseURL) {
    throw new Error("A compatible base URL is required for this provider.");
  }

  const apiKeyEnvVar = input.apiKeyEnvVar?.trim() || preset?.apiKeyEnvVar;
  const apiKey = apiKeyEnvVar ? process.env[apiKeyEnvVar] : undefined;

  if (apiKeyEnvVar && !apiKey) {
    throw new Error(`Missing ${apiKeyEnvVar} in the environment.`);
  }

  const provider = createOpenAI({
    apiKey,
    baseURL,
    headers: input.headers
  });

  return provider(input.model);
}

export function serializeSkill(skill: SkillRecord): string {
  return [
    `### ${skill.title} ($${skill.slug})`,
    "",
    `- **Version**: ${skill.versionLabel}`,
    `- **Category**: ${skill.category}`,
    `- **Origin**: ${skill.origin}`,
    `- **Description**: ${skill.description}`,
    skill.agents[0]?.defaultPrompt ? `- **Default prompt**: ${skill.agents[0].defaultPrompt}` : null,
    "",
    "```",
    skill.body.slice(0, 2400),
    "```",
  ].filter(Boolean).join("\n");
}

export function serializeMcp(mcp: ImportedMcpDocument): string {
  return [
    `### ${mcp.name} (v${mcp.versionLabel})`,
    "",
    `- **Transport**: ${mcp.transport}`,
    `- **Manifest**: ${mcp.manifestUrl}`,
    mcp.docsUrl ? `- **Docs**: ${mcp.docsUrl}` : null,
    mcp.url ? `- **Endpoint**: ${mcp.url}` : null,
    mcp.command ? `- **Command**: \`${mcp.command} ${mcp.args.join(" ")}\`` : null,
    mcp.installStrategy ? `- **Install**: ${mcp.installStrategy}` : null,
    mcp.authType ? `- **Auth**: ${mcp.authType}` : null,
    mcp.verificationStatus ? `- **Verification**: ${mcp.verificationStatus}` : null,
    mcp.sandboxSupported !== undefined ? `- **Sandbox**: ${mcp.sandboxSupported ? "supported" : "not supported"}` : null,
    mcp.envKeys.length > 0 ? `- **Env keys**: ${mcp.envKeys.map((k) => `\`${k}\``).join(", ")}` : null,
    mcp.sandboxNotes ? `- **Sandbox notes**: ${mcp.sandboxNotes}` : null,
    "",
    mcp.description,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildAgentContext(snapshot: LoopSnapshot, input: AgentRunInput): string {
  const selectedSkills =
    input.selectedSkillSlugs && input.selectedSkillSlugs.length > 0
      ? snapshot.skills.filter((skill) => input.selectedSkillSlugs?.includes(skill.slug))
      : snapshot.skills.slice(0, 8);
  const selectedMcps =
    input.selectedMcpIds && input.selectedMcpIds.length > 0
      ? snapshot.mcps.filter((mcp) => input.selectedMcpIds?.includes(mcp.id))
      : [];

  const defaultSystemPrompt = [
    "You are a Loop agent — an autonomous operator that uses attached skills and MCP tools to accomplish tasks.",
    "",
    "Guidelines:",
    "- Draw on attached skill knowledge to inform your approach, but validate against tool output and real data.",
    "- When MCP tools are available, prefer using them over improvising or guessing.",
    "- Be concrete: produce code, commands, or structured output — not vague plans.",
    "- If you lack the information or tools to complete a task, say so clearly.",
  ].join("\n");

  return [
    input.systemPrompt?.trim() || defaultSystemPrompt,
    "",
    "---",
    "",
    `**Agent**: ${input.agentName?.trim() || "Untitled agent"} · **Model**: ${input.model} · **Provider**: ${getPreset(input.providerId)?.label ?? input.providerId}`,
    "",
    "# Attached skills",
    "",
    ...(selectedSkills.length > 0 ? selectedSkills.map(serializeSkill) : ["_No skills attached._"]),
    "",
    "# MCP definitions",
    "",
    ...(selectedMcps.length > 0
      ? selectedMcps.map(serializeMcp)
      : ["_No MCPs attached._"]),
    "",
    "# Daily briefs",
    "",
    ...(snapshot.dailyBriefs.length > 0
      ? snapshot.dailyBriefs.map((brief) => `- **${brief.title}**: ${brief.summary}`)
      : ["_No briefs available._"]),
  ].join("\n");
}

const GATEWAY_EDITOR_MODEL = process.env.LOOP_MODEL ?? "openai/gpt-5-mini";

let _gatewayKeyWarnedOnce = false;

export function getGatewayEditorModel(): LanguageModel | null {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    if (!_gatewayKeyWarnedOnce) {
      console.warn("[agents] AI_GATEWAY_API_KEY is not set – skill updates will use heuristic fallback (no AI)");
      _gatewayKeyWarnedOnce = true;
    }
    return null;
  }
  const provider = createGateway({ apiKey });
  return provider(GATEWAY_EDITOR_MODEL);
}

export function getGatewayEditorModelId(preferredModel?: string): string {
  return preferredModel || GATEWAY_EDITOR_MODEL;
}

/**
 * Resolve the editor model for a specific skill.
 * Uses the skill's preferredModel when set, otherwise the global default.
 */
export function getGatewayModelForSkill(preferredModel?: string): LanguageModel | null {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    if (!_gatewayKeyWarnedOnce) {
      console.warn("[agents] AI_GATEWAY_API_KEY is not set – skill updates will use heuristic fallback (no AI)");
      _gatewayKeyWarnedOnce = true;
    }
    return null;
  }
  const modelId = preferredModel || GATEWAY_EDITOR_MODEL;
  const provider = createGateway({ apiKey });
  return provider(modelId);
}

export async function listGatewayModels(): Promise<Array<{ id: string; name: string; provider: string }>> {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const provider = createGateway({ apiKey });
    const metadata = await provider.getAvailableModels();

    return metadata.models.map((model) => ({
      id: model.id,
      name: model.name,
      provider: model.specification.provider
    }));
  } catch {
    return [];
  }
}
