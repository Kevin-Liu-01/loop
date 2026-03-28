import { revalidatePath } from "next/cache";

import { createAutomation, createAutomationInputSchema } from "@/lib/automations";
import { getAuthorizedAdminEmail } from "@/lib/admin";
import { getSkillRecordBySlug } from "@/lib/content";
import { refreshSkillwireSnapshot } from "@/lib/refresh";
import { logUsageEvent, withApiUsage } from "@/lib/usage-server";

export async function GET() {
  return withApiUsage(
    {
      route: "/api/automations",
      method: "GET",
      label: "List automations"
    },
    async () => {
      const snapshot = await refreshSkillwireSnapshot({
        writeLocal: true,
        uploadBlob: false,
        forceFresh: false,
        refreshCategorySignals: false,
        refreshImportedSkills: false,
        refreshUserSkills: false
      });

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
      if (!getAuthorizedAdminEmail(request)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      try {
        const payload = createAutomationInputSchema.parse(await request.json());
        const skill = await getSkillRecordBySlug(payload.skillSlug);

        if (!skill) {
          return Response.json({ error: "That skill no longer exists." }, { status: 404 });
        }

        const created = await createAutomation(payload, skill);
        const snapshot = await refreshSkillwireSnapshot({
          writeLocal: true,
          uploadBlob: false,
          forceFresh: true,
          refreshCategorySignals: false,
          refreshImportedSkills: false,
          refreshUserSkills: false
        });

        revalidatePath("/");
        revalidatePath("/admin");
        revalidatePath(`/categories/${skill.category}`);
        revalidatePath(`/skills/${skill.slug}`);
        snapshot.skills.forEach((entry) => {
          if (entry.slug === skill.slug) {
            revalidatePath(entry.href);
          }
        });

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
        if (error instanceof Error) {
          return Response.json({ error: error.message }, { status: 400 });
        }

        return Response.json({ error: "Unable to create automation." }, { status: 400 });
      }
    }
  );
}
