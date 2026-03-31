import { AutomationManager } from "@/components/automation-manager";
import { SettingsSectionPage } from "@/components/settings-section-page";
import { getSessionUser } from "@/lib/auth";
import { findSkillAuthorForSession } from "@/lib/db/skill-authors";
import { getUsageTimeZoneFromCookie } from "@/lib/server/usage-timezone-cookie";
import { canSessionEditSkill } from "@/lib/skill-authoring";
import { getSystemSnapshot } from "@/lib/system-summary";

export const dynamic = "force-dynamic";

export default async function SettingsAutomationsPage() {
  const timeZone = await getUsageTimeZoneFromCookie();
  const [session, { snapshot }] = await Promise.all([
    getSessionUser(),
    getSystemSnapshot({ timeZone, includePrivate: true })
  ]);
  const sessionAuthor = session ? await findSkillAuthorForSession(session) : null;
  const manageableSkillSlugs = snapshot.skills
    .filter((skill) => canSessionEditSkill(skill, session, sessionAuthor))
    .map((skill) => skill.slug);

  return (
    <SettingsSectionPage sectionId="automations">
      <AutomationManager
        automations={snapshot.automations}
        manageableSkillSlugs={manageableSkillSlugs}
        skills={snapshot.skills}
      />
    </SettingsSectionPage>
  );
}
