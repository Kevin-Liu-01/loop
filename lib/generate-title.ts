import { generateText, type LanguageModel } from "ai";

import { getGatewayEditorModel } from "@/lib/agents";

const TITLE_SYSTEM_PROMPT = [
  "Generate a short, descriptive title (3–8 words) for a chat conversation.",
  "The title should capture the main topic or intent.",
  "Return ONLY the title text — no quotes, no punctuation at the end, no explanation.",
].join(" ");

/**
 * Generate a short conversation title from the first few messages.
 * Falls back to truncated first-user-message if the model is unavailable.
 * When `externalModel` is supplied it takes priority over the gateway editor model.
 */
export async function generateConversationTitle(
  messages: Array<{ role: string; content: string }>,
  externalModel?: LanguageModel,
): Promise<string> {
  const model = externalModel ?? getGatewayEditorModel();
  if (!model) return fallbackTitle(messages);

  const transcript = messages
    .slice(0, 6)
    .map((m) => `${m.role}: ${m.content.slice(0, 300)}`)
    .join("\n");

  try {
    const { text } = await generateText({
      model,
      system: TITLE_SYSTEM_PROMPT,
      prompt: transcript,
      maxOutputTokens: 30,
      temperature: 0.3,
    });

    const cleaned = text.trim().replace(/^["']|["']$/g, "").trim();
    return cleaned || fallbackTitle(messages);
  } catch {
    return fallbackTitle(messages);
  }
}

function fallbackTitle(
  messages: Array<{ role: string; content: string }>,
): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "Untitled session";
  const text = first.content.trim();
  return text.length > 60 ? text.slice(0, 57) + "…" : text;
}
