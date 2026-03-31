import { z } from "zod";

import { authErrorResponse, getSessionUser } from "@/lib/auth";
import { listConversations, upsertConversation } from "@/lib/db/conversations";
import { withApiUsage } from "@/lib/usage-server";

const messageMetadataSchema = z.object({
  attachments: z
    .object({
      skills: z.array(
        z.object({
          slug: z.string(),
          title: z.string(),
          versionLabel: z.string(),
          iconUrl: z.string().optional()
        })
      ),
      mcps: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          transport: z.enum(["stdio", "http", "sse", "ws", "unknown"]),
          iconUrl: z.string().optional(),
          sandboxSupported: z.boolean().optional()
        })
      )
    })
    .optional()
});

const upsertSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  channel: z.enum(["copilot", "agent-studio", "sandbox"]),
  title: z.string().max(200).default(""),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
      createdAt: z.string(),
      metadata: messageMetadataSchema.optional()
    })
  ),
  model: z.string().optional(),
  providerId: z.string().optional()
});

export async function GET(request: Request) {
  return withApiUsage(
    { route: "/api/conversations", method: "GET", label: "List conversations" },
    async () => {
      try {
        const session = await getSessionUser();
        if (!session) {
          return Response.json({ error: "Sign in to view conversations." }, { status: 401 });
        }

        const url = new URL(request.url);
        const channel = url.searchParams.get("channel") as "copilot" | "agent-studio" | null;
        const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 50);

        const conversations = await listConversations(
          session.userId,
          channel ?? undefined,
          limit
        );

        return Response.json({
          ok: true,
          conversations: conversations.map(({ messages: _msgs, ...rest }) => ({
            ...rest,
            messageCount: _msgs.length
          }))
        });
      } catch (error) {
        const authResponse = authErrorResponse(error);
        if (authResponse) return authResponse;
        return Response.json({ error: "Failed to list conversations." }, { status: 500 });
      }
    }
  );
}

export async function POST(request: Request) {
  return withApiUsage(
    { route: "/api/conversations", method: "POST", label: "Save conversation" },
    async () => {
      try {
        const session = await getSessionUser();
        if (!session) {
          return Response.json({ error: "Sign in to save conversations." }, { status: 401 });
        }

        const payload = upsertSchema.parse(await request.json());
        const record = await upsertConversation({
          id: payload.id ?? undefined,
          clerkUserId: session.userId,
          channel: payload.channel,
          title: payload.title,
          messages: payload.messages,
          model: payload.model,
          providerId: payload.providerId
        });

        return Response.json({ ok: true, id: record.id });
      } catch (error) {
        const authResponse = authErrorResponse(error);
        if (authResponse) return authResponse;

        if (error instanceof z.ZodError) {
          return Response.json({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
        }

        return Response.json({ error: "Failed to save conversation." }, { status: 500 });
      }
    }
  );
}
