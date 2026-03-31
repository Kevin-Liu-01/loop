import { revalidatePath } from "next/cache";

import { authErrorResponse, requireAuth } from "@/lib/auth";
import { getSkillRecordBySlug } from "@/lib/content";
import { deleteSkill } from "@/lib/db/skills";
import { findSkillAuthorForSession } from "@/lib/db/skill-authors";
import { canSessionEditSkill } from "@/lib/skill-authoring";
import {
  buildUserSkillRecord,
  saveUserSkillDocuments,
  skillRecordToUserDoc,
  updateUserSkillDocument,
  updateUserSkillInputSchema
} from "@/lib/user-skills";
import { logUsageEvent, withApiUsage } from "@/lib/usage-server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withApiUsage(
    {
      route: "/api/skills/[slug]",
      method: "PATCH",
      label: "Author edit skill"
    },
    async () => {
      try {
        const session = await requireAuth();
        const sessionAuthor = await findSkillAuthorForSession(session);
        const { slug } = await params;
        const skill = await getSkillRecordBySlug(slug);

        if (!skill) {
          return Response.json({ error: "Skill not found." }, { status: 404 });
        }

        if (!canSessionEditSkill(skill, session, sessionAuthor)) {
          return Response.json(
            { error: "Only the skill author or an admin can edit this skill." },
            { status: 403 }
          );
        }

        const payload = updateUserSkillInputSchema.parse({
          ...(await request.json()),
          slug
        });

        const result = updateUserSkillDocument(skillRecordToUserDoc(skill), payload);
        if (result.changed) {
          await saveUserSkillDocuments([result.skill]);
        }

        const record = buildUserSkillRecord(result.skill);

        revalidatePath("/");
        revalidatePath("/admin");
        revalidatePath("/skills/new");
        revalidatePath(`/categories/${skill.category}`);
        revalidatePath(`/categories/${result.skill.category}`);
        revalidatePath(`/skills/${slug}`);
        revalidatePath(record.href);

        await logUsageEvent({
          kind: "skill_save",
          source: "api",
          label: result.changed ? "Edited published skill" : "Checked published skill",
          path: record.href,
          skillSlug: result.skill.slug,
          categorySlug: result.skill.category,
          details: result.changed ? `Saved ${record.href}` : "No setup change"
        });

        return Response.json({
          ok: true,
          slug: result.skill.slug,
          href: record.href,
          changed: result.changed
        });
      } catch (error) {
        const authResp = authErrorResponse(error);
        if (authResp) return authResp;

        if (error instanceof Error) {
          return Response.json({ error: error.message }, { status: 400 });
        }

        return Response.json({ error: "Unable to update skill." }, { status: 400 });
      }
    }
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withApiUsage(
    {
      route: "/api/skills/[slug]",
      method: "DELETE",
      label: "Delete skill"
    },
    async () => {
      try {
        const session = await requireAuth();
        const sessionAuthor = await findSkillAuthorForSession(session);
        const { slug } = await params;
        const skill = await getSkillRecordBySlug(slug);

        if (!skill) {
          return Response.json({ error: "Skill not found." }, { status: 404 });
        }

        if (!canSessionEditSkill(skill, session, sessionAuthor)) {
          return Response.json(
            { error: "Only the skill author or an admin can delete this skill." },
            { status: 403 }
          );
        }

        await deleteSkill(slug);

        revalidatePath("/");
        revalidatePath("/admin");
        revalidatePath("/skills/new");
        revalidatePath(`/categories/${skill.category}`);
        revalidatePath(`/skills/${slug}`);
        revalidatePath(skill.href);

        await logUsageEvent({
          kind: "skill_delete",
          source: "api",
          label: "Deleted skill",
          path: skill.href,
          skillSlug: slug,
          categorySlug: skill.category,
          details: `Deleted ${skill.title}`
        });

        return Response.json({ ok: true, slug });
      } catch (error) {
        const authResp = authErrorResponse(error);
        if (authResp) return authResp;

        if (error instanceof Error) {
          return Response.json({ error: error.message }, { status: 400 });
        }

        return Response.json({ error: "Unable to delete skill." }, { status: 400 });
      }
    }
  );
}
