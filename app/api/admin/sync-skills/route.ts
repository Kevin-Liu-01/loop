import { NextResponse } from "next/server";

import { requireAuth, AuthError, type SessionUser } from "@/lib/auth";
import { isAdminSession } from "@/lib/skill-authoring";
import { getSkillBySlug, updateSkill } from "@/lib/db/skills";
import { SEED_SKILL_DEFINITIONS } from "@/lib/db/seed-data/skill-definitions";

export const runtime = "nodejs";

type SyncItemResult = {
  slug: string;
  status: "updated" | "skipped" | "not_found" | "error";
  changes?: string[];
  error?: string;
};

async function syncOneSkill(
  def: (typeof SEED_SKILL_DEFINITIONS)[number]
): Promise<SyncItemResult> {
  const existing = await getSkillBySlug(def.slug);

  if (!existing) {
    return { slug: def.slug, status: "not_found" };
  }

  const bodyChanged = existing.body !== def.body;
  const docsChanged =
    JSON.stringify(existing.agentDocs) !== JSON.stringify(def.agentDocs ?? {});
  const descChanged = existing.description !== def.description;
  const tagsChanged =
    JSON.stringify(existing.tags) !== JSON.stringify(def.tags ?? []);

  if (!bodyChanged && !docsChanged && !descChanged && !tagsChanged) {
    return { slug: def.slug, status: "skipped" };
  }

  const changes: string[] = [];
  if (bodyChanged) changes.push("body");
  if (docsChanged) changes.push("agent_docs");
  if (descChanged) changes.push("description");
  if (tagsChanged) changes.push("tags");

  await updateSkill(def.slug, {
    body: def.body,
    description: def.description,
    tags: def.tags,
    agentDocs: def.agentDocs ?? {},
  });

  return { slug: def.slug, status: "updated", changes };
}

export async function POST() {
  let session: SessionUser;
  try {
    session = await requireAuth();
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminSession(session)) {
    return NextResponse.json(
      { error: "Only admins can sync seed skill content." },
      { status: 403 }
    );
  }

  const results: SyncItemResult[] = [];

  for (const def of SEED_SKILL_DEFINITIONS) {
    try {
      const result = await syncOneSkill(def);
      results.push(result);
    } catch (err) {
      results.push({
        slug: def.slug,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const summary = {
    total: SEED_SKILL_DEFINITIONS.length,
    updated: results.filter((r) => r.status === "updated").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    notFound: results.filter((r) => r.status === "not_found").length,
    errors: results.filter((r) => r.status === "error").length,
  };

  return NextResponse.json({ summary, results });
}
