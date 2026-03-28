import { notFound } from "next/navigation";

import { SkillDetailPage } from "@/components/skill-detail-page";
import { getSkillRecordBySlug } from "@/lib/content";
import { getBrief, parseVersionSegment } from "@/lib/format";
import { getSkillwireSnapshot } from "@/lib/refresh";
import { readSystemStateStore } from "@/lib/system-state";
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

  const [snapshot, skill, previousSkill, systemState] = await Promise.all([
    getSkillwireSnapshot(),
    getSkillRecordBySlug(slug, versionNumber),
    versionNumber > 1 ? getSkillRecordBySlug(slug, versionNumber - 1) : Promise.resolve(null),
    readSystemStateStore()
  ]);

  if (!skill) {
    notFound();
  }

  const brief = getBrief(snapshot.dailyBriefs, skill.category);
  const latestRun =
    systemState.loopRuns.find(
      (run) => run.slug === skill.slug && run.origin === (skill.origin === "remote" ? "remote" : "user")
    ) ?? null;
  const usage = buildSkillUsageSummary(skill.slug, systemState.usageEvents, systemState.loopRuns);

  return (
    <SkillDetailPage
      brief={brief}
      latestRun={latestRun}
      previousSkill={previousSkill}
      skill={skill}
      usage={usage}
    />
  );
}
