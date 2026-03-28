import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

import { getLocalSnapshotBase, readLocalSnapshotFile, writeLocalSnapshotFile } from "@/lib/content";
import { buildImportedSkillRecord, listImportedSkills, saveImportedSkills, syncImportedSkill } from "@/lib/imports";
import { buildLoopUpdateSourceLog, buildLoopUpdateTarget } from "@/lib/loop-updates";
import { persistSearchIndex } from "@/lib/search";
import { fetchSignals } from "@/lib/source-signals";
import { recordLoopRun, recordRefreshRun } from "@/lib/system-state";
import { diffMultilineText } from "@/lib/text-diff";
import { buildUpdateDigest } from "@/lib/update-digest";
import {
  buildUserSkillRecord,
  createNextUserSkillVersion,
  isUserSkillAutomationDue,
  listUserSkillDocuments,
  saveUserSkillDocuments
} from "@/lib/user-skills";
import type {
  CategoryBrief,
  CategorySlug,
  DailySignal,
  LoopRunRecord,
  LoopUpdateResult,
  LoopUpdateSourceLog,
  LoopUpdateTarget,
  SkillUpdateEntry,
  SkillwireSnapshot,
  UserSkillDocument
} from "@/lib/types";

const SIGNAL_SCHEMA = z.object({
  summary: z.string(),
  whatChanged: z.string(),
  experiments: z.array(z.string()).min(2).max(3)
});

const SKILL_REVISION_SCHEMA = z.object({
  summary: z.string(),
  whatChanged: z.string(),
  experiments: z.array(z.string()).min(2).max(3),
  revisedDescription: z.string().min(16).max(220),
  revisedBody: z.string().min(40),
  changedSections: z.array(z.string()).min(1).max(6)
});

type RefreshOptions = {
  writeLocal?: boolean;
  uploadBlob?: boolean;
  forceFresh?: boolean;
  refreshCategorySignals?: boolean;
  refreshUserSkills?: boolean;
  refreshImportedSkills?: boolean;
  focusSkillSlugs?: string[];
  focusImportedSkillSlugs?: string[];
};

type SkillRevisionDraft = {
  update: SkillUpdateEntry;
  nextBody: string;
  nextDescription: string;
  bodyChanged: boolean;
  changedSections: string[];
  editorModel: string;
};

type UserSkillRefreshHooks = {
  onStart?: (loop: LoopUpdateTarget) => void;
  onSource?: (source: LoopUpdateSourceLog) => void;
  onMessage?: (message: string) => void;
};

export type UserSkillRefreshCycle = {
  nextSkill: UserSkillDocument;
  update: SkillUpdateEntry;
  result: LoopUpdateResult;
  sourceLogs: LoopUpdateSourceLog[];
  messages: string[];
  loopRun: LoopRunRecord;
};

const DEFAULT_SKILL_EDITOR_MODEL = process.env.SKILLWIRE_MODEL ?? "gpt-5-mini";

function replaceManagedSection(body: string, sectionTitle: string, sectionBody: string): string {
  const trimmed = body.trim();
  const escapedTitle = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sectionPattern = new RegExp(`\\n## ${escapedTitle}\\n[\\s\\S]*?(?=\\n## |$)`, "m");
  const replacement = `\n## ${sectionTitle}\n${sectionBody.trim()}\n`;

  if (sectionPattern.test(trimmed)) {
    return trimmed.replace(sectionPattern, replacement).trim();
  }

  return `${trimmed}\n\n## ${sectionTitle}\n${sectionBody.trim()}`.trim();
}

function applyFallbackSkillBodyEdit(skill: UserSkillDocument, update: SkillUpdateEntry): {
  nextBody: string;
  changedSections: string[];
} {
  const sectionLines = [
    update.whatChanged,
    "",
    "### Fresh signals",
    ...(update.items.length > 0
      ? update.items.slice(0, 4).map((item) => `- [${item.title}](${item.url}) · ${item.source}`)
      : ["- No fresh signals landed in this pass."]),
    "",
    "### Next edits",
    ...update.experiments.map((experiment) => `- ${experiment}`)
  ];

  return {
    nextBody: replaceManagedSection(skill.body, "Research-backed changes", sectionLines.join("\n")),
    changedSections: ["Research-backed changes"]
  };
}

function fallbackBrief(slug: CategorySlug, title: string, items: DailySignal[]): CategoryBrief {
  const topItems = items.slice(0, 4);
  const joinedTitles = topItems.map((item) => item.title).join("; ");

  return {
    slug,
    title,
    summary:
      topItems.length > 0
        ? `Fresh signals came in from ${Array.from(new Set(topItems.map((item) => item.source))).join(", ")}. ${joinedTitles}`
        : `No fresh remote signals landed, so the category is holding on local skill context and the last known radar.`,
    whatChanged:
      topItems.length > 0
        ? `The lead shift today is ${topItems[0]?.title ?? "a general source update"}, which is worth folding into the working playbook.`
        : `No major source delta was detected in this refresh window.`,
    experiments:
      topItems.length > 0
        ? [
            `Turn ${topItems[0]?.title ?? "the lead item"} into a local skill delta.`,
            `Draft one new prompt recipe from ${topItems[1]?.source ?? "today's sources"}.`,
            `Publish one public-facing brief with links back to the canonical sources.`
          ]
        : [
            `Review the canonical skill and tighten one stale section.`,
            `Add one higher-signal source to the watchlist.`,
            `Run the refresh route again after source access is configured.`
          ],
    items: topItems,
    generatedAt: new Date().toISOString()
  };
}

function fallbackSkillUpdate(skill: UserSkillDocument, items: DailySignal[]): SkillUpdateEntry {
  const topItems = items.slice(0, 4);
  const headline = topItems[0]?.title ?? "No fresh signal";

  return {
    generatedAt: new Date().toISOString(),
    summary:
      topItems.length > 0
        ? `${skill.title} now tracks ${headline} and ${Math.max(topItems.length - 1, 0)} other fresh signals.`
        : `${skill.title} held steady in this pass. No fresh remote signal landed, so the skill kept its last known posture.`,
    whatChanged:
      topItems.length > 0
        ? `The biggest delta is ${headline}. Fold the concrete changes into the operating notes, then discard the fluff.`
        : "No watchlist delta was detected. The automation ran anyway so the skill log stays honest instead of pretending silence is novelty.",
    experiments:
      topItems.length > 0
        ? [
            `Add one new tactic based on ${headline}.`,
            `Rewrite one stale section with today’s source language.`,
            `Turn the top signal into a reusable agent prompt.`
          ]
        : [
            "Tighten one ambiguous instruction.",
            "Swap in a higher-signal source.",
            "Run the next refresh after the source list changes."
          ],
    items: topItems
  };
}

function sortSignals(items: DailySignal[]): DailySignal[] {
  return items
    .slice()
    .sort((left, right) => +new Date(right.publishedAt) - +new Date(left.publishedAt));
}

function buildFailedLoopRun(
  skill: Pick<UserSkillDocument, "slug" | "title" | "sources" | "version">,
  trigger: LoopRunRecord["trigger"],
  startedAt: string,
  errorMessage: string
): LoopRunRecord {
  return {
    id: randomUUID(),
    slug: skill.slug,
    title: skill.title,
    origin: "user",
    trigger,
    status: "error",
    startedAt,
    finishedAt: new Date().toISOString(),
    previousVersionLabel: `v${skill.version}`,
    nextVersionLabel: `v${skill.version}`,
    changedSections: [],
    sourceCount: skill.sources.length,
    signalCount: 0,
    messages: [
      `Started scanning ${skill.sources.length} sources.`,
      errorMessage
    ],
    sources: skill.sources.map((source) => ({
      ...buildLoopUpdateSourceLog(source, "error"),
      note: errorMessage
    })),
    diffLines: [],
    errorMessage
  };
}

async function synthesizeBrief(slug: CategorySlug, title: string, items: DailySignal[]): Promise<CategoryBrief> {
  if (items.length === 0 || !process.env.OPENAI_API_KEY) {
    return fallbackBrief(slug, title, items);
  }

  try {
    const prompt = [
      `You are building a terse editorial daily briefing for the ${title} category of a skills product.`,
      "Summarize the concrete shifts only.",
      "Return a crisp summary, one what-changed paragraph, and 2-3 experiments.",
      "",
      ...items.map(
        (item, index) =>
          `${index + 1}. ${item.title} | ${item.source} | ${item.publishedAt} | ${item.summary || "No summary"}`
      )
    ].join("\n");

    const result = await generateObject({
      model: openai(process.env.SKILLWIRE_MODEL ?? "gpt-5-mini"),
      schema: SIGNAL_SCHEMA,
      prompt
    });

    return {
      slug,
      title,
      summary: result.object.summary,
      whatChanged: result.object.whatChanged,
      experiments: result.object.experiments,
      items: items.slice(0, 4),
      generatedAt: new Date().toISOString()
    };
  } catch {
    return fallbackBrief(slug, title, items);
  }
}

export async function synthesizeSkillUpdate(skill: UserSkillDocument, items: DailySignal[]): Promise<SkillRevisionDraft> {
  const generatedAt = new Date().toISOString();
  const topItems = items.slice(0, 4);
  const fallbackUpdate = fallbackSkillUpdate(skill, items);
  const fallbackEdit = applyFallbackSkillBodyEdit(skill, {
    ...fallbackUpdate,
    generatedAt
  });
  const fallbackBodyChanged = fallbackEdit.nextBody.trim() !== skill.body.trim();
  const fallbackDraft: SkillRevisionDraft = {
    update: {
      ...fallbackUpdate,
      generatedAt,
      bodyChanged: fallbackBodyChanged,
      changedSections: fallbackEdit.changedSections,
      editorModel: "heuristic-fallback"
    },
    nextBody: fallbackEdit.nextBody,
    nextDescription: fallbackUpdate.summary,
    bodyChanged: fallbackBodyChanged,
    changedSections: fallbackEdit.changedSections,
    editorModel: "heuristic-fallback"
  };

  if (items.length === 0 || !process.env.OPENAI_API_KEY) {
    return fallbackDraft;
  }

  try {
    const prompt = [
      `You are operating an autonomous skill editor for a user-authored skill titled "${skill.title}".`,
      "Your job is to inspect the latest external signals and rewrite the skill body where necessary.",
      "Preserve the intent and existing structure unless the sources justify a concrete edit.",
      "Do not add fake claims or fake sources.",
      "Do not include update-engine, recent-log, or observability sections in the rewritten body. The product adds those automatically.",
      "Keep the writing terse, operational, and copy-pasteable for agents.",
      `Current skill description: ${skill.description}`,
      `Automation instruction: ${skill.automation.prompt}`,
      "Current skill body:",
      skill.body,
      "",
      "Latest signals:",
      ...items.map(
        (item, index) =>
          `${index + 1}. ${item.title} | ${item.source} | ${item.publishedAt} | ${item.summary || "No summary"}`
      )
    ].join("\n");

    const result = await generateObject({
      model: openai(DEFAULT_SKILL_EDITOR_MODEL),
      schema: SKILL_REVISION_SCHEMA,
      prompt
    });

    const normalizedBody = result.object.revisedBody.trim();
    const normalizedDescription = result.object.revisedDescription.trim();
    const normalizedSections = Array.from(
      new Set(result.object.changedSections.map((section) => section.trim()).filter(Boolean))
    ).slice(0, 6);
    const bodyChanged = normalizedBody !== skill.body.trim();
    const nextBody = bodyChanged ? normalizedBody : fallbackEdit.nextBody;
    const changedSections = bodyChanged ? normalizedSections : fallbackEdit.changedSections;
    const finalBodyChanged = nextBody.trim() !== skill.body.trim();

    return {
      update: {
        generatedAt,
        summary: result.object.summary,
        whatChanged: result.object.whatChanged,
        experiments: result.object.experiments,
        items: topItems,
        bodyChanged: finalBodyChanged,
        changedSections,
        editorModel: DEFAULT_SKILL_EDITOR_MODEL
      },
      nextBody,
      nextDescription: normalizedDescription,
      bodyChanged: finalBodyChanged,
      changedSections,
      editorModel: DEFAULT_SKILL_EDITOR_MODEL
    };
  } catch {
    return fallbackDraft;
  }
}

export async function runTrackedUserSkillUpdate(
  skill: UserSkillDocument,
  trigger: LoopRunRecord["trigger"],
  hooks: UserSkillRefreshHooks = {}
): Promise<UserSkillRefreshCycle> {
  const startedAt = new Date().toISOString();
  const beforeRecord = buildUserSkillRecord(skill);
  const target = buildLoopUpdateTarget(beforeRecord);
  const messages: string[] = [];
  let sourceLogs = skill.sources.map((source) => buildLoopUpdateSourceLog(source, "pending"));

  hooks.onStart?.(target);
  messages.push(`Started scanning ${skill.sources.length} sources.`);
  hooks.onMessage?.(messages[messages.length - 1] ?? "");

  for (const source of skill.sources) {
    const running: LoopUpdateSourceLog = {
      ...buildLoopUpdateSourceLog(source, "running"),
      note: "Scanning source."
    };
    sourceLogs = sourceLogs.map((entry) => (entry.id === running.id ? running : entry));
    hooks.onSource?.(running);
    messages.push(`${running.label}: ${running.note}`);
    hooks.onMessage?.(messages[messages.length - 1] ?? "");

    const items = await fetchSignals(source);
    const completed: LoopUpdateSourceLog = {
      ...running,
      status: "done",
      itemCount: items.length,
      items,
      note: items.length > 0 ? `${items.length} fresh signals captured.` : "No fresh signals found."
    };
    sourceLogs = sourceLogs.map((entry) => (entry.id === completed.id ? completed : entry));
    hooks.onSource?.(completed);
    messages.push(`${completed.label}: ${completed.note}`);
    hooks.onMessage?.(messages[messages.length - 1] ?? "");
  }

  messages.push("Agent is rewriting the skill body from the fetched source deltas.");
  hooks.onMessage?.(messages[messages.length - 1] ?? "");

  const flattened = sortSignals(sourceLogs.flatMap((entry) => entry.items));
  const draft = await synthesizeSkillUpdate(skill, flattened);
  const nextUpdatedAt = draft.update.generatedAt;
  const nextSkill = createNextUserSkillVersion(
    skill,
    {
      title: skill.title,
      description: draft.nextDescription,
      category: skill.category,
      body: draft.nextBody,
      ownerName: skill.ownerName,
      tags: skill.tags,
      visibility: skill.visibility,
      sources: skill.sources,
      automation: {
        ...skill.automation,
        lastRunAt: nextUpdatedAt
      },
      updates: [draft.update, ...skill.updates].slice(0, 8)
    },
    nextUpdatedAt
  );

  const afterRecord = buildUserSkillRecord(nextSkill);
  const updateDiff = diffMultilineText(buildUpdateDigest(skill.updates[0]), buildUpdateDigest(draft.update));
  const bodyDiff = diffMultilineText(beforeRecord.body, afterRecord.body);
  const diffLines = draft.bodyChanged ? bodyDiff : updateDiff.length > 0 ? updateDiff : bodyDiff;
  const result: LoopUpdateResult = {
    slug: skill.slug,
    title: afterRecord.title,
    origin: "user",
    changed: true,
    previousVersionLabel: beforeRecord.versionLabel,
    nextVersionLabel: afterRecord.versionLabel,
    updatedAt: afterRecord.updatedAt,
    href: afterRecord.href,
    diffLines,
    summary: draft.update.summary,
    whatChanged: draft.update.whatChanged,
    experiments: draft.update.experiments,
    items: draft.update.items.slice(0, 4),
    changedSections: draft.changedSections,
    bodyChanged: draft.bodyChanged,
    editorModel: draft.editorModel
  };

  messages.push(
    draft.bodyChanged
      ? `${afterRecord.versionLabel} is live with body edits.`
      : `${afterRecord.versionLabel} is live with summary and log updates.`
  );
  hooks.onMessage?.(messages[messages.length - 1] ?? "");

  const loopRun: LoopRunRecord = {
    id: randomUUID(),
    slug: skill.slug,
    title: skill.title,
    origin: "user",
    trigger,
    status: "success",
    startedAt,
    finishedAt: new Date().toISOString(),
    previousVersionLabel: beforeRecord.versionLabel,
    nextVersionLabel: afterRecord.versionLabel,
    href: afterRecord.href,
    summary: draft.update.summary,
    whatChanged: draft.update.whatChanged,
    bodyChanged: draft.bodyChanged,
    changedSections: draft.changedSections,
    editorModel: draft.editorModel,
    sourceCount: sourceLogs.length,
    signalCount: flattened.length,
    messages,
    sources: sourceLogs.map((source) => ({
      ...source,
      items: source.items.slice(0, 3)
    })),
    diffLines: diffLines.slice(0, 120)
  };

  return {
    nextSkill,
    update: draft.update,
    result,
    sourceLogs,
    messages,
    loopRun
  };
}

async function refreshTrackedUserSkills(options: RefreshOptions): Promise<void> {
  const skills = await listUserSkillDocuments();
  const focusSet = options.focusSkillSlugs ? new Set(options.focusSkillSlugs) : null;
  const now = new Date();
  let didChange = false;
  const loopRuns: LoopRunRecord[] = [];

  const refreshedSkills = await Promise.all(
    skills.map(async (skill) => {
      const canRefresh = skill.automation.enabled && skill.automation.status === "active" && skill.sources.length > 0;

      if (focusSet && !focusSet.has(skill.slug)) {
        return skill;
      }

      if ((focusSet && !canRefresh) || (!focusSet && !isUserSkillAutomationDue(skill, now))) {
        return skill;
      }

      try {
        const cycle = await runTrackedUserSkillUpdate(skill, "automation");
        didChange = true;
        loopRuns.push(cycle.loopRun);

        return cycle.nextSkill;
      } catch (error) {
        loopRuns.push(
          buildFailedLoopRun(
            skill,
            "automation",
            new Date().toISOString(),
            error instanceof Error ? error.message : "Agent automation failed before a new revision could be saved."
          )
        );
        return skill;
      }
    })
  );

  if (didChange || loopRuns.length > 0) {
    await saveUserSkillDocuments(refreshedSkills);
    await Promise.all(loopRuns.map((run) => recordLoopRun(run)));
  }
}

async function refreshTrackedImportedSkills(options: RefreshOptions): Promise<void> {
  const importedSkills = await listImportedSkills();
  const focusSet = options.focusImportedSkillSlugs ? new Set(options.focusImportedSkillSlugs) : null;
  let shouldSave = false;
  const loopRuns: LoopRunRecord[] = [];

  const nextSkills = await Promise.all(
    importedSkills.map(async (skill) => {
      if (!skill.syncEnabled) {
        return skill;
      }

      if (focusSet && !focusSet.has(skill.slug)) {
        return skill;
      }

      if (!focusSet && skill.lastSyncedAt) {
        const elapsedMs = Date.now() - new Date(skill.lastSyncedAt).valueOf();
        if (elapsedMs < 24 * 60 * 60 * 1000) {
          return skill;
        }
      }

      const startedAt = new Date().toISOString();
      const beforeRecord = buildImportedSkillRecord(skill);
      const canonicalSource = beforeRecord.sources?.[0];

      try {
        const refreshed = await syncImportedSkill(skill);
        const afterRecord = buildImportedSkillRecord(refreshed);
        const changed = afterRecord.version !== beforeRecord.version;
        const bodyChanged = beforeRecord.body !== afterRecord.body;
        const sourceLog = canonicalSource
          ? {
              ...buildLoopUpdateSourceLog(canonicalSource, "done"),
              itemCount: 1,
              items: [
                {
                  title: afterRecord.title,
                  url: canonicalSource.url,
                  source: canonicalSource.label,
                  publishedAt: afterRecord.updatedAt,
                  summary: afterRecord.description,
                  tags: afterRecord.tags
                }
              ],
              note: changed
                ? "Canonical source changed and a new imported revision was created."
                : "Canonical source fetched cleanly. No structural diff landed."
            }
          : null;

        loopRuns.push({
          id: randomUUID(),
          slug: skill.slug,
          title: afterRecord.title,
          origin: "remote",
          trigger: "import-sync",
          status: "success",
          startedAt,
          finishedAt: new Date().toISOString(),
          previousVersionLabel: beforeRecord.versionLabel,
          nextVersionLabel: afterRecord.versionLabel,
          href: afterRecord.href,
          summary: changed
            ? `Fetched the canonical source and minted ${afterRecord.versionLabel}.`
            : `Fetched the canonical source and kept ${afterRecord.versionLabel}.`,
          whatChanged: changed
            ? "The imported source changed enough to warrant a new saved revision."
            : "The canonical source was reachable, but the imported body stayed materially the same.",
          bodyChanged,
          changedSections: bodyChanged ? ["Canonical import"] : [],
          editorModel: "canonical-import",
          sourceCount: canonicalSource ? 1 : 0,
          signalCount: sourceLog?.items.length ?? 0,
          messages: [
            "Fetched the canonical source.",
            changed ? "Detected a structural diff against the current imported revision." : "No structural diff detected.",
            changed ? `Saved ${afterRecord.versionLabel}.` : `Kept ${afterRecord.versionLabel}.`
          ],
          sources: sourceLog ? [sourceLog] : [],
          diffLines: diffMultilineText(beforeRecord.body, afterRecord.body).slice(0, 120)
        });

        if (
          refreshed.version !== skill.version ||
          refreshed.updatedAt !== skill.updatedAt ||
          refreshed.lastSyncedAt !== skill.lastSyncedAt
        ) {
          shouldSave = true;
        }
        return refreshed;
      } catch (error) {
        loopRuns.push({
          id: randomUUID(),
          slug: skill.slug,
          title: skill.title,
          origin: "remote",
          trigger: "import-sync",
          status: "error",
          startedAt,
          finishedAt: new Date().toISOString(),
          previousVersionLabel: beforeRecord.versionLabel,
          nextVersionLabel: beforeRecord.versionLabel,
          href: beforeRecord.href,
          changedSections: [],
          sourceCount: canonicalSource ? 1 : 0,
          signalCount: 0,
          messages: [
            "Fetched the canonical source.",
            error instanceof Error ? error.message : "Imported sync failed."
          ],
          sources: canonicalSource
            ? [
                {
                  ...buildLoopUpdateSourceLog(canonicalSource, "error"),
                  note: error instanceof Error ? error.message : "Imported sync failed."
                }
              ]
            : [],
          diffLines: [],
          errorMessage: error instanceof Error ? error.message : "Imported sync failed."
        });
        return skill;
      }
    })
  );

  if (shouldSave) {
    await saveImportedSkills(nextSkills);
  }

  if (loopRuns.length > 0) {
    await Promise.all(loopRuns.map((run) => recordLoopRun(run)));
  }
}

async function uploadSnapshot(snapshot: SkillwireSnapshot): Promise<string | undefined> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return undefined;
  }

  const { put } = await import("@vercel/blob");
  const blob = await put("skillwire/latest.json", JSON.stringify(snapshot, null, 2), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json"
  });

  return blob.url;
}

export async function refreshSkillwireSnapshot(
  options: RefreshOptions = {}
): Promise<SkillwireSnapshot> {
  const startedAt = new Date().toISOString();
  const refreshUserSkills = options.refreshUserSkills ?? true;
  const shouldRefreshImportedSkills = options.refreshImportedSkills ?? true;
  const refreshCategorySignals = options.refreshCategorySignals ?? true;

  try {
    if (refreshUserSkills) {
      await refreshTrackedUserSkills(options);
    }

    if (shouldRefreshImportedSkills) {
      await refreshTrackedImportedSkills(options);
    }

    const base = await getLocalSnapshotBase();
    const cachedSnapshot = options.forceFresh ? null : await readLocalSnapshotFile();

    const dailyBriefs = refreshCategorySignals
      ? await Promise.all(
          base.categories.map(async (category) => {
            const signalBuckets = await Promise.all(category.sources.map(fetchSignals));
            const flattened = signalBuckets
              .flat()
              .sort((left, right) => +new Date(right.publishedAt) - +new Date(left.publishedAt));

            return synthesizeBrief(category.slug, category.title, flattened);
          })
        )
      : cachedSnapshot?.dailyBriefs ??
        base.categories.map((category) => fallbackBrief(category.slug, category.title, []));

    const snapshot: SkillwireSnapshot = {
      ...base,
      dailyBriefs,
      generatedAt: new Date().toISOString(),
      generatedFrom: refreshCategorySignals ? "remote-refresh" : "local-scan",
      remoteSnapshotUrl: cachedSnapshot?.remoteSnapshotUrl
    };

    if (options.writeLocal !== false) {
      await writeLocalSnapshotFile(snapshot);
    }

    try {
      await persistSearchIndex(snapshot);
    } catch {
      // Search can rebuild on demand; snapshot generation should still succeed.
    }

    if (options.uploadBlob) {
      const remoteSnapshotUrl = await uploadSnapshot(snapshot);
      if (remoteSnapshotUrl) {
        snapshot.remoteSnapshotUrl = remoteSnapshotUrl;
        if (options.writeLocal !== false) {
          await writeLocalSnapshotFile(snapshot);
        }
      }
    }

    await recordRefreshRun({
      id: randomUUID(),
      status: "success",
      startedAt,
      finishedAt: new Date().toISOString(),
      generatedAt: snapshot.generatedAt,
      generatedFrom: snapshot.generatedFrom,
      writeLocal: options.writeLocal !== false,
      uploadBlob: Boolean(options.uploadBlob),
      refreshCategorySignals,
      refreshUserSkills,
      refreshImportedSkills: shouldRefreshImportedSkills,
      focusSkillSlugs: options.focusSkillSlugs ?? [],
      focusImportedSkillSlugs: options.focusImportedSkillSlugs ?? [],
      skillCount: snapshot.skills.length,
      categoryCount: snapshot.categories.length,
      dailyBriefCount: snapshot.dailyBriefs.length
    });

    return snapshot;
  } catch (error) {
    await recordRefreshRun({
      id: randomUUID(),
      status: "error",
      startedAt,
      finishedAt: new Date().toISOString(),
      writeLocal: options.writeLocal !== false,
      uploadBlob: Boolean(options.uploadBlob),
      refreshCategorySignals,
      refreshUserSkills,
      refreshImportedSkills: shouldRefreshImportedSkills,
      focusSkillSlugs: options.focusSkillSlugs ?? [],
      focusImportedSkillSlugs: options.focusImportedSkillSlugs ?? [],
      errorMessage: error instanceof Error ? error.message : "Unknown refresh failure."
    });
    throw error;
  }
}

export async function getSkillwireSnapshot(): Promise<SkillwireSnapshot> {
  const base = await getLocalSnapshotBase();
  const cached = await readLocalSnapshotFile();
  if (cached && cached.dailyBriefs.length > 0 && cached.categories.length > 0) {
    return {
      ...cached,
      ...base,
      dailyBriefs: cached.dailyBriefs,
      generatedAt: cached.generatedAt,
      generatedFrom: cached.generatedFrom,
      remoteSnapshotUrl: cached.remoteSnapshotUrl
    };
  }

  return refreshSkillwireSnapshot({ writeLocal: true, uploadBlob: false });
}

async function runCli(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const writeLocal = args.has("--write-local");
  const uploadBlob = args.has("--upload-blob");
  const snapshot = await refreshSkillwireSnapshot({ writeLocal, uploadBlob, forceFresh: true });

  const outputPath = path.join(process.cwd(), "content/generated/skillwire-snapshot.stdout.json");
  await fs.writeFile(outputPath, JSON.stringify(snapshot, null, 2));
  console.log(`Skillwire snapshot written to ${outputPath}`);
}

if (process.argv[1] && process.argv[1].endsWith("refresh.ts")) {
  runCli().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
