import { revalidatePath } from "next/cache";

import { getLocalSnapshotBase } from "@/lib/content";
import { refreshSkillwireSnapshot } from "@/lib/refresh";
import { logUsageEvent, withApiUsage } from "@/lib/usage-server";
import {
  addUserSkill,
  buildUserSkillRecord,
  createUserSkillDocument,
  createUserSkillInputSchema,
  listUserSkillDocuments,
  saveUserSkillDocuments,
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
        const payload = createUserSkillInputSchema.parse(await request.json());
        const draft = createUserSkillDocument(payload);
        const snapshot = await getLocalSnapshotBase();

        if (snapshot.skills.some((skill) => skill.slug === draft.slug)) {
          return Response.json(
            {
              error: `The slug "${draft.slug}" is already taken. Rename the skill title and try again.`
            },
            { status: 409 }
          );
        }

        const created = await addUserSkill(payload);
        const createdRecord = buildUserSkillRecord(created);
        await refreshSkillwireSnapshot({
          writeLocal: true,
          uploadBlob: false,
          forceFresh: true,
          refreshCategorySignals: false,
          refreshUserSkills: true,
          focusSkillSlugs: [created.slug]
        });

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
        const payload = updateUserSkillInputSchema.parse(await request.json());
        const skills = await listUserSkillDocuments();
        const current = skills.find((skill) => skill.slug === payload.slug);

        if (!current) {
          return Response.json({ error: "That tracked skill could not be found." }, { status: 404 });
        }

        const result = updateUserSkillDocument(current, payload);
        if (result.changed) {
          await saveUserSkillDocuments(skills.map((skill) => (skill.slug === payload.slug ? result.skill : skill)));
        }

        const record = buildUserSkillRecord(result.skill);
        await refreshSkillwireSnapshot({
          writeLocal: true,
          uploadBlob: false,
          forceFresh: true,
          refreshCategorySignals: false,
          refreshUserSkills: false,
          refreshImportedSkills: false,
          focusSkillSlugs: [result.skill.slug]
        });

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
        if (error instanceof Error) {
          return Response.json({ error: error.message }, { status: 400 });
        }

        return Response.json({ error: "Unable to update skill." }, { status: 400 });
      }
    }
  );
}
