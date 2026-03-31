import type { ImportedMcpTransport } from "@/lib/types";
import { buildVersionLabel } from "@/lib/format";

// ---------------------------------------------------------------------------
// Seed MCP type
// ---------------------------------------------------------------------------

export type SeedMcp = {
  name: string;
  description: string;
  manifestUrl: string;
  homepageUrl?: string;
  transport: ImportedMcpTransport;
  url?: string;
  command?: string;
  args: string[];
  envKeys: string[];
  headers?: Record<string, string>;
  tags: string[];
};

// ---------------------------------------------------------------------------
// Helper to build an ImportedMcpDocument-compatible row
// ---------------------------------------------------------------------------

export function toMcpRow(seed: SeedMcp) {
  const now = new Date().toISOString();
  return {
    name: seed.name,
    description: seed.description,
    manifest_url: seed.manifestUrl,
    homepage_url: seed.homepageUrl ?? null,
    transport: seed.transport,
    url: seed.url ?? null,
    command: seed.command ?? null,
    args: seed.args,
    env_keys: seed.envKeys,
    headers: seed.headers ?? null,
    tags: seed.tags,
    raw: "",
    version: 1,
    version_label: buildVersionLabel(1),
    created_at: now,
    updated_at: now,
  };
}

// ---------------------------------------------------------------------------
// stdio helper — for npm-based MCP servers run via npx
// ---------------------------------------------------------------------------

function stdio(
  name: string,
  description: string,
  pkg: string,
  args: string[],
  opts: {
    manifestUrl: string;
    homepageUrl?: string;
    envKeys?: string[];
    tags: string[];
  }
): SeedMcp {
  return {
    name,
    description,
    manifestUrl: opts.manifestUrl,
    homepageUrl: opts.homepageUrl,
    transport: "stdio",
    command: "npx",
    args: ["-y", pkg, ...args],
    envKeys: opts.envKeys ?? [],
    tags: opts.tags,
  };
}

// ---------------------------------------------------------------------------
// uvx helper — for Python-based MCP servers run via uvx
// ---------------------------------------------------------------------------

function uvx(
  name: string,
  description: string,
  pkg: string,
  args: string[],
  opts: {
    manifestUrl: string;
    homepageUrl?: string;
    envKeys?: string[];
    tags: string[];
  }
): SeedMcp {
  return {
    name,
    description,
    manifestUrl: opts.manifestUrl,
    homepageUrl: opts.homepageUrl,
    transport: "stdio",
    command: "uvx",
    args: [`${pkg}@latest`, ...args],
    envKeys: opts.envKeys ?? [],
    tags: opts.tags,
  };
}

// ---------------------------------------------------------------------------
// http helper — for remote/hosted MCP servers
// ---------------------------------------------------------------------------

function http(
  name: string,
  description: string,
  url: string,
  opts: {
    manifestUrl: string;
    homepageUrl?: string;
    envKeys?: string[];
    tags: string[];
  }
): SeedMcp {
  return {
    name,
    description,
    manifestUrl: opts.manifestUrl,
    homepageUrl: opts.homepageUrl,
    transport: "http",
    url,
    command: undefined,
    args: [],
    envKeys: opts.envKeys ?? [],
    tags: opts.tags,
  };
}

// ===========================================================================
// Official Reference Servers (Anthropic / MCP org)
// ===========================================================================

const officialReference: SeedMcp[] = [
  stdio(
    "Everything",
    "Reference and test server demonstrating all MCP features: prompts, resources, tools, sampling, and logging.",
    "@modelcontextprotocol/server-everything",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@modelcontextprotocol/server-everything",
      homepageUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/everything",
      tags: ["official", "reference", "testing", "developer-tools"],
    }
  ),
  stdio(
    "Filesystem",
    "Secure file operations with configurable access controls. Read, write, move, search, and get metadata for files and directories.",
    "@modelcontextprotocol/server-filesystem",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@modelcontextprotocol/server-filesystem",
      homepageUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
      tags: ["official", "filesystem", "files", "developer-tools"],
    }
  ),
  stdio(
    "Memory",
    "Knowledge graph-based persistent memory system. Create entities, relations, and observations that persist across sessions.",
    "@modelcontextprotocol/server-memory",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@modelcontextprotocol/server-memory",
      homepageUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/memory",
      tags: ["official", "memory", "knowledge-graph", "persistence"],
    }
  ),
  stdio(
    "Sequential Thinking",
    "Structured step-by-step reasoning for complex problem solving. Break down problems, revise thoughts, and branch into alternative paths.",
    "@modelcontextprotocol/server-sequential-thinking",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@modelcontextprotocol/server-sequential-thinking",
      homepageUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
      tags: ["official", "reasoning", "thinking", "problem-solving"],
    }
  ),
  stdio(
    "Fetch",
    "Web content fetching and conversion for LLM consumption. Retrieve and transform web pages into clean markdown.",
    "@modelcontextprotocol/server-fetch",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@modelcontextprotocol/server-fetch",
      homepageUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
      tags: ["official", "fetch", "web", "scraping"],
    }
  ),
  stdio(
    "Git",
    "Git repository operations including status, diff, log, commit, branch management, and file operations across local repos.",
    "@modelcontextprotocol/server-git",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@modelcontextprotocol/server-git",
      homepageUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/git",
      tags: ["official", "git", "version-control", "developer-tools"],
    }
  ),
];

// ===========================================================================
// Developer Platform & DevOps
// ===========================================================================

const devPlatforms: SeedMcp[] = [
  stdio(
    "GitHub",
    "Full GitHub integration: search repos, manage issues and PRs, read files, create branches, review Actions runs, and more.",
    "@github/mcp-server",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@github/mcp-server",
      homepageUrl: "https://github.com/github/github-mcp-server",
      envKeys: ["GITHUB_PERSONAL_ACCESS_TOKEN"],
      tags: ["github", "git", "issues", "pull-requests", "developer-tools"],
    }
  ),
  http(
    "GitLab",
    "GitLab's official MCP server for project data, issue management, and repository operations via OAuth 2.0.",
    "https://gitlab.com/-/mcp",
    {
      manifestUrl: "https://docs.gitlab.com/user/gitlab_duo/model_context_protocol/mcp_server/",
      homepageUrl: "https://gitlab.com",
      tags: ["gitlab", "git", "issues", "developer-tools"],
    }
  ),
  http(
    "Vercel",
    "Manage Vercel projects, deployments, domains, environment variables, and logs. Search documentation and analyze deploy output.",
    "https://mcp.vercel.com/mcp",
    {
      manifestUrl: "https://mcp.vercel.com",
      homepageUrl: "https://vercel.com/docs/mcp",
      tags: ["vercel", "deployment", "hosting", "developer-tools"],
    }
  ),
  stdio(
    "Cloudflare",
    "Manage Cloudflare Workers, KV, R2, D1, Durable Objects, Queues, and Workers AI through natural language.",
    "@cloudflare/mcp-server-cloudflare",
    ["init"],
    {
      manifestUrl: "https://www.npmjs.com/package/@cloudflare/mcp-server-cloudflare",
      homepageUrl: "https://github.com/cloudflare/mcp-server-cloudflare",
      envKeys: ["CLOUDFLARE_API_TOKEN"],
      tags: ["cloudflare", "workers", "edge", "r2", "kv", "d1", "infra"],
    }
  ),
  http(
    "Netlify",
    "Create, build, deploy, and manage websites with the Netlify web platform. Full project and deploy lifecycle.",
    "https://mcp.netlify.com/mcp",
    {
      manifestUrl: "https://docs.netlify.com/welcome/build-with-ai/netlify-mcp-server/",
      homepageUrl: "https://netlify.com",
      tags: ["netlify", "deployment", "hosting", "developer-tools"],
    }
  ),
  stdio(
    "Heroku",
    "Interact with the Heroku Platform: manage apps, add-ons, dynos, databases, and more through LLM-driven tools.",
    "heroku-mcp-server",
    [],
    {
      manifestUrl: "https://github.com/heroku/heroku-mcp-server",
      homepageUrl: "https://heroku.com",
      tags: ["heroku", "deployment", "hosting", "developer-tools"],
    }
  ),
  stdio(
    "Sentry",
    "Access Sentry issues, errors, projects, and AI-powered Seer analysis. Debug production errors with full context.",
    "@sentry/mcp-server",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@sentry/mcp-server",
      homepageUrl: "https://docs.sentry.io/ai/mcp/",
      envKeys: ["SENTRY_AUTH_TOKEN"],
      tags: ["sentry", "error-tracking", "debugging", "observability"],
    }
  ),
  stdio(
    "CircleCI",
    "Enable AI agents to fix build failures, inspect pipelines, jobs, and test results from CircleCI.",
    "circleci-mcp-server",
    [],
    {
      manifestUrl: "https://github.com/CircleCI-Public/mcp-server-circleci",
      homepageUrl: "https://circleci.com",
      envKeys: ["CIRCLECI_TOKEN"],
      tags: ["circleci", "ci-cd", "builds", "developer-tools"],
    }
  ),
  stdio(
    "Storybook",
    "Interact with Storybook to automate UI component testing, documentation, and visual regression checks.",
    "@storybook/addon-mcp",
    [],
    {
      manifestUrl: "https://github.com/storybookjs/mcp",
      homepageUrl: "https://storybook.js.org",
      tags: ["storybook", "ui", "testing", "components", "developer-tools"],
    }
  ),
];

// ===========================================================================
// Databases
// ===========================================================================

const databases: SeedMcp[] = [
  stdio(
    "Supabase",
    "Query Supabase databases, manage auth, inspect schemas, and deploy edge functions with natural language.",
    "@supabase/mcp-server-supabase",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@supabase/mcp-server-supabase",
      homepageUrl: "https://github.com/supabase-community/supabase-mcp",
      envKeys: ["SUPABASE_ACCESS_TOKEN"],
      tags: ["supabase", "postgres", "database", "auth", "backend"],
    }
  ),
  stdio(
    "Neon",
    "Manage Neon Postgres databases, branches, and run queries via natural language. Supports branching for safe migrations.",
    "@neondatabase/mcp-server-neon",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@neondatabase/mcp-server-neon",
      homepageUrl: "https://neon.tech/docs/introduction/mcp",
      envKeys: ["NEON_API_KEY"],
      tags: ["neon", "postgres", "database", "serverless", "branching"],
    }
  ),
  stdio(
    "Prisma",
    "Manage Prisma Postgres databases with migration support, schema introspection, SQL execution, and backup creation.",
    "prisma",
    ["mcp"],
    {
      manifestUrl: "https://www.npmjs.com/package/prisma",
      homepageUrl: "https://www.prisma.io/docs/ai/tools/mcp-server",
      tags: ["prisma", "postgres", "database", "orm", "migrations"],
    }
  ),
  stdio(
    "Turso",
    "Interact with Turso/libSQL databases: list tables, inspect schemas, and run queries with edge-first SQLite.",
    "mcp-turso",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/mcp-turso",
      homepageUrl: "https://github.com/spences10/mcp-turso-cloud",
      envKeys: ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN"],
      tags: ["turso", "sqlite", "libsql", "database", "edge"],
    }
  ),
  stdio(
    "Upstash",
    "Interact with Upstash Redis databases, QStash message queues, and Workflow management from your AI editor.",
    "@upstash/mcp-server",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@upstash/mcp-server",
      homepageUrl: "https://github.com/upstash/mcp-server",
      envKeys: ["UPSTASH_EMAIL", "UPSTASH_API_KEY"],
      tags: ["upstash", "redis", "qstash", "serverless", "cache"],
    }
  ),
  stdio(
    "MongoDB",
    "MongoDB Community Server and Atlas: query collections, manage databases, create indexes, and run aggregation pipelines.",
    "mongodb-mcp-server",
    [],
    {
      manifestUrl: "https://github.com/mongodb-js/mongodb-mcp-server",
      homepageUrl: "https://mongodb.com",
      envKeys: ["MONGODB_CONNECTION_STRING"],
      tags: ["mongodb", "database", "nosql", "atlas"],
    }
  ),
  stdio(
    "ClickHouse",
    "Query your ClickHouse database server. Run analytical queries, inspect schemas, and explore OLAP data.",
    "@clickhouse/mcp-clickhouse",
    [],
    {
      manifestUrl: "https://github.com/ClickHouse/mcp-clickhouse",
      homepageUrl: "https://clickhouse.com",
      envKeys: ["CLICKHOUSE_URL", "CLICKHOUSE_USER", "CLICKHOUSE_PASSWORD"],
      tags: ["clickhouse", "database", "analytics", "olap"],
    }
  ),
  stdio(
    "Redis",
    "The official Redis MCP server for managing and searching data in Redis. Supports key-value ops, search, and JSON.",
    "@redis/mcp-server",
    [],
    {
      manifestUrl: "https://github.com/redis/mcp-redis",
      homepageUrl: "https://redis.io",
      envKeys: ["REDIS_URL"],
      tags: ["redis", "database", "cache", "search"],
    }
  ),
  stdio(
    "Neo4j",
    "Neo4j graph database server: schema inspection, read/write Cypher queries, and graph-backed memory for agents.",
    "neo4j-mcp-server",
    [],
    {
      manifestUrl: "https://github.com/neo4j-contrib/mcp-neo4j",
      homepageUrl: "https://neo4j.com",
      envKeys: ["NEO4J_URI", "NEO4J_USER", "NEO4J_PASSWORD"],
      tags: ["neo4j", "database", "graph", "cypher"],
    }
  ),
  stdio(
    "Elasticsearch",
    "Query your data in Elasticsearch: full-text search, aggregations, schema inspection, and index management.",
    "@elastic/mcp-server-elasticsearch",
    [],
    {
      manifestUrl: "https://github.com/elastic/mcp-server-elasticsearch",
      homepageUrl: "https://elastic.co/elasticsearch",
      envKeys: ["ELASTICSEARCH_URL", "ELASTICSEARCH_API_KEY"],
      tags: ["elasticsearch", "database", "search", "analytics"],
    }
  ),
  stdio(
    "MariaDB",
    "Standard SQL operations and advanced vector/embedding-based search for MariaDB databases.",
    "mariadb-mcp-server",
    [],
    {
      manifestUrl: "https://github.com/mariadb/mcp",
      homepageUrl: "https://mariadb.com",
      envKeys: ["MARIADB_CONNECTION_STRING"],
      tags: ["mariadb", "database", "sql", "vectors"],
    }
  ),
];

// ===========================================================================
// Vector Databases
// ===========================================================================

const vectorDbs: SeedMcp[] = [
  stdio(
    "Pinecone",
    "Pinecone vector database: search documentation, manage indexes, upsert and query vectors in your development environment.",
    "pinecone-mcp",
    [],
    {
      manifestUrl: "https://github.com/pinecone-io/pinecone-mcp",
      homepageUrl: "https://pinecone.io",
      envKeys: ["PINECONE_API_KEY"],
      tags: ["pinecone", "database", "vectors", "embeddings", "ai"],
    }
  ),
  stdio(
    "Qdrant",
    "Semantic memory layer on top of Qdrant vector search engine. Store, search, and manage vector collections.",
    "mcp-server-qdrant",
    [],
    {
      manifestUrl: "https://github.com/qdrant/mcp-server-qdrant",
      homepageUrl: "https://qdrant.tech",
      envKeys: ["QDRANT_URL", "QDRANT_API_KEY"],
      tags: ["qdrant", "database", "vectors", "search", "ai"],
    }
  ),
  stdio(
    "Chroma",
    "Embeddings, vector search, document storage, and full-text search with the open-source AI application database.",
    "chroma-mcp",
    [],
    {
      manifestUrl: "https://github.com/chroma-core/chroma-mcp",
      homepageUrl: "https://trychroma.com",
      tags: ["chroma", "database", "vectors", "embeddings", "ai"],
    }
  ),
  stdio(
    "Milvus",
    "Search, query, and interact with data in your Milvus Vector Database. Manage collections and run similarity search.",
    "mcp-server-milvus",
    [],
    {
      manifestUrl: "https://github.com/zilliztech/mcp-server-milvus",
      homepageUrl: "https://milvus.io",
      envKeys: ["MILVUS_ADDRESS"],
      tags: ["milvus", "database", "vectors", "search", "ai"],
    }
  ),
];

// ===========================================================================
// Search & Research
// ===========================================================================

const searchResearch: SeedMcp[] = [
  stdio(
    "Context7",
    "Inject version-specific, up-to-date code documentation directly into prompts. Eliminates hallucinated API examples.",
    "@upstash/context7-mcp",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@upstash/context7-mcp",
      homepageUrl: "https://context7.com",
      tags: ["context7", "documentation", "docs", "api-reference", "search"],
    }
  ),
  stdio(
    "Brave Search",
    "Real-time web search, local business search, image/video/news search, and AI summarization via Brave's index.",
    "@brave/brave-search-mcp-server",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@brave/brave-search-mcp-server",
      homepageUrl: "https://github.com/brave/brave-search-mcp-server",
      envKeys: ["BRAVE_API_KEY"],
      tags: ["brave", "search", "web-search", "research"],
    }
  ),
  http(
    "Exa",
    "AI-native web search, code search, and company research. Supports semantic search and content extraction.",
    "https://mcp.exa.ai/mcp",
    {
      manifestUrl: "https://www.npmjs.com/package/exa-mcp-server",
      homepageUrl: "https://exa.ai",
      envKeys: ["EXA_API_KEY"],
      tags: ["exa", "search", "semantic-search", "research", "ai"],
    }
  ),
  stdio(
    "Firecrawl",
    "Web scraping, crawling, search, batch processing, structured data extraction, and LLM-powered analysis.",
    "firecrawl-mcp",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/firecrawl-mcp",
      homepageUrl: "https://firecrawl.dev",
      envKeys: ["FIRECRAWL_API_KEY"],
      tags: ["firecrawl", "scraping", "crawling", "extraction", "research"],
    }
  ),
  stdio(
    "Perplexity",
    "Real-time web-wide research using Perplexity's Sonar API. Conversational AI-powered search with citations.",
    "perplexity-mcp",
    [],
    {
      manifestUrl: "https://github.com/perplexityai/modelcontextprotocol",
      homepageUrl: "https://www.perplexity.ai",
      envKeys: ["PERPLEXITY_API_KEY"],
      tags: ["perplexity", "search", "research", "ai"],
    }
  ),
  stdio(
    "Apify",
    "Use 6,000+ pre-built cloud tools to extract data from websites, e-commerce, social media, search engines, and maps.",
    "apify-mcp-server",
    [],
    {
      manifestUrl: "https://github.com/apify/apify-mcp-server",
      homepageUrl: "https://apify.com",
      envKeys: ["APIFY_TOKEN"],
      tags: ["apify", "scraping", "extraction", "research", "automation"],
    }
  ),
];

// ===========================================================================
// Browser Automation
// ===========================================================================

const browserAutomation: SeedMcp[] = [
  stdio(
    "Playwright",
    "Browser automation using accessibility snapshots. Navigate pages, fill forms, click elements, take screenshots, and extract content.",
    "@playwright/mcp",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@playwright/mcp",
      homepageUrl: "https://github.com/microsoft/playwright-mcp",
      tags: ["playwright", "browser", "automation", "testing", "e2e"],
    }
  ),
  stdio(
    "Puppeteer",
    "Browser automation with Puppeteer: navigate, screenshot, click, fill, select, hover, and evaluate JavaScript in the browser.",
    "@anthropic/mcp-server-puppeteer",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@anthropic/mcp-server-puppeteer",
      homepageUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer",
      tags: ["puppeteer", "browser", "automation", "scraping"],
    }
  ),
  stdio(
    "Browserbase",
    "Automate browser interactions in the cloud: web navigation, data extraction, form filling, and more.",
    "@browserbase/mcp-server-browserbase",
    [],
    {
      manifestUrl: "https://github.com/browserbase/mcp-server-browserbase",
      homepageUrl: "https://browserbase.com",
      envKeys: ["BROWSERBASE_API_KEY"],
      tags: ["browserbase", "browser", "automation", "cloud"],
    }
  ),
];

// ===========================================================================
// Productivity & Collaboration
// ===========================================================================

const productivity: SeedMcp[] = [
  http(
    "Notion",
    "Create pages, query databases, search workspace, and manage content in Notion. 22 tools for full workspace access.",
    "https://mcp.notion.so/mcp",
    {
      manifestUrl: "https://www.npmjs.com/package/@notionhq/notion-mcp-server",
      homepageUrl: "https://developers.notion.com",
      tags: ["notion", "productivity", "wiki", "databases", "collaboration"],
    }
  ),
  http(
    "Slack",
    "Search messages, users, channels, and files. Send messages, manage canvases, and access profiles in your Slack workspace.",
    "https://mcp.slack.com/mcp",
    {
      manifestUrl: "https://mcp.slack.com",
      homepageUrl: "https://api.slack.com",
      tags: ["slack", "messaging", "team", "collaboration"],
    }
  ),
  http(
    "Linear",
    "Create and update issues, manage projects and cycles, add comments, and search docs across your Linear workspace. 23+ tools.",
    "https://mcp.linear.app/mcp",
    {
      manifestUrl: "https://mcp.linear.app",
      homepageUrl: "https://linear.app/docs/mcp",
      tags: ["linear", "project-management", "issues", "agile"],
    }
  ),
  stdio(
    "Todoist",
    "Task and project management: create tasks, organize projects, manage labels, sections, reminders, and batch operations.",
    "@shayonpal/mcp-todoist",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@shayonpal/mcp-todoist",
      homepageUrl: "https://todoist.com",
      envKeys: ["TODOIST_API_TOKEN"],
      tags: ["todoist", "tasks", "productivity", "project-management"],
    }
  ),
  http(
    "Atlassian",
    "Securely interact with Jira work items and Confluence pages, and search across both. Official Atlassian MCP server.",
    "https://www.atlassian.com/platform/remote-mcp-server",
    {
      manifestUrl: "https://www.atlassian.com/platform/remote-mcp-server",
      homepageUrl: "https://atlassian.com",
      tags: ["atlassian", "jira", "confluence", "productivity", "project-management"],
    }
  ),
  http(
    "HubSpot",
    "Connect, manage, and interact with HubSpot CRM data: contacts, companies, deals, tickets, and marketing assets.",
    "https://developer.hubspot.com/mcp",
    {
      manifestUrl: "https://developer.hubspot.com/mcp",
      homepageUrl: "https://hubspot.com",
      tags: ["hubspot", "crm", "marketing", "sales", "productivity"],
    }
  ),
  stdio(
    "Monday.com",
    "Interact with Monday.com boards, items, accounts, and work forms. Full project management integration.",
    "monday-mcp-server",
    [],
    {
      manifestUrl: "https://github.com/mondaycom/mcp",
      homepageUrl: "https://monday.com",
      envKeys: ["MONDAY_API_TOKEN"],
      tags: ["monday", "project-management", "productivity", "boards"],
    }
  ),
];

// ===========================================================================
// Payments & Commerce
// ===========================================================================

const payments: SeedMcp[] = [
  http(
    "Stripe",
    "Interact with the Stripe API for payments, subscriptions, customers, and invoices. Search Stripe's knowledge base.",
    "https://mcp.stripe.com",
    {
      manifestUrl: "https://www.npmjs.com/package/@stripe/mcp",
      homepageUrl: "https://docs.stripe.com/mcp",
      envKeys: ["STRIPE_SECRET_KEY"],
      tags: ["stripe", "payments", "billing", "subscriptions", "commerce"],
    }
  ),
  http(
    "PayPal",
    "PayPal's official MCP server. Create and manage payments, invoices, subscriptions, and payouts.",
    "https://mcp.paypal.com",
    {
      manifestUrl: "https://mcp.paypal.com",
      homepageUrl: "https://developer.paypal.com",
      tags: ["paypal", "payments", "billing", "commerce"],
    }
  ),
];

// ===========================================================================
// Design
// ===========================================================================

const design: SeedMcp[] = [
  http(
    "Figma",
    "Extract design context from Figma, generate code from frames, and write to the canvas. Bridge design and development.",
    "https://mcp.figma.com/mcp",
    {
      manifestUrl: "https://www.figma.com/developers/mcp",
      homepageUrl: "https://www.figma.com",
      envKeys: ["FIGMA_ACCESS_TOKEN"],
      tags: ["figma", "design", "ui", "prototyping", "design-to-code"],
    }
  ),
  stdio(
    "Cloudinary",
    "Media upload, transformation, AI analysis, management, optimization, and delivery. Full asset lifecycle.",
    "cloudinary-mcp-server",
    [],
    {
      manifestUrl: "https://github.com/cloudinary/mcp-servers",
      homepageUrl: "https://cloudinary.com",
      envKeys: ["CLOUDINARY_URL"],
      tags: ["cloudinary", "media", "images", "video", "design"],
    }
  ),
];

// ===========================================================================
// Email & Communications
// ===========================================================================

const email: SeedMcp[] = [
  stdio(
    "Resend",
    "Send, list, and manage emails, contacts, broadcasts, domains, and webhooks via the Resend API.",
    "resend-mcp",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/resend-mcp",
      homepageUrl: "https://resend.com/docs/mcp-server",
      envKeys: ["RESEND_API_KEY"],
      tags: ["resend", "email", "transactional", "communications"],
    }
  ),
];

// ===========================================================================
// Observability
// ===========================================================================

const observability: SeedMcp[] = [
  {
    name: "Grafana",
    description:
      "40+ tools across 15 categories: dashboard management, Prometheus, Loki logs, alerting, incident management, and OnCall.",
    manifestUrl: "https://github.com/grafana/mcp-grafana",
    homepageUrl: "https://grafana.com",
    transport: "stdio",
    command: "uvx",
    args: ["mcp-grafana"],
    envKeys: ["GRAFANA_URL", "GRAFANA_API_KEY"],
    tags: ["grafana", "observability", "monitoring", "prometheus", "loki"],
  },
  stdio(
    "PagerDuty",
    "Manage incidents, services, schedules, and escalation policies. Full PagerDuty account integration.",
    "pagerduty-mcp-server",
    [],
    {
      manifestUrl: "https://github.com/PagerDuty/pagerduty-mcp-server",
      homepageUrl: "https://pagerduty.com",
      envKeys: ["PAGERDUTY_API_KEY"],
      tags: ["pagerduty", "incidents", "on-call", "observability"],
    }
  ),
  stdio(
    "PostHog",
    "Interact with PostHog analytics, feature flags, experiments, error tracking, and session replay.",
    "posthog-mcp-server",
    [],
    {
      manifestUrl: "https://github.com/posthog/mcp",
      homepageUrl: "https://posthog.com",
      envKeys: ["POSTHOG_API_KEY"],
      tags: ["posthog", "analytics", "feature-flags", "observability"],
    }
  ),
  stdio(
    "Honeycomb",
    "Query and analyze observability data, alerts, dashboards, and cross-reference production behavior with code.",
    "honeycomb-mcp",
    [],
    {
      manifestUrl: "https://github.com/honeycombio/honeycomb-mcp",
      homepageUrl: "https://honeycomb.io",
      envKeys: ["HONEYCOMB_API_KEY"],
      tags: ["honeycomb", "observability", "tracing", "debugging"],
    }
  ),
  stdio(
    "Axiom",
    "Query and analyze Axiom logs, traces, and event data in natural language. Full observability pipeline.",
    "axiom-mcp-server",
    [],
    {
      manifestUrl: "https://github.com/axiomhq/mcp-server-axiom",
      homepageUrl: "https://axiom.co",
      envKeys: ["AXIOM_TOKEN"],
      tags: ["axiom", "observability", "logs", "traces"],
    }
  ),
];

// ===========================================================================
// AI Providers
// ===========================================================================

const aiProviders: SeedMcp[] = [
  stdio(
    "OpenAI Agents",
    "Run and manage OpenAI agent workflows, completions, and assistants from your MCP client.",
    "@openai/mcp-server",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@openai/mcp-server",
      homepageUrl: "https://platform.openai.com",
      envKeys: ["OPENAI_API_KEY"],
      tags: ["openai", "ai", "llm", "agents", "completions"],
    }
  ),
  http(
    "Hugging Face",
    "Connect to Hugging Face Hub: semantic search for spaces/papers, explore datasets and models, and access compatible tools.",
    "https://huggingface.co/mcp",
    {
      manifestUrl: "https://huggingface.co/settings/mcp",
      homepageUrl: "https://huggingface.co",
      tags: ["huggingface", "ai", "models", "datasets", "research"],
    }
  ),
  stdio(
    "E2B",
    "Run code in secure cloud sandboxes. Isolated execution environment for AI-generated code with full filesystem access.",
    "@e2b/mcp-server",
    [],
    {
      manifestUrl: "https://github.com/e2b-dev/mcp-server",
      homepageUrl: "https://e2b.dev",
      envKeys: ["E2B_API_KEY"],
      tags: ["e2b", "sandbox", "code-execution", "ai", "security"],
    }
  ),
];

// ===========================================================================
// Data & Analytics
// ===========================================================================

const dataAnalytics: SeedMcp[] = [
  stdio(
    "PostgreSQL",
    "Direct Postgres database access: run queries, inspect schemas, list tables, and explore database structure.",
    "@modelcontextprotocol/server-postgres",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@modelcontextprotocol/server-postgres",
      homepageUrl: "https://github.com/modelcontextprotocol/servers",
      envKeys: ["POSTGRES_CONNECTION_STRING"],
      tags: ["postgres", "database", "sql", "official"],
    }
  ),
  stdio(
    "SQLite",
    "Local SQLite database access with business intelligence capabilities. Query, analyze, and create memo tables.",
    "@modelcontextprotocol/server-sqlite",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@modelcontextprotocol/server-sqlite",
      homepageUrl: "https://github.com/modelcontextprotocol/servers",
      tags: ["sqlite", "database", "sql", "local", "official"],
    }
  ),
];

// ===========================================================================
// Infrastructure & Cloud
// ===========================================================================

const infraCloud: SeedMcp[] = [
  uvx(
    "AWS API",
    "Official AWS Labs MCP server — interact with AWS services and resources through AWS CLI commands. Covers S3, Lambda, DynamoDB, EC2, CloudFormation, and all other AWS APIs.",
    "awslabs.aws-api-mcp-server",
    [],
    {
      manifestUrl: "https://github.com/awslabs/mcp",
      homepageUrl: "https://awslabs.github.io/mcp/servers/aws-api-mcp-server",
      envKeys: ["AWS_REGION", "AWS_PROFILE", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
      tags: ["aws", "cloud", "s3", "lambda", "infra", "official"],
    }
  ),
  stdio(
    "Azure",
    "Access Azure services: Azure Storage, Cosmos DB, Azure CLI, and more. Official Microsoft Azure MCP server.",
    "azure-mcp-server",
    [],
    {
      manifestUrl: "https://github.com/microsoft/mcp/tree/main/servers/Azure.Mcp.Server",
      homepageUrl: "https://azure.microsoft.com",
      envKeys: ["AZURE_SUBSCRIPTION_ID"],
      tags: ["azure", "cloud", "microsoft", "infra"],
    }
  ),
  stdio(
    "Google Cloud Run",
    "Deploy code to Google Cloud Run. Build, configure, and manage Cloud Run services and revisions.",
    "cloud-run-mcp",
    [],
    {
      manifestUrl: "https://github.com/GoogleCloudPlatform/cloud-run-mcp",
      homepageUrl: "https://cloud.google.com/run",
      envKeys: ["GOOGLE_CLOUD_PROJECT"],
      tags: ["gcp", "cloud", "cloud-run", "serverless", "infra"],
    }
  ),
  stdio(
    "Terraform",
    "Manage Terraform configurations, plan and apply infrastructure changes, and inspect state through MCP.",
    "terraform-mcp-server",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/terraform-mcp-server",
      homepageUrl: "https://developer.hashicorp.com/terraform",
      tags: ["terraform", "iac", "infrastructure", "devops"],
    }
  ),
  stdio(
    "Pulumi",
    "Deploy and manage cloud infrastructure using Pulumi. Create, update, and inspect stacks across any cloud.",
    "pulumi-mcp-server",
    [],
    {
      manifestUrl: "https://github.com/pulumi/pulumi-mcp-server",
      homepageUrl: "https://www.pulumi.com",
      envKeys: ["PULUMI_ACCESS_TOKEN"],
      tags: ["pulumi", "iac", "infrastructure", "devops"],
    }
  ),
  stdio(
    "Docker",
    "Manage Docker containers, images, volumes, and networks. Build, run, and inspect containerized applications.",
    "docker-mcp-server",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/docker-mcp-server",
      homepageUrl: "https://www.docker.com",
      tags: ["docker", "containers", "devops", "infrastructure"],
    }
  ),
  stdio(
    "Kubernetes",
    "Manage Kubernetes clusters, deployments, services, and pods. Apply manifests and inspect cluster state.",
    "kubernetes-mcp-server",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/kubernetes-mcp-server",
      homepageUrl: "https://kubernetes.io",
      envKeys: ["KUBECONFIG"],
      tags: ["kubernetes", "k8s", "containers", "orchestration", "infra"],
    }
  ),
  stdio(
    "Render",
    "Spin up new services, run queries against databases, and debug with direct access to service metrics and logs.",
    "render-mcp-server",
    [],
    {
      manifestUrl: "https://render.com/docs/mcp-server",
      homepageUrl: "https://render.com",
      envKeys: ["RENDER_API_KEY"],
      tags: ["render", "deployment", "hosting", "infra"],
    }
  ),
  stdio(
    "Firebase",
    "Firebase's experimental MCP server for managing Firebase projects, Firestore, Auth, and Cloud Functions.",
    "firebase-tools",
    ["mcp"],
    {
      manifestUrl: "https://github.com/firebase/firebase-tools/tree/main/src/mcp",
      homepageUrl: "https://firebase.google.com",
      tags: ["firebase", "google", "database", "auth", "infra"],
    }
  ),
];

// ===========================================================================
// Security
// ===========================================================================

const security: SeedMcp[] = [
  stdio(
    "Snyk",
    "Scan code and dependencies for vulnerabilities. Get security advisories, fix recommendations, and license compliance.",
    "snyk-mcp-server",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/snyk-mcp-server",
      homepageUrl: "https://snyk.io",
      envKeys: ["SNYK_TOKEN"],
      tags: ["snyk", "security", "vulnerabilities", "dependencies", "sca"],
    }
  ),
  stdio(
    "Auth0",
    "Interact with your Auth0 tenant: manage actions, applications, forms, logs, resource servers, and more.",
    "@auth0/auth0-mcp-server",
    [],
    {
      manifestUrl: "https://github.com/auth0/auth0-mcp-server",
      homepageUrl: "https://auth0.com",
      envKeys: ["AUTH0_DOMAIN", "AUTH0_CLIENT_ID", "AUTH0_CLIENT_SECRET"],
      tags: ["auth0", "auth", "identity", "security"],
    }
  ),
  stdio(
    "SonarQube",
    "Integration with SonarQube Server or Cloud for code quality analysis and vulnerability detection.",
    "sonarqube-mcp-server",
    [],
    {
      manifestUrl: "https://github.com/SonarSource/sonarqube-mcp-server",
      homepageUrl: "https://sonarsource.com",
      envKeys: ["SONARQUBE_URL", "SONARQUBE_TOKEN"],
      tags: ["sonarqube", "security", "code-quality", "static-analysis"],
    }
  ),
  stdio(
    "Semgrep",
    "Enable AI agents to secure code with Semgrep. Static analysis for finding bugs, vulnerabilities, and anti-patterns.",
    "semgrep",
    ["mcp"],
    {
      manifestUrl: "https://github.com/semgrep/semgrep/blob/develop/cli/src/semgrep/mcp/README.md",
      homepageUrl: "https://semgrep.dev",
      tags: ["semgrep", "security", "static-analysis", "code-quality"],
    }
  ),
  stdio(
    "CrowdStrike Falcon",
    "Intelligent security analysis: detections, incidents, threat intelligence, hosts, vulnerabilities, and identity protection.",
    "falcon-mcp",
    [],
    {
      manifestUrl: "https://github.com/CrowdStrike/falcon-mcp",
      homepageUrl: "https://crowdstrike.com",
      envKeys: ["FALCON_CLIENT_ID", "FALCON_CLIENT_SECRET"],
      tags: ["crowdstrike", "security", "threat-intelligence", "edr"],
    }
  ),
];

// ===========================================================================
// Utilities
// ===========================================================================

const utilities: SeedMcp[] = [
  stdio(
    "MCP Proxy",
    "Expose any stdio-based MCP server over Streamable HTTP or SSE. Bridge local tools to remote clients.",
    "mcp-proxy",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/mcp-proxy",
      homepageUrl: "https://github.com/punkpeye/mcp-proxy",
      tags: ["proxy", "transport", "http", "sse", "utility"],
    }
  ),
  stdio(
    "Time",
    "Time and timezone conversion utilities. Get current time in any timezone and convert between timezones.",
    "@modelcontextprotocol/server-time",
    [],
    {
      manifestUrl: "https://www.npmjs.com/package/@modelcontextprotocol/server-time",
      homepageUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/time",
      tags: ["time", "timezone", "utility", "official"],
    }
  ),
];

// ===========================================================================
// Aggregate export
// ===========================================================================

export const SEED_MCP_DEFINITIONS: SeedMcp[] = [
  ...officialReference,
  ...devPlatforms,
  ...databases,
  ...vectorDbs,
  ...searchResearch,
  ...browserAutomation,
  ...productivity,
  ...payments,
  ...design,
  ...email,
  ...observability,
  ...aiProviders,
  ...dataAnalytics,
  ...infraCloud,
  ...security,
  ...utilities,
];
