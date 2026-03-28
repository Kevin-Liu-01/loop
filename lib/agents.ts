import { createGateway, type LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import type {
  AgentProviderKind,
  AgentProviderPreset,
  ImportedMcpDocument,
  SkillRecord,
  SkillwireSnapshot
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

function serializeSkill(skill: SkillRecord): string {
  return [
    `Skill: ${skill.title} ($${skill.slug})`,
    `Version: ${skill.versionLabel}`,
    `Category: ${skill.category}`,
    `Origin: ${skill.origin}`,
    `Description: ${skill.description}`,
    `Prompt: ${skill.agents[0]?.defaultPrompt ?? `Use $${skill.slug}`}`,
    `Body: ${skill.body.slice(0, 2400)}`
  ].join("\n");
}

function serializeMcp(mcp: ImportedMcpDocument): string {
  return [
    `MCP: ${mcp.name}`,
    `Version: ${mcp.versionLabel}`,
    `Transport: ${mcp.transport}`,
    `Manifest: ${mcp.manifestUrl}`,
    mcp.url ? `Endpoint: ${mcp.url}` : null,
    mcp.command ? `Command: ${mcp.command} ${mcp.args.join(" ")}`.trim() : null,
    mcp.envKeys.length > 0 ? `Env keys: ${mcp.envKeys.join(", ")}` : null,
    `Description: ${mcp.description}`
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildAgentContext(snapshot: SkillwireSnapshot, input: AgentRunInput): string {
  const selectedSkills =
    input.selectedSkillSlugs && input.selectedSkillSlugs.length > 0
      ? snapshot.skills.filter((skill) => input.selectedSkillSlugs?.includes(skill.slug))
      : snapshot.skills.slice(0, 8);
  const selectedMcps =
    input.selectedMcpIds && input.selectedMcpIds.length > 0
      ? snapshot.mcps.filter((mcp) => input.selectedMcpIds?.includes(mcp.id))
      : [];

  return [
    input.systemPrompt?.trim() || "You are Skillwire's configurable agent runner. Use attached skills and MCP definitions precisely.",
    "",
    `Agent name: ${input.agentName?.trim() || "Untitled agent"}`,
    `Model: ${input.model}`,
    `Provider: ${getPreset(input.providerId)?.label ?? input.providerId}`,
    "",
    "Attached skills:",
    ...(selectedSkills.length > 0 ? selectedSkills.map(serializeSkill) : ["No explicit skills attached."]),
    "",
    "Attached MCP definitions:",
    ...(selectedMcps.length > 0
      ? selectedMcps.map(serializeMcp)
      : ["No MCPs attached."]),
    "",
    "Daily briefs:",
    ...snapshot.dailyBriefs.map((brief) => `${brief.title}: ${brief.summary}`)
  ].join("\n\n");
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
