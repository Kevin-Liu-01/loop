import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { z } from "zod";

import { resolveLanguageModel } from "@/lib/agents";
import { buildSandboxAgentConfig } from "@/lib/sandbox-agent";
import { getSandboxInstance } from "@/lib/sandbox";
import { getSkillwireSnapshot } from "@/lib/refresh";
import { logUsageEvent, withApiUsage } from "@/lib/usage-server";

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
  systemPrompt: z.string().optional()
});

export async function POST(request: Request) {
  return withApiUsage(
    { route: "/api/sandbox/run", method: "POST", label: "Sandbox agent run" },
    async () => {
      try {
        const payload = runSchema.parse(await request.json());

        const [snapshot, sandbox] = await Promise.all([
          getSkillwireSnapshot(),
          getSandboxInstance(payload.sandboxId)
        ]);

        const model = resolveLanguageModel(payload);

        const selectedSkills =
          payload.selectedSkillSlugs && payload.selectedSkillSlugs.length > 0
            ? snapshot.skills.filter((s) =>
                payload.selectedSkillSlugs?.includes(s.slug)
              )
            : [];

        const agentConfig = buildSandboxAgentConfig({
          model,
          skills: selectedSkills,
          sandbox,
          runtime: payload.runtime,
          systemPrompt: payload.systemPrompt
        });

        await logUsageEvent({
          kind: "agent_run",
          source: "api",
          label: "Ran sandbox agent",
          details: `${payload.providerId} · ${payload.model} · sandbox:${payload.sandboxId}`
        });

        const result = streamText({
          model,
          system: agentConfig.system,
          messages: convertToModelMessages(payload.messages),
          tools: agentConfig.tools,
          stopWhen: stepCountIs(agentConfig.maxToolSteps)
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
