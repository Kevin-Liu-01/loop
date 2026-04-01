import { revalidatePath } from "next/cache";
import { z } from "zod";

import { authErrorResponse, requireAuth } from "@/lib/auth";
import { getSkillRecordBySlug } from "@/lib/content";
import { createSkill as dbCreateSkill } from "@/lib/db/skills";
import { findSkillAuthorForSession } from "@/lib/db/skill-authors";
import { buildSkillVersionHref, buildVersionLabel } from "@/lib/format";
import { canCreateSkill } from "@/lib/skill-limits";
import { slugify, stableHash } from "@/lib/markdown";
import { buildPausedAutomationFromSource } from "@/lib/skill-fork-helpers";
import { logUsageEvent, withApiUsage } from "@/lib/usage-server";

const bodySchema = z.object({
  slug: z.string().min(1).max(120),
});

export async function POST(request: Request) {
  return withApiUsage(
    { route: "/api/skills/copy", method: "POST", label: "Copy skill" },
    async () => {
      try {
        const session = await requireAuth();
        const sessionAuthor = await findSkillAuthorForSession(session);
        const { slug: sourceSlug } = bodySchema.parse(await request.json());

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

        const source = await getSkillRecordBySlug(sourceSlug);
        if (!source) {
          return Response.json({ error: "Source skill not found." }, { status: 404 });
        }

        const baseSlug = `${slugify(source.title)}-copy` || `skill-${stableHash(source.title)}-copy`;
        let newSlug = baseSlug;
        let attempt = 0;
        while (await getSkillRecordBySlug(newSlug)) {
          attempt++;
          newSlug = `${baseSlug}-${attempt}`;
        }

        const created = await dbCreateSkill({
          slug: newSlug,
          title: `${source.title} (Copy)`,
          description: source.description,
          category: source.category,
          body: source.body,
          accent: source.accent,
          visibility: "private",
          origin: "user",
          tags: source.tags,
          ownerName: sessionAuthor?.displayName ?? undefined,
          authorId: sessionAuthor?.id,
          sources: source.sources ?? [],
          automation: buildPausedAutomationFromSource(source),
          updates: [],
          agentDocs: source.agentDocs,
          references: source.references,
          agents: source.agents,
          version: 1,
          creatorClerkUserId: session.userId,
          iconUrl: source.iconUrl,
          forkedFromSlug: sourceSlug,
        });

        const href = buildSkillVersionHref(newSlug, 1);

        revalidatePath("/");
        revalidatePath(`/skills/${newSlug}`);
        revalidatePath(href);

        await logUsageEvent({
          kind: "skill_create",
          source: "api",
          label: "Copied skill",
          path: href,
          skillSlug: newSlug,
          categorySlug: source.category,
          details: `Forked from ${sourceSlug}`,
        });

        return Response.json({
          ok: true,
          slug: newSlug,
          href,
          forkedFrom: sourceSlug,
        });
      } catch (error) {
        const authResp = authErrorResponse(error);
        if (authResp) return authResp;

        if (error instanceof Error) {
          return Response.json({ error: error.message }, { status: 400 });
        }
        return Response.json({ error: "Unable to copy skill." }, { status: 400 });
      }
    }
  );
}
