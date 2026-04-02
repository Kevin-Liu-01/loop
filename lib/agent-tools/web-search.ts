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
    prompt: `Search the web for: ${query}\n\nReturn the most relevant and recent results. Focus on authoritative sources.`,
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
      "Search the web for current information about this skill's domain. " +
      "Use when existing source signals are insufficient or you need to verify/expand on a topic. " +
      "Be strategic — you have a limited search budget.",
    inputSchema: z.object({
      query: z.string().min(3).max(200).describe("The search query"),
      recency: z
        .enum(["day", "week", "month", "year"])
        .optional()
        .describe("Filter results by content recency"),
    }),
    execute: async ({ query, recency }): Promise<WebSearchToolOutput> => {
      if (budget.used >= budget.max) {
        return {
          error: `Search budget exhausted (${budget.max}/${budget.max} used). Work with what you have.`,
        };
      }
      budget.used++;

      try {
        const results = await executeSearch(query, recency);
        return { results, budgetRemaining: budget.max - budget.used };
      } catch (error) {
        budget.used--;
        const message = error instanceof Error ? error.message : "Search failed";
        return { error: `Web search failed: ${message}` };
      }
    },
  });
}
