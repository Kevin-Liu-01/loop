import type { LanguageModel } from "ai";
import type { Sandbox } from "@vercel/sandbox";

import { serializeMcp, serializeSkill } from "@/lib/agents";
import { buildSandboxTools } from "@/lib/sandbox-tools";
import type { ImportedMcpDocument, SkillRecord } from "@/lib/types";

export type SandboxAgentConfig = {
  model: LanguageModel;
  skills: SkillRecord[];
  mcps?: ImportedMcpDocument[];
  sandbox: Sandbox;
  runtime: string;
  systemPrompt?: string;
  attachmentContext?: string;
};

function buildSandboxInstructions(
  skillContext: string,
  mcpContext: string,
  runtime: string,
  userPrompt?: string,
  attachmentContext?: string
): string {
  const base =
    userPrompt?.trim() ||
    "You are an operator agent with a live sandbox environment.";

  return [
    base,
    "",
    `## Knowledge (attached skills):\n${skillContext || "No skills attached."}`,
    "",
    `## MCP definitions:\n${mcpContext || "No MCPs attached."}`,
    "",
    `## Current message attachments:\n${attachmentContext || "No message-scoped attachments were provided."}`,
    "",
    "## Environment:",
    `You have a ${runtime} sandbox. Use these tools to interact with it:`,
    "- executeCode: Write and run code. Use console.log (JS) or print (Python) for output.",
    "- runCommand: Run shell commands (curl, ls, git, npm, pip, etc.)",
    "- writeFile: Create or overwrite files in the sandbox.",
    "- readFile: Read file contents from the sandbox.",
    "",
    "## Operating principles:",
    "1. Act first, reason second. Write code or run commands to accomplish the task.",
    "2. Observe results. Read stdout, stderr, and exit codes.",
    "3. Iterate. If something fails, debug by inspecting the error and trying again.",
    "4. Use your skill knowledge to inform what you build, but validate in the environment.",
    "5. Do NOT try to solve everything in a single response. Use multiple tool calls."
  ].join("\n");
}

export function buildSandboxAgentConfig(config: SandboxAgentConfig) {
  const sandboxTools = buildSandboxTools(config.sandbox);
  const skillContext = config.skills.map(serializeSkill).join("\n\n");
  const mcpContext = (config.mcps ?? []).map(serializeMcp).join("\n\n");

  return {
    system: buildSandboxInstructions(
      skillContext,
      mcpContext,
      config.runtime,
      config.systemPrompt,
      config.attachmentContext
    ),
    tools: sandboxTools,
    maxToolSteps: 20
  };
}
