import { getUserSubscription } from "@/lib/auth";
import { countUserSkills } from "@/lib/db/skills";
import { listLoopRuns } from "@/lib/system-state";
import type { SkillAutomationState, UserSkillCadence } from "@/lib/types";

export const FREE_SKILL_LIMIT = 2;

export const MANUAL_UPDATE_COOLDOWN_MS = 15 * 60 * 1000;

export const AUTOMATION_PROXIMITY_MS = 60 * 60 * 1000;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function cadenceIntervalMs(cadence: UserSkillCadence): number | null {
  if (cadence === "daily") return MS_PER_DAY;
  if (cadence === "weekly") return 7 * MS_PER_DAY;
  return null;
}

export async function canCreateSkill(
  clerkUserId: string
): Promise<{ allowed: boolean; currentCount: number; limit: number; isOperator: boolean }> {
  const [currentCount, subscription] = await Promise.all([
    countUserSkills(clerkUserId),
    getUserSubscription(clerkUserId),
  ]);
  const isOperator = subscription !== null;
  const limit = FREE_SKILL_LIMIT;
  const allowed = isOperator || currentCount < limit;
  return { allowed, currentCount, limit, isOperator };
}

export async function getManualUpdateCooldown(slug: string): Promise<{
  allowed: boolean;
  remainingMs: number;
  lastRunAt: string | null;
}> {
  const runs = await listLoopRuns();
  const lastManual = runs.find(
    (run) => run.slug === slug && run.trigger === "manual"
  );
  if (!lastManual) {
    return { allowed: true, remainingMs: 0, lastRunAt: null };
  }
  const lastRunAt = lastManual.startedAt;
  const elapsed = Date.now() - Date.parse(lastRunAt);
  if (Number.isNaN(elapsed) || elapsed >= MANUAL_UPDATE_COOLDOWN_MS) {
    return { allowed: true, remainingMs: 0, lastRunAt };
  }
  const remainingMs = MANUAL_UPDATE_COOLDOWN_MS - elapsed;
  return { allowed: false, remainingMs, lastRunAt };
}

export function isAutomationImminent(
  automation: SkillAutomationState | undefined
): { imminent: boolean; nextRunAt: string | null } {
  if (!automation?.enabled || automation.status !== "active") {
    return { imminent: false, nextRunAt: null };
  }
  const intervalMs = cadenceIntervalMs(automation.cadence);
  if (intervalMs === null) {
    return { imminent: false, nextRunAt: null };
  }
  const lastRunIso = automation.lastRunAt;
  if (!lastRunIso) {
    return { imminent: false, nextRunAt: null };
  }
  const lastMs = Date.parse(lastRunIso);
  if (Number.isNaN(lastMs)) {
    return { imminent: false, nextRunAt: null };
  }
  const nextMs = lastMs + intervalMs;
  const nextRunAt = new Date(nextMs).toISOString();
  const now = Date.now();
  if (nextMs <= now) {
    return { imminent: true, nextRunAt };
  }
  if (nextMs - now <= AUTOMATION_PROXIMITY_MS) {
    return { imminent: true, nextRunAt };
  }
  return { imminent: false, nextRunAt };
}
