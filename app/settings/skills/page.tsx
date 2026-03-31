import { SettingsSectionPage } from "@/components/settings-section-page";
import { SettingsSkillsOverview } from "@/components/settings-skills-overview";
import { getSessionUser } from "@/lib/auth";
import { findSkillAuthorForSession } from "@/lib/db/skill-authors";
import { getUsageTimeZoneFromCookie } from "@/lib/server/usage-timezone-cookie";
import { canSessionEditSkill } from "@/lib/skill-authoring";
import { listLoopRuns } from "@/lib/system-state";
import { getSystemSnapshot } from "@/lib/system-summary";

export const dynamic = "force-dynamic";

export default async function SettingsSkillsPage() {
  const timeZone = await getUsageTimeZoneFromCookie();
  const [session, { snapshot }, loopRuns] = await Promise.all([
    getSessionUser(),
    getSystemSnapshot({ timeZone, includePrivate: true }),
    listLoopRuns({ limit: 200 })
  ]);

  const sessionAuthor = session ? await findSkillAuthorForSession(session) : null;

  const userSkills = snapshot.skills.filter(
    (skill) => skill.origin === "user" && canSessionEditSkill(skill, session, sessionAuthor)
  );

  const latestRunBySlug = new Map<string, (typeof loopRuns)[number]>();
  for (const run of loopRuns) {
    if (!latestRunBySlug.has(run.slug)) {
      latestRunBySlug.set(run.slug, run);
    }
  }

  return (
    <SettingsSectionPage sectionId="skills">
      <SettingsSkillsOverview
        latestRuns={Object.fromEntries(latestRunBySlug)}
        skills={userSkills}
      />
    </SettingsSectionPage>
  );
}
