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
    "You are an operator agent with a live sandbox environment. Execute tasks by writing and running code, installing packages, and validating results in the sandbox.";

  return [
    base,
    "",
    "# Context",
    "",
    `## Attached skills\n\n${skillContext || "None."}`,
    "",
    `## MCP definitions\n\n${mcpContext || "None."}`,
    "",
    `## Message attachments\n\n${attachmentContext || "None."}`,
    "",
    "# Sandbox environment",
    "",
    `Runtime: **${runtime}**`,
    "",
    "Available tools:",
    "- **executeCode** — Write and run JavaScript or Python. Use console.log / print for output. Specify packages to auto-install before execution.",
    "- **runCommand** — Run any shell command (curl, ls, git, npm, pip, etc.). Read stdout, stderr, and exit codes.",
    "- **writeFile** — Create or overwrite a file at any path. Parent directories are created automatically.",
    "- **readFile** — Read a file's contents. Use to inspect generated output or debug file state.",
    "",
    "# Operating principles",
    "",
    "1. **Act, observe, iterate.** Write code or run commands immediately. Read output. Fix errors and try again.",
    "2. **Use multiple tool calls.** Break complex tasks into steps — install → scaffold → run → verify.",
    "3. **Validate in the sandbox.** Skill knowledge informs your approach, but the sandbox is ground truth.",
    "4. **Surface results.** Always show the user what worked, what output was produced, and what to do next.",
    "5. **Handle errors concretely.** When something fails, read the error, diagnose it, and retry with a fix — don't just report the failure.",
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
