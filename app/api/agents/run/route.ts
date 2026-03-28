import { stepCountIs, streamText } from "ai";
import { z } from "zod";

import { buildAgentContext, resolveLanguageModel } from "@/lib/agents";
import { buildMcpToolRuntime } from "@/lib/mcp-runtime";
import { getSkillwireSnapshot } from "@/lib/refresh";
import { logUsageEvent, withApiUsage } from "@/lib/usage-server";

const runSchema = z.object({
  messages: z.array(z.any()),
  agentName: z.string().optional(),
  systemPrompt: z.string().optional(),
  providerId: z.string().min(1),
  model: z.string().min(1),
  compatibleBaseUrl: z.string().optional(),
  apiKeyEnvVar: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  selectedSkillSlugs: z.array(z.string()).optional(),
  selectedMcpIds: z.array(z.string()).optional()
});

export async function POST(request: Request) {
  return withApiUsage(
    {
      route: "/api/agents/run",
      method: "POST",
      label: "Agent run"
    },
    async () => {
      try {
        const payload = runSchema.parse(await request.json());
        const snapshot = await getSkillwireSnapshot();
        const model = resolveLanguageModel(payload);
        const selectedMcps =
          payload.selectedMcpIds && payload.selectedMcpIds.length > 0
            ? snapshot.mcps.filter((mcp) => payload.selectedMcpIds?.includes(mcp.id))
            : [];
        const mcpRuntime = await buildMcpToolRuntime(selectedMcps);
        const toolContext =
          mcpRuntime.catalog.length > 0
            ? [
                "Executable MCP tools:",
                ...mcpRuntime.catalog.map(
                  (tool) => `- ${tool.toolKey} -> ${tool.serverName}/${tool.toolName}: ${tool.description}`
                )
              ].join("\n")
            : "Executable MCP tools: none.";
        const warningContext =
          mcpRuntime.warnings.length > 0 ? `\n\nMCP runtime warnings:\n- ${mcpRuntime.warnings.join("\n- ")}` : "";
        const system = `${buildAgentContext(snapshot, payload)}\n\n${toolContext}${warningContext}`;

        await logUsageEvent({
          kind: "agent_run",
          source: "api",
          label: "Ran agent",
          details: `${payload.providerId} · ${payload.model}`
        });

        const result = streamText({
          model,
          system,
          messages: payload.messages,
          tools: mcpRuntime.tools,
          stopWhen: stepCountIs(mcpRuntime.catalog.length > 0 ? 5 : 1),
          onFinish: async () => {
            await mcpRuntime.close();
          }
        });

        return result.toUIMessageStreamResponse();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to run agent.";
        return Response.json({ error: message }, { status: 400 });
      }
    }
  );
}
