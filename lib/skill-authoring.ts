import { getAdminEmails, normalizeAdminEmail } from "@/lib/admin";
import type { SessionUser } from "@/lib/auth";
import type { SkillAuthorRecord, SkillRecord } from "@/lib/types";

export function isAdminSession(session: SessionUser | null): boolean {
  if (!session) return false;
  return getAdminEmails().includes(normalizeAdminEmail(session.email));
}

export function canSessionEditSkill(
  skill: Pick<SkillRecord, "authorId" | "creatorClerkUserId">,
  session: SessionUser | null,
  sessionAuthor: SkillAuthorRecord | null
): boolean {
  if (!session) {
    return false;
  }

  if (isAdminSession(session)) {
    return true;
  }

  if (skill.authorId && sessionAuthor?.id === skill.authorId) {
    return true;
  }

  return skill.creatorClerkUserId === session.userId;
}

export function canViewPrivateSkill(
  skill: Pick<SkillRecord, "visibility" | "authorId" | "creatorClerkUserId">,
  session: SessionUser | null,
  sessionAuthor: SkillAuthorRecord | null
): boolean {
  if (skill.visibility === "public") return true;
  if (skill.visibility === "member" && session) return true;
  return canSessionEditSkill(skill, session, sessionAuthor);
}

export function getSkillPublisherName(skill: Pick<SkillRecord, "author" | "ownerName">): string {
  return skill.author?.displayName ?? skill.ownerName ?? "Community";
}
