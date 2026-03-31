import { requireAuth, authErrorResponse } from "@/lib/auth";
import { getSkillBySlug } from "@/lib/db/skills";
import { findSkillAuthorForSession } from "@/lib/db/skill-authors";
import { uploadIcon, validateIconFile, updateSkillIconUrl } from "@/lib/icon-storage";
import { canSessionEditSkill } from "@/lib/skill-authoring";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await requireAuth();
    const sessionAuthor = await findSkillAuthorForSession(session);
    const { slug } = await params;

    const skill = await getSkillBySlug(slug);
    if (!skill) {
      return Response.json({ error: "Skill not found." }, { status: 404 });
    }

    if (!canSessionEditSkill(skill, session, sessionAuthor)) {
      return Response.json(
        { error: "Only the skill author or an admin can change the icon." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("icon") as File | null;
    if (!file) {
      return Response.json({ error: "Missing 'icon' file field." }, { status: 400 });
    }

    const validationError = validateIconFile(file);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const { publicUrl } = await uploadIcon("skills", slug, file);
    await updateSkillIconUrl(slug, publicUrl);

    return Response.json({ ok: true, iconUrl: publicUrl });
  } catch (error) {
    const authResp = authErrorResponse(error);
    if (authResp) return authResp;
    console.error("[skill-icon] Upload failed:", error);
    return Response.json(
      { error: "Icon upload failed." },
      { status: 500 }
    );
  }
}
