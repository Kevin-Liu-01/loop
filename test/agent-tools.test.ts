import assert from "node:assert/strict";
import { describe, mock, test } from "node:test";

import { buildAddSourceTool, type AddedSourceCollector } from "@/lib/agent-tools/add-source";
import { DEFAULT_SEARCH_BUDGET, MAX_ADDED_SOURCES_PER_RUN } from "@/lib/agent-tools/constants";
import { fetchPageContent } from "@/lib/agent-tools/fetch-page";
import type { SearchBudget } from "@/lib/agent-tools/types";
import { buildWebSearchTool } from "@/lib/agent-tools/web-search";
import type { CategorySlug, SourceDefinition } from "@/lib/types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const stubSources: SourceDefinition[] = [
  {
    id: "src-1",
    label: "Vercel Blog",
    url: "https://vercel.com/blog/rss.xml",
    kind: "blog",
    tags: ["vercel"],
  },
  {
    id: "src-2",
    label: "Next.js Docs",
    url: "https://nextjs.org/docs",
    kind: "docs",
    tags: ["nextjs"],
  },
];

const stubCategory: CategorySlug = "frontend";

// ---------------------------------------------------------------------------
// add_source tool
// ---------------------------------------------------------------------------

function execCtx() {
  return { toolCallId: "test", messages: [] as any[], abortSignal: undefined as any };
}

describe("buildAddSourceTool", () => {
  test("adds a valid source to the collector", async () => {
    const collector: AddedSourceCollector = { sources: [] };
    const addSource = buildAddSourceTool(stubSources, stubCategory, collector);

    const result = await addSource.execute!(
      {
        label: "React Blog",
        url: "https://react.dev/blog/rss.xml",
        kind: "rss",
        tags: ["react"],
        rationale: "Official React release announcements",
      },
      execCtx()
    );

    assert.ok("added" in result && result.added);
    assert.equal(collector.sources.length, 1);
    assert.equal(collector.sources[0]?.label, "React Blog");
    assert.equal(collector.sources[0]?.mode, "discover");
    assert.equal(collector.sources[0]?.trust, "community");
  });

  test("rejects duplicate URL matching an existing source", async () => {
    const collector: AddedSourceCollector = { sources: [] };
    const addSource = buildAddSourceTool(stubSources, stubCategory, collector);

    const result = await addSource.execute!(
      {
        label: "Vercel Blog Duplicate",
        url: "https://vercel.com/blog/rss.xml",
        kind: "rss",
        tags: ["vercel"],
        rationale: "Duplicate test",
      },
      execCtx()
    );

    assert.ok("error" in result);
    assert.ok(result.error.includes("already tracked"));
    assert.equal(collector.sources.length, 0);
  });

  test("rejects duplicate URL matching a previously added source", async () => {
    const collector: AddedSourceCollector = { sources: [] };
    const addSource = buildAddSourceTool(stubSources, stubCategory, collector);

    await addSource.execute!(
      {
        label: "React Blog",
        url: "https://react.dev/blog/rss.xml",
        kind: "rss",
        tags: ["react"],
        rationale: "First add",
      },
      execCtx()
    );

    const result = await addSource.execute!(
      {
        label: "React Blog Again",
        url: "https://react.dev/blog/rss.xml",
        kind: "rss",
        tags: ["react"],
        rationale: "Second add",
      },
      execCtx()
    );

    assert.ok("error" in result);
    assert.ok(result.error.includes("already tracked"));
    assert.equal(collector.sources.length, 1);
  });

  test("enforces per-run source limit", async () => {
    const collector: AddedSourceCollector = { sources: [] };
    const addSource = buildAddSourceTool([], stubCategory, collector);

    for (let i = 0; i < MAX_ADDED_SOURCES_PER_RUN; i++) {
      await addSource.execute!(
        {
          label: `Source ${i}`,
          url: `https://example.com/source-${i}`,
          kind: "blog",
          tags: ["test"],
          rationale: `Source ${i} rationale`,
        },
        execCtx()
      );
    }

    assert.equal(collector.sources.length, MAX_ADDED_SOURCES_PER_RUN);

    const result = await addSource.execute!(
      {
        label: "One too many",
        url: "https://example.com/overflow",
        kind: "blog",
        tags: ["test"],
        rationale: "Should be rejected",
      },
      execCtx()
    );

    assert.ok("error" in result);
    assert.ok(result.error.includes("limit reached"));
    assert.equal(collector.sources.length, MAX_ADDED_SOURCES_PER_RUN);
  });

  test("normalizes trailing slashes when checking duplicates", async () => {
    const sources: SourceDefinition[] = [
      { id: "s1", label: "Example", url: "https://example.com/docs/", kind: "docs", tags: [] },
    ];
    const collector: AddedSourceCollector = { sources: [] };
    const addSource = buildAddSourceTool(sources, stubCategory, collector);

    const result = await addSource.execute!(
      {
        label: "Example no slash",
        url: "https://example.com/docs",
        kind: "docs",
        tags: ["test"],
        rationale: "Same as existing minus trailing slash",
      },
      execCtx()
    );

    assert.ok("error" in result);
    assert.ok(result.error.includes("already tracked"));
  });
});

// ---------------------------------------------------------------------------
// fetch_page tool
// ---------------------------------------------------------------------------

describe("fetchPageContent", () => {
  test("strips HTML and extracts title and text", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () =>
      new Response(
        `<html><head><title>Test Page</title></head><body>
          <nav>Skip nav</nav>
          <main><p>Hello world. This is the content.</p></main>
          <footer>Skip footer</footer>
        </body></html>`,
        { status: 200 }
      )
    ) as any;

    try {
      const result = await fetchPageContent("https://example.com/test");

      assert.ok(!("error" in result));
      assert.equal(result.title, "Test Page");
      assert.ok(result.content.includes("Hello world"));
      assert.ok(!result.content.includes("Skip nav"));
      assert.ok(!result.content.includes("Skip footer"));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("returns error for non-200 response", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () =>
      new Response("Not Found", { status: 404, statusText: "Not Found" })
    ) as any;

    try {
      const result = await fetchPageContent("https://example.com/missing");

      assert.ok("error" in result);
      assert.ok(result.error.includes("404"));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("truncates content to maxChars", async () => {
    const originalFetch = globalThis.fetch;
    const longBody = `<html><head><title>Long</title></head><body>${"x".repeat(10000)}</body></html>`;
    globalThis.fetch = mock.fn(async () =>
      new Response(longBody, { status: 200 })
    ) as any;

    try {
      const result = await fetchPageContent("https://example.com/long", 10000, 500);

      assert.ok(!("error" in result));
      assert.ok(result.content.length <= 500);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

// ---------------------------------------------------------------------------
// web_search tool (budget tracking)
// ---------------------------------------------------------------------------

describe("buildWebSearchTool budget enforcement", () => {
  test("budget tracks usage and blocks when exhausted", async () => {
    const budget: SearchBudget = { max: 1, used: 0 };
    const searchTool = buildWebSearchTool(budget);

    budget.used = budget.max;

    const result = await searchTool.execute!(
      { query: "test query" },
      execCtx()
    );

    assert.ok("error" in result);
    assert.ok(result.error.includes("budget exhausted"));
  });

  test("default budget matches constant", () => {
    assert.equal(DEFAULT_SEARCH_BUDGET, 5);
  });
});

// ---------------------------------------------------------------------------
// Integration: mergeDiscoveredSources (from refresh.ts logic)
// ---------------------------------------------------------------------------

describe("source merging logic", () => {
  function mergeDiscoveredSources(
    existing: SourceDefinition[],
    discovered: SourceDefinition[]
  ): SourceDefinition[] {
    if (discovered.length === 0) return existing;
    const existingUrls = new Set(
      existing.map((s) => s.url.replace(/\/+$/, "").toLowerCase())
    );
    const newSources = discovered.filter(
      (s) => !existingUrls.has(s.url.replace(/\/+$/, "").toLowerCase())
    );
    return [...existing, ...newSources];
  }

  test("merges new sources without duplicates", () => {
    const discovered: SourceDefinition[] = [
      { id: "new-1", label: "New Blog", url: "https://new.dev/blog", kind: "blog", tags: ["new"] },
      { id: "dup-1", label: "Vercel Blog Dup", url: "https://vercel.com/blog/rss.xml", kind: "blog", tags: ["vercel"] },
    ];

    const merged = mergeDiscoveredSources(stubSources, discovered);

    assert.equal(merged.length, 3);
    assert.ok(merged.some((s) => s.label === "New Blog"));
    assert.equal(
      merged.filter((s) => s.url.includes("vercel.com")).length,
      1
    );
  });

  test("returns existing unchanged when no discoveries", () => {
    const merged = mergeDiscoveredSources(stubSources, []);
    assert.equal(merged, stubSources);
  });
});
