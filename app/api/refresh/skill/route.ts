import { handleCallback } from "@vercel/queue";

import { buildFailedLoopRun, runTrackedUserSkillUpdate } from "@/lib/refresh";
import { recordLoopRun } from "@/lib/system-state";
import { logUsageEvent } from "@/lib/usage-server";
import { listUserSkillDocuments, saveUserSkillDocuments } from "@/lib/user-skills";
import type { SkillRefreshMessage } from "@/lib/queues";

export const maxDuration = 300;

export const POST = handleCallback<SkillRefreshMessage>(
  async (message, metadata) => {
    const { slug, trigger } = message;
    console.info(`[skill-worker] Processing "${slug}" (delivery ${metadata.deliveryCount})`);

    const skills = await listUserSkillDocuments();
    const skill = skills.find((entry) => entry.slug === slug);

    if (!skill) {
      console.warn(`[skill-worker] Skill "${slug}" not found – acknowledging to avoid retry`);
      return;
    }

    if (skill.sources.length === 0) {
      console.warn(`[skill-worker] Skill "${slug}" has no sources – skipping`);
      return;
    }

    const startedAt = new Date().toISOString();

    try {
      const cycle = await runTrackedUserSkillUpdate(skill, trigger);

      const successSkill = {
        ...cycle.nextSkill,
        automation: { ...cycle.nextSkill.automation, consecutiveFailures: 0 }
      };

      await saveUserSkillDocuments([successSkill]);

      try {
        await recordLoopRun(cycle.loopRun);
      } catch (recordError) {
        console.error(`[skill-worker] Failed to record loop run for "${slug}":`, recordError);
      }

      await logUsageEvent({
        kind: "skill_refresh",
        source: "api",
        label: "Automated skill refresh (queue)",
        path: cycle.result.href,
        skillSlug: slug,
        categorySlug: cycle.nextSkill.category,
        details: cycle.result.changed ? cycle.result.nextVersionLabel : "No diff"
      });

      console.info(`[skill-worker] Completed "${slug}" – ${cycle.result.changed ? cycle.result.nextVersionLabel : "no diff"}`);
    } catch (error) {
      const failedAt = new Date().toISOString();
      const errorMessage = error instanceof Error
        ? error.message
        : "Agent automation failed before a new revision could be saved.";

      const failures = (skill.automation.consecutiveFailures ?? 0) + 1;
      await saveUserSkillDocuments([{
        ...skill,
        automation: { ...skill.automation, lastRunAt: failedAt, consecutiveFailures: failures }
      }]);

      try {
        await recordLoopRun(buildFailedLoopRun(skill, trigger, startedAt, errorMessage));
      } catch (recordError) {
        console.error(`[skill-worker] Failed to record error loop run for "${slug}":`, recordError);
      }

      console.error(`[skill-worker] Failed "${slug}" (attempt ${metadata.deliveryCount}):`, errorMessage);

      if (failures >= 3) {
        console.warn(`[skill-worker] Skill "${slug}" hit ${failures} consecutive failures – acknowledging to stop retries`);
        return;
      }

      throw error;
    }
  },
  {
    visibilityTimeoutSeconds: 600,
    retry: (_error, metadata) => {
      if (metadata.deliveryCount > 2) return { acknowledge: true };
      const delay = Math.min(120, 2 ** metadata.deliveryCount * 15);
      return { afterSeconds: delay };
    }
  }
);
