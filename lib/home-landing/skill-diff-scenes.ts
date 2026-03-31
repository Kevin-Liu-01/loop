/**
 * Static diff scenes for the landing hero reel.
 * Each scene represents a real skill being refreshed with realistic changes.
 */

export type DiffSceneLine = {
  type: "context" | "added" | "removed";
  value: string;
};

export type DiffScene = {
  skillTitle: string;
  category: string;
  versionFrom: string;
  versionTo: string;
  lines: DiffSceneLine[];
};

export const DIFF_SCENES: DiffScene[] = [
  {
    skillTitle: "Frontend Frontier",
    category: "frontend",
    versionFrom: "v6",
    versionTo: "v7",
    lines: [
      { type: "context", value: "## Motion System" },
      { type: "context", value: "" },
      { type: "removed", value: "- Use Motion `layoutId` for shared-element transitions" },
      { type: "added", value: "- Use Motion `layoutId` with `layout=\"position\"` for" },
      { type: "added", value: "  shared-element transitions (avoids scale distortion)" },
      { type: "context", value: "- Pair GSAP with Lenis for scroll-synchronized sequences" },
      { type: "context", value: "" },
      { type: "context", value: "## Tailwind v4" },
      { type: "context", value: "" },
      { type: "removed", value: "- Use `@theme` for design tokens in CSS" },
      { type: "added", value: "- Use `@theme inline` for tree-shakeable design tokens" },
      { type: "added", value: "- Prefer `@property` registered custom props for animated tokens" },
      { type: "context", value: "- Reject raw hex colors and arbitrary spacing" },
      { type: "context", value: "" },
      { type: "context", value: "## Three.js" },
      { type: "removed", value: "- Ship WebGL renderer for all 3D scenes" },
      { type: "added", value: "- Default to WebGPU renderer when supported, WebGL fallback" },
      { type: "added", value: "- Use `THREE.StorageTexture` for compute-shader workflows" },
    ],
  },
  {
    skillTitle: "Agent Orchestration",
    category: "a2a",
    versionFrom: "v4",
    versionTo: "v5",
    lines: [
      { type: "context", value: "## Handoff Protocol" },
      { type: "context", value: "" },
      { type: "removed", value: "- Pass full conversation history on agent handoff" },
      { type: "added", value: "- Use summarized context windows on handoff to reduce" },
      { type: "added", value: "  token usage (avg 73% reduction in transfer size)" },
      { type: "context", value: "- Validate tool schemas before cross-agent delegation" },
      { type: "context", value: "" },
      { type: "context", value: "## Tool Routing" },
      { type: "context", value: "" },
      { type: "removed", value: "- Route tool calls by exact name match" },
      { type: "added", value: "- Route tool calls by capability namespace + semantic match" },
      { type: "added", value: "- Support MCP `roots` for scoped tool access per agent" },
      { type: "context", value: "" },
      { type: "context", value: "## State Management" },
      { type: "removed", value: "- Store agent state in conversation metadata" },
      { type: "added", value: "- Use structured `AgentState` objects with version tags" },
      { type: "added", value: "- Checkpoint state before tool execution for rollback" },
    ],
  },
  {
    skillTitle: "Security Best Practices",
    category: "security",
    versionFrom: "v3",
    versionTo: "v4",
    lines: [
      { type: "context", value: "## Dependency Audit" },
      { type: "context", value: "" },
      { type: "removed", value: "- Run `npm audit` weekly in CI" },
      { type: "added", value: "- Run `npm audit --omit=dev` on every PR + weekly full scan" },
      { type: "added", value: "- Pin transitive deps with `overrides` for critical CVEs" },
      { type: "context", value: "- Block merges on critical/high severity findings" },
      { type: "context", value: "" },
      { type: "context", value: "## Auth Patterns" },
      { type: "context", value: "" },
      { type: "removed", value: "- Validate JWT in middleware, reject expired tokens" },
      { type: "added", value: "- Validate JWT in middleware with clock-skew tolerance (30s)" },
      { type: "added", value: "- Enforce `aud` claim check against expected audience" },
      { type: "context", value: "" },
      { type: "context", value: "## API Security" },
      { type: "removed", value: "- Rate limit public endpoints at 100 req/min" },
      { type: "added", value: "- Rate limit public endpoints at 60 req/min (sliding window)" },
      { type: "added", value: "- Add `X-RateLimit-*` headers for client visibility" },
    ],
  },
  {
    skillTitle: "Next.js Patterns",
    category: "frontend",
    versionFrom: "v7",
    versionTo: "v8",
    lines: [
      { type: "context", value: "## Data Fetching" },
      { type: "context", value: "" },
      { type: "removed", value: "- Use `unstable_cache` for server-side caching" },
      { type: "added", value: "- Use `'use cache'` directive (stable in Next.js 16)" },
      { type: "added", value: "- Apply `cacheLife('hours')` for time-based revalidation" },
      { type: "context", value: "- Prefer Server Components for initial data loads" },
      { type: "context", value: "" },
      { type: "context", value: "## Routing" },
      { type: "context", value: "" },
      { type: "removed", value: "- Use `middleware.ts` for all request interception" },
      { type: "added", value: "- Use `proxy.ts` for lightweight rewrites and redirects" },
      { type: "added", value: "- Reserve `middleware.ts` for auth and complex logic" },
      { type: "context", value: "" },
      { type: "context", value: "## Build" },
      { type: "removed", value: "- Use `--turbo` flag for development" },
      { type: "added", value: "- Turbopack is default in dev (no flag needed)" },
      { type: "added", value: "- Use `--turbopack` for production builds (beta)" },
    ],
  },
  {
    skillTitle: "Prompt Engineering",
    category: "a2a",
    versionFrom: "v5",
    versionTo: "v6",
    lines: [
      { type: "context", value: "## Chain-of-Thought" },
      { type: "context", value: "" },
      { type: "removed", value: "- Instruct model to \"think step by step\"" },
      { type: "added", value: "- Use structured reasoning blocks with `<thinking>` tags" },
      { type: "added", value: "- Set `reasoning_effort` param when available (OpenAI o-series)" },
      { type: "context", value: "- Verify reasoning trace before accepting final answer" },
      { type: "context", value: "" },
      { type: "context", value: "## Structured Output" },
      { type: "context", value: "" },
      { type: "removed", value: "- Use JSON mode with a schema description in prompt" },
      { type: "added", value: "- Use `response_format` with strict JSON schema enforcement" },
      { type: "added", value: "- Define Zod schemas, convert with `zodResponseFormat()`" },
      { type: "context", value: "" },
      { type: "context", value: "## Tool Definitions" },
      { type: "removed", value: "- Describe tools in system prompt as text" },
      { type: "added", value: "- Use native function-calling with typed parameters" },
      { type: "added", value: "- Include `strict: true` for guaranteed schema adherence" },
    ],
  },
];
