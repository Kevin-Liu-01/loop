import { revalidatePath } from "next/cache";
import { z } from "zod";

import { authErrorResponse, requireActiveSubscription } from "@/lib/auth";
import { DEFAULT_PREFERRED_DAY, DEFAULT_PREFERRED_HOUR, isValidCronSlotHour, isValidDayOfWeek } from "@/lib/automation-constants";
import { getSkillCatalogue, getSkillRecordBySlug } from "@/lib/content";
import { findSkillAuthorForSession } from "@/lib/db/skill-authors";
import { updateSkill } from "@/lib/db/skills";
import { canSessionEditSkill } from "@/lib/skill-authoring";
import { logUsageEvent, withApiUsage } from "@/lib/usage-server";
import type { SkillAutomationState } from "@/lib/types";

const createSchema = z.object({
  name: z.string().trim().min(3).max(80),
  skillSlug: z.string().trim().min(1).max(120),
  cadence: z.enum(["daily", "weekly", "manual"]),
  note: z.string().trim().max(240).optional().default(""),
  status: z.enum(["ACTIVE", "PAUSED"]).default("ACTIVE"),
  preferredHour: z.number().int().min(0).max(23).optional(),
  preferredDay: z.number().int().min(0).max(6).optional(),
});

function buildPrompt(skillSlug: string, skillTitle: string, note: string): string {
  const task = note.trim() || `Review recent changes and update ${skillTitle} if the guidance needs a new revision.`;
  return `Use $${skillSlug} for this task.\n\n${task}`;
}

export async function GET() {
  return withApiUsage(
    { route: "/api/automations", method: "GET", label: "List automations" },
    async () => {
      const catalogue = await getSkillCatalogue();

      return Response.json({
        ok: true,
        automations: catalogue.automations
      });
    }
  );
}

export async function POST(request: Request) {
  return withApiUsage(
    { route: "/api/automations", method: "POST", label: "Create automation" },
    async () => {
      try {
        const session = await requireActiveSubscription();
        const sessionAuthor = await findSkillAuthorForSession(session);
        const payload = createSchema.parse(await request.json());
        const skill = await getSkillRecordBySlug(payload.skillSlug);

        if (!skill) {
          return Response.json({ error: "That skill no longer exists." }, { status: 404 });
        }

        if (!canSessionEditSkill(skill, session, sessionAuthor)) {
          return Response.json(
            { error: "Only the skill owner can create or trigger automation for this skill." },
            { status: 403 }
          );
        }

        const prompt = buildPrompt(skill.slug, skill.title, payload.note);

        const preferredHour = payload.preferredHour !== undefined && isValidCronSlotHour(payload.preferredHour)
          ? payload.preferredHour
          : DEFAULT_PREFERRED_HOUR;
        const preferredDay = payload.preferredDay !== undefined && isValidDayOfWeek(payload.preferredDay)
          ? payload.preferredDay
          : DEFAULT_PREFERRED_DAY;

        const automation: SkillAutomationState = {
          enabled: payload.status !== "PAUSED",
          cadence: payload.cadence,
          status: payload.status === "PAUSED" ? "paused" : "active",
          prompt,
          preferredHour,
          preferredDay,
        };

        await updateSkill(skill.slug, {
          origin: "user",
          automation
        });

        revalidatePath("/");
        revalidatePath("/settings", "layout");
        revalidatePath(`/categories/${skill.category}`);
        revalidatePath(`/skills/${skill.slug}`);

        await logUsageEvent({
          kind: "automation_create",
          source: "api",
          label: "Created automation",
          path: `/skills/${skill.slug}`,
          skillSlug: skill.slug,
          categorySlug: skill.category,
          details: payload.name
        });

        return Response.json({
          ok: true,
          id: skill.slug,
          prompt,
        });
      } catch (error) {
        const authResp = authErrorResponse(error);
        if (authResp) return authResp;

        if (error instanceof Error) {
          return Response.json({ error: error.message }, { status: 400 });
        }

        return Response.json({ error: "Unable to create automation." }, { status: 400 });
      }
    }
  );
}
