import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { authErrorResponse, requireAuth } from "@/lib/auth";
import { getSkillRecordBySlug } from "@/lib/content";
import { findSkillAuthorForSession } from "@/lib/db/skill-authors";
import { runTrackedUserSkillUpdate } from "@/lib/refresh";
import { canSessionEditSkill } from "@/lib/skill-authoring";
import { getManualUpdateCooldown, isAutomationImminent } from "@/lib/skill-limits";
import { recordLoopRun } from "@/lib/system-state";
import {
  applyUserEditsToSkill,
  buildUserSkillRecord,
  saveUserSkillDocuments,
  skillRecordToUserDoc,
  updateUserSkillInputSchema
} from "@/lib/user-skills";
import { logUsageEvent, withApiUsage } from "@/lib/usage-server";
import type { LoopUpdateStreamEvent } from "@/lib/types";

export const maxDuration = 300;

function sendEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  event: LoopUpdateStreamEvent
) {
  controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withApiUsage(
    {
      route: "/api/skills/[slug]/refresh",
      method: "POST",
      label: "Fused save + refresh"
    },
    async () => {
      let session;
      try {
        session = await requireAuth();
      } catch (error) {
        const authResp = authErrorResponse(error);
        if (authResp) return authResp;
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { slug } = await params;
      const sessionAuthor = await findSkillAuthorForSession(session);
      const skillRecord = await getSkillRecordBySlug(slug);

      if (!skillRecord) {
        return Response.json({ error: "Skill not found." }, { status: 404 });
      }

      if (!canSessionEditSkill(skillRecord, session, sessionAuthor)) {
        return Response.json(
          { error: "Only the skill author or an admin can refresh this skill." },
          { status: 403 }
        );
      }

      const cooldown = await getManualUpdateCooldown(slug);
      if (!cooldown.allowed) {
        const minutesLeft = Math.ceil(cooldown.remainingMs / 60_000);
        return Response.json(
          { error: `Manual updates are rate-limited. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.` },
          { status: 429 }
        );
      }

      let body: Record<string, unknown>;
      try {
        body = await request.json() as Record<string, unknown>;
      } catch {
        return Response.json({ error: "Invalid JSON body." }, { status: 400 });
      }

      const parseResult = updateUserSkillInputSchema.safeParse({ ...body, slug });
      if (!parseResult.success) {
        return Response.json(
          { error: "Validation failed.", details: parseResult.error.issues },
          { status: 400 }
        );
      }

      const currentSkill = skillRecordToUserDoc(skillRecord);
      const { skill: editedSkill } = applyUserEditsToSkill(currentSkill, parseResult.data);

      if (editedSkill.sources.length === 0) {
        return Response.json(
          { error: "This skill does not have any tracked sources yet." },
          { status: 400 }
        );
      }

      const automationWarning = isAutomationImminent(editedSkill.automation);

      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          const startedAt = new Date().toISOString();
          try {
            if (automationWarning.imminent) {
              sendEvent(controller, encoder, {
                type: "analysis",
                message: `Heads up: a scheduled automation is due ${automationWarning.nextRunAt ? "at " + new Date(automationWarning.nextRunAt).toLocaleString() : "soon"}. This manual run will take its place.`
              });
            }

            sendEvent(controller, encoder, {
              type: "analysis",
              message: "Applying author edits and running refresh."
            });

            const cycle = await runTrackedUserSkillUpdate(editedSkill, "manual", {
              onStart(loop) {
                sendEvent(controller, encoder, { type: "start", loop });
              },
              onSource(source) {
                sendEvent(controller, encoder, { type: "source", source });
              },
              onMessage(message) {
                sendEvent(controller, encoder, { type: "analysis", message });
              },
              onReasoningStep(step) {
                sendEvent(controller, encoder, { type: "reasoning-step", step });
              }
            });

            await saveUserSkillDocuments([cycle.nextSkill]);

            try {
              await recordLoopRun(cycle.loopRun);
            } catch (recordError) {
              console.error(`[skills/refresh] Failed to record loop run for "${slug}":`, recordError);
            }

            try {
              revalidatePath("/");
              revalidatePath("/admin");
              revalidatePath("/skills/new");
              revalidatePath(`/categories/${currentSkill.category}`);
              revalidatePath(`/categories/${cycle.nextSkill.category}`);
              revalidatePath(`/skills/${slug}`);
              revalidatePath(cycle.result.href);
            } catch (revalidateError) {
              console.error("[skills/refresh] Cache revalidation failed:", revalidateError);
            }

            try {
              await logUsageEvent({
                kind: "skill_refresh",
                source: "api",
                label: "Fused save + refresh",
                path: cycle.result.href,
                skillSlug: slug,
                categorySlug: cycle.nextSkill.category,
                details: cycle.result.changed ? cycle.result.nextVersionLabel : "No diff"
              });
            } catch (usageError) {
              console.error(`[skills/refresh] Failed to log usage event for "${slug}":`, usageError);
            }

            sendEvent(controller, encoder, {
              type: "complete",
              result: cycle.result,
              sources: cycle.sourceLogs
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : "Save + refresh failed.";
            try {
              await recordLoopRun({
                id: randomUUID(),
                slug,
                title: editedSkill.title,
                origin: "user",
                trigger: "manual",
                status: "error",
                startedAt,
                finishedAt: new Date().toISOString(),
                changedSections: [],
                sourceCount: editedSkill.sources.length,
                signalCount: 0,
                messages: [message],
                sources: [],
                diffLines: [],
                errorMessage: message
              });
            } catch (recordError) {
              console.error(`[skills/refresh] Failed to record error loop run for "${slug}":`, recordError);
            }
            sendEvent(controller, encoder, { type: "error", message });
          } finally {
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          "content-type": "application/x-ndjson; charset=utf-8",
          "cache-control": "no-store"
        }
      });
    }
  );
}
