import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { z } from "zod";

import { resolveLanguageModel } from "@/lib/agents";
import { buildMcpToolRuntime } from "@/lib/mcp-runtime";
import { supportsSandboxMcp } from "@/lib/mcp-utils";
import { buildSandboxAgentConfig } from "@/lib/sandbox-agent";
import { getSandboxInstance } from "@/lib/sandbox";
import { getLoopSnapshot } from "@/lib/refresh";
import { logUsageEvent, withApiUsage } from "@/lib/usage-server";
import type { ConversationMessageMetadata } from "@/lib/types";

const runSchema = z.object({
  messages: z.array(z.any()),
  sandboxId: z.string().min(1),
  runtime: z.string().default("node24"),
  providerId: z.string().min(1),
  model: z.string().min(1),
  compatibleBaseUrl: z.string().optional(),
  apiKeyEnvVar: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  selectedSkillSlugs: z.array(z.string()).optional(),
  selectedMcpIds: z.array(z.string()).optional(),
  systemPrompt: z.string().optional()
});

export async function POST(request: Request) {
  return withApiUsage(
    { route: "/api/sandbox/run", method: "POST", label: "Sandbox agent run" },
    async () => {
      try {
        const payload = runSchema.parse(await request.json());

        const [snapshot, sandbox] = await Promise.all([
          getLoopSnapshot(),
          getSandboxInstance(payload.sandboxId)
        ]);

        const model = resolveLanguageModel(payload);

        const selectedSkills =
          payload.selectedSkillSlugs && payload.selectedSkillSlugs.length > 0
            ? snapshot.skills.filter((s) =>
                payload.selectedSkillSlugs?.includes(s.slug)
              )
            : [];

        const selectedMcps =
          payload.selectedMcpIds && payload.selectedMcpIds.length > 0
            ? snapshot.mcps.filter(
                (mcp) =>
                  payload.selectedMcpIds?.includes(mcp.id) && supportsSandboxMcp(mcp)
              )
            : [];
        const unsupportedMcps =
          payload.selectedMcpIds && payload.selectedMcpIds.length > 0
            ? snapshot.mcps.filter(
                (mcp) =>
                  payload.selectedMcpIds?.includes(mcp.id) && !supportsSandboxMcp(mcp)
              )
            : [];
        const latestUserMessage = [...payload.messages]
          .reverse()
          .find(
            (message) =>
              typeof message === "object" &&
              message !== null &&
              "role" in message &&
              message.role === "user"
          ) as { metadata?: ConversationMessageMetadata } | undefined;
        const latestAttachments = latestUserMessage?.metadata?.attachments;
        const attachmentContext = latestAttachments
          ? [
              latestAttachments.skills.length > 0
                ? `Skills: ${latestAttachments.skills.map((skill) => `${skill.title} ($${skill.slug})`).join(", ")}`
                : "Skills: none",
              latestAttachments.mcps.length > 0
                ? `MCPs: ${latestAttachments.mcps
                    .map((mcp) => `${mcp.name}${mcp.sandboxSupported === false ? " (unsupported)" : ""}`)
                    .join(", ")}`
                : "MCPs: none"
            ].join("\n")
          : undefined;

        const [agentConfig, mcpRuntime] = await Promise.all([
          Promise.resolve(
            buildSandboxAgentConfig({
              model,
              skills: selectedSkills,
              mcps: selectedMcps,
              sandbox,
              runtime: payload.runtime,
              systemPrompt: payload.systemPrompt,
              attachmentContext
            })
          ),
          buildMcpToolRuntime(selectedMcps)
        ]);

        const mcpToolContext =
          mcpRuntime.catalog.length > 0
            ? [
                "\n\n## MCP tools (from attached servers):",
                ...mcpRuntime.catalog.map(
                  (t) => `- ${t.toolKey} → ${t.serverName}/${t.toolName}: ${t.description}`
                )
              ].join("\n")
            : "";

        const mcpWarnings =
          mcpRuntime.warnings.length > 0 || unsupportedMcps.length > 0
            ? `\n\nMCP runtime warnings:\n- ${[
                ...mcpRuntime.warnings,
                ...unsupportedMcps.map(
                  (mcp) => `${mcp.name} is not marked sandbox-compatible and was not attached to the run.`
                )
              ].join("\n- ")}`
            : "";

        const tools = { ...agentConfig.tools, ...mcpRuntime.tools };
        const maxSteps = agentConfig.maxToolSteps + (mcpRuntime.catalog.length > 0 ? 5 : 0);

        await logUsageEvent({
          kind: "agent_run",
          source: "api",
          label: "Ran sandbox agent",
          details: `${payload.providerId} · ${payload.model} · sandbox:${payload.sandboxId} · ${selectedMcps.length} MCPs`
        });

        const result = streamText({
          model,
          system: `${agentConfig.system}${mcpToolContext}${mcpWarnings}`,
          messages: convertToModelMessages(payload.messages),
          tools,
          stopWhen: stepCountIs(maxSteps),
          onFinish: async () => {
            await mcpRuntime.close();
          }
        });

        return result.toUIMessageStreamResponse();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to run sandbox agent.";
        return Response.json({ error: message }, { status: 400 });
      }
    }
  );
}
