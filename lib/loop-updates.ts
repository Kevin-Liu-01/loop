import { buildSourceLogoUrl } from "@/lib/source-signals";
import type {
  LoopRunRecord,
  LoopUpdateResult,
  LoopUpdateSourceLog,
  LoopUpdateTarget,
  SkillRecord,
  SourceDefinition
} from "@/lib/types";

export function buildLoopUpdateTarget(skill: SkillRecord): LoopUpdateTarget {
  const latestUpdate = skill.updates?.[0];

  return {
    slug: skill.slug,
    title: skill.title,
    category: skill.category,
    origin: skill.origin === "remote" ? "remote" : "user",
    description: skill.description,
    versionLabel: skill.versionLabel,
    updatedAt: skill.updatedAt,
    href: skill.href,
    automationLabel:
      skill.origin === "user"
        ? skill.automation?.enabled
          ? `${skill.automation.cadence} ${skill.automation.status}`
          : "manual"
        : "import sync",
    lastSummary: latestUpdate?.summary,
    lastWhatChanged: latestUpdate?.whatChanged,
    lastGeneratedAt: latestUpdate?.generatedAt,
    lastExperiments: latestUpdate?.experiments ?? [],
    lastSignals: latestUpdate?.items ?? [],
    lastChangedSections: latestUpdate?.changedSections ?? [],
    lastBodyChanged: latestUpdate?.bodyChanged,
    lastEditorModel: latestUpdate?.editorModel,
    sources: (skill.sources ?? []).map((source) => ({
      id: source.id,
      label: source.label,
      url: source.url,
      kind: source.kind,
      logoUrl: source.logoUrl || buildSourceLogoUrl(source.url),
      mode: source.mode,
      trust: source.trust,
      parser: source.parser,
      searchQueries: source.searchQueries
    }))
  };
}

export function buildLoopUpdateSourceLog(
  source: SourceDefinition,
  status: LoopUpdateSourceLog["status"] = "pending"
): LoopUpdateSourceLog {
  return {
    id: source.id,
    label: source.label,
    url: source.url,
    kind: source.kind,
    logoUrl: source.logoUrl || buildSourceLogoUrl(source.url),
    mode: source.mode,
    trust: source.trust,
    parser: source.parser,
    searchQueries: source.searchQueries,
    status,
    itemCount: 0,
    items: []
  };
}

export function buildLoopRunResult(run?: LoopRunRecord | null): LoopUpdateResult | null {
  if (!run?.previousVersionLabel || !run.nextVersionLabel || !run.href) {
    return null;
  }

  return {
    slug: run.slug,
    title: run.title,
    origin: run.origin,
    changed:
      run.status === "success" &&
      (run.bodyChanged === true ||
        run.previousVersionLabel !== run.nextVersionLabel ||
        run.diffLines.some((line) => line.type !== "context")),
    previousVersionLabel: run.previousVersionLabel,
    nextVersionLabel: run.nextVersionLabel,
    updatedAt: run.finishedAt,
    href: run.href,
    diffLines: run.diffLines,
    summary: run.summary,
    whatChanged: run.whatChanged,
    items: run.sources.flatMap((source) => source.items).slice(0, 4),
    changedSections: run.changedSections,
    bodyChanged: run.bodyChanged,
    editorModel: run.editorModel,
    reasoningSteps: run.reasoningSteps,
    searchesUsed: run.searchesUsed,
    addedSources: run.addedSources
  };
}
