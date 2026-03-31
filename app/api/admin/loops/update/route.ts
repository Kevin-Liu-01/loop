import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { z } from "zod";

import { requireAuth, AuthError, type SessionUser } from "@/lib/auth";
import { getManualUpdateCooldown, isAutomationImminent } from "@/lib/skill-limits";
import { getSkillBySlug } from "@/lib/db/skills";
import { findSkillAuthorForSession } from "@/lib/db/skill-authors";
import { buildImportedSkillDraft, buildImportedSkillRecord, createNextImportedSkillVersion, fetchRemoteText, listImportedSkills, saveImportedSkills } from "@/lib/imports";
import { buildLoopUpdateSourceLog, buildLoopUpdateTarget } from "@/lib/loop-updates";
import { runTrackedUserSkillUpdate } from "@/lib/refresh";
import { canSessionEditSkill } from "@/lib/skill-authoring";
import { diffMultilineText } from "@/lib/text-diff";
import { listUserSkillDocuments, saveUserSkillDocuments } from "@/lib/user-skills";
import { recordLoopRun } from "@/lib/system-state";
import { logUsageEvent, withApiUsage } from "@/lib/usage-server";
import type { DailySignal, ImportedSkillDocument, LoopRunRecord, LoopUpdateResult, LoopUpdateSourceLog, LoopUpdateStreamEvent, SourceDefinition } from "@/lib/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  slug: z.string().min(1),
  origin: z.enum(["user", "remote"])
});

function sendEvent(controller: ReadableStreamDefaultController<Uint8Array>, encoder: TextEncoder, event: LoopUpdateStreamEvent) {
  controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
}

function buildImportedNoopRefresh(skill: ImportedSkillDocument, lastSyncedAt?: string): ImportedSkillDocument {
  const latestVersionNumber = Math.max(...skill.versions.map((version) => version.version));

  return {
    ...skill,
    lastSyncedAt,
    versions: skill.versions.map((version) =>
      version.version === latestVersionNumber
        ? {
            ...version,
            lastSyncedAt
          }
        : version
    )
  };
}

async function runUserLoopUpdate(
  slug: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder
): Promise<void> {
  const skills = await listUserSkillDocuments();
  const skill = skills.find((entry) => entry.slug === slug);

  if (!skill) {
    throw new Error("This loop could not be found in the local user store.");
  }

  if (skill.sources.length === 0) {
    throw new Error("This loop does not have any tracked sources yet.");
  }

  const cycle = await runTrackedUserSkillUpdate(skill, "manual", {
    onStart(loop) {
      sendEvent(controller, encoder, {
        type: "start",
        loop
      });
    },
    onSource(source) {
      sendEvent(controller, encoder, {
        type: "source",
        source
      });
    },
    onMessage(message) {
      sendEvent(controller, encoder, {
        type: "analysis",
        message
      });
    },
    onReasoningStep(step) {
      sendEvent(controller, encoder, {
        type: "reasoning-step",
        step
      });
    }
  });

  await saveUserSkillDocuments(skills.map((entry) => (entry.slug === slug ? cycle.nextSkill : entry)));
  await recordLoopRun(cycle.loopRun);
  await logUsageEvent({
    kind: "skill_refresh",
    source: "api",
    label: "Refreshed skill",
    path: cycle.result.href,
    skillSlug: cycle.result.slug,
    categorySlug: cycle.nextSkill.category,
    details: cycle.result.changed ? cycle.result.nextVersionLabel : "No diff"
  });

  sendEvent(controller, encoder, {
    type: "complete",
    result: cycle.result,
    sources: cycle.sourceLogs
  });
}

function importedSkillChanged(current: ImportedSkillDocument, incoming: ImportedSkillDocument): boolean {
  const latest = current.versions.find((version) => version.version === current.version) ?? current.versions[0];

  return (
    latest.title !== incoming.title ||
    latest.description !== incoming.description ||
    latest.category !== incoming.category ||
    latest.body !== incoming.body ||
    latest.canonicalUrl !== incoming.canonicalUrl ||
    latest.ownerName !== incoming.ownerName ||
    JSON.stringify(latest.tags) !== JSON.stringify(incoming.tags)
  );
}

function buildImportedSourceLog(source: SourceDefinition, items: DailySignal[], note: string): LoopUpdateSourceLog {
  return {
    ...buildLoopUpdateSourceLog(source, "done"),
    itemCount: items.length,
    items,
    note
  };
}

async function assertManualUpdateAccess(
  session: SessionUser,
  slug: string,
  origin: "user" | "remote"
): Promise<void> {
  const sessionAuthor = await findSkillAuthorForSession(session);

  if (origin === "user") {
    const skill = await getSkillBySlug(slug);
    if (!skill) {
      throw new Error("This loop could not be found in the local user store.");
    }

    if (!canSessionEditSkill(skill, session, sessionAuthor)) {
      throw new AuthError("Only the skill owner can trigger manual refreshes.", 403);
    }

    return;
  }

  if (!canSessionEditSkill({ authorId: undefined, creatorClerkUserId: undefined }, session, null)) {
    throw new AuthError(
      "Track the skill or use the owner account before triggering manual refreshes.",
      403
    );
  }
}

async function runImportedLoopUpdate(
  slug: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder
): Promise<void> {
  const startedAt = new Date().toISOString();
  const importedSkills = await listImportedSkills();
  const skill = importedSkills.find((entry) => entry.slug === slug);

  if (!skill) {
    throw new Error("This imported loop could not be found.");
  }

  const beforeRecord = buildImportedSkillRecord(skill);
  const target = buildLoopUpdateTarget(beforeRecord);
  const canonicalSource = beforeRecord.sources?.[0];

  if (!canonicalSource) {
    throw new Error("This imported loop does not expose a canonical source.");
  }

  sendEvent(controller, encoder, {
    type: "start",
    loop: target
  });

  const running = {
    ...buildLoopUpdateSourceLog(canonicalSource, "running"),
    note: "Fetching remote source."
  } satisfies LoopUpdateSourceLog;
  sendEvent(controller, encoder, {
    type: "source",
    source: running
  });

  const { raw, normalizedUrl } = await fetchRemoteText(skill.canonicalUrl);
  const refreshed = buildImportedSkillDraft(raw, normalizedUrl, new Date());
  const logItems: DailySignal[] = [
    {
      title: refreshed.title,
      url: refreshed.canonicalUrl,
      source: canonicalSource.label,
      publishedAt: refreshed.updatedAt,
      summary: refreshed.description,
      tags: refreshed.tags
    }
  ];
  const fetchedSourceLog = buildImportedSourceLog(
    canonicalSource,
    logItems,
    `Fetched ${raw.length.toLocaleString()} bytes from the canonical source.`
  );
  sendEvent(controller, encoder, {
    type: "source",
    source: fetchedSourceLog
  });

  sendEvent(controller, encoder, {
    type: "analysis",
    message: "Comparing the fetched source against the current imported loop revision."
  });

  const changed = importedSkillChanged(skill, refreshed);
  const nextSkill = changed
    ? createNextImportedSkillVersion(
        skill,
        {
          title: refreshed.title,
          description: refreshed.description,
          category: refreshed.category,
          body: refreshed.body,
          sourceUrl: refreshed.sourceUrl,
          canonicalUrl: refreshed.canonicalUrl,
          ownerName: refreshed.ownerName,
          tags: refreshed.tags,
          visibility: refreshed.visibility,
          syncEnabled: refreshed.syncEnabled,
          lastSyncedAt: refreshed.lastSyncedAt
        },
        refreshed.updatedAt
      )
    : buildImportedNoopRefresh(skill, refreshed.lastSyncedAt);

  await saveImportedSkills(importedSkills.map((entry) => (entry.slug === slug ? nextSkill : entry)));

  const afterRecord = buildImportedSkillRecord(nextSkill);
  const result: LoopUpdateResult = {
    slug,
    title: afterRecord.title,
    origin: "remote",
    changed,
    previousVersionLabel: beforeRecord.versionLabel,
    nextVersionLabel: afterRecord.versionLabel,
    updatedAt: afterRecord.updatedAt,
    href: afterRecord.href,
    diffLines: diffMultilineText(beforeRecord.body, afterRecord.body),
    summary: changed
      ? `A fresh imported revision landed from ${canonicalSource.label}.`
      : `No structural diff landed from ${canonicalSource.label}.`,
    whatChanged: changed
      ? `The imported loop content changed and a new version was minted.`
      : `The source was fetched successfully, but the imported loop body stayed materially the same.`,
    items: logItems
  };

  const loopRun: LoopRunRecord = {
    id: randomUUID(),
    slug,
    title: afterRecord.title,
    origin: "remote",
    trigger: "manual",
    status: "success",
    startedAt,
    finishedAt: new Date().toISOString(),
    previousVersionLabel: beforeRecord.versionLabel,
    nextVersionLabel: afterRecord.versionLabel,
    href: afterRecord.href,
    summary: result.summary,
    whatChanged: result.whatChanged,
    bodyChanged: changed,
    changedSections: changed ? ["Canonical import"] : [],
    editorModel: "canonical-import",
    sourceCount: 1,
    signalCount: logItems.length,
    messages: [
      "Fetched the canonical source.",
      changed ? "Detected a structural diff against the current imported revision." : "No structural diff detected.",
      changed ? `Saved ${afterRecord.versionLabel}.` : `Kept ${afterRecord.versionLabel}.`
    ],
    sources: [fetchedSourceLog],
    diffLines: result.diffLines.slice(0, 120)
  };

  await recordLoopRun(loopRun);
  await logUsageEvent({
    kind: "skill_refresh",
    source: "api",
    label: "Refreshed imported skill",
    path: afterRecord.href,
    skillSlug: afterRecord.slug,
    categorySlug: afterRecord.category,
    details: changed ? afterRecord.versionLabel : "No diff"
  });

  sendEvent(controller, encoder, {
    type: "complete",
    result,
    sources: [fetchedSourceLog]
  });
}

export async function POST(request: Request) {
  return withApiUsage(
    {
      route: "/api/admin/loops/update",
      method: "POST",
      label: "Manual loop update"
    },
    async () => {
      let session: SessionUser;
      try {
        session = await requireAuth();
      } catch (error) {
        if (error instanceof AuthError) {
          return NextResponse.json({ error: error.message }, { status: error.status });
        }
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const payload = bodySchema.safeParse(await request.json());
      if (!payload.success) {
        return NextResponse.json({ error: "Invalid update payload." }, { status: 400 });
      }

      try {
        await assertManualUpdateAccess(session, payload.data.slug, payload.data.origin);
      } catch (error) {
        if (error instanceof AuthError) {
          return NextResponse.json({ error: error.message }, { status: error.status });
        }
        if (error instanceof Error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const cooldown = await getManualUpdateCooldown(payload.data.slug);
      if (!cooldown.allowed) {
        const minutesLeft = Math.ceil(cooldown.remainingMs / 60_000);
        return NextResponse.json(
          { error: `Manual updates are rate-limited. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.` },
          { status: 429 }
        );
      }

      const skill = payload.data.origin === "user"
        ? await getSkillBySlug(payload.data.slug)
        : null;
      const automationWarning = skill?.automation
        ? isAutomationImminent(skill.automation)
        : { imminent: false, nextRunAt: null };

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
            if (payload.data.origin === "user") {
              await runUserLoopUpdate(payload.data.slug, controller, encoder);
            } else {
              await runImportedLoopUpdate(payload.data.slug, controller, encoder);
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : "Manual loop update failed.";
            await recordLoopRun({
              id: randomUUID(),
              slug: payload.data.slug,
              title: payload.data.slug,
              origin: payload.data.origin,
              trigger: "manual",
              status: "error",
              startedAt,
              finishedAt: new Date().toISOString(),
              changedSections: [],
              sourceCount: 0,
              signalCount: 0,
              messages: [message],
              sources: [],
              diffLines: [],
              errorMessage: message
            });
            sendEvent(controller, encoder, {
              type: "error",
              message
            });
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
