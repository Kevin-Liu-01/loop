import { gateway, generateText, stepCountIs, tool } from "ai";
import { z } from "zod";

import { SEARCH_MAX_RESULTS, SEARCH_MAX_TOKENS } from "@/lib/agent-tools/constants";
import type { SearchBudget, SearchRecency, WebSearchResult, WebSearchToolOutput } from "@/lib/agent-tools/types";

function buildSearchModel() {
  return gateway("openai/gpt-5-mini");
}

function extractSourceUrl(source: { sourceType: string; url?: string; id?: string }): string {
  if ("url" in source && typeof source.url === "string") return source.url;
  if ("id" in source && typeof source.id === "string" && source.id.startsWith("http")) return source.id;
  return "";
}

async function executeSearch(query: string, recency?: SearchRecency): Promise<WebSearchResult[]> {
  const result = await generateText({
    model: buildSearchModel(),
    prompt: `Search: ${query}\n\nReturn the most relevant and recent results. Prioritize primary sources (official docs, changelogs, RFCs, maintainer posts) over aggregators and secondary commentary.`,
    tools: {
      perplexity_search: gateway.tools.perplexitySearch({
        maxResults: SEARCH_MAX_RESULTS,
        maxTokens: SEARCH_MAX_TOKENS,
        searchRecencyFilter: recency,
      }),
    },
    stopWhen: stepCountIs(2),
  });

  const searchResults: WebSearchResult[] = [];
  if (result.sources && result.sources.length > 0) {
    for (const source of result.sources) {
      const url = extractSourceUrl(source as { sourceType: string; url?: string; id?: string });
      searchResults.push({
        title: source.title ?? (url || "Untitled"),
        url,
        snippet: "",
      });
    }
  }

  if (result.text) {
    searchResults.push({
      title: "Search summary",
      url: "",
      snippet: result.text.slice(0, 2000),
    });
  }

  return searchResults;
}

export function buildWebSearchTool(budget: SearchBudget) {
  return tool({
    description:
      "Search the web for live information. Returns a list of results with titles, URLs, and a synthesized summary. " +
      "Use aggressively: search for recent changes, verify claims, find primary sources, discover adjacent topics. " +
      "Chain multiple searches — start broad, then narrow on specifics. Budget is limited so make queries specific and targeted.",
    inputSchema: z.object({
      query: z.string().min(3).max(200).describe("Specific search query — include key terms, version numbers, or date ranges for better results"),
      recency: z
        .enum(["day", "week", "month", "year"])
        .optional()
        .describe("Filter by content age. Use 'week' or 'month' for fast-moving topics, omit for evergreen queries"),
    }),
    execute: async ({ query, recency }): Promise<WebSearchToolOutput> => {
      if (budget.used >= budget.max) {
        console.warn(`[tool:web_search] Budget exhausted (${budget.max}/${budget.max}) – rejecting query: "${query}"`);
        return {
          error: `Search budget exhausted (${budget.max}/${budget.max} used). Work with what you have.`,
        };
      }
      budget.used++;
      const searchIndex = budget.used;
      console.info(`[tool:web_search] #${searchIndex}/${budget.max} query: "${query}" (recency: ${recency ?? "any"})`);
      const startMs = Date.now();

      try {
        const results = await executeSearch(query, recency);
        const elapsedMs = Date.now() - startMs;
        console.info(`[tool:web_search] #${searchIndex} returned ${results.length} results in ${elapsedMs}ms – remaining: ${budget.max - budget.used}`);
        return { results, budgetRemaining: budget.max - budget.used };
      } catch (error) {
        budget.used--;
        const elapsedMs = Date.now() - startMs;
        const message = error instanceof Error ? error.message : "Search failed";
        console.error(`[tool:web_search] #${searchIndex} FAILED in ${elapsedMs}ms: ${message}`);
        return { error: `Web search failed: ${message}` };
      }
    },
  });
}
