import { getAdminEmails, normalizeAdminEmail } from "@/lib/admin";
import type { SessionUser } from "@/lib/auth";
import type { SkillAuthorRecord, SkillRecord } from "@/lib/types";

export function canSessionEditSkill(
  skill: Pick<SkillRecord, "authorId" | "creatorClerkUserId">,
  session: SessionUser | null,
  sessionAuthor: SkillAuthorRecord | null
): boolean {
  if (!session) {
    return false;
  }

  const normalizedEmail = normalizeAdminEmail(session.email);
  if (getAdminEmails().includes(normalizedEmail)) {
    return true;
  }

  if (skill.authorId && sessionAuthor?.id === skill.authorId) {
    return true;
  }

  return skill.creatorClerkUserId === session.userId;
}

export function getSkillPublisherName(skill: Pick<SkillRecord, "author" | "ownerName">): string {
  return skill.author?.displayName ?? skill.ownerName ?? "Community";
}
