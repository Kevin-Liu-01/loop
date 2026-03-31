import type { CreateSkillInput } from "@/lib/db/skills";

type SeedSkill = Omit<CreateSkillInput, "origin"> & {
  origin?: CreateSkillInput["origin"];
};

export const infra: SeedSkill[] = [
  // ---------------------------------------------------------------------------
  // 1. Edge Compute
  // ---------------------------------------------------------------------------
  {
    slug: "edge-compute",
    title: "Cloudflare Edge Compute",
    description:
      "Cloudflare Workers, Vercel Edge Functions, Deno Deploy — patterns for running code at the edge with low latency and global distribution.",
    category: "infra",
    accent: "signal-blue",
    featured: false,
    visibility: "public",
    tags: ["edge", "cloudflare", "vercel", "serverless", "latency"],
    body: `# Cloudflare Edge Compute

Run code at the network edge — closer to users, lower latency, globally distributed by default.

## When to use

- Request routing, A/B testing, and geo-based personalization
- Auth token validation and JWT verification at the perimeter
- HTML rewriting, header injection, and response transformation
- Lightweight API proxies and gateway logic
- Real-time feature flags evaluated before origin roundtrip
- Image transformation and format negotiation at the edge
- Bot detection and rate limiting before traffic hits your origin

## When NOT to use

- Long-running compute (>30 s wall-clock on Workers, >25 s on Vercel Edge)
- Heavy CPU work — crypto hashing large payloads, ML inference, video transcoding
- Anything that needs persistent TCP connections to databases without connection pooling
- Batch jobs, cron-style workloads, or queue consumers
- When cold start is irrelevant (internal services with warm pools)
- Tasks requiring filesystem access or native binaries

## Core concepts

### Execution model

Edge functions run in V8 isolates (Cloudflare Workers, Vercel Edge) or Deno isolates (Deno Deploy). They share nothing between requests — no global mutable state survives across invocations reliably.

### Runtime differences

| Platform              | Runtime     | Max duration | Max size | KV / Storage        |
|-----------------------|-------------|-------------|----------|---------------------|
| Cloudflare Workers    | V8 isolate  | 30 s (paid) | 10 MB    | KV, R2, D1, DO      |
| Vercel Edge Functions | V8 isolate  | 25 s        | 4 MB     | Edge Config, KV      |
| Deno Deploy           | Deno isolate| 50 ms CPU   | No limit | Deno KV              |

### Request lifecycle

1. DNS resolves to nearest edge PoP
2. TLS terminates at the edge
3. Edge function executes in-region isolate
4. Function can respond directly or fetch from origin
5. Response cached at edge if cache headers allow

## Workflow

### Step 1 — Scaffold a Cloudflare Worker

\`\`\`bash
npm create cloudflare@latest my-worker -- --type=hello-world
cd my-worker
\`\`\`

### Step 2 — Configure wrangler.toml

\`\`\`toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-12-01"

[vars]
ENVIRONMENT = "production"

[[kv_namespaces]]
binding = "CACHE_KV"
id = "abc123"
\`\`\`

### Step 3 — Implement the handler

\`\`\`typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Geo-based routing
    const country = request.cf?.country ?? "US";
    if (country === "DE") {
      return Response.redirect("https://de.example.com" + url.pathname);
    }

    // KV-backed cache
    const cached = await env.CACHE_KV.get(url.pathname);
    if (cached) {
      return new Response(cached, {
        headers: { "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }

    const origin = await fetch("https://api.example.com" + url.pathname);
    const body = await origin.text();
    await env.CACHE_KV.put(url.pathname, body, { expirationTtl: 300 });

    return new Response(body, {
      headers: { "Content-Type": "application/json", "X-Cache": "MISS" },
    });
  },
};
\`\`\`

### Step 4 — Vercel Edge Function equivalent

\`\`\`typescript
// app/api/geo/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export function GET(request: NextRequest) {
  const country = request.geo?.country ?? "US";
  const city = request.geo?.city ?? "unknown";

  return NextResponse.json({
    country,
    city,
    timestamp: Date.now(),
  });
}
\`\`\`

### Step 5 — Deploy and verify

\`\`\`bash
# Cloudflare
npx wrangler deploy

# Verify latency from multiple regions
curl -w "time_total: %{time_total}s\\n" https://my-worker.example.workers.dev/
\`\`\`

## Examples

### JWT validation at the edge

\`\`\`typescript
import { jwtVerify } from "jose";

async function validateToken(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(auth.slice(7), secret);
    return new Response(JSON.stringify({ userId: payload.sub }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response("Invalid token", { status: 403 });
  }
}
\`\`\`

### A/B testing with edge-side cookies

\`\`\`typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const cookie = request.headers.get("Cookie") ?? "";
    let variant = cookie.match(/ab_variant=(\\w+)/)?.[1];

    if (!variant) {
      variant = Math.random() < 0.5 ? "control" : "treatment";
    }

    const origin = variant === "treatment"
      ? "https://v2.example.com"
      : "https://example.com";

    const response = await fetch(origin + new URL(request.url).pathname);
    const mutated = new Response(response.body, response);
    mutated.headers.set("Set-Cookie", \\\`ab_variant=\${variant}; Path=/; Max-Age=86400\\\`);
    return mutated;
  },
};
\`\`\`

## Decision tree

\`\`\`
Need to run code on every request?
├── Yes → Is the logic lightweight (<50ms CPU)?
│   ├── Yes → Edge function ✓
│   └── No  → Serverless function or origin server
└── No  → Static asset or CDN cache
\`\`\`

\`\`\`
Which edge platform?
├── Need KV, R2, Durable Objects, D1 → Cloudflare Workers
├── Next.js app on Vercel            → Vercel Edge Functions
├── Deno-native codebase             → Deno Deploy
└── Multi-cloud / portable           → Cloudflare Workers (most portable API)
\`\`\`

## Edge cases and gotchas

- **No Node.js APIs**: Workers and Vercel Edge run V8, not Node. \\\`fs\\\`, \\\`net\\\`, \\\`child_process\\\` are unavailable. Use Web APIs (\\\`fetch\\\`, \\\`crypto\\\`, \\\`TextEncoder\\\`).
- **Cold starts are rare but real**: Isolate recycling can add 5–50 ms on first request to a new PoP. Pre-warm critical paths with scheduled pings.
- **Subrequest limits**: Cloudflare Workers allow 50 subrequests per invocation (1000 on paid). Plan fan-out carefully.
- **Global state is unreliable**: Variables declared outside the handler may persist between requests on the same isolate, but never depend on it.
- **Body size limits**: Workers have a 100 MB response body limit; Vercel Edge has stricter limits for streaming.
- **Date.now() may be pinned**: In some runtimes, \\\`Date.now()\\\` returns the same value for the entire request for security. Use \\\`performance.now()\\\` for elapsed-time measurement.
- **Crypto key import is async**: \\\`crypto.subtle.importKey\\\` returns a promise. Cache imported keys in module scope.

## Evaluation criteria

| Criteria              | Target                                     |
|-----------------------|--------------------------------------------|
| P50 latency           | < 10 ms for cache hits, < 50 ms for origin |
| Cold start overhead   | < 50 ms                                    |
| Error rate            | < 0.1% on edge logic                       |
| Cache hit ratio       | > 90% for static/semi-static routes        |
| Bundle size           | < 1 MB (ideally < 200 KB)                  |
| Subrequest count      | < 10 per invocation                        |
| Global coverage       | Edge PoPs on all target continents         |`,
    agentDocs: {
      codex: `# Codex — Cloudflare Edge Compute

## Principles
- Default to Web APIs — no Node.js built-ins are available in V8 isolates.
- Keep edge logic thin: validate, route, transform, cache. Heavy compute goes to origin.
- Treat global state as ephemeral — never store mutable data outside the request handler.

## Implementation guidance
- Use \\\`wrangler.toml\\\` as the source of truth for bindings, routes, and compatibility dates.
- Prefer KV for read-heavy caches, Durable Objects for coordination, R2 for large blobs.
- Set \\\`compatibility_date\\\` to the latest tested date; do not leave it stale.
- Validate environment bindings at handler entry: fail fast with a clear 500 if a binding is missing.

## Code patterns
- Always return a \\\`Response\\\` — never let the handler fall through without one.
- Use \\\`structuredClone\\\` or \\\`new Response(original.body, original)\\\` to mutate immutable responses.
- Cache imported crypto keys in module scope to avoid repeated \\\`importKey\\\` calls.
- Set \\\`Cache-Control\\\` and \\\`CDN-Cache-Control\\\` headers explicitly; do not rely on platform defaults.

## Testing
- Use \\\`wrangler dev\\\` for local testing with real bindings via \\\`--remote\\\`.
- Test from multiple regions using curl or a synthetic monitor.
- Verify subrequest counts stay under platform limits.

## Common mistakes
- Using \\\`node:\\\` built-ins that silently fail or crash the isolate.
- Forgetting to \\\`await\\\` KV/R2 operations (they return promises).
- Exceeding the 50-subrequest limit in fan-out patterns.
- Assuming \\\`Date.now()\\\` changes within a single request.`,
      cursor: `# Cursor — Cloudflare Edge Compute

## Autocomplete and generation rules
- When generating edge functions, default to the \\\`export default { fetch }\\\` handler shape.
- Import types from \\\`@cloudflare/workers-types\\\` for \\\`Env\\\`, \\\`Request\\\`, and \\\`ExecutionContext\\\`.
- Do not import Node.js modules — flag any \\\`require\\\` or \\\`node:\\\` import as an error.
- For Vercel Edge, add \\\`export const runtime = "edge";\\\` at the top of the route file.

## Inline hints
- Warn when a fetch call inside an edge handler is missing error handling.
- Warn when KV \\\`put\\\` is called without \\\`expirationTtl\\\` — stale data risk.
- Suggest \\\`request.cf?.country\\\` for geo-routing instead of IP-based lookup libraries.
- Flag any use of \\\`setTimeout\\\` > 0 — edge isolates do not support long-running timers.

## Refactoring
- Extract shared edge middleware into a \\\`lib/edge/\\\` directory with pure functions.
- Keep handler files under 200 lines; split routing logic into separate modules.
- Prefer composition: \\\`handleAuth(request, env) ?? handleGeo(request, env) ?? handleDefault(request, env)\\\`.

## Testing suggestions
- Generate Miniflare-based test stubs when creating new Workers.
- Suggest latency assertions: response time < 100 ms from test region.
- Recommend \\\`wrangler tail\\\` for live-debugging production Workers.

## Context awareness
- If the project has a \\\`wrangler.toml\\\`, read it to understand bindings before generating code.
- If the project is Next.js on Vercel, use \\\`NextRequest\\\` / \\\`NextResponse\\\` instead of raw \\\`Request\\\`.`,
      claude: `# Claude — Cloudflare Edge Compute

## Conversational guidance
- When asked about edge vs serverless, explain the latency-vs-capability tradeoff concretely:
  edge = lower latency, smaller runtime; serverless = full Node.js, longer execution time.
- Provide platform comparison tables when the user is choosing between Cloudflare, Vercel Edge, and Deno Deploy.
- When reviewing edge code, check for: missing error responses, unhandled promise rejections, and Node.js API usage.

## Explanation patterns
- Explain V8 isolate model: lighter than containers, shared process, per-request isolation.
- Clarify KV consistency: eventually consistent reads, strong consistency only within a single PoP.
- Describe Durable Objects as "single-threaded actors at the edge" for coordination use cases.

## Architecture review
- Flag any edge function that exceeds 5 subrequests as a candidate for origin consolidation.
- Recommend edge for: auth validation, geo-routing, feature flags, cache orchestration.
- Recommend against edge for: database writes, file processing, ML inference, long-polling.

## Debugging assistance
- When debugging latency, ask about: DNS, TLS negotiation, cold start, subrequest waterfall.
- Suggest \\\`wrangler tail --format json\\\` for structured production log inspection.
- For Vercel Edge, recommend checking the function tab in the Vercel dashboard for cold start metrics.

## Security considerations
- Validate all tokens at the edge before forwarding to origin.
- Never log full JWTs or API keys in edge function logs.
- Use \\\`crypto.subtle\\\` for HMAC validation, not string comparison.`,
      agents: `# AGENTS.md — Cloudflare Edge Compute

## Review checklist
- Does the edge function return a Response on every code path, including errors?
- Are all KV/R2 operations awaited with proper error handling?
- Is the subrequest count within platform limits (50 free / 1000 paid on Cloudflare)?
- Are Node.js built-ins absent from the import graph?
- Is \\\`Cache-Control\\\` set explicitly on every response?
- Is geo-routing tested with multiple country codes?

## Architecture review
- Is the edge function thin (validate, route, transform) or doing too much compute?
- Could any origin fetch be replaced with a KV lookup?
- Is there a fallback path if the edge function throws?
- Are secrets stored in environment bindings, not hardcoded?

## Performance review
- Is the bundle under 1 MB? Under 200 KB ideally?
- Are crypto keys cached in module scope?
- Is KV used with appropriate TTLs — not too short (cache thrashing) or too long (stale data)?

## Testing review
- Are there integration tests using Miniflare or wrangler dev --remote?
- Is latency tested from representative regions?
- Are error responses (401, 403, 500) tested explicitly?`
    }
  },

  // ---------------------------------------------------------------------------
  // 2. Database Patterns
  // ---------------------------------------------------------------------------
  {
    slug: "database-patterns",
    title: "Supabase Database Patterns",
    description:
      "Supabase and Postgres best practices: connection pooling, RLS policies, migrations, indexing, query optimization, and schema design for web apps.",
    category: "infra",
    accent: "signal-blue",
    featured: false,
    visibility: "public",
    tags: ["postgres", "database", "sql", "migrations", "indexing"],
    body: `# Supabase Database Patterns

Supabase wraps Postgres with auth, real-time subscriptions, storage, and auto-generated APIs. This skill covers the database layer — schema design, RLS, migrations, indexing, and query optimization.

## When to use

- Designing schema for a new Supabase-backed application
- Adding Row Level Security policies to protect data per-user or per-org
- Writing migrations that are safe for zero-downtime deployments
- Diagnosing slow queries and adding appropriate indexes
- Setting up connection pooling for serverless workloads
- Optimizing Postgres for high-read, low-write web app patterns
- Implementing soft deletes, audit trails, or temporal data patterns

## When NOT to use

- Graph-shaped data that needs recursive traversals (consider a graph DB)
- Time-series at extreme write volume (consider TimescaleDB or ClickHouse)
- Full-text search as the primary access pattern (consider a dedicated search engine)
- Blob storage (use Supabase Storage or S3, not bytea columns)
- When the app only needs a key-value store (use Redis or KV)

## Core concepts

### Connection pooling

Supabase uses PgBouncer in transaction mode by default on port 6543. Each serverless function reuses pooled connections instead of opening a new TCP connection per invocation.

| Mode        | Port | Use case                           |
|-------------|------|------------------------------------|
| Direct      | 5432 | Migrations, long-lived connections |
| Transaction | 6543 | Serverless, short queries          |
| Session     | —    | Prepared statements, LISTEN/NOTIFY |

### Row Level Security (RLS)

RLS policies run as implicit WHERE clauses on every query. Supabase exposes \\\`auth.uid()\\\` and \\\`auth.jwt()\\\` as helper functions inside policies.

### Migration safety

Migrations in production must be backwards-compatible. Never rename a column — add a new one, backfill, switch code, then drop the old column.

## Workflow

### Step 1 — Define schema with migrations

\`\`\`sql
-- supabase/migrations/001_create_projects.sql
CREATE TABLE projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  slug        text NOT NULL UNIQUE,
  description text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_owner ON projects (owner_id);
CREATE INDEX idx_projects_slug ON projects (slug);

-- Updated-at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
\`\`\`

### Step 2 — Add RLS policies

\`\`\`sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can read their own projects
CREATE POLICY "Users read own projects"
  ON projects FOR SELECT
  USING (owner_id = auth.uid());

-- Users can insert projects they own
CREATE POLICY "Users insert own projects"
  ON projects FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Users can update their own non-archived projects
CREATE POLICY "Users update own projects"
  ON projects FOR UPDATE
  USING (owner_id = auth.uid() AND NOT is_archived)
  WITH CHECK (owner_id = auth.uid());

-- Users can soft-delete (archive) their own projects
CREATE POLICY "Users archive own projects"
  ON projects FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid() AND is_archived = true);
\`\`\`

### Step 3 — Optimize with targeted indexes

\`\`\`sql
-- Partial index for active (non-archived) projects
CREATE INDEX idx_projects_active
  ON projects (owner_id, created_at DESC)
  WHERE NOT is_archived;

-- GIN index for full-text search on name + description
CREATE INDEX idx_projects_search
  ON projects
  USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));
\`\`\`

### Step 4 — Query with the Supabase client

\`\`\`typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function listActiveProjects(userId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, slug, created_at")
    .eq("owner_id", userId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(\\\`listActiveProjects: \${error.message}\\\`);
  return data;
}
\`\`\`

### Step 5 — Run and verify migrations

\`\`\`bash
# Local development
supabase db reset
supabase db diff --use-migra

# Production (via CI)
supabase db push --linked
\`\`\`

## Examples

### Multi-tenant RLS with org membership

\`\`\`sql
CREATE TABLE org_members (
  org_id  uuid REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role    text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  PRIMARY KEY (org_id, user_id)
);

CREATE POLICY "Org members read org data"
  ON org_data FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );
\`\`\`

### Safe column migration (zero-downtime)

\`\`\`sql
-- Step 1: Add new column
ALTER TABLE projects ADD COLUMN display_name text;

-- Step 2: Backfill (batched to avoid long locks)
UPDATE projects SET display_name = name WHERE display_name IS NULL;

-- Step 3: (deploy code that reads display_name with fallback to name)

-- Step 4: Make non-null after code is deployed
ALTER TABLE projects ALTER COLUMN display_name SET NOT NULL;
ALTER TABLE projects ALTER COLUMN display_name SET DEFAULT '';

-- Step 5: (deploy code that only reads display_name, drop old references)
\`\`\`

## Decision tree

\`\`\`
New table or column?
├── Add migration file in supabase/migrations/
├── Need per-user isolation? → Add RLS policy
├── Queried frequently by a non-PK column? → Add index
├── Column holds large text searched often? → Add GIN index with to_tsvector
└── Column needs uniqueness? → Add UNIQUE constraint in migration
\`\`\`

\`\`\`
Slow query?
├── Run EXPLAIN ANALYZE
├── Sequential scan on large table? → Add index on filter/join columns
├── Index exists but not used? → Check for type mismatch or function wrapping
├── Lots of dead tuples? → Run VACUUM ANALYZE
└── Still slow? → Consider materialized view or denormalization
\`\`\`

## Edge cases and gotchas

- **RLS is bypassed by service_role key**: The \\\`service_role\\\` key skips all RLS. Never expose it to the client. Use \\\`anon\\\` key in browsers.
- **PgBouncer transaction mode breaks prepared statements**: Use parameterized queries, not \\\`PREPARE\\\`. Supabase client handles this, but raw \\\`pg\\\` drivers may not.
- **Migrations with locks**: \\\`ALTER TABLE ... ADD COLUMN\\\` with a DEFAULT on Postgres < 11 locks the table. On 11+, it's instant for non-volatile defaults. \\\`ADD COLUMN NOT NULL\\\` without a default still locks.
- **UUID primary keys**: Use \\\`gen_random_uuid()\\\` (Postgres 13+) over \\\`uuid_generate_v4()\\\` (requires extension). UUIDs are great for distributed systems but make range scans slower than integer IDs.
- **Cascading deletes**: \\\`ON DELETE CASCADE\\\` is convenient but dangerous on large tables — it can lock rows across multiple tables. Prefer soft deletes for user-facing data.
- **Real-time depends on RLS**: Supabase Realtime subscriptions respect RLS policies. If RLS is misconfigured, clients receive no events — not an error, just silence.
- **Supabase CLI diff limitations**: \\\`supabase db diff\\\` may miss some changes (triggers, functions). Always review generated SQL before applying.

## Evaluation criteria

| Criteria                | Target                                      |
|-------------------------|---------------------------------------------|
| Query P95 latency       | < 100 ms for indexed queries                |
| Migration rollback plan | Every migration has a documented reverse     |
| RLS coverage            | 100% of user-facing tables have RLS enabled  |
| Index bloat             | Unused indexes identified and dropped        |
| Connection pool usage   | < 80% of pool capacity under peak load       |
| Dead tuple ratio        | < 5% (autovacuum tuned)                      |`,
    agentDocs: {
      codex: `# Codex — Supabase Database Patterns

## Principles
- Every user-facing table must have RLS enabled with at least one policy per operation (SELECT, INSERT, UPDATE, DELETE).
- Migrations are append-only files. Never edit a migration that has already been applied.
- Use connection pooling (port 6543) for all serverless functions. Direct connections (5432) only for migrations.
- Prefer \\\`gen_random_uuid()\\\` for UUID generation — no extension required on Postgres 13+.

## Schema design
- Use \\\`timestamptz\\\` for all timestamp columns, never \\\`timestamp\\\` (timezone-naive).
- Add \\\`created_at\\\` and \\\`updated_at\\\` to every table with a trigger for \\\`updated_at\\\`.
- Use CHECK constraints for enum-like columns instead of a separate lookup table when the set is small and stable.
- Foreign keys should specify ON DELETE behavior explicitly — CASCADE, SET NULL, or RESTRICT.

## RLS patterns
- Use \\\`auth.uid()\\\` for direct ownership checks.
- For org/team access, join through a membership table inside the policy.
- Test RLS with \\\`SET LOCAL role = 'authenticated'; SET LOCAL request.jwt.claim.sub = 'user-uuid';\\\` in psql.
- Never use \\\`SECURITY DEFINER\\\` functions to bypass RLS unless absolutely necessary and well-documented.

## Indexing
- Always index foreign key columns — Postgres does not auto-index them.
- Use partial indexes for common filtered queries: \\\`WHERE NOT is_deleted\\\`, \\\`WHERE status = 'active'\\\`.
- Monitor with \\\`pg_stat_user_indexes\\\` — drop indexes with zero scans.
- Use \\\`CONCURRENTLY\\\` for production index creation to avoid table locks.

## Migration safety
- Never \\\`DROP COLUMN\\\` in the same deploy that removes code references — use a two-phase approach.
- Never \\\`ALTER TYPE\\\` on a column used in an index — drop index first, alter, recreate.
- Wrap destructive operations in a transaction with a sanity-check query.

## Common mistakes
- Forgetting to enable RLS on a new table (data is publicly readable via PostgREST).
- Using \\\`service_role\\\` key in client-side code.
- Running \\\`ALTER TABLE ... ADD COLUMN ... NOT NULL\\\` without a DEFAULT (locks table).
- Not indexing columns used in WHERE clauses of RLS policies (policy becomes a seq scan).`,
      cursor: `# Cursor — Supabase Database Patterns

## Autocomplete and generation rules
- When generating Supabase queries, always import and use the typed client: \\\`createClient<Database>\\\`.
- Use \\\`.select()\\\` with explicit column lists, not \\\`select("*")\\\`.
- Generate RLS policies alongside every new \\\`CREATE TABLE\\\` statement.
- Add index suggestions as comments when generating schema with foreign keys.

## Inline hints
- Warn when \\\`NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY\\\` appears in client-side code.
- Flag \\\`select("*")\\\` calls and suggest explicit column selection.
- Suggest \\\`.single()\\\` when the query is expected to return exactly one row.
- Warn when a \\\`.eq()\\\` filter targets a column without a known index.

## Refactoring
- Extract repeated Supabase queries into \\\`lib/db/\\\` files organized by domain (e.g., \\\`lib/db/projects.ts\\\`).
- Consolidate inline SQL strings into migration files.
- When a query is duplicated across server components, extract into a shared data-access function.

## Testing suggestions
- Generate test cases that verify RLS by querying as different users.
- Suggest \\\`supabase db reset && supabase db diff\\\` as a migration verification step.
- Recommend checking \\\`EXPLAIN ANALYZE\\\` output for any query touching > 10K rows.

## Context awareness
- Read \\\`supabase/migrations/\\\` to understand the current schema before generating queries.
- If \\\`database.types.ts\\\` exists, use its types for client instantiation.
- Detect \\\`@supabase/ssr\\\` vs \\\`@supabase/supabase-js\\\` and use the appropriate client pattern.`,
      claude: `# Claude — Supabase Database Patterns

## Conversational guidance
- When a user asks "how do I secure this table," start with RLS — explain that Supabase tables are exposed via PostgREST and are publicly queryable unless RLS is enabled.
- For migration questions, always ask: "Has this migration already been applied to production?" before recommending changes.
- When explaining indexing, use EXPLAIN ANALYZE output as a teaching tool — walk through Seq Scan vs Index Scan.

## Explanation patterns
- Explain RLS as "automatic WHERE clauses": every query gets an invisible filter based on the policy.
- Describe connection pooling as "PgBouncer sits between your serverless functions and Postgres, reusing connections."
- Clarify transaction mode limitations: no prepared statements, no LISTEN/NOTIFY, no SET commands.

## Architecture review
- Flag tables without RLS as a security risk — every table exposed to the client needs policies.
- Recommend separating read-heavy and write-heavy access patterns: read replicas for dashboards, primary for writes.
- Suggest materialized views for expensive aggregation queries that don't need real-time accuracy.

## Debugging assistance
- For slow queries: ask for EXPLAIN ANALYZE output, check for sequential scans, missing indexes, or bloated tables.
- For RLS issues: suggest testing with \\\`SET LOCAL\\\` in psql to simulate authenticated requests.
- For connection issues: check pool exhaustion (\\\`pgbouncer SHOW POOLS\\\`), verify the correct port is used.

## Security considerations
- Never recommend exposing \\\`service_role\\\` key to the browser.
- RLS policies should be defensive: prefer explicit allows over broad access.
- Recommend \\\`SECURITY INVOKER\\\` for functions that should respect RLS.
- Audit policies periodically — especially after schema changes that add new relationships.`,
      agents: `# AGENTS.md — Supabase Database Patterns

## Review checklist
- Does every user-facing table have RLS enabled?
- Are RLS policies present for all four operations (SELECT, INSERT, UPDATE, DELETE)?
- Are foreign key columns indexed?
- Do migrations use \\\`CREATE INDEX CONCURRENTLY\\\` for production deployments?
- Is \\\`service_role\\\` key absent from all client-side code and NEXT_PUBLIC_ env vars?
- Are \\\`timestamptz\\\` (not \\\`timestamp\\\`) used for all date columns?

## Architecture review
- Is the schema normalized appropriately, or is there premature denormalization?
- Are expensive queries (joins across 3+ tables, aggregations) behind materialized views or caches?
- Is the connection pooling mode (transaction vs session) appropriate for the workload?
- Are soft deletes used for user-facing data instead of hard CASCADE deletes?

## Performance review
- Run EXPLAIN ANALYZE on the top 5 most frequent queries.
- Check \\\`pg_stat_user_indexes\\\` for unused indexes.
- Verify autovacuum settings are appropriate for write-heavy tables.
- Check for N+1 query patterns in application code (multiple sequential \\\`.single()\\\` calls).

## Testing review
- Are RLS policies tested with multiple user contexts?
- Are migrations reversible — is there a rollback script or documented reverse procedure?
- Are constraint violations (unique, check, foreign key) tested with expected error messages?
- Is \\\`supabase db diff\\\` run in CI to detect schema drift?`
    }
  },

  // ---------------------------------------------------------------------------
  // 3. Observability Stack
  // ---------------------------------------------------------------------------
  {
    slug: "observability-stack",
    title: "Grafana Observability Stack",
    description:
      "Grafana, Prometheus, and Sentry — logging, tracing, alerting, and metrics for production systems with structured logs and distributed traces.",
    category: "infra",
    accent: "signal-blue",
    featured: false,
    visibility: "public",
    tags: ["observability", "logging", "tracing", "alerting", "metrics"],
    body: `# Grafana Observability Stack

Production observability built on three pillars: metrics (Prometheus), logs (Loki or structured JSON), and traces (Tempo or Sentry). Grafana unifies the view.

## When to use

- Monitoring API latency, error rates, and throughput in production
- Setting up alerting rules for SLA/SLO violations
- Debugging distributed request flows across multiple services
- Correlating errors with deployment events
- Tracking business metrics alongside infrastructure health
- Building on-call dashboards with clear escalation signals
- Instrumenting serverless functions and edge workers

## When NOT to use

- Application performance profiling at the code level (use a profiler, not traces)
- Log analysis at petabyte scale (consider a dedicated SIEM)
- When only a single monolith exists with minimal traffic (a simple health check suffices)
- Real-time user analytics (use product analytics tools like PostHog or Amplitude)
- Compliance audit logging with legal retention requirements (use append-only audit stores)

## Core concepts

### The three pillars

| Pillar  | Tool        | What it answers                        |
|---------|-------------|----------------------------------------|
| Metrics | Prometheus  | "How is the system performing right now?" |
| Logs    | Loki / JSON | "What happened during this request?"    |
| Traces  | Tempo / Sentry | "How did the request flow across services?" |

### Prometheus data model

Prometheus stores time-series data as metric name + label set + timestamp + value.

\`\`\`
http_requests_total{method="GET", endpoint="/api/users", status="200"} 1234 1672531200
\`\`\`

### Structured logging

Structured logs are JSON objects with consistent fields. They replace \\\`console.log\\\` strings with queryable data.

\`\`\`json
{
  "level": "error",
  "message": "Payment processing failed",
  "service": "billing",
  "traceId": "abc123",
  "userId": "user_456",
  "error": "insufficient_funds",
  "duration_ms": 342
}
\`\`\`

### Distributed tracing

A trace is a tree of spans. Each span represents a unit of work (HTTP request, DB query, external API call) with timing, status, and metadata.

## Workflow

### Step 1 — Instrument with OpenTelemetry

\`\`\`typescript
// lib/telemetry.ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + "/v1/traces",
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + "/v1/metrics",
    }),
    exportIntervalMillis: 15000,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: process.env.OTEL_SERVICE_NAME ?? "my-app",
});

sdk.start();
\`\`\`

### Step 2 — Add structured logging

\`\`\`typescript
// lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: process.env.OTEL_SERVICE_NAME ?? "my-app",
    environment: process.env.NODE_ENV,
  },
});

// Usage in a request handler
export function createRequestLogger(traceId: string, userId?: string) {
  return logger.child({ traceId, userId });
}
\`\`\`

### Step 3 — Configure Prometheus scraping

\`\`\`yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "my-app"
    metrics_path: "/metrics"
    static_configs:
      - targets: ["app:3000"]
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance

  - job_name: "node-exporter"
    static_configs:
      - targets: ["node-exporter:9100"]
\`\`\`

### Step 4 — Set up Sentry for error tracking

\`\`\`typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],
});
\`\`\`

### Step 5 — Build a Grafana dashboard

\`\`\`
# Key panels for an API service dashboard:

1. Request rate       → rate(http_requests_total[5m])
2. Error rate         → rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])
3. P50/P95/P99 latency → histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
4. Active connections  → pg_stat_activity_count{state="active"}
5. Memory usage        → process_resident_memory_bytes
6. CPU usage           → rate(process_cpu_seconds_total[5m])
\`\`\`

### Step 6 — Define alerting rules

\`\`\`yaml
# alerts.yml
groups:
  - name: api-slos
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error rate above 1% for 5 minutes"
          dashboard: "https://grafana.example.com/d/api-overview"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1.0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P95 latency above 1s for 5 minutes"
\`\`\`

## Examples

### Custom business metric

\`\`\`typescript
import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("billing");
const paymentCounter = meter.createCounter("payments_total", {
  description: "Total payment attempts",
});
const paymentDuration = meter.createHistogram("payment_duration_ms", {
  description: "Payment processing duration",
});

async function processPayment(amount: number) {
  const start = performance.now();
  try {
    await chargeCard(amount);
    paymentCounter.add(1, { status: "success" });
  } catch (err) {
    paymentCounter.add(1, { status: "failure" });
    throw err;
  } finally {
    paymentDuration.record(performance.now() - start);
  }
}
\`\`\`

### Correlating logs with traces

\`\`\`typescript
import { trace } from "@opentelemetry/api";

function handleRequest(req: Request) {
  const span = trace.getActiveSpan();
  const traceId = span?.spanContext().traceId ?? "no-trace";
  const log = createRequestLogger(traceId);

  log.info({ path: req.url, method: req.method }, "Request received");
  // ... handle request
  log.info({ status: 200, duration_ms: elapsed }, "Request completed");
}
\`\`\`

## Decision tree

\`\`\`
What do you need to know?
├── "Is the system healthy right now?" → Metrics (Prometheus + Grafana)
├── "What happened during this specific request?" → Logs (structured JSON + Loki)
├── "Where is the bottleneck across services?" → Traces (Tempo or Sentry)
└── "Why did this specific user see an error?" → Sentry + correlated logs
\`\`\`

\`\`\`
Which alerting severity?
├── Revenue impact or data loss risk → critical (pages on-call)
├── Degraded performance, no data loss → warning (Slack notification)
├── Anomaly, unclear impact → info (dashboard annotation)
└── Expected spike (deploy, marketing event) → suppress / silence window
\`\`\`

## Edge cases and gotchas

- **High-cardinality labels kill Prometheus**: Never use userId, requestId, or email as a Prometheus label. Use logs/traces for per-request data.
- **Sampling trades detail for cost**: A 10% trace sample rate means 9 out of 10 errors have no trace. Use 100% error sampling and lower happy-path sampling.
- **Log volume surprises**: A single noisy endpoint can generate gigabytes of logs per hour. Set rate limits on log emission per endpoint.
- **Grafana dashboard sprawl**: Start with one golden-signals dashboard per service (rate, errors, latency, saturation). Add specialized dashboards only when needed.
- **Clock skew breaks traces**: Ensure NTP is synchronized across all services. Span timestamps out of order make trace waterfalls unreadable.
- **Sentry quota exhaustion**: Noisy errors consume quota fast. Use \\\`beforeSend\\\` to filter known non-actionable errors.
- **Alert fatigue**: If an alert fires more than twice a week without action, it is noise. Fix the root cause or delete the alert.

## Evaluation criteria

| Criteria              | Target                                              |
|-----------------------|-----------------------------------------------------|
| MTTD (mean time to detect) | < 5 minutes for critical issues               |
| MTTR (mean time to resolve)| < 30 minutes with dashboard + runbook          |
| Dashboard load time   | < 3 seconds for primary on-call dashboard           |
| Alert noise ratio     | < 10% false positive rate                           |
| Log query latency     | < 5 seconds for 24-hour range queries               |
| Trace coverage        | 100% of errors, ≥ 10% of successful requests        |
| Metric cardinality    | < 10K unique time series per service                 |`,
    agentDocs: {
      codex: `# Codex — Grafana Observability Stack

## Principles
- Instrument before you need to debug. Adding observability after an incident is too late.
- Use OpenTelemetry as the single instrumentation standard — avoid vendor lock-in.
- Structured logs are non-negotiable. Replace every \\\`console.log\\\` with pino or a similar structured logger.
- Metrics are for dashboards and alerts; logs are for debugging; traces are for distributed flow analysis.

## Implementation guidance
- Initialize OpenTelemetry SDK as early as possible — before any other imports in the entry file.
- Use auto-instrumentations for HTTP, database, and framework libraries.
- Create custom metrics only for business-critical events (payments, signups, deployments).
- Set trace sample rate to 1.0 for errors and 0.1 for successful requests as a starting point.

## Prometheus patterns
- Name metrics with the pattern: \\\`<namespace>_<name>_<unit>\\\` (e.g., \\\`http_request_duration_seconds\\\`).
- Use counters for monotonically increasing values, histograms for latency distributions.
- Avoid high-cardinality labels — userId, requestId, email are log/trace fields, not metric labels.
- Set appropriate histogram buckets: \\\`[0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]\\\` for HTTP latency.

## Alerting
- Alert on symptoms (high error rate, slow latency), not causes (high CPU, disk usage).
- Every alert must have a runbook link in the annotation.
- Use \\\`for: 5m\\\` to avoid flapping alerts from transient spikes.
- Group related alerts to avoid notification storms.

## Common mistakes
- Adding userId as a Prometheus label (creates millions of time series).
- Logging sensitive data (passwords, tokens, PII) in structured logs.
- Setting trace sample rate to 1.0 in production (expensive and unnecessary for happy paths).
- Creating alerts without runbooks or escalation procedures.`,
      cursor: `# Cursor — Grafana Observability Stack

## Autocomplete and generation rules
- When generating API route handlers, include structured logging with request ID and trace correlation.
- Import pino logger from a shared \\\`lib/logger.ts\\\`, not inline initialization.
- When adding error handling, include Sentry capture alongside structured log emission.
- Generate OpenTelemetry span creation for custom business operations.

## Inline hints
- Warn when \\\`console.log\\\` is used in production code — suggest structured logger.
- Flag Prometheus metric definitions with high-cardinality label candidates (userId, email, requestId).
- Suggest \\\`beforeSend\\\` filters when Sentry \\\`init\\\` has no error filtering.
- Warn when trace sample rate is 1.0 — suggest conditional sampling.

## Refactoring
- Extract logging setup into \\\`lib/logger.ts\\\` and telemetry into \\\`lib/telemetry.ts\\\`.
- Consolidate scattered \\\`console.error\\\` calls into structured error logging.
- Move Prometheus metric definitions into a \\\`lib/metrics.ts\\\` registry file.

## Testing suggestions
- Generate tests that verify structured log output format (JSON with required fields).
- Suggest testing alert rules with Prometheus unit test framework (\\\`promtool test rules\\\`).
- Recommend testing Sentry integration in development with \\\`Sentry.captureException(new Error("test"))\\\`.

## Context awareness
- If the project uses Next.js, suggest \\\`@sentry/nextjs\\\` over \\\`@sentry/node\\\`.
- If OpenTelemetry is already configured, extend it rather than adding a parallel system.
- Detect existing logger usage (winston, bunyan, console) and suggest migration path to pino.`,
      claude: `# Claude — Grafana Observability Stack

## Conversational guidance
- When asked "how do I monitor my app," start with the golden signals: request rate, error rate, latency, saturation.
- Explain the three pillars (metrics, logs, traces) with concrete examples, not abstract definitions.
- When debugging an incident, walk through: "What do the metrics show? → What do the logs say? → What does the trace reveal?"

## Explanation patterns
- Describe Prometheus as "a time-series database that scrapes your app's /metrics endpoint every N seconds."
- Explain traces as "a family tree of operations: each span is a parent-child relationship showing who called what."
- Clarify log levels: ERROR = action needed, WARN = investigate soon, INFO = normal operation, DEBUG = development only.

## Architecture review
- Flag services without structured logging as an observability blind spot.
- Recommend OpenTelemetry over vendor-specific SDKs for portability.
- Suggest separating metric collection (Prometheus) from log aggregation (Loki) from tracing (Tempo) — each has different storage and query patterns.

## Debugging assistance
- For "high error rate" alerts: check recent deployments, dependency health, and error message patterns in logs.
- For "high latency" alerts: look at trace waterfall for slow spans, check database query times, check external API latency.
- For "alert fatigue" complaints: audit alert history, identify alerts that fire without action, tune thresholds or delete.

## Security considerations
- Never log passwords, tokens, credit card numbers, or PII in structured logs.
- Use allowlists for log fields rather than blocklists — only log fields you explicitly choose.
- Restrict Grafana dashboard access by team — not everyone needs to see all services.
- Sentry can capture user session data — ensure replay sampling respects privacy requirements.`,
      agents: `# AGENTS.md — Grafana Observability Stack

## Review checklist
- Is every production service instrumented with OpenTelemetry (metrics + traces)?
- Are all logs structured JSON with consistent fields (level, service, traceId)?
- Is Sentry configured with appropriate sample rates (100% errors, 10% happy path)?
- Do Prometheus metrics avoid high-cardinality labels?
- Does every alerting rule have a \\\`for\\\` duration and a runbook annotation?

## Architecture review
- Are the three pillars (metrics, logs, traces) correlated via traceId?
- Is there a single "golden signals" dashboard per service?
- Are log retention policies set and cost-appropriate?
- Is the alerting hierarchy clear: critical → pages, warning → Slack, info → dashboard?

## Performance review
- Is the /metrics endpoint response time < 100 ms?
- Are Prometheus scrape intervals appropriate (15s default, not 1s)?
- Is log volume monitored — no single endpoint producing excessive logs?
- Are Grafana dashboards loading in < 3 seconds?

## Security review
- Are structured logs free of PII, tokens, and credentials?
- Is Grafana access restricted by role (viewer, editor, admin)?
- Are Sentry replay sessions respecting privacy settings?
- Is the OTLP endpoint authenticated and not publicly accessible?`
    }
  },

  // ---------------------------------------------------------------------------
  // 4. Serverless Architecture
  // ---------------------------------------------------------------------------
  {
    slug: "serverless-architecture",
    title: "Vercel Serverless Architecture",
    description:
      "Vercel Functions, AWS Lambda, and edge functions — API route patterns, cold start mitigation, Fluid Compute, and event-driven architectures.",
    category: "infra",
    accent: "signal-blue",
    featured: false,
    visibility: "public",
    tags: ["serverless", "lambda", "functions", "event-driven", "architecture"],
    body: `# Vercel Serverless Architecture

API routes, background jobs, and event-driven patterns built on Vercel Functions, AWS Lambda, and edge runtimes. Fluid Compute keeps functions warm and responsive.

## When to use

- API routes for Next.js or any framework deployed on Vercel
- Webhook handlers that process inbound events (Stripe, GitHub, Clerk)
- Scheduled tasks via cron (daily digests, cleanup jobs, sync pipelines)
- Event-driven processing: queue consumers, real-time triggers
- Lightweight compute that scales to zero when idle
- Prototyping backends without provisioning servers
- Any request-response workload under 60 seconds

## When NOT to use

- Long-running processes (> 60 s on Vercel, > 15 min on Lambda)
- Persistent WebSocket connections (use a dedicated WebSocket service)
- Stateful workloads that need in-memory caches across requests
- High-throughput stream processing (use Kafka consumers or Flink)
- GPU compute or ML inference (use dedicated GPU instances)
- When cold start latency is unacceptable and pre-warming is not an option

## Core concepts

### Vercel Function lifecycle

1. Request arrives at Vercel's CDN edge
2. CDN routes to the nearest function region (or the configured region)
3. If no warm instance exists, a cold start provisions a new isolate/container
4. Function executes, returns a response
5. Instance stays warm for subsequent requests (Fluid Compute)
6. After idle timeout, instance is recycled

### Fluid Compute

Vercel's Fluid Compute reuses function instances across requests, reducing cold starts. Key behaviors:
- Instances process multiple sequential requests before recycling
- Global state persists across requests on the same instance (use for caching, not correctness)
- Concurrent requests may still trigger new instances

### Cold start anatomy

| Phase               | Duration    | Mitigation                          |
|---------------------|-------------|-------------------------------------|
| Container provision | 50–300 ms   | Fluid Compute keeps instances warm  |
| Runtime init        | 10–100 ms   | Use lightweight runtimes (Edge)     |
| Code load           | 10–500 ms   | Minimize bundle size, tree-shake    |
| Module init         | 0–2000 ms   | Lazy-load heavy dependencies        |
| Handler execution   | Variable    | Optimize code path                  |

### Function types on Vercel

| Type             | Runtime    | Max duration | Use case                              |
|------------------|------------|-------------|---------------------------------------|
| Serverless       | Node.js    | 60 s (Pro)  | API routes, webhooks, SSR             |
| Edge             | V8 isolate | 25 s        | Auth, geo-routing, low-latency APIs   |
| Cron             | Node.js    | 60 s (Pro)  | Scheduled tasks                       |
| Streaming        | Node.js    | 60 s (Pro)  | AI responses, large payloads          |

## Workflow

### Step 1 — Create an API route

\`\`\`typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = (page - 1) * limit;

  const users = await db
    .from("users")
    .select("id, name, email, created_at")
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    data: users.data,
    page,
    limit,
  });
}
\`\`\`

### Step 2 — Handle webhooks with verification

\`\`\`typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutComplete(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionCanceled(event.data.object);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
\`\`\`

### Step 3 — Configure cron jobs

\`\`\`json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/daily-digest",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 */6 * * *"
    }
  ]
}
\`\`\`

\`\`\`typescript
// app/api/cron/daily-digest/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== \\\`Bearer \${process.env.CRON_SECRET}\\\`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usersToNotify = await getUsersWithDigestEnabled();
  const results = await Promise.allSettled(
    usersToNotify.map((user) => sendDigestEmail(user))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ succeeded, failed, total: usersToNotify.length });
}
\`\`\`

### Step 4 — Streaming responses for AI

\`\`\`typescript
// app/api/chat/route.ts
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(request: Request) {
  const { messages } = await request.json();

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
  });

  return result.toDataStreamResponse();
}
\`\`\`

### Step 5 — Optimize cold starts

\`\`\`typescript
// Lazy-load heavy dependencies to reduce cold start
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}

// Reuse database connections across warm invocations
let _db: ReturnType<typeof createClient> | null = null;
function getDb() {
  if (!_db) {
    _db = createClient(process.env.DATABASE_URL!);
  }
  return _db;
}
\`\`\`

## Examples

### Idempotent webhook handler

\`\`\`typescript
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const idempotencyKey = \\\`checkout_\${session.id}\\\`;

  // Check if already processed
  const existing = await db
    .from("processed_events")
    .select("id")
    .eq("key", idempotencyKey)
    .maybeSingle();

  if (existing.data) return; // Already processed

  await db.rpc("process_checkout", {
    session_id: session.id,
    customer_email: session.customer_email,
    amount: session.amount_total,
    idempotency_key: idempotencyKey,
  });
}
\`\`\`

### Fan-out with Promise.allSettled

\`\`\`typescript
async function notifyAllChannels(event: AppEvent) {
  const [slack, email, webhook] = await Promise.allSettled([
    sendSlackNotification(event),
    sendEmailNotification(event),
    sendWebhookNotification(event),
  ]);

  return {
    slack: slack.status,
    email: email.status,
    webhook: webhook.status,
  };
}
\`\`\`

## Decision tree

\`\`\`
What kind of compute do you need?
├── Request-response API → Vercel Serverless Function
├── Low-latency, global → Vercel Edge Function
├── Scheduled task → Vercel Cron + Serverless Function
├── Background job > 60s → Vercel Workflow or external queue
├── Real-time bidirectional → WebSocket service (not serverless)
└── Heavy compute (ML, video) → Dedicated instance or GPU
\`\`\`

\`\`\`
Cold start a problem?
├── P99 latency > 1s → Profile: is it container init or module loading?
│   ├── Module loading → Lazy-load heavy deps, reduce bundle
│   └── Container init → Use Edge runtime or Fluid Compute
├── Webhook must respond < 3s → Acknowledge immediately, process async
└── Cold start acceptable → No action needed
\`\`\`

## Edge cases and gotchas

- **Function timeout is wall-clock, not CPU time**: A function waiting 55 s on a database query and 6 s of CPU work will timeout at 60 s total.
- **Vercel Cron runs in a single region**: Cron-triggered functions execute in the function's configured region, not globally. Time zone matters for schedule expressions.
- **Request body size limits**: Vercel Serverless Functions accept up to 4.5 MB request bodies by default. For larger payloads, use signed upload URLs to object storage.
- **Cold starts compound with dependencies**: Each \\\`require\\\` or \\\`import\\\` in the cold path adds latency. A function importing Prisma + Stripe + SendGrid can cold-start at 2–3 s.
- **Global variables persist across warm invocations**: This is useful for connection pooling but dangerous for per-request state. Never store request-scoped data in module scope.
- **Concurrent requests hit different instances**: Even with Fluid Compute, two simultaneous requests may land on different instances. Do not depend on shared in-memory state.
- **streaming requires \\\`export const dynamic = "force-dynamic"\\\`**: Static optimization will buffer the entire response, defeating streaming.
- **Webhook retries cause duplicate processing**: Always implement idempotency keys for webhook handlers.

## Evaluation criteria

| Criteria              | Target                                         |
|-----------------------|------------------------------------------------|
| Cold start P95        | < 500 ms                                       |
| Warm invocation P95   | < 100 ms (excluding external calls)            |
| Error rate            | < 0.1% for API routes                          |
| Timeout rate          | < 0.01% (functions completing within limit)     |
| Bundle size           | < 5 MB per function                             |
| Cron reliability      | 100% execution rate (verified via logs)          |
| Idempotency coverage  | 100% for webhook and payment handlers            |`,
    agentDocs: {
      codex: `# Codex — Vercel Serverless Architecture

## Principles
- Every serverless function should be stateless for correctness. Use module-scope caching only for performance.
- Reuse clients (database, Stripe, HTTP) across warm invocations — initialize lazily in module scope.
- Webhooks must be idempotent. Store processed event IDs and check before re-processing.
- Validate inputs at the boundary: parse and validate request bodies before any business logic.

## Implementation guidance
- Use Next.js App Router route handlers (\\\`route.ts\\\`) as the default function pattern on Vercel.
- Export \\\`runtime = "edge"\\\` only when the function needs low latency and uses no Node.js APIs.
- For streaming responses, export \\\`dynamic = "force-dynamic"\\\` to prevent static buffering.
- Set appropriate \\\`maxDuration\\\` in \\\`vercel.json\\\` for functions that need more than the default timeout.

## Cold start optimization
- Minimize the import graph: only import what the handler actually uses.
- Lazy-load heavy SDKs (Stripe, Prisma, PDF generators) inside the handler, not at module top.
- Use \\\`@vercel/nft\\\` tracing to identify bloated function bundles.
- Consider Edge runtime for functions that only need Web APIs and fast response times.

## Cron jobs
- Always verify the \\\`Authorization\\\` header with \\\`CRON_SECRET\\\` to prevent unauthorized invocations.
- Log execution summary (items processed, failures, duration) for observability.
- Use \\\`Promise.allSettled\\\` for fan-out operations to prevent one failure from blocking others.
- Set cron schedules in UTC and document the intended local time in comments.

## Error handling
- Return appropriate HTTP status codes: 400 for bad input, 401/403 for auth, 500 for server errors.
- Never expose internal error details to the client — log them and return a generic message.
- Use \\\`try/catch\\\` around all external service calls with specific error handling per service.
- Implement circuit breakers for external dependencies that may be temporarily unavailable.

## Common mistakes
- Storing request-scoped data in module-scope variables (leaks between requests).
- Not implementing idempotency on webhook handlers (duplicate processing on retries).
- Importing large dependencies at the module top (cold start bloat).
- Forgetting \\\`CRON_SECRET\\\` verification (anyone can trigger the cron endpoint).`,
      cursor: `# Cursor — Vercel Serverless Architecture

## Autocomplete and generation rules
- When generating Next.js API routes, use App Router \\\`route.ts\\\` pattern with typed \\\`NextRequest\\\`.
- Include input validation at the top of every handler before business logic.
- Generate webhook handlers with signature verification and idempotency checks.
- Suggest \\\`export const runtime = "edge"\\\` only when no Node.js APIs are needed.

## Inline hints
- Warn when a function handler has no error handling around external calls.
- Flag webhook handlers missing signature verification.
- Suggest \\\`Promise.allSettled\\\` when multiple independent async operations are awaited sequentially.
- Warn when \\\`vercel.json\\\` cron paths don't match actual API routes.

## Refactoring
- Extract shared request validation into middleware or helper functions in \\\`lib/api/\\\`.
- Move webhook event handlers into domain-specific files: \\\`lib/webhooks/stripe.ts\\\`, \\\`lib/webhooks/clerk.ts\\\`.
- Consolidate database client initialization into a reusable \\\`lib/db/client.ts\\\` with connection pooling.
- Split large route handlers into: validate → authorize → execute → respond.

## Testing suggestions
- Generate test cases for webhook handlers with valid and invalid signatures.
- Suggest testing cron endpoints with and without the \\\`CRON_SECRET\\\` header.
- Recommend load testing with tools like \\\`autocannon\\\` to identify cold start patterns.
- Test streaming endpoints with a client that consumes chunks progressively.

## Context awareness
- Read \\\`vercel.json\\\` to understand cron schedules and function configuration.
- Check for \\\`@vercel/functions\\\` usage and suggest Fluid Compute patterns.
- If the project uses \\\`ai\\\` SDK, suggest streaming response patterns.
- Detect duplicate client initialization across route files and suggest shared modules.`,
      claude: `# Claude — Vercel Serverless Architecture

## Conversational guidance
- When asked "serverless vs traditional server," explain: serverless = zero ops, pay-per-invocation, auto-scale;
  traditional = more control, persistent state, predictable cold path.
- For cold start complaints, walk through the anatomy: container → runtime → code → modules → handler.
  Ask which phase is slowest before recommending fixes.
- When discussing Vercel vs AWS Lambda, highlight: Vercel = tighter Next.js integration, Fluid Compute, edge;
  Lambda = more runtimes, longer max duration, deeper AWS ecosystem.

## Explanation patterns
- Explain Fluid Compute as "your function stays warm and processes multiple requests like a mini-server, but Vercel manages the lifecycle."
- Describe idempotency as "making it safe to process the same event twice — the second time is a no-op."
- Clarify streaming: "instead of buffering the entire response, each chunk is sent to the client as it's ready."

## Architecture review
- Flag functions over 30 lines of business logic — suggest extracting into service modules.
- Recommend event-driven patterns for operations that don't need synchronous responses.
- Suggest background processing (Vercel Workflow, Inngest, or queues) for operations > 10 seconds.
- Flag any function that makes > 5 sequential external calls — parallelize or batch.

## Debugging assistance
- For timeout errors: check if the function is waiting on a slow external service. Suggest adding timeout to fetch calls.
- For cold start spikes: ask for the function's import list and suggest lazy loading the heaviest modules.
- For webhook failures: verify signature secret matches, check request body encoding (text vs JSON).

## Security considerations
- Always verify webhook signatures before processing — never trust the payload without verification.
- Use \\\`CRON_SECRET\\\` for all cron endpoints; the URL is guessable.
- Validate and sanitize all user input at the API boundary.
- Never expose stack traces or internal error messages in API responses.`,
      agents: `# AGENTS.md — Vercel Serverless Architecture

## Review checklist
- Does every API route handler have error handling for all external calls?
- Are webhook handlers verifying signatures and implementing idempotency?
- Are cron endpoints protected with CRON_SECRET verification?
- Is client initialization (DB, Stripe, etc.) shared across warm invocations via module scope?
- Are request bodies validated before business logic?
- Do streaming endpoints have \\\`export const dynamic = "force-dynamic"\\\`?

## Architecture review
- Is each function focused on a single responsibility?
- Are shared patterns (auth, validation, error handling) extracted into reusable middleware?
- Is the function bundle size reasonable (< 5 MB)?
- Are long-running operations offloaded to background processing?

## Performance review
- Profile cold start: what is the heaviest import in the cold path?
- Are database connections pooled and reused across invocations?
- Is \\\`Promise.allSettled\\\` used for independent parallel operations?
- Are response payloads appropriately sized (no unnecessary data)?

## Testing review
- Are webhook handlers tested with valid signatures, invalid signatures, and duplicate events?
- Are cron endpoints tested with and without auth headers?
- Are error paths tested (external service down, invalid input, timeout)?
- Is there a load test or cold-start measurement for critical functions?`
    }
  },

  // ---------------------------------------------------------------------------
  // 5. CDN & Caching
  // ---------------------------------------------------------------------------
  {
    slug: "cdn-caching",
    title: "Cloudflare CDN & Caching",
    description:
      "Cloudflare and Vercel cache strategies, CDN configuration, stale-while-revalidate, cache invalidation, and edge caching for global delivery.",
    category: "infra",
    accent: "signal-blue",
    featured: false,
    visibility: "public",
    tags: ["cdn", "caching", "swr", "invalidation", "performance"],
    body: `# Cloudflare CDN & Caching

Cache strategies for global delivery — Cloudflare CDN, Vercel Edge Cache, stale-while-revalidate patterns, and cache invalidation architectures.

## When to use

- Serving static assets (JS, CSS, images, fonts) from edge PoPs worldwide
- Caching API responses that don't change on every request
- Implementing stale-while-revalidate for near-instant page loads
- Reducing origin load by serving cached content at the edge
- Protecting origins from traffic spikes with CDN absorption
- A/B testing and personalization with edge-side cache variants
- Image optimization and format negotiation (WebP, AVIF) at the edge

## When NOT to use

- Real-time data that must be fresh on every request (WebSocket feeds, live scores)
- Authenticated responses unique to each user (unless using cache keys with auth)
- Write-heavy APIs where cache invalidation cost exceeds cache benefit
- Data that changes every second (streaming metrics, live cursors)
- When the response is already < 10 ms from origin (caching adds complexity without benefit)

## Core concepts

### Cache layers

\`\`\`
Browser Cache → CDN Edge Cache → Origin Shield → Origin Server
\`\`\`

Each layer reduces latency and origin load. A cache hit at the edge means the origin never sees the request.

### Cache-Control header

The single most important header for caching. It tells every cache layer how to handle the response.

\`\`\`
Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200
\`\`\`

| Directive                | Scope     | Meaning                                        |
|--------------------------|-----------|------------------------------------------------|
| \\\`public\\\`               | All       | Response can be cached by any cache             |
| \\\`private\\\`              | Browser   | Only the user's browser may cache this          |
| \\\`max-age=N\\\`            | Browser   | Browser considers fresh for N seconds           |
| \\\`s-maxage=N\\\`           | CDN       | CDN considers fresh for N seconds               |
| \\\`stale-while-revalidate=N\\\` | CDN/SW | Serve stale while fetching fresh in background  |
| \\\`no-cache\\\`             | All       | Must revalidate with origin before serving      |
| \\\`no-store\\\`             | All       | Never cache; always fetch from origin           |
| \\\`immutable\\\`            | All       | Content will never change (hashed filenames)    |

### Stale-while-revalidate (SWR)

The most impactful caching pattern for web apps. Users see cached content instantly while the CDN fetches a fresh copy in the background.

\`\`\`
First request:  [Origin responds in 200ms] → cached at edge
Second request: [Edge serves in 5ms] ← stale cache
Background:     [Edge revalidates with origin] → fresh cache
Third request:  [Edge serves fresh in 5ms]
\`\`\`

### Cache keys and variants

A cache key determines what makes two requests "the same" for caching purposes. Default: URL. Custom keys can include headers, cookies, or query parameters.

## Workflow

### Step 1 — Set cache headers in Next.js

\`\`\`typescript
// app/api/products/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const products = await fetchProducts();

  return NextResponse.json(products, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
\`\`\`

### Step 2 — Configure Cloudflare page rules

\`\`\`
# Cache static assets aggressively
URL: example.com/assets/*
Cache Level: Cache Everything
Edge Cache TTL: 30 days
Browser Cache TTL: 1 year

# SWR for API responses
URL: example.com/api/public/*
Cache Level: Cache Everything
Edge Cache TTL: 5 minutes
Browser Cache TTL: 1 minute
\`\`\`

### Step 3 — Implement cache tags for targeted invalidation

\`\`\`typescript
// app/api/products/[id]/route.ts
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const product = await fetchProduct(params.id);

  return NextResponse.json(product, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Cache-Tag": \\\`product-\${params.id}, products, catalog\\\`,
      "CDN-Cache-Control": "public, max-age=3600",
    },
  });
}
\`\`\`

### Step 4 — Purge cache on content update

\`\`\`typescript
// lib/cache/invalidation.ts
async function purgeProductCache(productId: string) {
  // Cloudflare cache tag purge
  await fetch(
    \\\`https://api.cloudflare.com/client/v4/zones/\${process.env.CF_ZONE_ID}/purge_cache\\\`,
    {
      method: "POST",
      headers: {
        Authorization: \\\`Bearer \${process.env.CF_API_TOKEN}\\\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tags: [\\\`product-\${productId}\\\`, "catalog"],
      }),
    }
  );

  // Vercel on-demand revalidation
  await fetch(
    \\\`\${process.env.NEXT_PUBLIC_URL}/api/revalidate?tag=product-\${productId}\\\`,
    { method: "POST" }
  );
}
\`\`\`

### Step 5 — Vercel ISR (Incremental Static Regeneration)

\`\`\`typescript
// app/products/[id]/page.tsx
import { notFound } from "next/navigation";

export const revalidate = 3600; // Revalidate every hour

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await fetchProduct(params.id);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}

// On-demand revalidation endpoint
// app/api/revalidate/route.ts
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get("tag");
  if (!tag) return NextResponse.json({ error: "Missing tag" }, { status: 400 });

  revalidateTag(tag);
  return NextResponse.json({ revalidated: true, tag });
}
\`\`\`

## Examples

### Immutable asset caching with content hashing

\`\`\`typescript
// next.config.js
module.exports = {
  headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};
\`\`\`

### Vary-based caching for different formats

\`\`\`typescript
export async function GET(request: NextRequest) {
  const accept = request.headers.get("Accept") ?? "";
  const supportsAvif = accept.includes("image/avif");
  const supportsWebp = accept.includes("image/webp");

  const format = supportsAvif ? "avif" : supportsWebp ? "webp" : "png";
  const image = await getOptimizedImage(format);

  return new Response(image, {
    headers: {
      "Content-Type": \\\`image/\${format}\\\`,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      Vary: "Accept",
    },
  });
}
\`\`\`

### Cache warming on deploy

\`\`\`typescript
// scripts/warm-cache.ts
const criticalPaths = [
  "/",
  "/pricing",
  "/docs",
  "/api/public/products",
  "/api/public/categories",
];

async function warmCache(baseUrl: string) {
  const results = await Promise.allSettled(
    criticalPaths.map(async (path) => {
      const start = performance.now();
      const res = await fetch(baseUrl + path);
      const duration = performance.now() - start;
      return { path, status: res.status, duration: Math.round(duration) };
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      console.log(\\\`✓ \${result.value.path} → \${result.value.status} (\${result.value.duration}ms)\\\`);
    } else {
      console.error(\\\`✗ \${result.reason}\\\`);
    }
  }
}
\`\`\`

## Decision tree

\`\`\`
Should this response be cached?
├── Static asset with hash in filename → immutable, max-age=1yr
├── Public data, changes infrequently → s-maxage + stale-while-revalidate
├── Public data, changes often → short s-maxage (30s–5min) + SWR
├── Personalized / auth-gated → private, no CDN cache (or Vary on cookie)
├── Write endpoint (POST/PUT/DELETE) → no-store
└── Real-time data → no-cache or no-store
\`\`\`

\`\`\`
Cache invalidation strategy?
├── Content updated by CMS → On-demand revalidation (revalidateTag)
├── Content updated by user → Purge specific cache tags
├── Deployment → Automatic CDN purge (Vercel handles this)
├── Emergency (stale data visible) → Purge all + cache warming
└── Gradual rollout → Use stale-while-revalidate + short TTLs
\`\`\`

## Edge cases and gotchas

- **\\\`Vary: *\\\` disables caching entirely**: If your origin returns \\\`Vary: *\\\`, no CDN will cache the response. Audit origin headers.
- **Query string cache busting**: By default, \\\`?v=1\\\` and \\\`?v=2\\\` are different cache keys. Normalize query strings or strip irrelevant params.
- **Set-Cookie prevents CDN caching**: Most CDNs refuse to cache responses with \\\`Set-Cookie\\\` headers. Move cookie-setting to a separate endpoint.
- **Stale content after purge**: Purge propagation takes 1–30 seconds across all PoPs. Users may see stale content briefly.
- **Cache stampede on expiration**: When a popular cached response expires, hundreds of requests hit origin simultaneously. Use SWR to prevent this — the first request revalidates while others get stale.
- **Browser cache is harder to control**: Once \\\`max-age\\\` puts a response in the browser cache, you cannot revoke it remotely. Use short \\\`max-age\\\` with longer \\\`s-maxage\\\` for CDN.
- **ISR and CDN double-caching**: Vercel ISR has its own cache layer. Adding Cloudflare on top creates two caches that may conflict. Coordinate TTLs carefully.
- **CORS and caching**: Cached responses may have CORS headers for the first requester's origin. Use \\\`Vary: Origin\\\` if multiple origins access the same cached resource.

## Evaluation criteria

| Criteria              | Target                                           |
|-----------------------|--------------------------------------------------|
| Cache hit ratio       | > 90% for static assets, > 70% for API responses |
| TTFB (cached)         | < 50 ms from nearest edge PoP                    |
| TTFB (cache miss)     | < 500 ms (origin + edge overhead)                 |
| Purge propagation     | < 30 seconds globally                             |
| Stale content window  | < 60 seconds after content update                 |
| Origin request rate   | < 10% of total traffic (high cache absorption)    |
| Cache storage cost    | Proportional to unique content, not request volume |`,
    agentDocs: {
      codex: `# Codex — Cloudflare CDN & Caching

## Principles
- Set \\\`Cache-Control\\\` headers explicitly on every response. Never rely on CDN defaults.
- Use \\\`s-maxage\\\` for CDN TTL and \\\`max-age\\\` for browser TTL — they serve different purposes.
- \\\`stale-while-revalidate\\\` is the highest-impact caching pattern. Default to it for any cacheable response.
- Immutable assets (hashed filenames) get \\\`max-age=31536000, immutable\\\`. Never set short TTLs on hashed assets.

## Implementation guidance
- Separate cache strategy by content type: static assets, public API, personalized responses.
- Use cache tags for targeted invalidation instead of purging entire zones.
- Implement on-demand revalidation (\\\`revalidateTag\\\`) for CMS-driven content.
- Set \\\`Vary\\\` headers carefully — each unique combination creates a separate cache entry.

## Cache-Control patterns
- Static hashed assets: \\\`public, max-age=31536000, immutable\\\`
- Public API responses: \\\`public, s-maxage=300, stale-while-revalidate=600\\\`
- HTML pages (ISR): \\\`public, s-maxage=3600, stale-while-revalidate=86400\\\`
- Authenticated responses: \\\`private, no-cache\\\` or \\\`private, max-age=60\\\`
- Write endpoints: \\\`no-store\\\`

## Invalidation
- Prefer tag-based purge over URL-based purge — it scales better.
- After purging, warm critical paths to prevent cache stampede.
- Coordinate Vercel ISR cache with Cloudflare CDN cache — avoid conflicting TTLs.
- Log every purge operation for debugging stale content issues.

## Common mistakes
- Setting long \\\`max-age\\\` on non-hashed URLs (browser cache becomes uncontrollable).
- Using \\\`Vary: *\\\` (disables caching on all layers).
- Returning \\\`Set-Cookie\\\` on cacheable responses (CDNs skip caching).
- Not accounting for cache stampede when popular content expires.
- Forgetting \\\`Vary: Origin\\\` on CORS-enabled cached endpoints.`,
      cursor: `# Cursor — Cloudflare CDN & Caching

## Autocomplete and generation rules
- When generating API responses, include \\\`Cache-Control\\\` header with appropriate directives.
- For static asset routes, suggest \\\`immutable\\\` directive when filenames contain content hashes.
- Generate \\\`Vary\\\` headers when response depends on \\\`Accept\\\`, \\\`Accept-Encoding\\\`, or \\\`Origin\\\`.
- When generating ISR pages, include \\\`export const revalidate = N\\\` with a justified TTL value.

## Inline hints
- Warn when a public API response has no \\\`Cache-Control\\\` header.
- Flag \\\`max-age\\\` values > 60 on non-immutable resources — suggest \\\`s-maxage\\\` for CDN instead.
- Suggest \\\`stale-while-revalidate\\\` when \\\`s-maxage\\\` is set without it.
- Warn when \\\`Set-Cookie\\\` appears alongside cache-friendly headers.

## Refactoring
- Extract cache header helpers into \\\`lib/cache/headers.ts\\\` with preset functions for common strategies.
- Consolidate cache invalidation logic into \\\`lib/cache/invalidation.ts\\\`.
- Move cache warming scripts into \\\`scripts/\\\` with environment-aware base URLs.
- Normalize custom header configurations into \\\`next.config.js\\\` \\\`headers()\\\` function.

## Testing suggestions
- Generate tests that verify \\\`Cache-Control\\\` headers on API responses.
- Suggest testing cache invalidation by checking response freshness after purge.
- Recommend \\\`curl -sI\\\` for manual cache header verification.
- Test with \\\`CF-Cache-Status\\\` header to verify Cloudflare cache behavior (HIT, MISS, EXPIRED).

## Context awareness
- Check \\\`next.config.js\\\` for existing header configuration before adding new cache rules.
- If Cloudflare is detected (wrangler.toml or CF env vars), suggest \\\`CDN-Cache-Control\\\` for CF-specific TTLs.
- If Vercel ISR is used, warn about double-caching with an external CDN.`,
      claude: `# Claude — Cloudflare CDN & Caching

## Conversational guidance
- When asked "how do I make my site faster," start with caching — it's the highest-leverage performance optimization.
- Explain SWR as: "Users see the old version instantly while a fresh version loads in the background. Next time, they get the fresh version."
- For cache invalidation questions, ask: "How quickly must users see the update?" — this determines TTL vs on-demand purge.

## Explanation patterns
- Describe the cache layer stack: browser → CDN edge → origin shield → origin.
- Explain \\\`s-maxage\\\` vs \\\`max-age\\\`: "s-maxage controls the CDN, max-age controls the browser. You almost always want them different."
- Clarify cache stampede: "When a popular cached response expires, thousands of requests all hit origin at once. SWR prevents this."

## Architecture review
- Flag any high-traffic endpoint without cache headers as a missed optimization.
- Recommend separating public and authenticated responses into distinct route patterns for cleaner cache rules.
- Suggest cache warming for critical paths after deployments.
- Flag double-caching setups (Vercel ISR + Cloudflare) and recommend coordinated TTLs.

## Debugging assistance
- For stale content: check \\\`CF-Cache-Status\\\` header (HIT/MISS/EXPIRED), browser cache (\\\`max-age\\\`), and purge propagation delay.
- For slow first load: check if the response is a cache MISS and whether SWR is configured.
- For inconsistent responses: check \\\`Vary\\\` headers — missing \\\`Vary: Origin\\\` can serve wrong CORS responses.

## Security considerations
- Never cache responses that contain user-specific data without \\\`private\\\` or proper \\\`Vary\\\` headers.
- \\\`Set-Cookie\\\` on cached responses can leak session tokens to other users — audit carefully.
- Cache tag purge APIs should be authenticated and rate-limited.
- Audit Cloudflare cache rules to ensure no sensitive endpoints are accidentally cached.`,
      agents: `# AGENTS.md — Cloudflare CDN & Caching

## Review checklist
- Does every public API response have explicit \\\`Cache-Control\\\` headers?
- Are static assets with content hashes served with \\\`immutable\\\`?
- Is \\\`stale-while-revalidate\\\` used on all time-sensitive cached responses?
- Are \\\`Vary\\\` headers set correctly for format negotiation and CORS?
- Is there no \\\`Set-Cookie\\\` on publicly cached responses?
- Is cache invalidation implemented with tags, not full-zone purges?

## Architecture review
- Is the cache strategy documented per content type (static, API, HTML, personalized)?
- Are Vercel ISR TTLs coordinated with any external CDN TTLs?
- Is cache warming implemented for critical paths after deployments?
- Is there monitoring for cache hit ratio and origin load?

## Performance review
- Is cache hit ratio > 90% for static assets and > 70% for API responses?
- Is TTFB < 50 ms for cached responses?
- Are cache stampedes prevented with SWR on popular content?
- Is browser cache (\\\`max-age\\\`) short enough to allow server-side updates?

## Security review
- Are authenticated / personalized responses excluded from CDN cache?
- Is cache purge API authenticated and not publicly accessible?
- Are \\\`Vary\\\` headers preventing cross-user data leaks?
- Is there no sensitive data (tokens, PII) in cached response bodies?`
    }
  },
];
