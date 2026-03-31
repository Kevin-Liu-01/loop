import { revalidatePath } from "next/cache";

import { authErrorResponse, requireAuth } from "@/lib/auth";
import { getSkillCatalogue, getSkillRecordBySlug } from "@/lib/content";
import { findSkillAuthorForSession } from "@/lib/db/skill-authors";
import { canSessionEditSkill } from "@/lib/skill-authoring";
import { canCreateSkill } from "@/lib/skill-limits";
import { logUsageEvent, withApiUsage } from "@/lib/usage-server";
import {
  addUserSkill,
  buildUserSkillRecord,
  createUserSkillDocument,
  createUserSkillInputSchema,
  listUserSkillDocuments,
  saveUserSkillDocuments,
  skillRecordToUserDoc,
  updateUserSkillDocument,
  updateUserSkillInputSchema
} from "@/lib/user-skills";

export async function GET() {
  return withApiUsage(
    {
      route: "/api/skills",
      method: "GET",
      label: "List user skills"
    },
    async () => {
      const skills = await listUserSkillDocuments();

      return Response.json({
        ok: true,
        count: skills.length,
        skills: skills.map((skill) => ({
          slug: skill.slug,
          title: skill.title,
          category: skill.category,
          updatedAt: skill.updatedAt,
          ownerName: skill.ownerName ?? null,
          automation: skill.automation
        }))
      });
    }
  );
}

export async function POST(request: Request) {
  return withApiUsage(
    {
      route: "/api/skills",
      method: "POST",
      label: "Create skill"
    },
    async () => {
      try {
        const session = await requireAuth();
        const sessionAuthor = await findSkillAuthorForSession(session);
        const payload = createUserSkillInputSchema.parse(await request.json());
        const limits = await canCreateSkill(session.userId);
        if (!limits.allowed) {
          return Response.json(
            {
              error: `Free accounts can create up to ${limits.limit} skills. Upgrade to Operator to create more.`,
              currentCount: limits.currentCount,
              limit: limits.limit,
              isOperator: limits.isOperator
            },
            { status: 403 }
          );
        }
        const draft = createUserSkillDocument(payload);
        const catalogue = await getSkillCatalogue();

        if (catalogue.skills.some((skill) => skill.slug === draft.slug)) {
          return Response.json(
            {
              error: `The slug "${draft.slug}" is already taken. Rename the skill title and try again.`
            },
            { status: 409 }
          );
        }

        const created = await addUserSkill(payload, {
          creatorClerkUserId: session.userId,
          authorId: sessionAuthor?.id,
          ownerName: sessionAuthor?.displayName ?? payload.ownerName
        });
        const createdRecord = buildUserSkillRecord(created);

        revalidatePath("/");
        revalidatePath("/skills/new");
        revalidatePath(`/categories/${created.category}`);
        revalidatePath(`/skills/${created.slug}`);
        revalidatePath(createdRecord.href);

        await logUsageEvent({
          kind: "skill_create",
          source: "api",
          label: "Created skill",
          path: createdRecord.href,
          skillSlug: created.slug,
          categorySlug: created.category,
          details: created.title
        });

        return Response.json({
          ok: true,
          slug: created.slug,
          href: createdRecord.href
        });
      } catch (error) {
        const authResp = authErrorResponse(error);
        if (authResp) return authResp;

        if (error instanceof Error) {
          return Response.json({ error: error.message }, { status: 400 });
        }

        return Response.json({ error: "Unable to create skill." }, { status: 400 });
      }
    }
  );
}

export async function PATCH(request: Request) {
  return withApiUsage(
    {
      route: "/api/skills",
      method: "PATCH",
      label: "Save skill setup"
    },
    async () => {
      try {
        const session = await requireAuth();
        const sessionAuthor = await findSkillAuthorForSession(session);
        const payload = updateUserSkillInputSchema.parse(await request.json());
        const current = await getSkillRecordBySlug(payload.slug);

        if (!current) {
          return Response.json({ error: "That tracked skill could not be found." }, { status: 404 });
        }

        if (!canSessionEditSkill(current, session, sessionAuthor)) {
          return Response.json(
            { error: "Only the skill author or an admin can edit this skill." },
            { status: 403 }
          );
        }

        const result = updateUserSkillDocument(skillRecordToUserDoc(current), payload);
        if (result.changed) {
          await saveUserSkillDocuments([result.skill]);
        }

        const record = buildUserSkillRecord(result.skill);

        revalidatePath("/");
        revalidatePath("/admin");
        revalidatePath("/skills/new");
        revalidatePath(`/categories/${current.category}`);
        revalidatePath(`/categories/${result.skill.category}`);
        revalidatePath(`/skills/${current.slug}`);
        revalidatePath(record.href);

        await logUsageEvent({
          kind: "skill_save",
          source: "api",
          label: result.changed ? "Saved skill setup" : "Checked skill setup",
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
