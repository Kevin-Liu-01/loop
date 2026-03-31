import { skillCadenceToRRule } from "@/lib/automation-constants";
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
            schedule: skillCadenceToRRule(skill.automation.cadence),
            status: skill.automation.status === "paused" ? "PAUSED" : "ACTIVE",
            path: "",
            cwd: [],
            matchedSkillSlugs: [skill.slug],
            matchedCategorySlugs: [],
          },
        ]
      : [];

  return [...builtIn, ...skill.automations];
}
