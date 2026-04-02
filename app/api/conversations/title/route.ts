import { z } from "zod";

import { resolveLanguageModel } from "@/lib/agents";
import { authErrorResponse, getSessionUser } from "@/lib/auth";
import { generateConversationTitle } from "@/lib/generate-title";
import { withApiUsage } from "@/lib/usage-server";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.string(),
        content: z.string(),
      }),
    )
    .min(1)
    .max(10),
  providerId: z.string().optional(),
  model: z.string().optional(),
  compatibleBaseUrl: z.string().optional(),
  apiKeyEnvVar: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

export async function POST(request: Request) {
  return withApiUsage(
    { route: "/api/conversations/title", method: "POST", label: "Generate conversation title" },
    async () => {
      try {
        const session = await getSessionUser();
        if (!session) {
          return Response.json({ error: "Sign in required." }, { status: 401 });
        }

        const payload = bodySchema.parse(await request.json());

        let externalModel;
        if (payload.providerId && payload.model) {
          try {
            externalModel = resolveLanguageModel({
              providerId: payload.providerId,
              model: payload.model,
              compatibleBaseUrl: payload.compatibleBaseUrl,
              apiKeyEnvVar: payload.apiKeyEnvVar,
              headers: payload.headers,
            });
          } catch {
            /* fall through to gateway/fallback */
          }
        }

        const title = await generateConversationTitle(payload.messages, externalModel);

        return Response.json({ ok: true, title });
      } catch (error) {
        const authResponse = authErrorResponse(error);
        if (authResponse) return authResponse;

        if (error instanceof z.ZodError) {
          return Response.json(
            { error: error.issues[0]?.message ?? "Invalid payload." },
            { status: 400 },
          );
        }

        return Response.json(
          { error: "Failed to generate title." },
          { status: 500 },
        );
      }
    },
  );
}
