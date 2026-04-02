import { streamText } from "ai";

import { getGatewayModelForSkill, getGatewayEditorModelId } from "@/lib/agents";
import { getLoopSnapshot } from "@/lib/refresh";
import { withApiUsage } from "@/lib/usage-server";

export async function POST(request: Request) {
  return withApiUsage(
    {
      route: "/api/chat",
      method: "POST",
      label: "Desk copilot"
    },
    async () => {
      const model = getGatewayModelForSkill();
      if (!model) {
        return Response.json({ error: "AI_GATEWAY_API_KEY is not configured." }, { status: 503 });
      }

      const { messages } = await request.json();
      const snapshot = await getLoopSnapshot();
      const skillList = snapshot.skills.slice(0, 28).map((skill) => {
        return [
          `**${skill.title}** ($${skill.slug}) — ${skill.category}`,
          skill.description,
          skill.automations.length > 0 ? `Automations: ${skill.automations.map((a) => a.name).join(", ")}` : null,
        ].filter(Boolean).join("\n  ");
      });

      const briefList = snapshot.dailyBriefs.map(
        (brief) => `**${brief.title}**: ${brief.summary}`
      );

      const context = [
        "# Skill catalogue",
        "",
        ...skillList,
        "",
        "# Daily briefs",
        "",
        ...briefList,
      ].join("\n");

      const result = streamText({
        model,
        system: [
          "You are Loop's desk copilot — a concise, knowledgeable assistant for navigating and understanding the user's skill catalogue.",
          "",
          "Guidelines:",
          "- Answer from the skill catalogue and daily briefs below. Do not invent skills or briefs that aren't listed.",
          "- Reference skills by their exact name and $slug, e.g. \"**Next.js** ($nextjs)\".",
          "- When comparing or recommending skills, cite the category lane and key differences.",
          "- Keep responses short and actionable: recommend concrete next steps, not abstract advice.",
          "- If the user asks about something outside the catalogue, say so clearly and suggest which skill might be closest.",
          "",
          context,
        ].join("\n"),
        messages
      });

      return result.toUIMessageStreamResponse();
    }
  );
}
