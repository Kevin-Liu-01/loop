import { generateText, stepCountIs, tool, type LanguageModel } from "ai";
import { z } from "zod";

import { buildAddSourceTool, type AddedSourceCollector } from "@/lib/agent-tools/add-source";
import { DEFAULT_SEARCH_BUDGET } from "@/lib/agent-tools/constants";
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
const MAX_AGENT_STEPS = 12;

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

  return [
    `You are an autonomous skill editor for "${skill.title}".`,
    "Your job is to inspect fresh external signals, optionally search the web for more, and decide whether and how to rewrite the skill body.",
    "",
    "Operating rules:",
    "- Preserve existing intent and structure unless signals justify a concrete edit.",
    "- Do not fabricate claims or sources.",
    "- Do not add update-engine, recent-log, or observability sections (the product handles those).",
    "- Keep writing terse, operational, and copy-pasteable for agents.",
    "",
    "Workflow:",
    "1. Use analyze_signals to review what each source brought in.",
    "2. Use read_current_skill to see the full skill body.",
    "3. Identify gaps: stale sections, missing context, thin coverage, unverified claims.",
    "4. Use web_search to fill those gaps. Be specific with queries. Prioritize high-value searches.",
    "5. Use fetch_page to deep-read any promising URL that web_search surfaced.",
    "6. If you discover a high-quality recurring source (official docs, maintained blog, release feed, GitHub repo), use add_source to track it for future refreshes.",
    "7. Reason about what should change (explain your thinking in your messages).",
    "8. Use revise_skill to apply your edits.",
    "9. Use finalize when you are satisfied with the revision.",
    "",
    `Web search budget: ${searchBudgetMax} queries this refresh. Use them strategically.`,
    "",
    `Automation instruction: ${skill.automation.prompt}`,
    "",
    "## Source signals",
    sourceList
  ].join("\n");
}

function buildAnalyzeSignalsTool(sourceLogs: LoopUpdateSourceLog[]) {
  return tool({
    description: "Retrieve and analyze signals from a specific tracked source. Use this to understand what changed.",
    inputSchema: z.object({
      sourceLabel: z.string().describe("The label of the source to analyze")
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
    description: "Read the current skill body and metadata. Use this before deciding what to edit.",
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
    description: "Apply a revision to the skill. Provide the complete revised body, description, a summary of the update, what changed, which sections changed, and 2-3 experiment ideas.",
    inputSchema: z.object({
      revisedBody: z.string().min(40).describe("The full revised skill body"),
      revisedDescription: z.string().min(16).max(220).describe("Updated skill description"),
      summary: z.string().describe("Summary of what this update does"),
      whatChanged: z.string().describe("Narrative of the concrete changes made"),
      changedSections: z.array(z.string()).min(1).max(6).describe("Sections that were edited"),
      experiments: z.array(z.string()).min(2).max(3).describe("Suggested follow-up experiments")
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
    description: "Signal that the revision is complete and you are satisfied with the result.",
    inputSchema: z.object({
      finalNote: z.string().optional().describe("Optional closing note about the revision")
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
    prompt: `You have ${sourceLogs.length} sources with ${signals.length} total signals and a web search budget of ${searchBudgetMax} queries. Analyze existing signals, search the web to fill gaps, read the current skill, decide what to change, revise the skill, then finalize.`,
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
