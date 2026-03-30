import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { authErrorResponse, requireActiveSubscription } from "@/lib/auth";
import { automationCadenceSchema } from "@/lib/automations";
import { cadenceToRRule } from "@/lib/automation-constants";
import { withApiUsage } from "@/lib/usage-server";

const AUTOMATIONS_ROOT = path.join(os.homedir(), ".codex", "automations");

const patchSchema = z.object({
  name: z.string().trim().min(3).max(80).optional(),
  cadence: automationCadenceSchema.optional(),
  status: z.enum(["ACTIVE", "PAUSED"]).optional()
});

async function readTomlFields(filePath: string): Promise<Record<string, string>> {
  const raw = await fs.readFile(filePath, "utf8");
  const fields: Record<string, string> = {};

  for (const line of raw.split("\n")) {
    const match = /^(\w+)\s*=\s*(.+)$/.exec(line.trim());
    if (!match) continue;
    const [, key, rawValue] = match;
    try {
      fields[key] = JSON.parse(rawValue);
    } catch {
      fields[key] = rawValue;
    }
  }

  return fields;
}

function quoteToml(value: string): string {
  return JSON.stringify(value);
}

function renderTomlArray(values: string[]): string {
  return `[${values.map((v) => quoteToml(v)).join(", ")}]`;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withApiUsage(
    { route: "/api/automations/[id]", method: "PATCH", label: "Update automation" },
    async () => {
      try {
        await requireActiveSubscription();
        const { id } = await context.params;
        const automationPath = path.join(AUTOMATIONS_ROOT, id, "automation.toml");

        try {
          await fs.access(automationPath);
        } catch {
          return Response.json({ error: "Automation not found." }, { status: 404 });
        }

        const patch = patchSchema.parse(await request.json());
        const existing = await readTomlFields(automationPath);

        if (patch.name) existing.name = patch.name;
        if (patch.status) existing.status = patch.status;
        if (patch.cadence) existing.rrule = cadenceToRRule(patch.cadence);

        const cwds = existing.cwds ?? `["${process.cwd()}"]`;

        const toml = [
          `id = ${quoteToml(existing.id ?? id)}`,
          `name = ${quoteToml(existing.name ?? id)}`,
          `prompt = ${quoteToml(existing.prompt ?? "")}`,
          `rrule = ${quoteToml(existing.rrule ?? "")}`,
          `status = ${quoteToml(existing.status ?? "ACTIVE")}`,
          `cwds = ${typeof cwds === "string" && cwds.startsWith("[") ? cwds : renderTomlArray([process.cwd()])}`
        ].join("\n");

        await fs.writeFile(automationPath, toml);
        revalidatePath("/settings");

        return Response.json({ ok: true, id });
      } catch (error) {
        const authResp = authErrorResponse(error);
        if (authResp) return authResp;

        if (error instanceof Error) {
          return Response.json({ error: error.message }, { status: 400 });
        }

        return Response.json({ error: "Unable to update automation." }, { status: 400 });
      }
    }
  );
}

export async function DELETE(_request: Request, context: RouteContext) {
  return withApiUsage(
    { route: "/api/automations/[id]", method: "DELETE", label: "Delete automation" },
    async () => {
      try {
        await requireActiveSubscription();
        const { id } = await context.params;
        const automationDir = path.join(AUTOMATIONS_ROOT, id);

        try {
          await fs.access(automationDir);
        } catch {
          return Response.json({ error: "Automation not found." }, { status: 404 });
        }

        await fs.rm(automationDir, { recursive: true, force: true });
        revalidatePath("/settings");

        return Response.json({ ok: true, id });
      } catch (error) {
        const authResp = authErrorResponse(error);
        if (authResp) return authResp;

        if (error instanceof Error) {
          return Response.json({ error: error.message }, { status: 400 });
        }

        return Response.json({ error: "Unable to delete automation." }, { status: 400 });
      }
    }
  );
}
