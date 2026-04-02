import { generateText, stepCountIs, tool, type LanguageModel } from "ai";
import { z } from "zod";

import { buildAddSourceTool, type AddedSourceCollector } from "@/lib/agent-tools/add-source";
import { DEFAULT_SEARCH_BUDGET, MIN_SEARCH_REQUIRED } from "@/lib/agent-tools/constants";
import { buildFetchPageTool } from "@/lib/agent-tools/fetch-page";
import type { SearchBudget } from "@/lib/agent-tools/types";
import { buildWebSearchTool } from "@/lib/agent-tools/web-search";
import { diffMultilineText } from "@/lib/text-diff";
import type {
  AgentReasoningStep,
  DailySignal,
  DiffLine,
  LoopUpdateSourceLog,
  SkillUpdateEntry,
  SourceDefinition,
  UserSkillDocument
} from "@/lib/types";

const MAX_REASONING_CHARS = 2000;
const MAX_TOOL_RESULT_CHARS = 2000;
const MAX_SEARCH_RESULT_CHARS = 4000;
const MAX_DIFF_LINES_PER_STEP = 80;
const MAX_AGENT_STEPS = 18;

const LARGE_OUTPUT_TOOLS = new Set(["web_search", "fetch_page"]);

export type SkillRevisionDraft = {
  update: SkillUpdateEntry;
  nextBody: string;
  nextDescription: string;
  bodyChanged: boolean;
  changedSections: string[];
  editorModel: string;
  addedSources: SourceDefinition[];
  searchesUsed: number;
};

type EditorAgentResult = SkillRevisionDraft & {
  reasoningSteps: AgentReasoningStep[];
};

type MutableRevisionState = {
  body: string;
  description: string;
  summary: string;
  whatChanged: string;
  experiments: string[];
  changedSections: string[];
  revised: boolean;
  finalized: boolean;
};

function buildSystemPrompt(
  skill: UserSkillDocument,
  sourceLogs: LoopUpdateSourceLog[],
  searchBudgetMax: number
): string {
  const sourceList = sourceLogs
    .map((s) => {
      const items = s.items
        .slice(0, 6)
        .map((item, i) => `  ${i + 1}. ${item.title} | ${item.source} | ${item.publishedAt}\n     ${item.summary || "No summary"}`)
        .join("\n");
      return `### ${s.label} (${s.itemCount} signals)\n${items || "  No signals."}`;
    })
    .join("\n\n");

  const today = new Date().toISOString().slice(0, 10);

  return [
    `# Skill editor agent — "${skill.title}"`,
    "",
    "You are a research-first autonomous editor. Your job: absorb tracked-source signals, actively research the web, then produce a precise revision of the skill body.",
    "",
    "## Mandatory research phase",
    "",
    `Budget: ${searchBudgetMax} web searches. You MUST use at least ${MIN_SEARCH_REQUIRED}.`,
    "Do NOT skip searching even when signals look complete — there is always more to learn.",
    "",
    "What to search for:",
    "- Breaking changes, new releases, or version bumps since the skill was last updated.",
    "- Corrections, deprecations, or revised best practices that invalidate current advice.",
    "- Adjacent techniques, libraries, or patterns the skill doesn't cover yet.",
    "- Authoritative primary sources (official docs, RFCs, changelogs) to replace or verify weaker references.",
    "",
    "Search tactics:",
    `- Start broad: "${skill.title} latest changes ${today.slice(0, 4)}". Narrow from there.`,
    "- Chain searches: first result → follow-up on specifics (version numbers, migration guides, benchmarks).",
    "- If a query returns thin results, rephrase with different keywords — do not accept one weak attempt.",
    "- Use fetch_page on the most promising URLs to get full context before citing them.",
    "",
    "## Workflow",
    "",
    "1. **Gather** — analyze_signals on each source, then read_current_skill.",
    "2. **Research** — web_search to fill gaps, fetch_page for depth. Do this BEFORE planning edits.",
    "3. **Discover** — if you find a high-value recurring source (official docs, release feed, maintained blog, GitHub repo), use add_source so future refreshes track it automatically.",
    "4. **Plan** — reason about what should change and why. Explain your thinking in your messages.",
    "5. **Revise** — revise_skill with the complete updated body.",
    "6. **Finalize** — finalize when satisfied.",
    "",
    "## Writing standards",
    "",
    "- Terse, operational, copy-pasteable by agents and developers.",
    "- Preserve existing structure and intent unless evidence justifies changing them.",
    "- Every added claim must trace to a search result or existing signal — never fabricate.",
    "- Do NOT add meta-sections about update history or observability (the product handles those).",
    "- Prefer concrete over vague: version numbers, dates, specific API names, code snippets.",
    "",
    `## Author instruction\n\n${skill.automation.prompt}`,
    "",
    `## Source signals (today: ${today})`,
    "",
    sourceList
  ].join("\n");
}

function buildAnalyzeSignalsTool(sourceLogs: LoopUpdateSourceLog[]) {
  return tool({
    description: "Pull the full signal list from one tracked source. Returns each signal's title, URL, date, and summary so you can assess what's new and what gaps remain.",
    inputSchema: z.object({
      sourceLabel: z.string().describe("Exact label of the source (case-insensitive)")
    }),
    execute: async ({ sourceLabel }) => {
      const match = sourceLogs.find(
        (s) => s.label.toLowerCase() === sourceLabel.toLowerCase()
      );
      if (!match) {
        return {
          found: false,
          message: `Source "${sourceLabel}" not found. Available: ${sourceLogs.map((s) => s.label).join(", ")}`
        };
      }
      return {
        found: true,
        label: match.label,
        status: match.status,
        itemCount: match.itemCount,
        items: match.items.map((item) => ({
          title: item.title,
          url: item.url,
          source: item.source,
          publishedAt: item.publishedAt,
          summary: item.summary
        }))
      };
    }
  });
}

function buildReadCurrentSkillTool(skill: UserSkillDocument) {
  return tool({
    description: "Return the skill's full body text, title, description, and current version. Call this early so you can compare against incoming signals and identify stale or incomplete sections.",
    inputSchema: z.object({}),
    execute: async () => ({
      title: skill.title,
      description: skill.description,
      body: skill.body,
      version: skill.version,
      versionLabel: `v${skill.version}`
    })
  });
}

function buildReviseSkillTool(skill: UserSkillDocument, state: MutableRevisionState) {
  return tool({
    description: "Submit a revised version of the skill. You must provide the COMPLETE body (not a diff) plus metadata about what changed. Only call this after your research phase is complete and you have a clear plan.",
    inputSchema: z.object({
      revisedBody: z.string().min(40).describe("The complete revised skill body — include ALL sections, not just changed ones"),
      revisedDescription: z.string().min(16).max(220).describe("Updated one-line skill description reflecting current scope"),
      summary: z.string().describe("One-paragraph summary of what this update accomplishes and why"),
      whatChanged: z.string().describe("Bullet-style list of concrete changes: what was added, removed, or rewritten"),
      changedSections: z.array(z.string()).min(1).max(6).describe("Names of the sections you touched"),
      experiments: z.array(z.string()).min(2).max(3).describe("2-3 follow-up experiments or areas to investigate in future refreshes")
    }),
    execute: async ({ revisedBody, revisedDescription, summary, whatChanged, changedSections, experiments }) => {
      state.body = revisedBody.trim();
      state.description = revisedDescription.trim();
      state.summary = summary;
      state.whatChanged = whatChanged;
      state.changedSections = Array.from(
        new Set(changedSections.map((s) => s.trim()).filter(Boolean))
      ).slice(0, 6);
      state.experiments = experiments;
      state.revised = true;

      const bodyChanged = state.body !== skill.body.trim();
      return {
        applied: true,
        bodyChanged,
        changedSections: state.changedSections,
        bodyLengthBefore: skill.body.length,
        bodyLengthAfter: state.body.length
      };
    }
  });
}

function buildFinalizeTool(state: MutableRevisionState) {
  return tool({
    description: "Mark the revision as complete. Call this once — and only after — you have called revise_skill and are satisfied with the result. If you have not revised the skill (no meaningful changes needed), still call this to end the run cleanly.",
    inputSchema: z.object({
      finalNote: z.string().optional().describe("Brief closing note: confidence level, anything deferred to the next refresh, or why no changes were made")
    }),
    execute: async ({ finalNote }) => {
      state.finalized = true;
      return { finalized: true, note: finalNote ?? "Revision finalized." };
    }
  });
}

function omitVerboseArgs(
  args: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  const filtered = { ...args };
  for (const key of keys) {
    if (key in filtered && typeof filtered[key] === "string") {
      filtered[key] = `[${(filtered[key] as string).length} chars omitted]`;
    }
  }
  return filtered;
}

function extractStepsFromResponse(response: { steps: any[] }, skill: UserSkillDocument): AgentReasoningStep[] {
  const steps: AgentReasoningStep[] = [];
  let stepIndex = 0;
  let previousBody = skill.body;

  for (const step of response.steps) {
    const reasoning = step.text?.slice(0, MAX_REASONING_CHARS) ?? "";
    const toolCalls = step.toolCalls ?? [];
    const toolResults = step.toolResults ?? [];

    if (reasoning.trim()) {
      steps.push({
        index: stepIndex++,
        reasoning,
        timestamp: new Date().toISOString()
      });
    }

    for (let i = 0; i < toolCalls.length; i++) {
      const tc = toolCalls[i];
      const tr = toolResults[i];
      let diffLines: DiffLine[] | undefined;
      const toolInput = tc.input as Record<string, unknown>;

      if (tc.toolName === "revise_skill") {
        const newBody = (toolInput.revisedBody as string | undefined)?.trim() ?? previousBody;
        diffLines = diffMultilineText(previousBody, newBody).slice(0, MAX_DIFF_LINES_PER_STEP);
        previousBody = newBody;
      }

      const toolOutput = tr?.output;
      const maxChars = LARGE_OUTPUT_TOOLS.has(tc.toolName)
        ? MAX_SEARCH_RESULT_CHARS
        : MAX_TOOL_RESULT_CHARS;
      const resultStr = toolOutput
        ? typeof toolOutput === "string"
          ? toolOutput.slice(0, maxChars)
          : JSON.stringify(toolOutput).slice(0, maxChars)
        : undefined;

      const logArgs = tc.toolName === "revise_skill"
        ? omitVerboseArgs(toolInput, ["revisedBody"])
        : tc.toolName === "fetch_page"
          ? toolInput
          : toolInput;

      steps.push({
        index: stepIndex++,
        reasoning: reasoning && !steps.some((s) => s.reasoning === reasoning) ? reasoning : "",
        toolCall: {
          name: tc.toolName,
          args: logArgs
        },
        toolResult: resultStr,
        diffLines,
        timestamp: new Date().toISOString()
      });
    }
  }

  return steps;
}

export async function runSkillEditorAgent(
  skill: UserSkillDocument,
  signals: DailySignal[],
  sourceLogs: LoopUpdateSourceLog[],
  model: LanguageModel,
  modelLabel: string,
  onStep?: (step: AgentReasoningStep) => void
): Promise<EditorAgentResult> {
  const generatedAt = new Date().toISOString();

  const searchBudgetMax = skill.automation.searchBudget ?? DEFAULT_SEARCH_BUDGET;
  const searchBudget: SearchBudget = { max: searchBudgetMax, used: 0 };
  const sourceCollector: AddedSourceCollector = { sources: [] };

  const revisionState: MutableRevisionState = {
    body: skill.body,
    description: skill.description,
    summary: "",
    whatChanged: "",
    experiments: [],
    changedSections: [],
    revised: false,
    finalized: false
  };

  const tools = {
    analyze_signals: buildAnalyzeSignalsTool(sourceLogs),
    read_current_skill: buildReadCurrentSkillTool(skill),
    web_search: buildWebSearchTool(searchBudget),
    fetch_page: buildFetchPageTool(),
    add_source: buildAddSourceTool(skill.sources, skill.category, sourceCollector),
    revise_skill: buildReviseSkillTool(skill, revisionState),
    finalize: buildFinalizeTool(revisionState)
  };

  const response = await generateText({
    model,
    system: buildSystemPrompt(skill, sourceLogs, searchBudgetMax),
    prompt: [
      `${sourceLogs.length} tracked sources delivered ${signals.length} signal(s).`,
      `Web search budget: ${searchBudgetMax} (minimum ${MIN_SEARCH_REQUIRED}).`,
      "",
      "Execute the workflow: gather → research → discover → plan → revise → finalize.",
      `Start by calling analyze_signals for each source, then read_current_skill, then begin your research phase with at least ${MIN_SEARCH_REQUIRED} web searches before deciding any edits.`,
    ].join("\n"),
    tools,
    stopWhen: stepCountIs(MAX_AGENT_STEPS)
  });

  const reasoningSteps = extractStepsFromResponse(response, skill);

  if (onStep) {
    for (const step of reasoningSteps) {
      onStep(step);
    }
  }

  const topItems = signals.slice(0, 4);
  const addedSources = sourceCollector.sources;
  const searchesUsed = searchBudget.used;

  if (!revisionState.revised) {
    return {
      update: {
        generatedAt,
        summary: `${skill.title} was reviewed by the editor agent but no revision was applied.`,
        whatChanged: "The agent analyzed signals but did not call revise_skill.",
        experiments: ["Review the skill body for stale sections.", "Add a higher-signal source.", "Re-run after new signals arrive."],
        items: topItems,
        bodyChanged: false,
        changedSections: [],
        editorModel: modelLabel,
        addedSources: addedSources.length > 0 ? addedSources : undefined,
        searchesUsed: searchesUsed > 0 ? searchesUsed : undefined
      },
      nextBody: skill.body,
      nextDescription: skill.description,
      bodyChanged: false,
      changedSections: [],
      editorModel: modelLabel,
      addedSources,
      searchesUsed,
      reasoningSteps
    };
  }

  const bodyChanged = revisionState.body.trim() !== skill.body.trim();

  return {
    update: {
      generatedAt,
      summary: revisionState.summary || `${skill.title} was reviewed by the editor agent.`,
      whatChanged: revisionState.whatChanged || "The agent applied a revision with no detailed changelog.",
      experiments: revisionState.experiments.length > 0
        ? revisionState.experiments
        : ["Review the skill body for stale sections.", "Add a higher-signal source.", "Re-run after new signals arrive."],
      items: topItems,
      bodyChanged,
      changedSections: revisionState.changedSections,
      editorModel: modelLabel,
      addedSources: addedSources.length > 0 ? addedSources : undefined,
      searchesUsed: searchesUsed > 0 ? searchesUsed : undefined
    },
    nextBody: revisionState.body,
    nextDescription: revisionState.description,
    bodyChanged,
    changedSections: revisionState.changedSections,
    editorModel: modelLabel,
    addedSources,
    searchesUsed,
    reasoningSteps
  };
}
