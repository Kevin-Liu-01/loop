import { revalidatePath } from "next/cache";

import { authErrorResponse, requireActiveSubscription } from "@/lib/auth";
import { createAutomation, createAutomationInputSchema } from "@/lib/automations";
import { getSkillRecordBySlug } from "@/lib/content";
import { getLoopSnapshot, refreshLoopSnapshot } from "@/lib/refresh";
import { logUsageEvent, withApiUsage } from "@/lib/usage-server";

export async function GET() {
  return withApiUsage(
    {
      route: "/api/automations",
      method: "GET",
      label: "List automations"
    },
    async () => {
      const snapshot = await getLoopSnapshot();

      return Response.json({
        ok: true,
        automations: snapshot.automations
      });
    }
  );
}

export async function POST(request: Request) {
  return withApiUsage(
    {
      route: "/api/automations",
      method: "POST",
      label: "Create automation"
    },
    async () => {
      try {
        await requireActiveSubscription();
        const payload = createAutomationInputSchema.parse(await request.json());
        const skill = await getSkillRecordBySlug(payload.skillSlug);

        if (!skill) {
          return Response.json({ error: "That skill no longer exists." }, { status: 404 });
        }

        const created = await createAutomation(payload, skill);
        await refreshLoopSnapshot({
          writeLocal: true,
          uploadBlob: false,
          forceFresh: true,
          refreshCategorySignals: false,
          refreshImportedSkills: false,
          refreshUserSkills: false
        });

        revalidatePath("/");
        revalidatePath("/settings");
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
          id: created.id,
          path: created.path,
          prompt: created.prompt,
          rrule: created.rrule
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
