import { listSkills } from "@/lib/db/skills";
import { listMcps } from "@/lib/db/mcps";
import { buildSkillAutomationSummaries } from "@/lib/skill-automations";
import type { AutomationSummary, SkillRecord } from "@/lib/types";
import type { LandingMcpRow } from "@/lib/home-landing/landing-data";

export type LandingData = {
  skills: SkillRecord[];
  mcps: LandingMcpRow[];
  automations: AutomationSummary[];
};

export async function fetchLandingData(): Promise<LandingData> {
  const [allSkills, allMcps] = await Promise.all([
    listSkills({ visibility: "public" }).catch(() => [] as SkillRecord[]),
    listMcps().catch(() => []),
  ]);

  const skills = allSkills
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);

  const automations = allSkills.flatMap((s) => buildSkillAutomationSummaries(s));

  const mcps: LandingMcpRow[] = allMcps.slice(0, 10).map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    transport: m.transport,
    iconUrl: m.iconUrl,
    homepageUrl: m.homepageUrl,
  }));

  return { skills, mcps, automations };
}
