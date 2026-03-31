import type { CreateSkillInput } from "@/lib/db/skills";

type SeedSkill = Omit<CreateSkillInput, "origin"> & {
  origin?: CreateSkillInput["origin"];
};

// ---------------------------------------------------------------------------
// A2A / Agent Skills (5)
// ---------------------------------------------------------------------------

export const a2a: SeedSkill[] = [
  // -----------------------------------------------------------------------
  // 1. Agent Orchestration
  // -----------------------------------------------------------------------
  {
    slug: "agent-orchestration",
    title: "OpenAI Agent Orchestration",
    description:
      "OpenAI and Anthropic multi-agent patterns, handoff protocols, tool routing, state management, and coordination strategies for AI agent systems.",
    category: "a2a",
    accent: "signal-gold",
    featured: true,
    visibility: "public",
    tags: ["agents", "orchestration", "handoff", "multi-agent", "patterns"],
    body: `# OpenAI Agent Orchestration

Design and implement multi-agent systems that coordinate specialized AI agents to solve complex tasks through handoffs, tool routing, and shared state.

## When to use

- Building a system where one LLM call is insufficient (e.g. research → plan → execute → review)
- Splitting work across specialized agents (code agent, search agent, reviewer agent)
- Implementing human-in-the-loop workflows with approval gates
- Creating pipelines where upstream agent output feeds downstream agent input
- Need deterministic routing between agents based on task classification

## When NOT to use

- A single system prompt with tools can handle the entire workflow
- The task is a simple one-shot completion (summarize, translate, classify)
- You only need function calling without inter-agent communication
- Latency constraints prohibit multi-turn agent loops (< 2s budget)
- The "agents" are really just prompt variants — use a single agent with conditional instructions instead

## Core concepts

### Agent types

| Type | Role | Example |
|------|------|---------|
| Router | Classifies and dispatches to specialists | Triage agent for support tickets |
| Specialist | Handles a narrow domain with focused tools | SQL agent, code-review agent |
| Orchestrator | Manages multi-step pipelines and state | Project planner that sequences sub-agents |
| Guardrail | Validates outputs before they reach the user | Safety classifier, PII redactor |

### Handoff protocol

Handoffs transfer control from one agent to another. The handoff carries:
- **target agent** — which specialist to invoke
- **context** — accumulated conversation state
- **instructions** — what the target should focus on
- **metadata** — routing reason, priority, constraints

\`\`\`typescript
// OpenAI Agents SDK handoff definition
import { Agent, handoff } from "@openai/agents";

const researchAgent = new Agent({
  name: "research_agent",
  instructions: "You find and summarize relevant information.",
  tools: [webSearch, docRetrieval],
});

const codeAgent = new Agent({
  name: "code_agent",
  instructions: "You write and review code based on research findings.",
  tools: [fileWrite, linter, testRunner],
});

const triageAgent = new Agent({
  name: "triage_agent",
  instructions: \\\`Classify the user request:
- If it needs research → hand off to research_agent
- If it needs code → hand off to code_agent
- If unclear → ask a clarifying question\\\`,
  handoffs: [handoff(researchAgent), handoff(codeAgent)],
});
\`\`\`

### State management patterns

\`\`\`
┌─────────────┐     context      ┌─────────────────┐
│   Router     │ ──────────────> │  Specialist A    │
│   Agent      │                 │  (research)      │
└──────┬───── ┘                 └────────┬─────────┘
       │                                  │ result
       │    ┌─────────────────────────────┘
       ▼    ▼
┌─────────────┐     context      ┌─────────────────┐
│ Orchestrator │ ──────────────> │  Specialist B    │
│   (merge)    │                 │  (code)          │
└──────┬──────┘                 └────────┬─────────┘
       │                                  │ result
       ▼                                  ▼
┌─────────────────────────────────────────────────┐
│                 Guardrail Agent                   │
│            (validate final output)                │
└──────────────────────────────────────────────────┘
\`\`\`

**Shared state approaches:**

| Approach | Pros | Cons |
|----------|------|------|
| Conversation history passthrough | Simple, stateless agents | Token bloat on long chains |
| External store (Redis/DB) | Persistent, queryable | Adds infra dependency |
| Structured context object | Typed, compact | Requires schema discipline |
| Tool-based state | Agents read/write via tools | Natural LLM interface |

## Workflow

### Step 1: Define your agent graph

Map out which agents exist and how control flows between them.

\`\`\`typescript
// Agent graph as config
const agentGraph = {
  entrypoint: "triage",
  agents: {
    triage: {
      handoffs: ["research", "code", "clarify"],
      tools: [],
    },
    research: {
      handoffs: ["code", "triage"],
      tools: ["web_search", "doc_retrieval"],
    },
    code: {
      handoffs: ["review"],
      tools: ["file_write", "shell_exec", "test_run"],
    },
    review: {
      handoffs: ["code", "triage"],
      tools: ["lint", "test_run"],
    },
  },
  guardrails: ["safety_check", "pii_redact"],
};
\`\`\`

### Step 2: Implement agents with focused instructions

\`\`\`typescript
import { Agent, run } from "@openai/agents";

const reviewAgent = new Agent({
  name: "review_agent",
  instructions: \\\`You review code changes for:
1. Correctness — does it solve the stated problem?
2. Security — any injection, auth bypass, or data leak?
3. Performance — unnecessary loops, missing indexes, N+1?
4. Style — consistent with project conventions?

If issues found, hand back to code_agent with specific feedback.
If approved, return the final result to the user.\\\`,
  handoffs: [handoff(codeAgent)],
  tools: [lintTool, testRunTool],
});
\`\`\`

### Step 3: Run the orchestration loop

\`\`\`typescript
import { run } from "@openai/agents";

async function orchestrate(userMessage: string) {
  const result = await run(triageAgent, userMessage, {
    maxTurns: 15,
    stream: true,
  });

  for await (const event of result) {
    if (event.type === "agent_handoff") {
      console.log(\\\`Handoff: \\\${event.from} → \\\${event.to}\\\`);
    }
    if (event.type === "tool_call") {
      console.log(\\\`Tool: \\\${event.name}(\\\${JSON.stringify(event.args)})\\\`);
    }
    if (event.type === "message") {
      yield event.content;
    }
  }
}
\`\`\`

### Step 4: Add guardrails

\`\`\`typescript
import { Agent, InputGuardrail, OutputGuardrail } from "@openai/agents";

const safetyGuardrail: InputGuardrail = {
  name: "safety_check",
  execute: async (input) => {
    const result = await classifySafety(input);
    if (result.category === "unsafe") {
      return { blocked: true, reason: result.reason };
    }
    return { blocked: false };
  },
};

const triageAgent = new Agent({
  name: "triage",
  instructions: "Route user requests to the right specialist.",
  inputGuardrails: [safetyGuardrail],
  handoffs: [handoff(researchAgent), handoff(codeAgent)],
});
\`\`\`

## Examples

### Example 1: Customer support pipeline

\`\`\`typescript
const supportTriage = new Agent({
  name: "support_triage",
  instructions: \\\`Classify the support ticket:
- billing → billing_agent
- technical → tech_agent
- account → account_agent
- unknown → ask clarifying question\\\`,
  handoffs: [
    handoff(billingAgent),
    handoff(techAgent),
    handoff(accountAgent),
  ],
});

// Each specialist has domain-specific tools
const billingAgent = new Agent({
  name: "billing_agent",
  instructions: "Handle billing inquiries. You can look up invoices and issue refunds.",
  tools: [lookupInvoice, issueRefund, updateSubscription],
});
\`\`\`

### Example 2: Code generation with review loop

\`\`\`typescript
async function codeWithReview(task: string) {
  let result = await run(codeAgent, task);
  let attempts = 0;

  while (attempts < 3) {
    const review = await run(reviewAgent, result.output);
    if (review.output.includes("APPROVED")) break;
    result = await run(codeAgent, \\\`Fix these issues:\\n\\\${review.output}\\\`);
    attempts++;
  }

  return result.output;
}
\`\`\`

### Example 3: Anthropic tool_use with agent routing

\`\`\`typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

async function anthropicAgentRouter(userMessage: string) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: \\\`You are a router. Analyze the request and call the
appropriate agent tool. Always provide a clear routing reason.\\\`,
    tools: [
      {
        name: "dispatch_to_agent",
        description: "Route to a specialist agent",
        input_schema: {
          type: "object" as const,
          properties: {
            agent: { type: "string", enum: ["research", "code", "review"] },
            context: { type: "string" },
            priority: { type: "string", enum: ["low", "medium", "high"] },
          },
          required: ["agent", "context"],
        },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  return response;
}
\`\`\`

## Decision tree

\`\`\`
Is one LLM call enough?
├── Yes → Single agent with tools (no orchestration needed)
└── No
    ├── Is the flow linear (A → B → C)?
    │   ├── Yes → Pipeline pattern (chain agents sequentially)
    │   └── No
    │       ├── Does routing depend on input classification?
    │       │   ├── Yes → Router + Specialists pattern
    │       │   └── No
    │       │       ├── Do agents need to iterate (code → review → fix)?
    │       │       │   ├── Yes → Loop pattern with max iterations
    │       │       │   └── No → Parallel fan-out pattern
    │       │       └── Need human approval mid-flow?
    │       │           ├── Yes → Add approval gates between stages
    │       │           └── No → Fully autonomous pipeline
    └── Need guardrails?
        ├── Yes → Wrap entry/exit with guardrail agents
        └── No → Direct orchestration
\`\`\`

## Edge cases and gotchas

- **Infinite loops**: Always set \`maxTurns\` — agents handing off to each other can loop forever
- **Context bloat**: Each handoff passes the full conversation; for long chains, summarize before handoff
- **Error propagation**: If a specialist fails, the orchestrator must handle the error — don't let it silently drop
- **Model mismatch**: Router agents can use cheaper/faster models; specialists may need more capable ones
- **Streaming across handoffs**: The stream must indicate which agent is currently responding
- **Tool overlap**: If two specialists share a tool, ensure they don't conflict on shared state
- **Latency multiplication**: Each handoff adds a full LLM round-trip; budget 2-5s per hop
- **Guardrail ordering**: Input guardrails run before the agent; output guardrails after — both can block

## Evaluation criteria

| Criterion | How to measure |
|-----------|---------------|
| Routing accuracy | % of requests dispatched to the correct specialist |
| Task completion rate | % of end-to-end tasks resolved without human escalation |
| Handoff efficiency | Average number of handoffs per task (lower is better) |
| Latency budget | Total wall-clock time from input to final output |
| Error recovery rate | % of tool failures gracefully retried or escalated |
| Context preservation | Does the specialist have all needed info after handoff? |
| Guardrail precision | False positive rate on blocked legitimate requests |`,
    agentDocs: {
      codex: `# Codex — Agent Orchestration

When building multi-agent systems in Codex:

## Setup
- Use the OpenAI Agents SDK: \`@openai/agents\`
- Define each agent as a separate \`Agent\` instance with focused instructions
- Use \`handoff()\` to declare valid transitions between agents

## Implementation rules
- Always set \`maxTurns\` on \`run()\` to prevent infinite loops — default to 10-15
- Keep agent instructions under 500 tokens for routing agents, up to 2000 for specialists
- Use structured context objects passed via tool calls, not raw conversation dumps
- Prefer the Agents SDK \`run()\` with streaming for real-time feedback
- Each agent should have 2-5 tools max — more causes selection confusion
- Log every handoff event for debugging: \`event.type === "agent_handoff"\`

## Guardrails
- Add input guardrails on the entry agent to catch unsafe/invalid requests early
- Add output guardrails on the final agent to validate response quality
- Guardrails should be fast (< 500ms) — use classification models, not full generation

## Testing
- Test each agent in isolation before wiring the orchestration
- Mock tool responses for deterministic integration tests
- Validate the full loop with at least 20 representative user inputs

## Anti-patterns
- Don't pass entire conversation history through 5+ handoffs — summarize
- Don't use the same generic instructions for all agents
- Don't skip guardrails because "the model is good enough"`,
      cursor: `# Cursor — Agent Orchestration

When working with agent orchestration code in Cursor:

## Code organization
- One file per agent definition (\`agents/triage.ts\`, \`agents/research.ts\`, etc.)
- Shared tools in a \`tools/\` directory, imported by agents that need them
- Agent graph config in a central \`agent-graph.ts\` file
- Guardrails in \`guardrails/\` directory

## Autocomplete hints
- Import from \`@openai/agents\` for Agent, handoff, run, InputGuardrail, OutputGuardrail
- Agent instructions are template literals — use Cursor's multi-line editing
- Tool definitions follow the OpenAI function calling schema (name, description, parameters)

## Debugging patterns
- Use the Agents SDK tracing: enable \`OPENAI_AGENTS_TRACE=true\` env var
- Stream events give you \`agent_handoff\`, \`tool_call\`, \`message\` types to inspect
- Check \`maxTurns\` exhaustion — if the run ends without a final message, the loop hit the cap

## Common edits
- Adding a new agent: define Agent → add handoff to parent → update graph config
- Adding a guardrail: implement the \`execute\` function → attach to agent's input/output guardrails
- Changing routing logic: update the triage agent's instructions — routing is prompt-driven

## Performance
- Router agents: use \`gpt-4o-mini\` for fast classification
- Specialist agents: use \`gpt-4o\` or \`o3\` for complex reasoning
- Guardrail agents: use \`gpt-4o-mini\` for speed`,
      claude: `# Claude Code — Agent Orchestration

When implementing agent orchestration with Claude:

## Anthropic multi-agent approach
- Claude doesn't have a native "Agents SDK" — use tool_use with routing tools
- Define a \`dispatch_to_agent\` tool that selects the target agent and passes context
- Each "agent" is a separate \`client.messages.create()\` call with a specialized system prompt

## Implementation pattern
\`\`\`
Router call → tool_use: dispatch_to_agent(agent="code", context="...")
  → Specialist call with specialist system prompt + context
    → tool_use results or final response
\`\`\`

## Key differences from OpenAI Agents SDK
- No built-in handoff primitive — implement handoffs as tool calls
- No built-in guardrails — implement as pre/post processing functions
- No streaming handoff events — track state manually between calls
- Context must be serialized explicitly between agent calls

## Best practices
- Use extended thinking for complex routing decisions
- Keep each agent's system prompt focused on one domain
- Implement retry logic around each \`messages.create()\` call
- Use structured tool outputs (\`input_schema\`) to enforce handoff contracts

## Anti-patterns
- Don't try to make one giant system prompt act as multiple agents
- Don't skip context passing between calls — each call is stateless
- Don't ignore tool_use blocks in the response — they are the routing signal`,
      agents: `# AGENTS.md — Agent Orchestration

## Review checklist for multi-agent systems

### Architecture
- [ ] Is there a clear agent graph showing all agents and valid handoffs?
- [ ] Is each agent's responsibility narrow and well-defined?
- [ ] Are there maximum turn/iteration limits on all loops?
- [ ] Is the entry point agent a lightweight router, not a heavyweight specialist?

### State management
- [ ] How is context passed between agents? (conversation history, structured object, external store)
- [ ] Is context summarized before long handoff chains to prevent token bloat?
- [ ] Are shared resources (files, DB) accessed through tools, not implicit state?

### Error handling
- [ ] What happens when a specialist agent fails or returns an invalid response?
- [ ] Is there a fallback path when routing is ambiguous?
- [ ] Are tool failures retried with backoff?

### Guardrails
- [ ] Is there an input guardrail on the entry agent?
- [ ] Is there an output guardrail on the final response?
- [ ] Are guardrails fast enough (< 500ms) to not dominate latency?

### Observability
- [ ] Are handoff events logged with from/to agent and routing reason?
- [ ] Are tool calls logged with name, arguments, and result?
- [ ] Is total latency tracked per orchestration run?

### Testing
- [ ] Is each agent tested in isolation with mocked tools?
- [ ] Is the full orchestration tested end-to-end with representative inputs?
- [ ] Are edge cases tested: max turns hit, all specialists fail, ambiguous routing?`
    }
  },

  // -----------------------------------------------------------------------
  // 2. MCP Development
  // -----------------------------------------------------------------------
  {
    slug: "mcp-development",
    title: "Anthropic MCP Development",
    description:
      "Building Anthropic Model Context Protocol servers and clients — tool definitions, resource exposure, transport layers, and integration patterns.",
    category: "a2a",
    accent: "signal-gold",
    featured: true,
    visibility: "public",
    tags: ["mcp", "protocol", "tools", "server", "integration"],
    body: `# Anthropic MCP Development

Build Model Context Protocol (MCP) servers that expose tools and resources to AI agents, and clients that consume them across transport layers.

## When to use

- Exposing an API, database, or service to AI agents through a standardized protocol
- Building IDE integrations (Cursor, VS Code) that need tool access
- Creating reusable tool servers that work across multiple AI clients
- Connecting AI agents to internal systems (CRMs, ticketing, monitoring)
- Need a protocol-level contract between tool providers and AI consumers

## When NOT to use

- The tool is only used by one agent and will never be reused — just define it inline
- You need real-time bidirectional streaming (MCP is request/response oriented)
- The integration is a simple REST API call that doesn't benefit from protocol abstraction
- You're building a one-off script, not a reusable server
- The target client doesn't support MCP (check compatibility first)

## Core concepts

### Architecture

\`\`\`
┌──────────────────┐          ┌──────────────────┐
│    AI Client      │          │    MCP Server     │
│  (Cursor, Claude, │  JSON-RPC│  (your service)   │
│   Codex, etc.)    │ ◄──────►│                    │
│                    │  over    │  ┌──── Tools ────┐│
│  Sends tool calls  │  stdio/  │  │ search()      ││
│  Reads resources   │  HTTP/   │  │ create()      ││
│  Subscribes to     │  SSE     │  │ update()      ││
│  notifications     │          │  └───────────────┘│
│                    │          │  ┌── Resources ──┐│
│                    │          │  │ config://      ││
│                    │          │  │ data://        ││
│                    │          │  └───────────────┘│
└──────────────────┘          └──────────────────┘
\`\`\`

### MCP primitives

| Primitive | Direction | Purpose |
|-----------|-----------|---------|
| Tools | Client → Server | Functions the AI can call (search, create, update) |
| Resources | Client → Server | Read-only data the AI can access (configs, schemas, docs) |
| Prompts | Client → Server | Pre-built prompt templates the AI can use |
| Notifications | Server → Client | Real-time updates (progress, state changes) |

### Transport layers

| Transport | When to use | Setup complexity |
|-----------|-------------|-----------------|
| stdio | Local dev, CLI tools, IDE plugins | Low |
| HTTP + SSE | Remote servers, cloud deployment | Medium |
| Streamable HTTP | Modern remote with bidirectional streaming | Medium |

## Workflow

### Step 1: Scaffold the server

\`\`\`typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "my-service",
  version: "1.0.0",
  capabilities: {
    tools: {},
    resources: {},
  },
});
\`\`\`

### Step 2: Define tools with typed schemas

\`\`\`typescript
server.tool(
  "search_issues",
  "Search for issues by query string",
  {
    query: z.string().describe("Search query"),
    status: z.enum(["open", "closed", "all"]).default("open"),
    limit: z.number().min(1).max(100).default(20),
  },
  async ({ query, status, limit }) => {
    const issues = await db.issues.search({ query, status, limit });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(issues, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "create_issue",
  "Create a new issue in the tracker",
  {
    title: z.string().min(1).max(200),
    body: z.string().optional(),
    labels: z.array(z.string()).default([]),
    assignee: z.string().optional(),
  },
  async ({ title, body, labels, assignee }) => {
    const issue = await db.issues.create({ title, body, labels, assignee });

    return {
      content: [
        {
          type: "text",
          text: \\\`Created issue #\\\${issue.id}: \\\${issue.title}\\\`,
        },
      ],
    };
  }
);
\`\`\`

### Step 3: Expose resources

\`\`\`typescript
server.resource(
  "project-config",
  "config://project",
  "Current project configuration",
  async () => {
    const config = await loadProjectConfig();
    return {
      contents: [
        {
          uri: "config://project",
          mimeType: "application/json",
          text: JSON.stringify(config, null, 2),
        },
      ],
    };
  }
);

// Dynamic resource with URI template
server.resource(
  "issue-detail",
  "issues://{id}",
  "Detailed view of a specific issue",
  async (uri) => {
    const id = uri.pathname;
    const issue = await db.issues.getById(id);
    return {
      contents: [
        {
          uri: uri.toString(),
          mimeType: "application/json",
          text: JSON.stringify(issue, null, 2),
        },
      ],
    };
  }
);
\`\`\`

### Step 4: Wire up transport and start

\`\`\`typescript
// stdio transport (for local/CLI use)
async function startStdio() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// HTTP + SSE transport (for remote use)
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

function startHttp(port: number) {
  const app = express();
  const transports = new Map<string, SSEServerTransport>();

  app.get("/sse", async (req, res) => {
    const transport = new SSEServerTransport("/messages", res);
    transports.set(transport.sessionId, transport);
    await server.connect(transport);
  });

  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports.get(sessionId);
    if (!transport) return res.status(404).end();
    await transport.handlePostMessage(req, res);
  });

  app.listen(port);
}
\`\`\`

### Step 5: Configure client integration

\`\`\`json
{
  "mcpServers": {
    "my-service": {
      "command": "npx",
      "args": ["-y", "my-mcp-service"],
      "env": {
        "API_KEY": "sk-..."
      }
    }
  }
}
\`\`\`

## Examples

### Example 1: Database explorer MCP server

\`\`\`typescript
const dbServer = new McpServer({
  name: "db-explorer",
  version: "1.0.0",
});

dbServer.tool("query", "Run a read-only SQL query", {
  sql: z.string().describe("SELECT query to execute"),
}, async ({ sql }) => {
  if (!sql.trim().toUpperCase().startsWith("SELECT")) {
    return {
      content: [{ type: "text", text: "Error: Only SELECT queries allowed" }],
      isError: true,
    };
  }
  const rows = await pool.query(sql);
  return {
    content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
  };
});

dbServer.resource("schema", "db://schema", "Database schema", async () => ({
  contents: [{
    uri: "db://schema",
    mimeType: "application/json",
    text: JSON.stringify(await getSchemaInfo()),
  }],
}));
\`\`\`

### Example 2: GitHub integration server

\`\`\`typescript
const ghServer = new McpServer({ name: "github", version: "1.0.0" });

ghServer.tool("list_prs", "List open pull requests", {
  repo: z.string().describe("owner/repo format"),
  state: z.enum(["open", "closed", "all"]).default("open"),
}, async ({ repo, state }) => {
  const [owner, name] = repo.split("/");
  const prs = await octokit.pulls.list({ owner, repo: name, state });
  return {
    content: [{
      type: "text",
      text: prs.data.map(pr =>
        \\\`#\\\${pr.number} \\\${pr.title} (\\\${pr.user?.login})\\\`
      ).join("\\n"),
    }],
  };
});

ghServer.tool("review_pr", "Add a review comment to a PR", {
  repo: z.string(),
  pr_number: z.number(),
  body: z.string(),
  event: z.enum(["APPROVE", "REQUEST_CHANGES", "COMMENT"]),
}, async ({ repo, pr_number, body, event }) => {
  const [owner, name] = repo.split("/");
  await octokit.pulls.createReview({
    owner, repo: name, pull_number: pr_number, body, event,
  });
  return {
    content: [{ type: "text", text: \\\`Review submitted on PR #\\\${pr_number}\\\` }],
  };
});
\`\`\`

### Example 3: Prompt templates

\`\`\`typescript
server.prompt(
  "code-review",
  "Review code changes with specific focus areas",
  {
    focus: z.enum(["security", "performance", "style", "all"]).default("all"),
    language: z.string().default("typescript"),
  },
  async ({ focus, language }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: \\\`Review the following \\\${language} code for \\\${focus} issues.
Provide specific line-level feedback with severity (critical/warning/info).\\\`,
        },
      },
    ],
  })
);
\`\`\`

## Decision tree

\`\`\`
Do you need to expose functionality to AI agents?
├── No → Regular API, no MCP needed
└── Yes
    ├── Is it read-only data?
    │   ├── Yes → Use MCP Resources
    │   └── No → Use MCP Tools
    ├── Will multiple clients consume it?
    │   ├── Yes → MCP server (reusable across Cursor, Claude, Codex)
    │   └── No → Consider inline tool definition first
    ├── Local or remote?
    │   ├── Local (IDE plugin, CLI) → stdio transport
    │   └── Remote (cloud, shared) → HTTP + SSE transport
    └── Need auth?
        ├── API key → Pass via env vars in MCP config
        ├── OAuth → Implement OAuth flow in server, token in session
        └── None → Direct connection
\`\`\`

## Edge cases and gotchas

- **Schema validation**: Zod schemas in tool definitions are your contract — be strict with types and add \`.describe()\` to every field
- **Error responses**: Return \`{ isError: true }\` in tool results so the AI knows the call failed
- **Timeout handling**: Long-running tools should report progress via notifications, not block
- **stdio buffering**: When using stdio transport, ensure your process doesn't buffer stdout — use \`process.stdout.write\` or disable buffering
- **Resource freshness**: Resources are read on demand — if data changes frequently, document the staleness window
- **Tool naming**: Use snake_case for tool names, keep them short and descriptive — the AI reads the name for routing
- **Capability negotiation**: Declare only the capabilities your server supports — don't claim tools if you only have resources
- **Session management**: HTTP transport requires session tracking — use the sessionId from SSE connections
- **Auth in env vars**: Never hardcode credentials — always pass via the \`env\` block in MCP config
- **Package naming**: For npm-published servers, prefix with \`mcp-\` for discoverability

## Evaluation criteria

| Criterion | How to measure |
|-----------|---------------|
| Tool coverage | % of API surface exposed as MCP tools |
| Schema quality | All parameters have types, descriptions, and validation |
| Error handling | Tool failures return isError with actionable messages |
| Transport compatibility | Works on both stdio and HTTP transports |
| Response latency | Tool calls complete in < 2s for interactive use |
| Resource freshness | Resources reflect current state within documented SLA |
| Client compatibility | Tested with at least 2 MCP clients (Cursor + Claude) |`,
    agentDocs: {
      codex: `# Codex — MCP Development

When building MCP servers in Codex:

## Setup
- Install: \`@modelcontextprotocol/sdk\` and \`zod\` for schema validation
- Use the \`McpServer\` class, not the lower-level \`Server\` class
- Pick transport: \`StdioServerTransport\` for local, \`SSEServerTransport\` for remote

## Tool definitions
- Every tool parameter must have a \`.describe()\` — the AI reads these for tool selection
- Return structured JSON in \`content[].text\` — the AI parses it
- Return \`{ isError: true }\` on failure so the AI can retry or fall back
- Keep tool count under 15 per server — more causes selection confusion

## Resource definitions
- Use URI schemes that describe the domain: \`db://\`, \`config://\`, \`docs://\`
- Resources are read-only — if the AI needs to write, use a tool instead
- Support URI templates for dynamic resources: \`issues://{id}\`

## Testing
- Test tools by calling \`server.tool()\` handler directly with mock input
- Test transport by running the server and sending JSON-RPC messages
- Validate error cases: missing params, invalid types, auth failures

## Publishing
- Name packages \`mcp-{service}\` for npm discoverability
- Include a \`README.md\` with the MCP config JSON snippet
- Document all tools and resources with examples`,
      cursor: `# Cursor — MCP Development

When working with MCP server code in Cursor:

## Project structure
- \`src/server.ts\` — McpServer setup and transport wiring
- \`src/tools/\` — one file per tool or tool group
- \`src/resources/\` — one file per resource or resource group
- \`src/prompts/\` — prompt templates if used
- \`src/lib/\` — shared utilities, DB clients, API clients

## Configuration
- MCP servers in Cursor are configured in \`.cursor/mcp.json\` or \`~/.cursor/mcp.json\`
- Use the \`command\` + \`args\` format for stdio servers
- Use the \`url\` format for remote HTTP servers
- Pass secrets via the \`env\` block — never commit them

## Debugging
- Check MCP server output in Cursor's terminal panel
- Use \`console.error()\` for debug logging (stdout is reserved for JSON-RPC)
- Enable MCP logging: set \`DEBUG=mcp:*\` in the env block
- Read tool descriptors at \`~/.cursor/projects/{project}/mcps/{server}/tools/\`

## Common patterns
- Wrap existing REST APIs as MCP tools — one tool per endpoint
- Expose database schemas as resources for context
- Use prompt templates for complex multi-step instructions

## Gotchas
- Cursor restarts MCP servers on config change — ensure clean shutdown
- stdio servers must not write anything to stdout except JSON-RPC messages
- Tool names are globally scoped — prefix with your server name if conflicts arise`,
      claude: `# Claude Code — MCP Development

When building or consuming MCP servers with Claude:

## Server implementation
- Claude Desktop supports MCP natively — configure in \`claude_desktop_config.json\`
- Use stdio transport for local servers, HTTP + SSE for remote
- Claude reads tool descriptions carefully — invest in clear, concise descriptions

## Client-side consumption
- Claude's tool_use messages trigger MCP tool calls transparently
- The MCP client SDK handles JSON-RPC framing — you write the handler logic
- Use \`@modelcontextprotocol/sdk/client\` for programmatic MCP client usage

## Key differences from direct tool_use
- MCP tools are discovered at connection time, not defined per-request
- Tool schemas are Zod-validated on the server, not JSON Schema in the prompt
- Resources provide read-only context without consuming tool call turns
- Notifications allow server-initiated updates (progress bars, state changes)

## Implementation tips
- Start with 3-5 tools — validate the workflow before adding more
- Test with Claude Desktop first (easiest MCP integration to debug)
- Use \`server.notification()\` for long-running operations
- Return errors as structured objects: \`{ error: "message", code: "NOT_FOUND" }\`

## Pitfalls
- Don't use \`console.log()\` in stdio servers — it corrupts the JSON-RPC stream
- Don't assume the client caches resources — each read is a fresh call
- Don't skip capability negotiation — declare exactly what you support`,
      agents: `# AGENTS.md — MCP Development

## Review checklist for MCP servers

### Tool quality
- [ ] Every tool has a clear, concise description (< 100 chars)
- [ ] Every parameter has a type, description, and sensible default
- [ ] Error responses use \`isError: true\` with actionable messages
- [ ] No tool does both read and write — split into separate tools
- [ ] Tool count is under 15 per server

### Resource quality
- [ ] Resources use descriptive URI schemes
- [ ] Resource content is JSON with consistent structure
- [ ] Freshness SLA is documented (real-time, cached, manual refresh)

### Security
- [ ] Credentials are passed via env vars, never hardcoded
- [ ] Read-only tools cannot be tricked into mutations (SQL injection, etc.)
- [ ] Input validation rejects malformed parameters before hitting the backend
- [ ] Auth tokens are scoped to minimum required permissions

### Transport
- [ ] stdio server doesn't write non-JSON-RPC to stdout
- [ ] HTTP server handles session lifecycle (create, use, cleanup)
- [ ] Server handles graceful shutdown on SIGTERM/SIGINT

### Testing
- [ ] Each tool is tested with valid input, invalid input, and edge cases
- [ ] Transport layer is tested with raw JSON-RPC messages
- [ ] Server starts and responds to \`initialize\` within 5 seconds

### Documentation
- [ ] README includes MCP config JSON snippet for quick setup
- [ ] All tools and resources are documented with examples
- [ ] Required env vars are listed with descriptions`
    }
  },

  // -----------------------------------------------------------------------
  // 3. Prompt Engineering
  // -----------------------------------------------------------------------
  {
    slug: "prompt-engineering",
    title: "OpenAI Prompt Engineering",
    description:
      "System prompts for OpenAI and Claude, few-shot examples, chain-of-thought, structured outputs, and prompt optimization for production AI.",
    category: "a2a",
    accent: "signal-gold",
    featured: true,
    visibility: "public",
    tags: ["prompts", "system-prompt", "few-shot", "chain-of-thought", "llm"],
    body: `# OpenAI Prompt Engineering

Craft system prompts, few-shot examples, chain-of-thought strategies, and structured output schemas for production AI systems on OpenAI and Anthropic.

## When to use

- Writing or refining system prompts for chat applications
- Designing few-shot examples that steer model behavior
- Implementing chain-of-thought reasoning for complex tasks
- Extracting structured data from unstructured inputs
- Optimizing prompt performance (accuracy, cost, latency)
- Building evaluation datasets and regression tests for prompts

## When NOT to use

- The task is simple enough that default model behavior works (no prompt needed)
- You need deterministic, rule-based logic — use code instead of prompts
- The "prompt engineering" is really just API configuration (temperature, max_tokens)
- You're trying to make the model do something it fundamentally can't (real-time data, computation)
- The problem is better solved by fine-tuning than prompt design

## Core concepts

### System prompt anatomy

\`\`\`
┌─────────────────────────────────────────────┐
│              SYSTEM PROMPT                   │
├─────────────────────────────────────────────┤
│  1. Role definition (who the model is)       │
│  2. Task description (what it should do)     │
│  3. Output format (how to structure results) │
│  4. Constraints (what to avoid)              │
│  5. Examples (few-shot demonstrations)       │
│  6. Edge case handling (ambiguity rules)     │
└─────────────────────────────────────────────┘
\`\`\`

### Prompt strategies

| Strategy | When to use | Token cost |
|----------|-------------|-----------|
| Zero-shot | Simple tasks, capable models | Low |
| Few-shot | Consistent format needed, edge cases | Medium |
| Chain-of-thought | Multi-step reasoning, math, logic | High |
| Self-consistency | High-stakes decisions needing confidence | Very high |
| ReAct | Tool-using agents that reason and act | High |
| Structured output | Data extraction, API responses | Medium |

### Temperature guide

| Temperature | Use case |
|-------------|----------|
| 0 | Deterministic: classification, extraction, code generation |
| 0.3-0.5 | Balanced: writing assistance, summarization |
| 0.7-1.0 | Creative: brainstorming, story generation, exploration |

## Workflow

### Step 1: Define the task contract

Before writing any prompt, answer these questions:

\`\`\`typescript
type PromptContract = {
  input: string;       // What does the model receive?
  output: string;      // What should it produce?
  format: string;      // JSON, markdown, plain text?
  constraints: string[]; // What must it avoid?
  edgeCases: string[];   // How should it handle ambiguity?
  examples: Array<{ input: string; output: string }>;
};
\`\`\`

### Step 2: Write the system prompt

\`\`\`typescript
const systemPrompt = \\\`You are a senior code reviewer specializing in TypeScript and React.

## Task
Review the provided code diff and return structured feedback.

## Output format
Return a JSON array of findings:
[
  {
    "severity": "critical" | "warning" | "info",
    "line": <number>,
    "message": "<concise description>",
    "suggestion": "<specific fix>"
  }
]

## Rules
- Focus on bugs, security issues, and performance problems
- Do not comment on style preferences unless they cause bugs
- If the code is correct and well-written, return an empty array []
- Never suggest changes that would break existing tests
- Limit findings to the top 5 most important issues

## Examples

Input: \\\\\\\`const x = data.map(d => d.name)\\\\\\\`
Output:
[
  {
    "severity": "warning",
    "line": 1,
    "message": "No null check on data before .map()",
    "suggestion": "Use optional chaining: data?.map(d => d.name) ?? []"
  }
]\\\`;
\`\`\`

### Step 3: Implement structured output with OpenAI

\`\`\`typescript
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const FindingSchema = z.object({
  severity: z.enum(["critical", "warning", "info"]),
  line: z.number(),
  message: z.string(),
  suggestion: z.string(),
});

const ReviewSchema = z.object({
  findings: z.array(FindingSchema),
});

const client = new OpenAI();

async function reviewCode(diff: string) {
  const response = await client.responses.create({
    model: "gpt-4o",
    instructions: systemPrompt,
    input: diff,
    text: {
      format: zodResponseFormat(ReviewSchema, "code_review"),
    },
  });

  return ReviewSchema.parse(JSON.parse(response.output_text));
}
\`\`\`

### Step 4: Implement with Anthropic

\`\`\`typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

async function reviewCodeClaude(diff: string) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: diff }],
  });

  const text = response.content
    .filter(block => block.type === "text")
    .map(block => block.text)
    .join("");

  return JSON.parse(text);
}
\`\`\`

### Step 5: Add chain-of-thought for complex reasoning

\`\`\`typescript
const chainOfThoughtPrompt = \\\`You are solving a complex problem.

## Process
Think through this step by step:

1. **Understand**: Restate the problem in your own words
2. **Decompose**: Break it into sub-problems
3. **Solve**: Work through each sub-problem
4. **Verify**: Check your solution against the original constraints
5. **Format**: Present the final answer

## Output format
<thinking>
[Your step-by-step reasoning here — be thorough]
</thinking>

<answer>
[Your final, concise answer here]
</answer>\\\`;
\`\`\`

## Examples

### Example 1: Classification with few-shot

\`\`\`typescript
const classificationPrompt = \\\`Classify the support ticket into exactly one category.

Categories: billing, technical, account, feature-request, other

## Examples

Ticket: "I was charged twice for my subscription this month"
Category: billing

Ticket: "The API returns 500 errors when I send more than 10 requests"
Category: technical

Ticket: "Can you add dark mode to the dashboard?"
Category: feature-request

Ticket: "I can't log in after resetting my password"
Category: account

## Rules
- Return only the category name, nothing else
- If genuinely ambiguous, choose the most actionable category
- "other" is the last resort — use it only when no category fits\\\`;
\`\`\`

### Example 2: Data extraction with structured output

\`\`\`typescript
const extractionPrompt = \\\`Extract structured event information from the text.

Return JSON matching this schema exactly:
{
  "event_name": "string",
  "date": "YYYY-MM-DD or null",
  "time": "HH:MM or null",
  "location": "string or null",
  "attendees": ["string"],
  "confidence": 0.0-1.0
}

## Rules
- If a field is not mentioned, use null (not a guess)
- Parse relative dates against today's date provided in the user message
- List only explicitly named attendees, not implied ones
- Confidence reflects how clearly the information was stated\\\`;
\`\`\`

### Example 3: Multi-turn agent instructions

\`\`\`typescript
const agentSystemPrompt = \\\`You are a research assistant that helps users
find and synthesize information.

## Available tools
- web_search(query: string) — search the web for information
- read_url(url: string) — read the content of a web page
- save_note(title: string, content: string) — save a research note

## Behavior
1. When the user asks a question, search for relevant sources first
2. Read the top 2-3 results to gather information
3. Synthesize findings into a concise answer with citations
4. Save important findings as notes for future reference

## Citation format
Use inline citations: "The API supports 100 req/s [1]"
List sources at the end:
[1] https://docs.example.com/rate-limits

## Constraints
- Never fabricate information — if you can't find it, say so
- Always cite sources for factual claims
- Prefer official documentation over blog posts
- If search returns no results, suggest alternative queries\\\`;
\`\`\`

## Decision tree

\`\`\`
What type of prompt do you need?
├── Classification / Routing
│   ├── < 5 categories → Zero-shot with category list
│   └── > 5 categories or subtle distinctions → Few-shot with examples
├── Data extraction
│   ├── Fixed schema → Structured output (JSON mode / zodResponseFormat)
│   └── Variable schema → Describe output format in prompt
├── Reasoning / Analysis
│   ├── Single-step → Zero-shot with clear instructions
│   └── Multi-step → Chain-of-thought with <thinking> blocks
├── Generation / Writing
│   ├── Consistent style → Few-shot with 3+ examples
│   └── Creative → Higher temperature, fewer constraints
└── Agent / Tool use
    ├── Simple tool routing → ReAct pattern in system prompt
    └── Complex orchestration → Agent orchestration skill
\`\`\`

## Edge cases and gotchas

- **Prompt injection**: Never put untrusted user input directly in the system prompt — use the user message field
- **Token budget**: System prompts count against context window — measure and optimize
- **Model drift**: Prompts that work on GPT-4o may not work on Claude — test across providers
- **Few-shot ordering**: The last example has the most influence — put your best example last
- **Negative instructions**: "Don't do X" is weaker than "Always do Y instead of X"
- **Output format compliance**: Models may drift from the requested format — use structured outputs or regex validation
- **Temperature 0 is not deterministic**: It's greedy decoding, not true determinism — outputs can still vary slightly
- **Long prompts degrade**: Performance drops as system prompts exceed ~2000 tokens — distill ruthlessly
- **XML tags in Claude**: Anthropic models respond well to XML structure: \`<rules>\`, \`<examples>\`, \`<output>\`
- **JSON mode quirks**: OpenAI's JSON mode requires "JSON" in the prompt; structured outputs (zodResponseFormat) don't

## Evaluation criteria

| Criterion | How to measure |
|-----------|---------------|
| Accuracy | % of outputs matching ground-truth labels |
| Format compliance | % of outputs parseable as the requested format |
| Consistency | Variance across 10 identical requests (temperature 0) |
| Cost efficiency | Tokens consumed per successful completion |
| Latency | Time-to-first-token and total generation time |
| Robustness | Accuracy on adversarial / edge-case inputs |
| Provider portability | Works on both OpenAI and Anthropic without rewrite |`,
    agentDocs: {
      codex: `# Codex — Prompt Engineering

When writing or optimizing prompts in Codex:

## System prompt structure
- Start with a one-line role definition: "You are a [role] that [task]."
- Follow with output format, then rules, then examples
- Keep system prompts under 1500 tokens — distill aggressively
- Use numbered rules, not paragraphs — models parse lists more reliably

## Structured outputs
- Use \`zodResponseFormat\` from \`openai/helpers/zod\` for guaranteed JSON schema compliance
- For OpenAI Responses API: \`text.format\` with zodResponseFormat
- For Anthropic: describe the schema in the system prompt with an example
- Always validate parsed output even with structured outputs — defense in depth

## Few-shot examples
- Include 3-5 examples that cover the typical case and 1-2 edge cases
- Put the most representative example last (recency bias)
- Match the exact output format in examples — models copy structure

## Chain-of-thought
- Use \`<thinking>\` / \`<answer>\` blocks to separate reasoning from output
- For OpenAI: structured outputs + CoT = reasoning in a "thinking" field
- For Anthropic: extended thinking is built in — enable with \`thinking: { type: "enabled" }\`

## Testing prompts
- Build a test suite of 20+ input/output pairs covering normal and edge cases
- Run the same prompt 3x at temperature 0 to check consistency
- Track prompt versions in version control — treat prompts as code

## Cost optimization
- Use \`gpt-4o-mini\` for classification and routing
- Use \`gpt-4o\` for generation and complex reasoning
- Cache system prompts with prompt caching (automatic on OpenAI)
- Trim context: only include relevant data, not entire documents`,
      cursor: `# Cursor — Prompt Engineering

When editing prompts in Cursor:

## File organization
- Store system prompts in \`prompts/\` directory as template literal exports
- One file per prompt: \`prompts/code-review.ts\`, \`prompts/classification.ts\`
- Store few-shot examples alongside the prompt or in a \`prompts/examples/\` dir
- Version prompts with descriptive git commits

## Editing tips
- Use template literals for multi-line prompts — preserve formatting
- Escape inner backticks with backslash: \\\\\`code\\\\\`
- Use Cursor's multi-cursor to update repeated patterns across examples
- Preview markdown rendering to check prompt structure

## Inline prompt testing
- Create a \`scripts/test-prompt.ts\` that runs the prompt against test cases
- Use \`tsx scripts/test-prompt.ts\` for quick iteration
- Log token counts to track prompt size over time

## Common edits
- Narrowing output format: add a schema definition + example
- Adding edge case handling: add a "## Edge cases" section with rules
- Improving accuracy: add few-shot examples that demonstrate the failure mode
- Reducing tokens: remove redundant instructions, combine similar rules

## Provider switching
- OpenAI and Anthropic have different prompt styles — maintain both if needed
- Anthropic prefers XML structure: \`<rules>\`, \`<examples>\`
- OpenAI prefers markdown headers: \`## Rules\`, \`## Examples\`
- Test on both providers when switching — behavior will differ`,
      claude: `# Claude Code — Prompt Engineering

When writing prompts for Claude models:

## Claude-specific patterns
- Use XML tags for structure: \`<instructions>\`, \`<examples>\`, \`<rules>\`, \`<output_format>\`
- Claude responds well to roleplay: "You are an expert [domain] engineer"
- Use \`<thinking>\` tags to encourage step-by-step reasoning
- Extended thinking (built-in CoT) is available: \`thinking: { type: "enabled", budget_tokens: 5000 }\`

## System prompt structure for Claude
\`\`\`
<role>You are a [role].</role>

<task>[What to do]</task>

<rules>
- Rule 1
- Rule 2
</rules>

<output_format>
[Schema or description]
</output_format>

<examples>
<example>
<input>[Example input]</input>
<output>[Example output]</output>
</example>
</examples>
\`\`\`

## Key differences from OpenAI
- Claude doesn't have native JSON mode — use tool_use with a schema for structured output
- Claude's context window is 200K tokens — you can include more context but shouldn't by default
- Prompt caching works differently — Anthropic caches based on prefix matching
- Claude follows negative instructions better: "Never include PII" works well

## Testing tips
- Use the Anthropic workbench for quick prompt iteration
- Test with \`claude-haiku\` for fast iteration, validate on \`claude-sonnet\` for production
- Log \`usage.input_tokens\` and \`usage.output_tokens\` for cost tracking
- Use \`stop_sequences\` to control output length when needed`,
      agents: `# AGENTS.md — Prompt Engineering

## Review checklist for prompts

### Structure
- [ ] Does the prompt start with a clear role and task definition?
- [ ] Is the output format explicitly specified?
- [ ] Are constraints listed as rules, not buried in prose?
- [ ] Are few-shot examples present for non-trivial tasks?

### Quality
- [ ] Is the prompt under 1500 tokens? (If not, can it be distilled?)
- [ ] Do examples cover both typical cases and edge cases?
- [ ] Are negative instructions rephrased as positive instructions where possible?
- [ ] Is the prompt tested on both OpenAI and Anthropic if cross-provider?

### Security
- [ ] Is user input placed in the user message, never in the system prompt?
- [ ] Are there instructions to refuse out-of-scope requests?
- [ ] Is the prompt resistant to injection? (Test with adversarial inputs)
- [ ] Does the prompt avoid leaking its own instructions?

### Performance
- [ ] Is the prompt cost-optimized for the task? (Right model, right token count)
- [ ] Are structured outputs used where format compliance matters?
- [ ] Is chain-of-thought only used when reasoning is genuinely needed?
- [ ] Is temperature set intentionally (not left at default)?

### Testing
- [ ] Is there a test suite of 20+ input/output pairs?
- [ ] Are consistency checks run (same input 3x at temp 0)?
- [ ] Is prompt performance tracked over time (accuracy, cost, latency)?
- [ ] Are prompt versions tracked in git?`
    }
  },

  // -----------------------------------------------------------------------
  // 4. Tool Use & Function Calling
  // -----------------------------------------------------------------------
  {
    slug: "tool-use-patterns",
    title: "Tool Use & Function Calling",
    description:
      "OpenAI and Anthropic function calling, structured outputs, tool selection strategies, error recovery, and composable tool chains for AI agents.",
    category: "a2a",
    accent: "signal-gold",
    featured: true,
    visibility: "public",
    tags: ["function-calling", "tools", "structured-output", "agents", "api"],
    body: `# Tool Use & Function Calling

Implement function calling and tool use patterns for OpenAI and Anthropic models — from single tool calls to composable multi-tool chains with error recovery.

## When to use

- The model needs to interact with external systems (APIs, databases, file systems)
- You need structured, validated output from the model (not free-form text)
- Building an agent that reasons about which tools to call and in what order
- Implementing human-in-the-loop workflows where the model proposes actions
- Need reliable extraction of structured data from unstructured inputs

## When NOT to use

- The task is pure text generation with no external data needed
- A hard-coded API call sequence would be more reliable and faster
- The model only needs to classify or route — tool calling adds unnecessary latency
- You have fewer than 2 tools — consider structured output instead
- The "tools" don't have side effects and are really just output schemas

## Core concepts

### OpenAI function calling

\`\`\`typescript
import OpenAI from "openai";

const client = new OpenAI();

const tools: OpenAI.Responses.Tool[] = [
  {
    type: "function",
    name: "get_weather",
    description: "Get current weather for a location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City name, e.g. 'San Francisco, CA'",
        },
        units: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          default: "fahrenheit",
        },
      },
      required: ["location"],
    },
  },
  {
    type: "function",
    name: "search_docs",
    description: "Search documentation for a query",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        limit: { type: "number", default: 5 },
      },
      required: ["query"],
    },
  },
];

async function callWithTools(userMessage: string) {
  const response = await client.responses.create({
    model: "gpt-4o",
    tools,
    input: [{ role: "user", content: userMessage }],
  });

  return response;
}
\`\`\`

### Anthropic tool_use

\`\`\`typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const tools: Anthropic.Messages.Tool[] = [
  {
    name: "get_weather",
    description: "Get current weather for a location",
    input_schema: {
      type: "object" as const,
      properties: {
        location: {
          type: "string",
          description: "City name, e.g. 'San Francisco, CA'",
        },
        units: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
        },
      },
      required: ["location"],
    },
  },
];

async function callWithToolsClaude(userMessage: string) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    tools,
    messages: [{ role: "user", content: userMessage }],
  });

  return response;
}
\`\`\`

### Tool execution loop

\`\`\`
User message
     │
     ▼
┌─────────────┐
│  LLM call   │ ◄──────────────────────────┐
│  with tools  │                             │
└──────┬──────┘                             │
       │                                     │
       ▼                                     │
  Has tool_use?                              │
  ├── No → Return text response              │
  └── Yes                                    │
       │                                     │
       ▼                                     │
┌─────────────┐                             │
│Execute tool  │                             │
│  function    │                             │
└──────┬──────┘                             │
       │                                     │
       ▼                                     │
  Return tool result ────────────────────────┘
  as next message
\`\`\`

### Tool selection patterns

| Pattern | Description | Use when |
|---------|-------------|----------|
| Auto | Model chooses which tools to call | Default for agents |
| Required | Model must call at least one tool | Forcing structured output |
| Specific | Model must call a named tool | Constraining to one action |
| None | Model cannot call any tools | Forcing text-only response |
| Parallel | Model calls multiple tools at once | Independent data fetches |

## Workflow

### Step 1: Define tool schemas

\`\`\`typescript
// Type-safe tool definitions with Zod
import { z } from "zod";

const toolSchemas = {
  get_weather: z.object({
    location: z.string().describe("City and state, e.g. 'San Francisco, CA'"),
    units: z.enum(["celsius", "fahrenheit"]).default("fahrenheit"),
  }),

  search_docs: z.object({
    query: z.string().describe("Search query for the documentation"),
    section: z.enum(["api", "guides", "examples"]).optional(),
    limit: z.number().min(1).max(20).default(5),
  }),

  create_ticket: z.object({
    title: z.string().min(1).max(200),
    description: z.string(),
    priority: z.enum(["low", "medium", "high", "critical"]),
    labels: z.array(z.string()).default([]),
  }),
} as const;
\`\`\`

### Step 2: Implement tool handlers

\`\`\`typescript
type ToolName = keyof typeof toolSchemas;

const toolHandlers: Record<ToolName, (args: unknown) => Promise<string>> = {
  async get_weather(args) {
    const { location, units } = toolSchemas.get_weather.parse(args);
    const data = await weatherApi.getCurrent(location, units);
    return JSON.stringify(data);
  },

  async search_docs(args) {
    const { query, section, limit } = toolSchemas.search_docs.parse(args);
    const results = await docsSearch.query(query, { section, limit });
    return JSON.stringify(results);
  },

  async create_ticket(args) {
    const { title, description, priority, labels } =
      toolSchemas.create_ticket.parse(args);
    const ticket = await ticketService.create({
      title, description, priority, labels,
    });
    return JSON.stringify({ id: ticket.id, url: ticket.url });
  },
};
\`\`\`

### Step 3: Build the tool execution loop (OpenAI)

\`\`\`typescript
async function agentLoop(userMessage: string, maxIterations = 10) {
  const messages: OpenAI.Responses.ResponseInput = [
    { role: "user", content: userMessage },
  ];

  for (let i = 0; i < maxIterations; i++) {
    const response = await client.responses.create({
      model: "gpt-4o",
      tools,
      input: messages,
    });

    const toolCalls = response.output.filter(
      (item): item is OpenAI.Responses.FunctionToolCall =>
        item.type === "function_call"
    );

    if (toolCalls.length === 0) {
      return response.output_text;
    }

    // Execute tools in parallel when possible
    const results = await Promise.allSettled(
      toolCalls.map(async (call) => {
        const handler = toolHandlers[call.name as ToolName];
        if (!handler) throw new Error(\\\`Unknown tool: \\\${call.name}\\\`);
        const args = JSON.parse(call.arguments);
        return { callId: call.call_id, result: await handler(args) };
      })
    );

    // Append tool results
    for (const result of results) {
      if (result.status === "fulfilled") {
        messages.push({
          type: "function_call_output",
          call_id: result.value.callId,
          output: result.value.result,
        });
      } else {
        messages.push({
          type: "function_call_output",
          call_id: toolCalls[results.indexOf(result)].call_id,
          output: JSON.stringify({ error: result.reason?.message }),
        });
      }
    }
  }

  throw new Error("Max iterations reached");
}
\`\`\`

### Step 4: Build the tool execution loop (Anthropic)

\`\`\`typescript
async function agentLoopClaude(userMessage: string, maxIterations = 10) {
  const messages: Anthropic.Messages.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  for (let i = 0; i < maxIterations; i++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      tools,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      const textBlocks = response.content.filter(b => b.type === "text");
      return textBlocks.map(b => b.text).join("");
    }

    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
    );

    // Append assistant response and tool results
    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      try {
        const handler = toolHandlers[block.name as ToolName];
        const result = await handler(block.input);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      } catch (err) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: \\\`Error: \\\${(err as Error).message}\\\`,
          is_error: true,
        });
      }
    }

    messages.push({ role: "user", content: toolResults });
  }

  throw new Error("Max iterations reached");
}
\`\`\`

## Examples

### Example 1: Parallel tool execution

\`\`\`typescript
// Model requests weather for 3 cities simultaneously
const response = await client.responses.create({
  model: "gpt-4o",
  tools,
  input: [{ role: "user", content: "Compare weather in NYC, London, and Tokyo" }],
});

// response.output may contain 3 parallel function_call items
// Execute all 3 in parallel with Promise.all
const results = await Promise.all(
  toolCalls.map(call => toolHandlers.get_weather(JSON.parse(call.arguments)))
);
\`\`\`

### Example 2: Error recovery with retry

\`\`\`typescript
async function executeWithRetry(
  handler: (args: unknown) => Promise<string>,
  args: unknown,
  maxRetries = 2
): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await handler(args);
    } catch (err) {
      if (attempt === maxRetries) {
        return JSON.stringify({
          error: (err as Error).message,
          suggestion: "Try a different approach or ask the user for help",
        });
      }
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return JSON.stringify({ error: "Exhausted retries" });
}
\`\`\`

### Example 3: Tool choice strategies

\`\`\`typescript
// Force the model to call a specific tool
const response = await client.responses.create({
  model: "gpt-4o",
  tools,
  tool_choice: { type: "function", name: "create_ticket" },
  input: messages,
});

// Prevent tool calling (text-only response)
const textOnly = await client.responses.create({
  model: "gpt-4o",
  tools,
  tool_choice: "none",
  input: messages,
});
\`\`\`

## Decision tree

\`\`\`
Does the model need to interact with external systems?
├── No
│   ├── Need structured output? → Use response_format / structured outputs
│   └── Free text is fine? → No tools needed
└── Yes
    ├── How many tools?
    │   ├── 1-3 → Define inline, auto tool_choice
    │   ├── 4-10 → Group by domain, add clear descriptions
    │   └── 10+ → Split into sub-agents with focused tool sets
    ├── Tool calls independent?
    │   ├── Yes → Enable parallel tool calling
    │   └── No → Sequential execution with state passing
    ├── Side effects?
    │   ├── Read-only → Auto execute, no confirmation
    │   └── Writes / deletes → Add confirmation step or human-in-the-loop
    └── Error handling?
        ├── Transient errors → Retry with backoff
        ├── Permanent errors → Return error to model, let it adapt
        └── Critical errors → Abort and escalate to user
\`\`\`

## Edge cases and gotchas

- **Hallucinated tool names**: The model may try to call tools that don't exist — always validate tool names before execution
- **Argument type coercion**: Models sometimes send strings where numbers are expected — Zod \`.coerce\` handles this
- **Parallel call ordering**: When the model requests parallel calls, execution order is not guaranteed — don't assume ordering
- **Tool call in text**: Some models include tool call syntax in text responses — parse the structured response, not the text
- **Infinite tool loops**: The model may keep calling tools without converging — always set a max iteration limit
- **Empty arguments**: Some calls come with \`{}\` arguments — ensure defaults handle this
- **Large tool results**: Sending huge JSON back as tool results bloats the context — truncate or summarize
- **Streaming with tools**: Tool calls arrive as deltas during streaming — accumulate before executing
- **Tool description length**: Longer descriptions improve selection accuracy but cost tokens — aim for 1-2 sentences
- **Cross-provider differences**: OpenAI uses \`function_call\` / \`call_id\`; Anthropic uses \`tool_use\` / \`tool_use_id\` — abstract the difference

## Evaluation criteria

| Criterion | How to measure |
|-----------|---------------|
| Tool selection accuracy | % of correct tool chosen for a given intent |
| Argument accuracy | % of tool calls with valid, complete arguments |
| Execution success rate | % of tool calls that succeed on first attempt |
| Loop efficiency | Average tool calls per task (lower is better) |
| Error recovery | % of failed calls where the model adapts successfully |
| Parallel utilization | % of independent calls made in parallel vs serial |
| Latency per tool turn | Time from model response to tool result submitted |`,
    agentDocs: {
      codex: `# Codex — Tool Use & Function Calling

When implementing function calling in Codex:

## Tool definition
- Use the Responses API (\`client.responses.create\`) with \`tools\` array
- Each tool needs: \`name\` (snake_case), \`description\` (1-2 sentences), \`parameters\` (JSON Schema)
- Keep descriptions actionable: "Search for X" not "This tool searches for X"
- Use \`enum\` for constrained string parameters — reduces hallucination

## Execution loop
- Always check \`response.output\` for \`function_call\` type items
- Execute tools and return results as \`function_call_output\` type
- Set a max iteration limit (10-15) on the loop to prevent runaways
- Use \`Promise.allSettled\` for parallel execution — handle partial failures gracefully

## Error handling
- On tool failure, return a JSON error object as the tool result — don't throw
- Include a \`suggestion\` field so the model can adapt its approach
- Retry transient errors (network, rate limit) with exponential backoff
- For permanent errors, let the model fall back to a different tool or inform the user

## Structured outputs
- For extraction tasks, use \`zodResponseFormat\` instead of tools
- For agent workflows, tools are the right abstraction
- Don't define tools that only return data — use structured outputs instead

## Performance
- Each tool call round-trip adds 1-3s of latency
- Minimize round-trips by enabling parallel tool calls
- Use \`gpt-4o-mini\` for simple tool routing; \`gpt-4o\` for complex reasoning
- Cache tool results when the underlying data doesn't change frequently`,
      cursor: `# Cursor — Tool Use & Function Calling

When working with function calling code in Cursor:

## File structure
- \`tools/definitions.ts\` — tool schemas (JSON Schema or Zod)
- \`tools/handlers.ts\` — tool implementation functions
- \`tools/loop.ts\` — the agent execution loop
- \`tools/types.ts\` — shared types for tool inputs/outputs

## Type safety
- Define tool schemas with Zod, convert to JSON Schema for OpenAI
- Use \`z.infer<typeof schema>\` for typed handler arguments
- Type the tool handler map: \`Record<ToolName, (args: unknown) => Promise<string>>\`
- Validate all incoming arguments with Zod \`.parse()\` — never trust raw model output

## Debugging
- Log every tool call: name, arguments, result, duration
- Use Cursor's terminal to run the agent loop interactively
- Add a \`--dry-run\` flag that logs tool calls without executing them
- Inspect the full message array when the model makes unexpected tool choices

## Common refactors
- Adding a new tool: define schema → implement handler → add to tools array
- Converting from OpenAI to Anthropic: swap \`function_call\` for \`tool_use\` blocks
- Adding retry logic: wrap handler in \`executeWithRetry\` utility
- Adding rate limiting: use a semaphore around parallel tool execution

## Gotchas in Cursor
- Auto-import may pull from the wrong \`openai\` module — check import paths
- Tool parameter \`description\` fields affect model behavior — don't skip them
- TypeScript may widen \`"object" as const\` in Anthropic schemas — add explicit cast`,
      claude: `# Claude Code — Tool Use & Function Calling

When implementing tool use with Claude:

## Anthropic tool_use format
- Tools are defined with \`name\`, \`description\`, and \`input_schema\` (JSON Schema)
- Response contains \`tool_use\` content blocks with \`id\`, \`name\`, \`input\`
- Return results as \`tool_result\` blocks in the next user message
- Set \`is_error: true\` on tool results to signal failures

## Key differences from OpenAI
\`\`\`
OpenAI:                          Anthropic:
─────────                        ─────────
tools[].parameters              tools[].input_schema
function_call (output)          tool_use (content block)
function_call_output (input)    tool_result (content block)
call_id                         tool_use_id
tool_choice: "auto"             tool_choice: { type: "auto" }
tool_choice: { name: "x" }     tool_choice: { type: "tool", name: "x" }
\`\`\`

## Implementation tips
- Claude tends to explain its reasoning before calling tools — expect text + tool_use blocks
- Use \`stop_reason === "tool_use"\` to detect when tool execution is needed
- Claude supports parallel tool calls — multiple \`tool_use\` blocks in one response
- For forced tool use, set \`tool_choice: { type: "any" }\` (must call at least one)

## Best practices
- Keep tool count under 10 per call — Claude performs best with focused tool sets
- Use \`input_schema.description\` on every property — Claude reads them carefully
- Return structured JSON from tools — Claude parses it better than plain text
- Test with Claude Haiku for fast iteration, validate on Sonnet for production

## Error handling
- Return \`is_error: true\` tool results so Claude knows to retry or adapt
- Include the error type and a suggestion in the error content
- Claude handles errors gracefully — it will often try a different approach automatically`,
      agents: `# AGENTS.md — Tool Use & Function Calling

## Review checklist for tool implementations

### Tool definitions
- [ ] Every tool has a clear, actionable description (< 100 chars)
- [ ] Every parameter has a type, description, and sensible default
- [ ] Enum types are used for constrained string parameters
- [ ] Tool count is reasonable (< 10 per agent, < 20 per system)
- [ ] Tool names are snake_case and descriptive

### Execution loop
- [ ] Max iteration limit is set (10-15 recommended)
- [ ] Unknown tool names are handled gracefully (not silently ignored)
- [ ] Parallel tool calls are executed concurrently with \`Promise.allSettled\`
- [ ] Tool results are sent back with correct call_id / tool_use_id

### Error handling
- [ ] Tool failures return structured error objects, not exceptions
- [ ] Transient errors are retried with backoff
- [ ] Permanent errors are reported to the model with suggestions
- [ ] Large tool results are truncated or summarized to stay within context limits

### Security
- [ ] Tool arguments are validated before execution (Zod, JSON Schema)
- [ ] Tools with side effects require confirmation or are gated
- [ ] No tool can be tricked into executing arbitrary code
- [ ] API keys and credentials are not passed through tool arguments

### Observability
- [ ] Every tool call is logged: name, args, result, duration
- [ ] Failed tool calls are logged with error details
- [ ] Total round-trips per agent session are tracked
- [ ] Token usage per tool loop is monitored`
    }
  },

  // -----------------------------------------------------------------------
  // 5. RAG Pipelines
  // -----------------------------------------------------------------------
  {
    slug: "rag-pipelines",
    title: "OpenAI RAG Pipelines",
    description:
      "Retrieval-augmented generation with OpenAI embeddings and Pinecone: chunking strategies, vector search, context window management, and hybrid search.",
    category: "a2a",
    accent: "signal-gold",
    featured: true,
    visibility: "public",
    tags: ["rag", "retrieval", "embeddings", "vector-search", "context"],
    body: `# OpenAI RAG Pipelines

Build retrieval-augmented generation systems that ground LLM responses in your own data using embeddings, vector search, and context window management.

## When to use

- The model needs access to proprietary data not in its training set
- Building a Q&A system over documentation, codebases, or knowledge bases
- Need grounded, citation-backed answers instead of potential hallucinations
- Data changes frequently and re-training is impractical
- Implementing semantic search over large document collections

## When NOT to use

- The answer is in the model's training data and doesn't need grounding
- You have fewer than 50 documents — just put them in the context window
- Real-time data is needed (stock prices, live APIs) — use tool calling instead
- The query is transactional, not informational (CRUD operations)
- Exact keyword match is sufficient — use a traditional search engine

## Core concepts

### RAG pipeline architecture

\`\`\`
┌────────────────────────────────────────────────────┐
│                   Ingestion Pipeline                │
│                                                      │
│  Documents → Chunking → Embedding → Vector Store     │
│    (PDF,      (split     (OpenAI      (Pinecone,     │
│     MD,       into       text-         Supabase       │
│     HTML)     chunks)    embedding-3)  pgvector)      │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│                   Query Pipeline                     │
│                                                      │
│  User Query → Embed → Vector Search → Rerank →       │
│                                                      │
│  → Build Prompt (query + retrieved chunks) →          │
│                                                      │
│  → LLM Generation → Response with citations           │
└────────────────────────────────────────────────────┘
\`\`\`

### Chunking strategies

| Strategy | When to use | Chunk size |
|----------|-------------|-----------|
| Fixed-size | Simple, uniform documents | 500-1000 tokens |
| Sentence-based | Prose, articles, documentation | 3-5 sentences |
| Paragraph-based | Well-structured documents | 1-3 paragraphs |
| Semantic | Mixed-format, variable structure | Dynamic (by topic) |
| Header-based | Documentation with clear headings | Per section |
| Code-aware | Source code repositories | Per function/class |

### Embedding models

| Model | Dimensions | Max tokens | Use case |
|-------|-----------|-----------|----------|
| text-embedding-3-small | 1536 | 8191 | Cost-effective general use |
| text-embedding-3-large | 3072 | 8191 | High-accuracy retrieval |
| text-embedding-ada-002 | 1536 | 8191 | Legacy (use 3-small instead) |

## Workflow

### Step 1: Document chunking

\`\`\`typescript
type Chunk = {
  id: string;
  text: string;
  metadata: {
    source: string;
    title: string;
    section: string;
    chunkIndex: number;
    tokenCount: number;
  };
};

function chunkDocument(
  doc: { title: string; content: string; source: string },
  maxTokens = 500,
  overlap = 50
): Chunk[] {
  const paragraphs = doc.content.split(/\\n\\n+/);
  const chunks: Chunk[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const combined = currentChunk
      ? \\\`\\\${currentChunk}\\n\\n\\\${paragraph}\\\`
      : paragraph;

    if (estimateTokens(combined) > maxTokens && currentChunk) {
      chunks.push({
        id: \\\`\\\${doc.source}-\\\${chunkIndex}\\\`,
        text: currentChunk,
        metadata: {
          source: doc.source,
          title: doc.title,
          section: extractSection(currentChunk),
          chunkIndex,
          tokenCount: estimateTokens(currentChunk),
        },
      });
      chunkIndex++;

      // Overlap: keep last N tokens from previous chunk
      const sentences = currentChunk.split(/\\.\\s+/);
      currentChunk = sentences.slice(-2).join(". ") + ". " + paragraph;
    } else {
      currentChunk = combined;
    }
  }

  if (currentChunk) {
    chunks.push({
      id: \\\`\\\${doc.source}-\\\${chunkIndex}\\\`,
      text: currentChunk,
      metadata: {
        source: doc.source,
        title: doc.title,
        section: extractSection(currentChunk),
        chunkIndex,
        tokenCount: estimateTokens(currentChunk),
      },
    });
  }

  return chunks;
}
\`\`\`

### Step 2: Generate embeddings

\`\`\`typescript
import OpenAI from "openai";

const openai = new OpenAI();

async function embedChunks(chunks: Chunk[]): Promise<Array<Chunk & { embedding: number[] }>> {
  const batchSize = 100;
  const results: Array<Chunk & { embedding: number[] }> = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: batch.map(c => c.text),
    });

    for (let j = 0; j < batch.length; j++) {
      results.push({
        ...batch[j],
        embedding: response.data[j].embedding,
      });
    }
  }

  return results;
}

async function embedQuery(query: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  return response.data[0].embedding;
}
\`\`\`

### Step 3: Store in vector database (Pinecone)

\`\`\`typescript
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone();
const index = pinecone.index("knowledge-base");

async function upsertChunks(chunks: Array<Chunk & { embedding: number[] }>) {
  const vectors = chunks.map(chunk => ({
    id: chunk.id,
    values: chunk.embedding,
    metadata: {
      text: chunk.text,
      source: chunk.metadata.source,
      title: chunk.metadata.title,
      section: chunk.metadata.section,
    },
  }));

  // Upsert in batches of 100
  for (let i = 0; i < vectors.length; i += 100) {
    await index.upsert(vectors.slice(i, i + 100));
  }
}

async function queryVectors(
  embedding: number[],
  topK = 5,
  filter?: Record<string, string>
) {
  const result = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter,
  });

  return result.matches?.map(match => ({
    id: match.id,
    score: match.score ?? 0,
    text: (match.metadata?.text as string) ?? "",
    source: (match.metadata?.source as string) ?? "",
    title: (match.metadata?.title as string) ?? "",
  })) ?? [];
}
\`\`\`

### Step 4: Alternative — Supabase pgvector

\`\`\`typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function upsertChunksPgvector(chunks: Array<Chunk & { embedding: number[] }>) {
  const rows = chunks.map(chunk => ({
    id: chunk.id,
    content: chunk.text,
    embedding: chunk.embedding,
    metadata: chunk.metadata,
  }));

  const { error } = await supabase.from("documents").upsert(rows);
  if (error) throw error;
}

async function queryPgvector(embedding: number[], topK = 5) {
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: topK,
  });

  if (error) throw error;
  return data;
}

// Required SQL function for pgvector similarity search:
// CREATE FUNCTION match_documents(
//   query_embedding vector(1536),
//   match_threshold float,
//   match_count int
// ) RETURNS TABLE (id text, content text, similarity float)
// LANGUAGE plpgsql AS $$
// BEGIN
//   RETURN QUERY
//   SELECT d.id, d.content,
//     1 - (d.embedding <=> query_embedding) as similarity
//   FROM documents d
//   WHERE 1 - (d.embedding <=> query_embedding) > match_threshold
//   ORDER BY d.embedding <=> query_embedding
//   LIMIT match_count;
// END;
// $$;
\`\`\`

### Step 5: Build the RAG prompt

\`\`\`typescript
function buildRagPrompt(
  query: string,
  retrievedChunks: Array<{ text: string; source: string; title: string; score: number }>
): string {
  const contextBlock = retrievedChunks
    .map((chunk, i) =>
      \\\`[Source \\\${i + 1}: \\\${chunk.title} (\\\${chunk.source})]\\n\\\${chunk.text}\\\`
    )
    .join("\\n\\n---\\n\\n");

  return \\\`Answer the user's question based on the provided context.

## Rules
- Only use information from the provided context
- Cite sources using [Source N] notation
- If the context doesn't contain the answer, say "I don't have enough information"
- Do not make up information not present in the context
- Prefer the most relevant source when multiple sources agree

## Context
\\\${contextBlock}

## Question
\\\${query}\\\`;
}
\`\`\`

### Step 6: End-to-end RAG query

\`\`\`typescript
async function ragQuery(userQuestion: string) {
  // 1. Embed the question
  const queryEmbedding = await embedQuery(userQuestion);

  // 2. Retrieve relevant chunks
  const chunks = await queryVectors(queryEmbedding, 5);

  // 3. Build the augmented prompt
  const augmentedPrompt = buildRagPrompt(userQuestion, chunks);

  // 4. Generate the response
  const response = await openai.responses.create({
    model: "gpt-4o",
    instructions: "You are a helpful assistant that answers questions based on provided context.",
    input: augmentedPrompt,
  });

  return {
    answer: response.output_text,
    sources: chunks.map(c => ({ title: c.title, source: c.source, score: c.score })),
  };
}
\`\`\`

## Examples

### Example 1: Hybrid search (semantic + keyword)

\`\`\`typescript
async function hybridSearch(query: string, topK = 5) {
  // Semantic search
  const embedding = await embedQuery(query);
  const semanticResults = await queryVectors(embedding, topK * 2);

  // Keyword search (BM25 via Supabase full-text search)
  const { data: keywordResults } = await supabase
    .from("documents")
    .select("id, content, metadata")
    .textSearch("content", query, { type: "websearch" })
    .limit(topK * 2);

  // Reciprocal Rank Fusion (RRF)
  const scores = new Map<string, number>();
  const k = 60; // RRF constant

  semanticResults.forEach((result, rank) => {
    const current = scores.get(result.id) ?? 0;
    scores.set(result.id, current + 1 / (k + rank + 1));
  });

  (keywordResults ?? []).forEach((result: { id: string }, rank: number) => {
    const current = scores.get(result.id) ?? 0;
    scores.set(result.id, current + 1 / (k + rank + 1));
  });

  // Sort by combined score and return top K
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([id, score]) => ({ id, score }));
}
\`\`\`

### Example 2: Context window management

\`\`\`typescript
function fitChunksToWindow(
  chunks: Array<{ text: string; score: number }>,
  maxContextTokens: number
): string[] {
  const selected: string[] = [];
  let totalTokens = 0;

  // Sort by relevance score (highest first)
  const sorted = [...chunks].sort((a, b) => b.score - a.score);

  for (const chunk of sorted) {
    const chunkTokens = estimateTokens(chunk.text);
    if (totalTokens + chunkTokens > maxContextTokens) break;
    selected.push(chunk.text);
    totalTokens += chunkTokens;
  }

  return selected;
}

// Budget: model context - system prompt - output reserve
const maxContext = 128000 - 2000 - 4000; // for gpt-4o
\`\`\`

### Example 3: Incremental ingestion

\`\`\`typescript
async function ingestNewDocuments(docs: Document[]) {
  // Only process documents not already in the vector store
  const existingIds = new Set(await getStoredDocumentIds());
  const newDocs = docs.filter(d => !existingIds.has(d.id));

  if (newDocs.length === 0) return { ingested: 0 };

  const chunks = newDocs.flatMap(doc => chunkDocument(doc));
  const embedded = await embedChunks(chunks);
  await upsertChunks(embedded);

  return { ingested: newDocs.length, chunks: embedded.length };
}
\`\`\`

## Decision tree

\`\`\`
Do you need external knowledge in the LLM response?
├── No → Standard prompting (no RAG needed)
└── Yes
    ├── How much data?
    │   ├── < 50 docs / < 100K tokens → Put it all in context (no vector DB)
    │   ├── 50-10K docs → Single vector index with metadata filters
    │   └── 10K+ docs → Partitioned indexes or hybrid search
    ├── Data freshness?
    │   ├── Static → One-time ingestion
    │   ├── Weekly updates → Batch re-ingestion
    │   └── Real-time → Incremental ingestion + cache invalidation
    ├── Search type?
    │   ├── Semantic similarity → Vector search only
    │   ├── Exact keyword match → Full-text search only
    │   └── Both → Hybrid search with RRF
    └── Vector store?
        ├── Already using Supabase → pgvector extension
        ├── Need managed service → Pinecone
        ├── Need open source → Qdrant, Weaviate, Milvus
        └── Prototyping → In-memory with cosine similarity
\`\`\`

## Edge cases and gotchas

- **Chunk boundary artifacts**: Important information split across two chunks — use overlap to mitigate
- **Embedding model mismatch**: Query and document embeddings must use the same model — mixing models breaks similarity
- **Metadata filtering**: Filter before vector search, not after — otherwise you get irrelevant results within the top K
- **Stale embeddings**: When documents update, old embeddings remain — implement a re-indexing strategy
- **Score calibration**: Cosine similarity scores are not comparable across queries — use rank, not absolute score
- **Context window overflow**: Retrieved chunks + prompt + expected output must fit in the model's context window
- **Hallucination despite RAG**: The model may still hallucinate even with retrieved context — add "only use provided context" instructions
- **Multi-language**: Embedding models work best in English — multilingual retrieval needs multilingual embedding models
- **Code vs. prose**: Code chunks need different splitting strategies (by function/class, not by paragraph)
- **Duplicate chunks**: Near-duplicate documents create redundant retrieval — deduplicate before ingestion

## Evaluation criteria

| Criterion | How to measure |
|-----------|---------------|
| Retrieval precision@K | % of top-K results that are relevant to the query |
| Retrieval recall | % of relevant documents found in top-K |
| Answer accuracy | % of answers that match ground-truth (human eval or LLM judge) |
| Citation accuracy | % of citations that point to the actual source of the claim |
| Hallucination rate | % of claims not supported by any retrieved chunk |
| Latency | End-to-end time from query to response (target: < 3s) |
| Ingestion throughput | Documents per second during bulk ingestion |
| Cost per query | Embedding cost + vector search cost + LLM generation cost |`,
    agentDocs: {
      codex: `# Codex — RAG Pipelines

When building RAG systems in Codex:

## Ingestion pipeline
- Use \`text-embedding-3-small\` for cost-effective embeddings (1536 dims)
- Upgrade to \`text-embedding-3-large\` (3072 dims) only if retrieval quality is insufficient
- Batch embedding calls: max 100 texts per API call
- Store chunk metadata alongside vectors: source, title, section, creation date

## Chunking
- Default to 500-token chunks with 50-token overlap for prose
- Use header-based chunking for documentation with clear structure
- Use function/class-based chunking for code
- Always include the section heading in each chunk for context

## Vector stores
- Pinecone: managed, serverless, best for production scale
- Supabase pgvector: good if already using Supabase, simpler ops
- For prototyping: compute cosine similarity in-memory (< 1000 chunks)

## Query pipeline
- Embed the query with the same model used for documents
- Retrieve 5-10 chunks, then fit to context window by token budget
- Build the RAG prompt with source attribution markers
- Instruct the model: "Only use provided context. Cite sources."

## Testing
- Build a test set of 50+ question/answer/source triples
- Measure retrieval precision@5 and answer accuracy
- Test edge cases: no relevant docs, conflicting sources, multi-hop questions
- Monitor cost: embedding + search + generation per query

## Performance
- Cache embeddings for repeated queries
- Use metadata filters to narrow search scope before vector similarity
- Precompute common query embeddings for popular questions`,
      cursor: `# Cursor — RAG Pipelines

When working with RAG pipeline code in Cursor:

## Project structure
- \`rag/ingest.ts\` — document loading, chunking, embedding
- \`rag/search.ts\` — vector search, hybrid search, reranking
- \`rag/prompt.ts\` — RAG prompt construction with citations
- \`rag/query.ts\` — end-to-end query pipeline
- \`rag/types.ts\` — shared types (Chunk, SearchResult, etc.)
- \`rag/store/\` — vector store adapters (Pinecone, pgvector)

## Debugging retrieval
- Log retrieved chunks with scores to see what the model receives
- Compare semantic search results with keyword search for the same query
- Check if relevant documents were chunked correctly (overlap, boundaries)
- Visualize embedding similarity with a 2D projection (t-SNE or UMAP)

## Common refactors
- Switching vector stores: implement the store adapter interface, swap the import
- Improving retrieval: add hybrid search (RRF), metadata filters, or reranking
- Reducing hallucination: tighten the RAG prompt instructions, add "I don't know" fallback
- Optimizing cost: reduce chunk count, use smaller embedding model, cache embeddings

## Environment variables
- \`OPENAI_API_KEY\` — for embeddings and generation
- \`PINECONE_API_KEY\` + \`PINECONE_INDEX\` — if using Pinecone
- \`SUPABASE_URL\` + \`SUPABASE_SERVICE_KEY\` — if using pgvector
- Never commit these — use \`.env.local\` or Vercel env vars

## Performance tips
- Batch embedding calls (100 per request max)
- Use connection pooling for Supabase/Postgres
- Cache hot query embeddings in Redis or memory
- Parallelize embedding and search when processing multiple queries`,
      claude: `# Claude Code — RAG Pipelines

When building RAG systems with Claude:

## Using Claude as the generation model
- Claude's 200K context window allows more retrieved chunks than GPT-4o
- Use XML tags for the context block: \`<context>\`, \`<source>\`
- Claude follows "only use provided context" instructions reliably
- Enable extended thinking for complex multi-hop RAG queries

## RAG prompt structure for Claude
\`\`\`
<system>
You answer questions based only on the provided context.
Cite sources using [Source N] notation.
If the context doesn't contain the answer, say so.
</system>

<context>
<source id="1" title="..." url="...">
[chunk text]
</source>
<source id="2" title="..." url="...">
[chunk text]
</source>
</context>

<question>
[user question]
</question>
\`\`\`

## Key differences from OpenAI RAG
- Claude doesn't have a built-in embeddings API — use OpenAI or Cohere for embeddings
- Claude's longer context means you can retrieve more chunks (10-20 vs 5-10)
- Claude handles contradictory sources well — it will note the disagreement
- For structured RAG output, use tool_use with a citations schema

## Implementation tips
- Use Anthropic's prompt caching for the system prompt (saves cost on repeated queries)
- Claude's \`stop_sequences\` can control output length for concise answers
- For citation accuracy, ask Claude to quote the relevant text alongside the citation
- Test with Claude Haiku for fast iteration on retrieval quality

## Pitfalls
- Don't stuff 200K tokens of context just because you can — relevance > volume
- Embedding quality matters more than generation model choice
- Don't skip the "no relevant context" fallback — Claude can still hallucinate
- Monitor \`usage.input_tokens\` to track RAG context cost over time`,
      agents: `# AGENTS.md — RAG Pipelines

## Review checklist for RAG systems

### Ingestion
- [ ] Chunking strategy matches document type (prose vs code vs structured)
- [ ] Chunks have sufficient overlap to avoid boundary artifacts
- [ ] Metadata (source, title, section, date) is stored with each vector
- [ ] Re-indexing strategy exists for updated documents
- [ ] Duplicate detection prevents redundant chunks

### Retrieval
- [ ] Query and document embeddings use the same model
- [ ] Top-K is tuned (default 5, increase for complex queries)
- [ ] Metadata filters narrow the search space when applicable
- [ ] Hybrid search (semantic + keyword) is used for critical queries
- [ ] Retrieved chunks fit within the context window budget

### Generation
- [ ] RAG prompt includes "only use provided context" instruction
- [ ] Source attribution is required in the output
- [ ] "I don't know" fallback exists for queries with no relevant context
- [ ] Context window budget accounts for: system prompt + chunks + output reserve

### Evaluation
- [ ] Test set exists with question/answer/source ground-truth triples
- [ ] Retrieval precision@K is measured and tracked
- [ ] Answer accuracy is evaluated (human or LLM judge)
- [ ] Hallucination rate is measured against retrieved context
- [ ] End-to-end latency is under 3 seconds

### Security & cost
- [ ] API keys are in env vars, not committed
- [ ] Embedding costs are tracked per ingestion batch and per query
- [ ] PII is stripped or redacted before ingestion
- [ ] Access control on the vector store matches document permissions`
    }
  },
];
