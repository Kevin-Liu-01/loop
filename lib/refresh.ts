import { randomUUID } from "node:crypto";

import { generateObject } from "ai";
import { z } from "zod";

import { getGatewayEditorModel, getGatewayEditorModelId, getGatewayModelForSkill } from "@/lib/agents";
import {
  getSkillCatalogue,
  findSkillFiles,
  parseSkill,
  WORKSPACE_ROOT,
  CODEX_SKILLS_ROOT
} from "@/lib/content";
import { seedCategories } from "@/lib/db/categories";
import { upsertSkillFromFilesystem } from "@/lib/db/skills";
import { upsertBrief } from "@/lib/db/briefs";
import {
  buildImportedSkillRecord,
  listImportedSkills,
  saveImportedSkills,
  syncImportedSkill
} from "@/lib/imports";
import { buildLoopUpdateSourceLog, buildLoopUpdateTarget } from "@/lib/loop-updates";
import { publishSkillRefresh } from "@/lib/queues";
import { runSkillEditorAgent } from "@/lib/skill-editor-agent";
import { fetchSignals } from "@/lib/source-signals";
import { recordLoopRun, recordRefreshRun } from "@/lib/system-state";
import { diffMultilineText } from "@/lib/text-diff";
import { CATEGORY_REGISTRY } from "@/lib/registry";
import { buildUpdateDigest } from "@/lib/update-digest";
import {
  buildUserSkillRecord,
  createNextUserSkillVersion,
  isUserSkillAutomationDue,
  listUserSkillDocuments
} from "@/lib/user-skills";
import type {
  AgentReasoningStep,
  CategoryBrief,
  CategorySlug,
  DailySignal,
  LoopRunRecord,
  LoopUpdateResult,
  LoopUpdateSourceLog,
  LoopUpdateTarget,
  SkillUpdateEntry,
  UserSkillDocument
} from "@/lib/types";

const SIGNAL_SCHEMA = z.object({
  summary: z.string(),
  whatChanged: z.string(),
  experiments: z.array(z.string()).min(2).max(3)
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
  onReasoningStep?: (step: AgentReasoningStep) => void;
};

export type UserSkillRefreshCycle = {
  nextSkill: UserSkillDocument;
  update: SkillUpdateEntry;
  result: LoopUpdateResult;
  sourceLogs: LoopUpdateSourceLog[];
  messages: string[];
  loopRun: LoopRunRecord;
};

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
            `Rewrite one stale section with today's source language.`,
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

export function buildFailedLoopRun(
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
  const briefModel = getGatewayEditorModel();
  if (items.length === 0 || !briefModel) {
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
      model: briefModel,
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI error";
    console.warn(`[refresh] synthesizeBrief failed for "${title}": ${message}`);
    return fallbackBrief(slug, title, items);
  }
}

type SynthesizeResult = SkillRevisionDraft & {
  reasoningSteps: AgentReasoningStep[];
};

export async function synthesizeSkillUpdate(
  skill: UserSkillDocument,
  items: DailySignal[],
  sourceLogs: LoopUpdateSourceLog[] = [],
  onReasoningStep?: (step: AgentReasoningStep) => void,
  preferredModel?: string
): Promise<SynthesizeResult> {
  const generatedAt = new Date().toISOString();
  const fallbackUpdate = fallbackSkillUpdate(skill, items);
  const fallbackEdit = applyFallbackSkillBodyEdit(skill, {
    ...fallbackUpdate,
    generatedAt
  });
  const fallbackBodyChanged = fallbackEdit.nextBody.trim() !== skill.body.trim();
  const fallbackDraft: SynthesizeResult = {
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
    editorModel: "heuristic-fallback",
    reasoningSteps: []
  };

  const editorModel = getGatewayModelForSkill(preferredModel);
  if (items.length === 0 || !editorModel) {
    return fallbackDraft;
  }

  try {
    const result = await runSkillEditorAgent(
      skill,
      items,
      sourceLogs,
      editorModel,
      getGatewayEditorModelId(preferredModel),
      onReasoningStep
    );
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI error";
    console.warn(`[refresh] synthesizeSkillUpdate failed for "${skill.title}": ${message}`);
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

  const fetchResults = await Promise.allSettled(
    skill.sources.map(async (source) => {
      const items = await fetchSignals(source);
      return { source, items };
    })
  );

  for (let i = 0; i < skill.sources.length; i++) {
    const source = skill.sources[i]!;
    const result = fetchResults[i]!;
    const items = result.status === "fulfilled" ? result.value.items : [];
    if (result.status === "rejected") {
      console.warn(`[refresh] fetchSignals failed for "${source.label}":`, result.reason);
    }

    const completed: LoopUpdateSourceLog = {
      ...buildLoopUpdateSourceLog(source, "done"),
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
  const draft = await synthesizeSkillUpdate(skill, flattened, sourceLogs, hooks.onReasoningStep, skill.automation.preferredModel);
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
    editorModel: draft.editorModel,
    reasoningSteps: draft.reasoningSteps
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
    diffLines: diffLines.slice(0, 120),
    reasoningSteps: draft.reasoningSteps.slice(0, 20)
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

function sortByMostOverdue(skills: UserSkillDocument[]): UserSkillDocument[] {
  return [...skills].sort((a, b) => {
    const aTime = a.automation.lastRunAt ? new Date(a.automation.lastRunAt).valueOf() : 0;
    const bTime = b.automation.lastRunAt ? new Date(b.automation.lastRunAt).valueOf() : 0;
    return aTime - bTime;
  });
}

async function refreshTrackedUserSkills(options: RefreshOptions): Promise<number> {
  const editorModel = getGatewayEditorModel();
  console.info(`[refresh] Starting user skill refresh fan-out — model: ${editorModel ? getGatewayEditorModelId() : "heuristic-fallback"}`);

  const skills = await listUserSkillDocuments();
  const focusSet = options.focusSkillSlugs ? new Set(options.focusSkillSlugs) : null;
  const now = new Date();

  const eligibleSkills = skills.filter((skill) => {
    const canRefresh = skill.automation.enabled && skill.automation.status === "active" && skill.sources.length > 0;
    if (focusSet && !focusSet.has(skill.slug)) return false;
    if ((focusSet && !canRefresh) || (!focusSet && !isUserSkillAutomationDue(skill, now))) return false;
    return true;
  });

  const sorted = sortByMostOverdue(eligibleSkills);

  if (sorted.length === 0) {
    console.info("[refresh] No eligible user skills — nothing to dispatch");
    return 0;
  }

  const results = await Promise.allSettled(
    sorted.map((skill) => publishSkillRefresh(skill.slug, "automation"))
  );

  let dispatched = 0;
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (!result) continue;
    if (result.status === "fulfilled") {
      dispatched++;
    } else {
      console.error(`[refresh] Failed to enqueue "${sorted[i]?.slug}":`, result.reason);
    }
  }

  console.info(`[refresh] Dispatched ${dispatched}/${sorted.length} user skill refreshes to queue`);
  return dispatched;
}

async function refreshTrackedImportedSkills(options: RefreshOptions): Promise<void> {
  const importedSkills = await listImportedSkills();
  const focusSet = options.focusImportedSkillSlugs ? new Set(options.focusImportedSkillSlugs) : null;
  let shouldSave = false;
  const loopRuns: LoopRunRecord[] = [];

  const nextSkills = await Promise.all(
    importedSkills.map(async (skill) => {
      if (!skill.syncEnabled) return skill;
      if (focusSet && !focusSet.has(skill.slug)) return skill;

      if (!focusSet && skill.lastSyncedAt) {
        const elapsedMs = Date.now() - new Date(skill.lastSyncedAt).valueOf();
        if (elapsedMs < 24 * 60 * 60 * 1000) return skill;
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
    const changedSkills = nextSkills.filter((next, i) => next !== importedSkills[i]);
    if (changedSkills.length > 0) {
      await saveImportedSkills(changedSkills);
    }
  }

  for (const run of loopRuns) {
    try {
      await recordLoopRun(run);
    } catch (recordError) {
      console.error(`[refresh] Failed to record imported loop run for "${run.slug}":`, recordError);
    }
  }
}

/**
 * Legacy filesystem sync — only runs in local dev when LOOP_SYNC_FS=1 is set.
 * In production, all skills live in Supabase and this is a no-op.
 */
async function syncFilesystemSkillsToDb(): Promise<void> {
  if (process.env.NODE_ENV !== "development" || process.env.LOOP_SYNC_FS !== "1") {
    return;
  }

  const repoSkillFiles = await findSkillFiles(WORKSPACE_ROOT);
  const codexSkillFiles = await findSkillFiles(CODEX_SKILLS_ROOT);
  const allSkillFiles = [...repoSkillFiles, ...codexSkillFiles];

  if (allSkillFiles.length === 0) return;

  console.info(`[refresh] LOOP_SYNC_FS=1 — syncing ${allSkillFiles.length} filesystem skills to DB`);

  await Promise.all(
    allSkillFiles.map(async (skillFile) => {
      const parsed = await parseSkill(skillFile);
      await upsertSkillFromFilesystem({
        slug: parsed.slug,
        title: parsed.title,
        description: parsed.description,
        category: parsed.category,
        body: parsed.body,
        accent: parsed.accent,
        featured: parsed.featured,
        visibility: parsed.visibility,
        origin: parsed.origin as "repo" | "codex",
        path: parsed.path,
        relativeDir: parsed.relativeDir,
        tags: parsed.tags,
        headings: parsed.headings,
        references: parsed.references,
        agents: parsed.agents,
        agentDocs: parsed.agentDocs,
        version: 1
      });
    })
  );
}

export async function refreshLoopSnapshot(
  options: RefreshOptions = {}
): Promise<{ dispatchedSkillCount: number }> {
  const startedAt = new Date().toISOString();
  const refreshUserSkills = options.refreshUserSkills ?? true;
  const shouldRefreshImportedSkills = options.refreshImportedSkills ?? true;
  const refreshCategorySignals = options.refreshCategorySignals ?? true;

  try {
    await seedCategories(CATEGORY_REGISTRY);
    await syncFilesystemSkillsToDb();

    let dispatchedSkillCount = 0;

    if (refreshUserSkills) {
      dispatchedSkillCount = await refreshTrackedUserSkills(options);
    }

    if (shouldRefreshImportedSkills) {
      await refreshTrackedImportedSkills(options);
    }

    if (refreshCategorySignals) {
      const categories = CATEGORY_REGISTRY;
      await Promise.all(
        categories.map(async (category) => {
          try {
            const signalBuckets = await Promise.all(category.sources.map(fetchSignals));
            const flattened = signalBuckets
              .flat()
              .sort((left, right) => +new Date(right.publishedAt) - +new Date(left.publishedAt));

            const brief = await synthesizeBrief(category.slug, category.title, flattened);
            await upsertBrief(brief);
          } catch (briefError) {
            console.error(`[refresh] Brief failed for "${category.slug}":`, briefError);
          }
        })
      );
    }

    const catalogue = await getSkillCatalogue();

    try {
      await recordRefreshRun({
        id: randomUUID(),
        status: "success",
        startedAt,
        finishedAt: new Date().toISOString(),
        generatedAt: new Date().toISOString(),
        generatedFrom: refreshCategorySignals ? "remote-refresh" : "local-scan",
        writeLocal: false,
        uploadBlob: false,
        refreshCategorySignals,
        refreshUserSkills,
        refreshImportedSkills: shouldRefreshImportedSkills,
        focusSkillSlugs: options.focusSkillSlugs ?? [],
        focusImportedSkillSlugs: options.focusImportedSkillSlugs ?? [],
        skillCount: catalogue.skills.length,
        categoryCount: catalogue.categories.length,
        dailyBriefCount: 0,
        dispatchedSkillCount
      });
    } catch (recordError) {
      console.error("[refresh] Failed to record successful refresh run:", recordError);
    }

    return { dispatchedSkillCount };
  } catch (error) {
    try {
      await recordRefreshRun({
        id: randomUUID(),
        status: "error",
        startedAt,
        finishedAt: new Date().toISOString(),
        writeLocal: false,
        uploadBlob: false,
        refreshCategorySignals,
        refreshUserSkills,
        refreshImportedSkills: shouldRefreshImportedSkills,
        focusSkillSlugs: options.focusSkillSlugs ?? [],
        focusImportedSkillSlugs: options.focusImportedSkillSlugs ?? [],
        errorMessage: error instanceof Error ? error.message : "Unknown refresh failure."
      });
    } catch (recordError) {
      console.error("[refresh] Failed to record error refresh run:", recordError);
    }
    throw error;
  }
}

export async function getLoopSnapshot(options?: { includePrivate?: boolean }) {
  const { getLoopSnapshot: getSnapshot } = await import("@/lib/content");
  return getSnapshot(options);
}
