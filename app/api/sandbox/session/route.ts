import { z } from "zod";

import {
  createSandboxSession,
  getSandboxStatus,
  stopSandboxSession,
  type SandboxRuntime
} from "@/lib/sandbox";
import { logUsageEvent, withApiUsage } from "@/lib/usage-server";

const createSchema = z.object({
  runtime: z.enum(["node24", "node22", "python3.13"]).default("node24"),
  env: z.record(z.string(), z.string()).optional()
});

export async function POST(request: Request) {
  return withApiUsage(
    { route: "/api/sandbox/session", method: "POST", label: "Create sandbox" },
    async () => {
      try {
        const payload = createSchema.parse(await request.json());
        const session = await createSandboxSession(
          payload.runtime as SandboxRuntime,
          payload.env
        );

        await logUsageEvent({
          kind: "api_call",
          source: "api",
          label: "Created sandbox session",
          details: `${session.runtime} / ${session.sandboxId}`
        });

        return Response.json(session, { status: 201 });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create sandbox";

        try {
          const parsed = JSON.parse(message);
          if (parsed.code === "SANDBOX_AUTH_FAILED") {
            return Response.json(parsed, { status: 403 });
          }
        } catch {
          /* not a structured error */
        }

        return Response.json({ error: message }, { status: 400 });
      }
    }
  );
}

export async function GET(request: Request) {
  return withApiUsage(
    { route: "/api/sandbox/session", method: "GET", label: "Get sandbox status" },
    async () => {
      const { searchParams } = new URL(request.url);
      const sandboxId = searchParams.get("sandboxId");

      if (!sandboxId) {
        return Response.json(
          { error: "sandboxId query param required" },
          { status: 400 }
        );
      }

      const status = await getSandboxStatus(sandboxId);
      if (!status) {
        return Response.json({ error: "Sandbox not found" }, { status: 404 });
      }

      return Response.json(status);
    }
  );
}

export async function DELETE(request: Request) {
  return withApiUsage(
    {
      route: "/api/sandbox/session",
      method: "DELETE",
      label: "Stop sandbox"
    },
    async () => {
      const { searchParams } = new URL(request.url);
      const sandboxId = searchParams.get("sandboxId");

      if (!sandboxId) {
        return Response.json(
          { error: "sandboxId query param required" },
          { status: 400 }
        );
      }

      await stopSandboxSession(sandboxId);

      logUsageEvent({
        kind: "api_call",
        source: "api",
        label: "Stopped sandbox session",
        details: sandboxId
      }).catch(() => {});

      return Response.json({ ok: true });
    }
  );
}
