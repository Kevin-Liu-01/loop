import { notFound } from "next/navigation";

import { SkillDetailPage } from "@/components/skill-detail-page";
import { getSessionUser } from "@/lib/auth";
import { getSkillRecordBySlug } from "@/lib/content";
import { findSkillAuthorForSession } from "@/lib/db/skill-authors";
import { listSkillUpstreams } from "@/lib/db/skill-intelligence";
import { getBrief, parseVersionSegment } from "@/lib/format";
import { hasUserPurchasedSkill } from "@/lib/purchases";
import { getLoopSnapshot } from "@/lib/refresh";
import { canSessionEditSkill, canViewPrivateSkill } from "@/lib/skill-authoring";
import { listLoopRuns, listUsageEvents } from "@/lib/system-state";
import { buildSkillUsageSummary } from "@/lib/usage";

type VersionedSkillPageProps = {
  params: Promise<{
    slug: string;
    version: string;
  }>;
};

export default async function VersionedSkillPage({ params }: VersionedSkillPageProps) {
  const { slug, version } = await params;
  const versionNumber = parseVersionSegment(version);

  if (!versionNumber) {
    notFound();
  }

  const [session, snapshot, skill, previousSkill, loopRuns, usageEvents] = await Promise.all([
    getSessionUser(),
    getLoopSnapshot(),
    getSkillRecordBySlug(slug, versionNumber),
    versionNumber > 1 ? getSkillRecordBySlug(slug, versionNumber - 1) : Promise.resolve(null),
    listLoopRuns(),
    listUsageEvents()
  ]);

  if (!skill) {
    notFound();
  }

  const sessionAuthor = session ? await findSkillAuthorForSession(session) : null;

  if (!canViewPrivateSkill(skill, session, sessionAuthor)) {
    notFound();
  }

  const upstreams = await listSkillUpstreams(skill.slug);

  const purchased = session?.userId ? await hasUserPurchasedSkill(session.userId, slug) : false;
  const canEdit = canSessionEditSkill(skill, session, sessionAuthor);

  const brief = getBrief(snapshot.dailyBriefs, skill.category);
  const latestRun =
    loopRuns.find(
      (run) => run.slug === skill.slug && run.origin === (skill.origin === "remote" ? "remote" : "user")
    ) ?? null;
  const usage = buildSkillUsageSummary(skill.slug, usageEvents, loopRuns);

  return (
    <SkillDetailPage
      brief={brief}
      canEdit={canEdit}
      isSignedIn={!!session}
      latestRun={latestRun}
      previousSkill={previousSkill}
      purchased={purchased || canEdit}
      skill={{ ...skill, upstreams }}
      usage={usage}
    />
  );
}
