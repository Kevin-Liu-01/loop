import { revalidatePath } from "next/cache";

import { z } from "zod";

import { authErrorResponse, requireAuth } from "@/lib/auth";
import { getSkillCatalogue } from "@/lib/content";
import { logUsageEvent, withApiUsage } from "@/lib/usage-server";
import { addTrackedSkillFromRecord, buildUserSkillRecord } from "@/lib/user-skills";

const bodySchema = z.object({
  slug: z.string().min(1)
});

export async function POST(request: Request) {
  return withApiUsage(
    {
      route: "/api/skills/track",
      method: "POST",
      label: "Track skill"
    },
    async () => {
      try {
        await requireAuth();
        const payload = bodySchema.parse(await request.json());
        const base = await getSkillCatalogue();
        const skill = base.skills.find((entry) => entry.slug === payload.slug);

        if (!skill) {
          return Response.json({ error: "That skill could not be found." }, { status: 404 });
        }

        if (skill.origin === "user") {
          return Response.json({
            ok: true,
            slug: skill.slug,
            href: skill.href,
            created: false
          });
        }

        const skillSources = skill.sources ?? [];
        const hasOwnSources = skillSources.length > 0;
        const category = base.categories.find((entry) => entry.slug === skill.category);
        const sourcesToTrack = hasOwnSources
          ? skillSources
          : (category?.sources ?? []);
        const tracked = await addTrackedSkillFromRecord(skill, sourcesToTrack);
        const record = buildUserSkillRecord(tracked);

        revalidatePath("/");
        revalidatePath("/admin");
        revalidatePath("/skills/new");
        revalidatePath(`/categories/${tracked.category}`);
        revalidatePath(`/skills/${tracked.slug}`);
        revalidatePath(record.href);

        await logUsageEvent({
          kind: "skill_track",
          source: "api",
          label: "Tracked skill",
          path: record.href,
          skillSlug: tracked.slug,
          categorySlug: tracked.category,
          details: tracked.title
        });

        return Response.json({
          ok: true,
          slug: tracked.slug,
          href: record.href,
          created: true
        });
      } catch (error) {
        const authResp = authErrorResponse(error);
        if (authResp) return authResp;

        if (error instanceof Error) {
          return Response.json({ error: error.message }, { status: 400 });
        }

        return Response.json({ error: "Unable to make this skill updateable." }, { status: 400 });
      }
    }
  );
}
