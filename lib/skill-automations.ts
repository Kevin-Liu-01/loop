import { DEFAULT_PREFERRED_HOUR } from "@/lib/automation-constants";
import { formatScheduleLabel } from "@/lib/schedule";
import type { AutomationSummary, SkillRecord } from "@/lib/types";

type SkillAutomationSource = Pick<
  SkillRecord,
  "slug" | "title" | "origin" | "automation" | "automations"
>;

export function buildSkillAutomationSummaries(
  skill: SkillAutomationSource,
): AutomationSummary[] {
  const builtIn: AutomationSummary[] =
    skill.origin === "user" && skill.automation
      ? [
          {
            id: skill.slug,
            name: `${skill.title} refresh`,
            prompt: skill.automation.prompt,
            schedule: formatScheduleLabel(skill.automation.cadence, skill.automation.preferredHour ?? DEFAULT_PREFERRED_HOUR, skill.automation.preferredDay),
            cadence: skill.automation.cadence,
            status: skill.automation.status === "paused" ? "PAUSED" : "ACTIVE",
            path: "",
            cwd: [],
            matchedSkillSlugs: [skill.slug],
            matchedCategorySlugs: [],
            preferredModel: skill.automation.preferredModel,
            preferredHour: skill.automation.preferredHour,
            preferredDay: skill.automation.preferredDay,
          },
        ]
      : [];

  return [...builtIn, ...skill.automations];
}
