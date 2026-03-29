import type { LoopRunRecord, SkillRecord } from "@/lib/types";
import type { StatusDotTone } from "@/components/ui/status-dot";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

export type FreshnessInfo = {
  tone: StatusDotTone;
  label: string;
};

export function computeFreshness(
  skill: SkillRecord,
  loopRuns: LoopRunRecord[]
): FreshnessInfo {
  const latestRun = loopRuns.find((run) => run.slug === skill.slug);

  if (latestRun?.status === "error") {
    return { tone: "error", label: "Last update failed" };
  }

  if (skill.origin !== "user") {
    return { tone: "idle", label: "Catalog skill" };
  }

  const ageMs = Date.now() - new Date(skill.updatedAt).valueOf();

  if (skill.automation?.enabled && skill.automation.status === "active") {
    const cadenceMs =
      skill.automation.cadence === "daily" ? ONE_DAY_MS : SEVEN_DAYS_MS;
    const overdue = skill.automation.lastRunAt
      ? Date.now() - new Date(skill.automation.lastRunAt).valueOf() >= cadenceMs
      : true;

    if (overdue) {
      return { tone: "stale", label: "Update due" };
    }
    return { tone: "fresh", label: "Up to date" };
  }

  if (ageMs < ONE_DAY_MS) {
    return { tone: "fresh", label: "Updated recently" };
  }

  if (ageMs < SEVEN_DAYS_MS) {
    return { tone: "idle", label: "No automation" };
  }

  return { tone: "stale", label: "Stale" };
}
