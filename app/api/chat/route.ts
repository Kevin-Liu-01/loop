import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

import { getSkillwireSnapshot } from "@/lib/refresh";
import { withApiUsage } from "@/lib/usage-server";

export async function POST(request: Request) {
  return withApiUsage(
    {
      route: "/api/chat",
      method: "POST",
      label: "Desk copilot"
    },
    async () => {
      if (!process.env.OPENAI_API_KEY) {
        return Response.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
      }

      const { messages } = await request.json();
      const snapshot = await getSkillwireSnapshot();
      const context = [
        "Skillwire local context:",
        ...snapshot.skills.slice(0, 28).map((skill) => {
          return [
            `Skill: ${skill.title} ($${skill.slug})`,
            `Category: ${skill.category}`,
            `Description: ${skill.description}`,
            `Prompt: ${skill.agents[0]?.defaultPrompt ?? `Use $${skill.slug}`}`,
            `Automations: ${skill.automations.map((automation) => automation.name).join(", ") || "none"}`
          ].join(" | ");
        }),
        "Daily briefs:",
        ...snapshot.dailyBriefs.map((brief) => `${brief.title}: ${brief.summary}`)
      ].join("\n");

      const result = streamText({
        model: openai(process.env.SKILLWIRE_MODEL ?? "gpt-5-mini"),
        system: `You are the in-house Skillwire copilot. Answer using the local skill catalogue and daily briefs only. Prefer exact skill names, category lanes, and concrete next steps.\n\n${context}`,
        messages
      });

      return result.toUIMessageStreamResponse();
    }
  );
}
