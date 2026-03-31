import type { CreateSkillInput } from "@/lib/db/skills";

type SeedSkill = Omit<CreateSkillInput, "origin"> & {
  origin?: CreateSkillInput["origin"];
};

export const security: SeedSkill[] = [
  // -------------------------------------------------------------------------
  // 1. OWASP Security Best Practices
  // -------------------------------------------------------------------------
  {
    slug: "security-best-practices",
    title: "OWASP Security Best Practices",
    description:
      "OWASP secure coding defaults for web applications: input validation, output encoding, authentication, authorization, and dependency management.",
    category: "security",
    accent: "signal-blue",
    featured: true,
    visibility: "member",
    tags: ["hardening", "review", "secure-coding", "validation"],
    body: `# OWASP Security Best Practices

Systematic secure-coding defaults for web applications grounded in the OWASP Top 10 and ASVS. Covers input validation, output encoding, authentication hardening, authorization enforcement, cryptographic hygiene, dependency management, and security review workflows.

## When to use

- Starting a new web application or API and need a security baseline
- Reviewing an existing codebase for hardening opportunities
- Adding user-facing forms, file uploads, or payment flows
- Preparing for a security audit or penetration test
- Onboarding a team to secure-coding standards

## When NOT to use

- Pure static marketing sites with zero user input — reach for CSP headers only
- Embedded firmware or kernel-level security — reach for platform-specific hardening guides
- Threat modeling (use the \\\`security-threat-model\\\` skill instead)

## Core concepts

| Concept | Description |
|---------|-------------|
| Defense in depth | Multiple overlapping controls so no single failure is catastrophic |
| Least privilege | Every component gets the minimum permissions it needs |
| Fail secure | Errors deny access by default, never fail open |
| Input validation | Allowlist-first validation at every trust boundary |
| Output encoding | Context-aware encoding prevents injection in HTML, JS, SQL, URLs |
| Secure defaults | Ship with the strictest config; relax intentionally |

### OWASP Top 10 quick reference

| # | Risk | Primary defense |
|---|------|-----------------|
| A01 | Broken Access Control | RBAC + row-level security + server-side checks |
| A02 | Cryptographic Failures | TLS everywhere, bcrypt/argon2, no secrets in code |
| A03 | Injection | Parameterized queries, Zod validation, output encoding |
| A04 | Insecure Design | Threat modeling, abuse stories, security requirements |
| A05 | Security Misconfiguration | Hardened defaults, CSP, CORS allowlists |
| A06 | Vulnerable Components | Automated dependency scanning, lock files |
| A07 | Auth Failures | MFA, rate limiting, session management |
| A08 | Data Integrity Failures | Signed artifacts, CI pipeline integrity |
| A09 | Logging Failures | Structured security logs, alert on anomalies |
| A10 | SSRF | URL allowlists, network segmentation |

## Workflow

### Step 1: Define a validation layer with Zod

Every external input must pass through a schema before touching business logic.

\\\`\\\`\\\`typescript
import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .max(254, "Email too long")
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z\\d])/,
      "Password must include upper, lower, digit, and special character"
    ),
  displayName: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[\\w\\s-]+$/, "Display name contains invalid characters"),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: result.error };
}
\\\`\\\`\\\`

### Step 2: Harden HTTP headers

\\\`\\\`\\\`typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "0",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https:",
    "font-src 'self'",
    "frame-ancestors 'none'",
  ].join("; "),
};

export function applySecurityHeaders(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}
\\\`\\\`\\\`

### Step 3: Sanitize output encoding

\\\`\\\`\\\`typescript
const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'/]/g, (ch) => HTML_ESCAPE_MAP[ch] ?? ch);
}

export function escapeForAttribute(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] ?? ch);
}

export function escapeForUrl(str: string): string {
  return encodeURIComponent(str);
}
\\\`\\\`\\\`

### Step 4: Enforce parameterized queries

\\\`\\\`\\\`typescript
import { getServerSupabase } from "@/lib/db/client";

export async function getUserByEmail(email: string) {
  const db = getServerSupabase();
  const { data, error } = await db
    .from("users")
    .select("id, email, display_name, role")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();
  if (error) throw new Error("Query failed");
  return data;
}
\\\`\\\`\\\`

Never interpolate user input into SQL strings. Always use parameterized queries or the Supabase query builder.

### Step 5: Dependency scanning

\\\`\\\`\\\`bash
# Audit dependencies for known vulnerabilities
pnpm audit --audit-level=high

# Pin exact versions in lock file
pnpm install --frozen-lockfile

# Check for outdated packages
pnpm outdated
\\\`\\\`\\\`

Add \\\`pnpm audit\\\` to CI and fail the build on high-severity findings.

## Examples

### Example 1: API route with full validation

\\\`\\\`\\\`typescript
import { NextResponse } from "next/server";
import { CreateUserSchema, validateInput } from "@/lib/validation";
import { createUser } from "@/lib/db/users";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = await rateLimit(request, { max: 5, windowMs: 60_000 });
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = validateInput(CreateUserSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.errors.flatten() },
      { status: 422 }
    );
  }

  const user = await createUser(validation.data);
  return NextResponse.json({ id: user.id }, { status: 201 });
}
\\\`\\\`\\\`

### Example 2: Supabase Row-Level Security policy

\\\`\\\`\\\`sql
-- Users can only read their own data
CREATE POLICY "users_read_own" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "users_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all profiles
CREATE POLICY "admins_read_all" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );
\\\`\\\`\\\`

## Decision tree

- User input arrives → validate with Zod schema before any processing
- Rendering user content → apply context-appropriate output encoding
- Storing passwords → use bcrypt (cost 12+) or argon2id
- Accessing data → enforce row-level security + server-side auth checks
- Third-party dependency → pin version, check audit, review changelog
- Sensitive config → environment variable, never committed to repo
- If unsure about a pattern → apply the strictest control and relax intentionally

## Edge cases and gotchas

1. **Double encoding** — encoding output that was already encoded produces garbled text. Track encoding state through the pipeline.
2. **Zod transforms silently change data** — \\\`.transform()\\\` runs after validation. Log the pre/post values during development to catch surprises.
3. **CSP breaking inline scripts** — strict CSP blocks inline handlers and eval. Use nonces or move scripts to external files.
4. **Rate limiter bypass via IP spoofing** — \\\`X-Forwarded-For\\\` is trivially spoofed. Use Vercel's trusted \\\`x-real-ip\\\` or Cloudflare's \\\`CF-Connecting-IP\\\`.
5. **Lock file drift** — \\\`pnpm install\\\` without \\\`--frozen-lockfile\\\` in CI can pull unaudited versions. Always freeze in CI.
6. **RLS not enabled** — Supabase tables have no RLS by default. Every table with user data must have explicit policies; use \\\`ALTER TABLE ... ENABLE ROW LEVEL SECURITY\\\`.
7. **JWT expiry mismatch** — short-lived access tokens with long-lived refresh tokens need separate validation paths.

## Evaluation criteria

- [ ] All user input validated with typed Zod schemas before processing
- [ ] No raw SQL string interpolation anywhere in the codebase
- [ ] Security headers applied to all responses (HSTS, CSP, X-Content-Type-Options)
- [ ] Passwords hashed with bcrypt (cost ≥ 12) or argon2id
- [ ] RLS enabled on every Supabase table containing user data
- [ ] Dependency audit passes with no high/critical findings
- [ ] Rate limiting applied to authentication and write endpoints
- [ ] Secrets stored in environment variables, not in code or config files
- [ ] Error responses do not leak stack traces, SQL errors, or internal paths
- [ ] Security logging captures auth failures, permission denials, and validation errors`,

    agentDocs: {
      codex: `# Codex — OWASP Security Best Practices

## Environment
- Codex runs in a sandboxed environment: file I/O only, no browser, no GUI
- Network access may be restricted — prefer local operations when possible
- Working directory is the project root

## When this skill is active
- Validate every external input with a Zod schema before processing
- Never interpolate user data into SQL — use parameterized queries or ORM builders
- Apply security headers in middleware, not per-route
- Hash passwords with bcrypt (cost ≥ 12) or argon2id — never SHA-256 or MD5
- Pin dependency versions; run \`pnpm audit\` in CI

## Tool usage
- Use file read to check existing validation schemas and middleware
- Use shell to run \`pnpm audit --audit-level=high\` and \`pnpm outdated\`
- Prefer non-interactive commands (no -i flags, no prompts)

## Testing expectations
- Run the test suite after every security-related change
- Verify Zod schemas reject malformed input with unit tests
- Check RLS policies with integration tests using different auth contexts
- Verify rate limiting with sequential request tests

## Common failure modes
- Missing RLS on new tables: always check \`ALTER TABLE ... ENABLE ROW LEVEL SECURITY\`
- Zod schema too permissive: prefer \`.strict()\` to reject unknown keys
- CSP too loose: audit Content-Security-Policy for unnecessary \`unsafe-eval\`

## Output format
- Write changes directly to files
- Summarize each security control added and its OWASP mapping
- Include before/after comparisons for middleware or schema changes`,

      cursor: `# Cursor — OWASP Security Best Practices

## IDE context
- You have access to the full project via file editing, search, and multi-file operations
- Linter feedback is available in real time
- You can run terminal commands for builds, tests, and git operations

## When this skill applies
- Every API route must validate its request body with a Zod schema
- Never use \`any\` for request/response types — use explicit typed schemas
- Apply security headers via middleware, not scattered across routes
- Use Supabase RLS policies for data access control, not application-level filters alone
- Escape user content for the correct output context (HTML, URL, attribute)

## Code style
- Follow existing project patterns: Zod schemas in \`lib/validation/\`
- Security middleware in \`middleware.ts\` at the project root
- RLS policies in \`supabase/migrations/\` with descriptive names
- Rate limiting middleware in \`lib/rate-limit.ts\`

## Cursor features to leverage
- Use multi-file edit when adding validation to multiple API routes
- Search for \`request.json()\` calls without corresponding Zod validation
- Check linter output for \`any\` types in request handlers
- Use grep to find raw SQL string interpolation

## Review checklist
- [ ] All API routes validate input with Zod before processing
- [ ] No \`any\` types in request/response handling
- [ ] Security headers applied in middleware
- [ ] RLS policies exist for every user-data table
- [ ] Rate limiting on auth and write endpoints
- [ ] Error responses do not leak internals`,

      claude: `# Claude — OWASP Security Best Practices

## Interaction patterns
- When reviewing code for security, systematically check each OWASP Top 10 category
- Ask which authentication provider is in use before recommending auth patterns
- Identify trust boundaries before suggesting validation placement
- Structure findings by severity: critical → high → medium → low

## Response structure
1. **Threat surface** — identify what's exposed and to whom
2. **Findings** — list issues mapped to OWASP categories with severity
3. **Remediation** — provide concrete code fixes, not just descriptions
4. **Verification** — describe how to test each fix

## Chain-of-thought guidance
- Trace data flow from input to storage to output to find injection points
- Check authorization at every layer: middleware, route handler, database
- Verify that error messages don't leak internal structure
- Consider both authenticated and unauthenticated attack surfaces

## Output formatting
- Use tables for multi-issue findings with severity ratings
- Code blocks with language tags for all fixes
- Reference specific files and functions when discussing issues
- Provide a prioritized remediation checklist

## Constraints
- Never recommend disabling security controls for convenience
- Never suggest storing secrets in code or config files
- Always recommend the strictest viable control as the default`,

      agents: `# AGENTS.md — OWASP Security Best Practices

## Purpose
Enforce OWASP-aligned secure coding defaults across the codebase, covering input validation, output encoding, authentication, authorization, and dependency hygiene.

## Review checklist
1. Every API route validates its request body with a typed Zod schema
2. No raw SQL string interpolation exists in the codebase
3. Security headers (HSTS, CSP, X-Content-Type-Options, X-Frame-Options) are applied globally
4. Passwords are hashed with bcrypt (cost ≥ 12) or argon2id
5. RLS is enabled and policies exist for every table containing user data
6. \`pnpm audit\` reports no high or critical vulnerabilities
7. Rate limiting is applied to authentication and mutation endpoints
8. Error responses reveal no stack traces, SQL errors, or internal paths

## Quality gates
- All Zod schemas use \`.strict()\` to reject unexpected keys
- CSP does not include \`unsafe-eval\` in production
- No secrets appear in committed files (scan with \`rg -i "password|secret|api.key" --type ts\`)

## Related skills
- \`security-threat-model\`: use for structured threat analysis before hardening
- \`api-security\`: use for API-specific controls (OAuth, JWT, CORS, webhooks)
- \`auth-patterns\`: use for authentication provider integration

## Escalation criteria
- Escalate to a human when a known CVE affects a core dependency with no patch available
- Escalate when RLS policies conflict with existing application authorization logic`,
    },
  },

  // -------------------------------------------------------------------------
  // 2. OWASP Threat Modeling
  // -------------------------------------------------------------------------
  {
    slug: "security-threat-model",
    title: "OWASP Threat Modeling",
    description:
      "OWASP threat modeling methodology: trust boundaries, asset inventory, STRIDE analysis, abuse paths, and structured mitigation planning.",
    category: "security",
    accent: "signal-blue",
    featured: true,
    visibility: "member",
    tags: ["threat-model", "appsec", "trust-boundaries", "mitigations"],
    body: `# OWASP Threat Modeling

Repository-grounded threat modeling methodology that enumerates trust boundaries, builds an asset inventory, applies STRIDE analysis, maps abuse paths, and produces structured mitigation plans. Designed for web applications, APIs, and cloud-native architectures.

## When to use

- Designing a new system or major feature before writing code
- Preparing for a security audit or compliance review
- After a security incident to identify overlooked attack vectors
- Evaluating third-party integrations for risk exposure
- When stakeholders ask "what could go wrong?" and need a structured answer

## When NOT to use

- Hardening existing code (use \\\`security-best-practices\\\` instead)
- Implementing specific auth flows (use \\\`auth-patterns\\\` instead)
- Fixing a known vulnerability with a clear remediation path
- Pure infrastructure/network security without application context

## Core concepts

| Concept | Description |
|---------|-------------|
| Trust boundary | A line where the trust level changes — network edge, auth layer, service-to-service |
| Asset | Anything of value to an attacker: user data, credentials, API keys, compute |
| STRIDE | Threat categories: Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation of Privilege |
| Abuse path | A concrete sequence of steps an attacker takes to reach an asset |
| Mitigation | A control that blocks, detects, or limits an abuse path |
| Risk rating | Likelihood × Impact, scored to prioritize remediation |
| Data flow diagram | Visual map of how data moves across trust boundaries |

### STRIDE category reference

| Category | Question | Example |
|----------|----------|---------|
| **S**poofing | Can someone pretend to be another user or service? | Forged JWT, stolen session cookie |
| **T**ampering | Can data be modified in transit or at rest? | Unsigned webhook payload, mutable cache |
| **R**epudiation | Can someone deny performing an action? | Missing audit log for admin operations |
| **I**nfo Disclosure | Can sensitive data leak to unauthorized parties? | Error messages with stack traces, verbose API responses |
| **D**enial of Service | Can the system be made unavailable? | Unbounded query, missing rate limit, regex DoS |
| **E**levation of Privilege | Can someone gain unauthorized access? | Missing RLS, broken RBAC, IDOR |

## Workflow

### Step 1: Enumerate trust boundaries

Identify every point where the trust level changes in your system.

\\\`\\\`\\\`markdown
## Trust Boundaries

1. **Browser → CDN/Edge** — public internet, untrusted
2. **Edge → API Routes** — authenticated via Clerk JWT
3. **API Routes → Supabase** — service role key, trusted
4. **API Routes → External APIs** — outbound, mixed trust
5. **Cron Jobs → Database** — server-side, privileged
6. **Webhook Ingress → API Routes** — inbound, signature-verified
\\\`\\\`\\\`

### Step 2: Build an asset inventory

\\\`\\\`\\\`markdown
## Asset Inventory

| Asset | Classification | Storage | Access control |
|-------|---------------|---------|----------------|
| User PII (email, name) | Confidential | Supabase profiles table | RLS + auth |
| Session tokens | Secret | HTTP-only cookies | Clerk managed |
| API keys | Secret | Environment variables | Vercel env |
| Skill content | Internal | Supabase skills table | RLS by visibility |
| Payment data | Restricted | Stripe (external) | PCI via Stripe |
| Audit logs | Internal | Supabase logs table | Admin-only RLS |
\\\`\\\`\\\`

### Step 3: Apply STRIDE analysis

For each trust boundary, systematically check each STRIDE category.

\\\`\\\`\\\`markdown
## STRIDE Worksheet

### Boundary: Browser → API Routes

| Threat | Category | Likelihood | Impact | Risk | Mitigation |
|--------|----------|------------|--------|------|------------|
| Forged auth token | Spoofing | Medium | High | High | Clerk JWT verification with \`auth()\` |
| Tampered request body | Tampering | High | High | Critical | Zod validation on all inputs |
| Unlogged admin action | Repudiation | Medium | Medium | Medium | Audit log table with actor_id |
| Stack trace in error | Info Disclosure | High | Low | Medium | Generic error responses in production |
| Unbounded list query | DoS | High | Medium | High | Pagination limits, rate limiting |
| Missing RLS bypass | Elevation | Medium | Critical | Critical | RLS on all tables, test with anon role |

### Boundary: Webhook Ingress → API Routes

| Threat | Category | Likelihood | Impact | Risk | Mitigation |
|--------|----------|------------|--------|------|------------|
| Forged webhook | Spoofing | High | High | Critical | HMAC signature verification |
| Replay attack | Tampering | Medium | Medium | Medium | Timestamp validation (5-min window) |
| Payload injection | Tampering | Medium | High | High | Zod schema validation on payload |
\\\`\\\`\\\`

### Step 4: Map abuse paths

\\\`\\\`\\\`markdown
## Abuse Paths

### Path 1: Unauthorized data access via IDOR
1. Attacker authenticates as User A
2. Attacker modifies resource ID in API request to target User B's data
3. API handler fetches data using the supplied ID without ownership check
4. User B's data is returned to User A

**Mitigation chain:**
- Server-side ownership check in route handler
- RLS policy: \`USING (auth.uid() = user_id)\`
- Integration test: verify cross-user access returns 403

### Path 2: Webhook forgery
1. Attacker discovers webhook endpoint URL
2. Attacker crafts a fake payload mimicking the provider's format
3. Endpoint processes the payload without signature verification
4. Attacker triggers arbitrary side effects (account creation, data mutation)

**Mitigation chain:**
- HMAC signature verification using provider's signing secret
- Timestamp validation within 5-minute window
- Zod validation on the webhook payload schema
\\\`\\\`\\\`

### Step 5: Prioritize and plan mitigations

\\\`\\\`\\\`markdown
## Mitigation Plan

| Priority | Threat | Mitigation | Effort | Owner |
|----------|--------|------------|--------|-------|
| P0 | Missing RLS on profiles | Add RLS policies | 2h | Backend |
| P0 | Unsigned webhooks | Add HMAC verification | 4h | Backend |
| P1 | No rate limiting on auth | Add rate limiter middleware | 4h | Backend |
| P1 | Verbose error messages | Sanitize error responses | 2h | Backend |
| P2 | Missing audit logging | Add audit log table + triggers | 8h | Backend |
| P2 | No CSP headers | Add CSP in middleware | 2h | Frontend |
\\\`\\\`\\\`

## Examples

### Example 1: STRIDE worksheet for a new API endpoint

\\\`\\\`\\\`markdown
## Threat Model: POST /api/skills/copy

### Trust boundary: Authenticated user → API → Supabase

| Threat | STRIDE | Risk | Mitigation |
|--------|--------|------|------------|
| User copies skill they don't have access to | Elevation | High | Check visibility + membership before copy |
| Copied skill retains original author's identity | Spoofing | Medium | Set new author_id to copying user |
| Unlimited copies cause storage exhaustion | DoS | Medium | Rate limit + per-user copy quota |
| Copy operation not logged | Repudiation | Low | Audit log entry on copy |
\\\`\\\`\\\`

### Example 2: Data flow diagram template

\\\`\\\`\\\`markdown
## Data Flow: User Authentication

Browser                     Clerk                       API Route           Supabase
  |                           |                           |                   |
  |-- Sign-in request ------->|                           |                   |
  |                           |-- Verify credentials ---->|                   |
  |                           |<-- JWT token -------------|                   |
  |<-- Set HTTP-only cookie --|                           |                   |
  |                           |                           |                   |
  |-- API request + cookie ---|-------------------------->|                   |
  |                           |                           |-- auth() verify ->|
  |                           |                           |<- user context ---|
  |                           |                           |-- RLS query ----->|
  |                           |                           |<- filtered data --|
  |<-- JSON response ---------|---------------------------|                   |

Trust boundaries: [Browser ↔ Clerk] [Browser ↔ API] [API ↔ Supabase]
\\\`\\\`\\\`

## Decision tree

- New feature or endpoint → run STRIDE worksheet before implementation
- Third-party integration → map trust boundaries and verify signature scheme
- Data storage → classify assets and define RLS policies before creating tables
- Incident response → trace the abuse path, check mitigations, update threat model
- Compliance audit → export threat model as evidence of security design process
- If unsure about risk level → rate it higher and mitigate first

## Edge cases and gotchas

1. **Trust boundary confusion in serverless** — each function invocation is a separate trust context. Don't assume state carries over between invocations.
2. **STRIDE for third-party APIs** — you control only your side of the boundary. Document what the provider guarantees and what you verify.
3. **Threat model drift** — models go stale as features ship. Schedule quarterly reviews or trigger re-analysis on major architecture changes.
4. **Over-modeling low-risk features** — not every CRUD endpoint needs a full STRIDE worksheet. Apply depth proportional to data sensitivity and exposure.
5. **Missing "Repudiation" analysis** — teams often skip repudiation because it's less dramatic than injection. Audit logging gaps cause real compliance pain.
6. **Incomplete asset inventory** — temporary files, cache stores, and log sinks are assets too. Include anything that could contain sensitive data.
7. **Risk score inflation** — rating everything as "Critical" makes prioritization impossible. Use a consistent scale and defend ratings with evidence.

## Evaluation criteria

- [ ] All trust boundaries identified and documented
- [ ] Asset inventory covers data at rest, in transit, and in processing
- [ ] STRIDE analysis completed for every trust boundary
- [ ] At least two concrete abuse paths documented with mitigation chains
- [ ] Mitigation plan prioritized with effort estimates and ownership
- [ ] Threat model is version-controlled alongside the codebase
- [ ] Quarterly review cadence established
- [ ] Critical and high risks have mitigations in progress or completed
- [ ] Data flow diagrams show how data crosses trust boundaries
- [ ] Threat model covers both authenticated and unauthenticated attack surfaces`,

    agentDocs: {
      codex: `# Codex — OWASP Threat Modeling

## Environment
- Codex runs in a sandboxed environment: file I/O only, no browser, no GUI
- Network access may be restricted — prefer local operations when possible
- Working directory is the project root

## When this skill is active
- Scan the codebase for trust boundaries: API routes, middleware, database access, external calls
- Identify data stores and classify assets by sensitivity
- Generate a STRIDE worksheet for each trust boundary
- Map concrete abuse paths with step-by-step attacker actions
- Produce a prioritized mitigation plan with effort estimates

## Tool usage
- Use file read to analyze route handlers, middleware, and database schemas
- Use shell to list API routes: \`find app/api -name "route.ts"\`
- Use grep to find auth checks: \`rg "auth()" --type ts\`
- Check RLS policies: read \`supabase/migrations/\` files

## Testing expectations
- Validate that identified mitigations are actually implemented
- Cross-reference STRIDE findings with existing security controls
- Verify no high-risk findings are left without a mitigation plan

## Common failure modes
- Missing trust boundaries at serverless function edges
- Forgetting cron jobs and background workers in the threat model
- Overlooking repudiation threats (missing audit logs)

## Output format
- Write the threat model as a markdown file in \`docs/security/\`
- Include STRIDE worksheet tables, abuse paths, and mitigation plan
- Summarize findings by risk level: critical, high, medium, low`,

      cursor: `# Cursor — OWASP Threat Modeling

## IDE context
- You have access to the full project via file editing, search, and multi-file operations
- Linter feedback is available in real time
- You can run terminal commands for builds, tests, and git operations

## When this skill applies
- Before implementing a new feature, generate a STRIDE worksheet
- Map all API routes and their authentication requirements
- Check every Supabase table for RLS policies
- Identify external integrations and their trust levels
- Verify webhook endpoints have signature verification

## Code style
- Threat model documents go in \`docs/security/\`
- Use markdown tables for STRIDE worksheets
- Name files by feature: \`threat-model-skill-copy.md\`
- Reference specific files and line numbers in findings

## Cursor features to leverage
- Use search to find all \`route.ts\` files and map the API surface
- Use grep to find auth checks: \`rg "auth()" --type ts\`
- Use multi-file read to analyze data flow across components
- Check \`supabase/migrations/\` for RLS policy coverage

## Review checklist
- [ ] Trust boundaries match the actual deployment topology
- [ ] Every API route appears in the threat model
- [ ] STRIDE analysis covers all six categories per boundary
- [ ] Abuse paths are concrete and actionable
- [ ] Mitigations reference specific code changes or tickets`,

      claude: `# Claude — OWASP Threat Modeling

## Interaction patterns
- When asked to threat-model a feature, start by mapping trust boundaries
- Ask about the deployment topology if not obvious from the codebase
- Identify assets before analyzing threats — what's worth stealing?
- Present STRIDE analysis as structured tables, not prose

## Response structure
1. **Scope** — what system or feature is being modeled
2. **Trust boundaries** — where trust levels change
3. **Asset inventory** — what's valuable and where it lives
4. **STRIDE worksheet** — systematic threat enumeration per boundary
5. **Abuse paths** — concrete attacker sequences
6. **Mitigation plan** — prioritized controls with effort estimates

## Chain-of-thought guidance
- Think like an attacker: what's the easiest path to the most valuable asset?
- Consider both external and internal threat actors
- Don't skip "Repudiation" — audit logging gaps are common findings
- Rate risks consistently: use Likelihood × Impact, not gut feeling

## Output formatting
- Use markdown tables for STRIDE worksheets and mitigation plans
- Use numbered sequences for abuse paths
- ASCII diagrams for data flow when appropriate
- Separate findings by trust boundary for readability

## Constraints
- Never skip STRIDE categories — even if you think they don't apply, note why
- Never rate all risks as "Critical" — force prioritization
- Always include at least two concrete abuse paths with mitigation chains`,

      agents: `# AGENTS.md — OWASP Threat Modeling

## Purpose
Produce structured threat models grounded in the actual codebase: trust boundaries, asset inventory, STRIDE analysis, abuse paths, and prioritized mitigations.

## Review checklist
1. All trust boundaries in the system are identified and documented
2. Asset inventory covers data at rest, in transit, and in processing
3. STRIDE analysis completed for every trust boundary with risk ratings
4. At least two concrete abuse paths documented with mitigation chains
5. Mitigation plan is prioritized by risk with effort estimates
6. Threat model references specific files, routes, and database tables
7. Both authenticated and unauthenticated attack surfaces are covered
8. Repudiation threats (audit logging gaps) are explicitly addressed

## Quality gates
- Every trust boundary has all six STRIDE categories assessed
- Risk ratings use a consistent Likelihood × Impact framework
- Abuse paths include step-by-step attacker actions, not just descriptions
- Mitigations are specific and actionable, not generic advice

## Related skills
- \`security-best-practices\`: use after threat modeling to implement hardening controls
- \`api-security\`: use for API-specific threat analysis (OAuth, JWT, CORS)
- \`auth-patterns\`: use for authentication-specific threat modeling

## Escalation criteria
- Escalate to a human when critical risks have no viable technical mitigation
- Escalate when the threat model reveals architectural redesign needs
- Escalate when third-party provider security guarantees are unclear`,
    },
  },

  // -------------------------------------------------------------------------
  // 3. Clerk Auth Patterns
  // -------------------------------------------------------------------------
  {
    slug: "auth-patterns",
    title: "Clerk Auth Patterns",
    description:
      "Clerk, Auth0, and OAuth authentication patterns: JWT, sessions, RBAC, Supabase row-level security, and multi-tenant access control for web apps.",
    category: "security",
    accent: "signal-blue",
    tags: ["auth", "jwt", "sessions", "oauth", "rbac"],
    body: `# Clerk Auth Patterns

Production authentication patterns for web applications using Clerk as the primary provider, with Auth0 and generic OAuth 2.0 as alternatives. Covers JWT verification, session management, RBAC, Supabase row-level security integration, multi-tenant access control, and middleware-driven auth enforcement.

## When to use

- Adding authentication to a Next.js application
- Implementing role-based access control (RBAC) for API routes
- Integrating Clerk with Supabase for row-level security
- Building multi-tenant applications with organization-scoped access
- Setting up OAuth 2.0 flows with third-party providers
- Protecting API routes with JWT verification

## When NOT to use

- Machine-to-machine auth without user context — use API keys or mTLS instead
- Embedded device authentication — use device-specific protocols
- General API hardening (use \\\`api-security\\\` instead)
- Threat modeling (use \\\`security-threat-model\\\` instead)

## Core concepts

| Concept | Description |
|---------|-------------|
| JWT (JSON Web Token) | Signed token containing user claims, verified server-side without a session store |
| Session | Server-managed auth state, typically stored in HTTP-only cookies |
| RBAC | Role-Based Access Control — permissions derived from assigned roles |
| RLS | Row-Level Security — database-enforced access control per row |
| Multi-tenancy | Single deployment serving multiple isolated organizations |
| OAuth 2.0 | Authorization framework for delegated access via access tokens |
| PKCE | Proof Key for Code Exchange — prevents auth code interception in public clients |
| Middleware auth | Request interception layer that verifies auth before reaching route handlers |

### Authentication flow comparison

| Pattern | Best for | Session store | Token type |
|---------|----------|--------------|------------|
| Clerk (managed) | Next.js apps, rapid setup | Clerk-managed | Clerk JWT |
| Auth0 | Enterprise SSO, custom flows | Auth0-managed | Auth0 JWT |
| Custom OAuth 2.0 | Full control, multi-provider | Self-managed | Standard JWT |
| Supabase Auth | Supabase-native apps | Supabase-managed | Supabase JWT |

## Workflow

### Step 1: Set up Clerk middleware

\\\`\\\`\\\`typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/public(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
\\\`\\\`\\\`

### Step 2: Protect API routes with auth checks

\\\`\\\`\\\`typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId, orgId, orgRole } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (orgRole !== "org:admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ userId, orgId });
}
\\\`\\\`\\\`

### Step 3: Integrate Clerk JWT with Supabase RLS

\\\`\\\`\\\`typescript
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function getAuthenticatedSupabase() {
  const { getToken } = await auth();
  const supabaseToken = await getToken({ template: "supabase" });

  if (!supabaseToken) {
    throw new Error("Failed to get Supabase token from Clerk");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: \\\`Bearer \\\${supabaseToken}\\\` },
      },
    }
  );
}
\\\`\\\`\\\`

\\\`\\\`\\\`sql
-- Supabase JWT function to extract Clerk user ID
CREATE OR REPLACE FUNCTION auth.clerk_user_id()
RETURNS TEXT AS $$
  SELECT coalesce(
    current_setting('request.jwt.claims', true)::json->>'sub',
    (current_setting('request.jwt.claims', true)::json->>'userId')::text
  );
$$ LANGUAGE sql STABLE;

-- RLS policy using Clerk user ID
CREATE POLICY "users_own_data" ON public.user_profiles
  FOR ALL USING (clerk_user_id = auth.clerk_user_id());
\\\`\\\`\\\`

### Step 4: Implement RBAC with organization roles

\\\`\\\`\\\`typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type OrgRole = "org:admin" | "org:member" | "org:viewer";

const ROLE_HIERARCHY: Record<OrgRole, number> = {
  "org:admin": 3,
  "org:member": 2,
  "org:viewer": 1,
};

export function requireRole(minimumRole: OrgRole) {
  return async function checkRole() {
    const { userId, orgRole } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userLevel = ROLE_HIERARCHY[orgRole as OrgRole] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole];

    if (userLevel < requiredLevel) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    return null;
  };
}
\\\`\\\`\\\`

### Step 5: Handle Clerk webhooks for user sync

\\\`\\\`\\\`typescript
import { Webhook } from "svix";
import { NextResponse } from "next/server";
import type { WebhookEvent } from "@clerk/nextjs/server";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const headerPayload = request.headers;
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await request.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let event: WebhookEvent;
  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  switch (event.type) {
    case "user.created":
      await syncUserToDatabase(event.data);
      break;
    case "user.updated":
      await updateUserInDatabase(event.data);
      break;
    case "user.deleted":
      await deactivateUserInDatabase(event.data.id!);
      break;
  }

  return NextResponse.json({ received: true });
}
\\\`\\\`\\\`

## Examples

### Example 1: Protected page with org switching

\\\`\\\`\\\`typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId, orgId } = await auth();

  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/select-org");

  const data = await fetchOrgDashboard(orgId);
  return <Dashboard data={data} />;
}
\\\`\\\`\\\`

### Example 2: Multi-tenant RLS policy

\\\`\\\`\\\`sql
-- Organization-scoped access
CREATE POLICY "org_members_access" ON public.projects
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE clerk_user_id = auth.clerk_user_id()
    )
  );

-- Admin-only write access within org
CREATE POLICY "org_admins_write" ON public.org_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships
      WHERE org_memberships.org_id = org_settings.org_id
        AND org_memberships.clerk_user_id = auth.clerk_user_id()
        AND org_memberships.role = 'admin'
    )
  );
\\\`\\\`\\\`

## Decision tree

- New Next.js app → use Clerk with middleware-based auth
- Enterprise SSO requirement → use Clerk Organizations or Auth0
- Supabase data access → integrate Clerk JWT with RLS policies
- Public API → use API keys with rate limiting, not session auth
- Webhook from Clerk → verify svix signature before processing
- Multi-tenant app → use Clerk Organizations with org-scoped RLS
- Server component data fetch → use \\\`auth()\\\` to get user context
- If unsure about auth provider → start with Clerk for fastest iteration

## Edge cases and gotchas

1. **Clerk token template mismatch** — the Supabase JWT template must include the \\\`sub\\\` claim. Verify the template in Clerk Dashboard → JWT Templates.
2. **Middleware matcher too broad** — matching \\\`/(.*)\\\` intercepts static assets and causes performance issues. Use the recommended matcher pattern.
3. **Organization role caching** — Clerk caches org roles in the session token. Role changes may not reflect until the token refreshes (default: 60s).
4. **Webhook replay** — svix handles deduplication via \\\`svix-id\\\`, but your handler must be idempotent for retries.
5. **RLS with service role key** — the Supabase service role key bypasses RLS entirely. Never expose it to the client; use the anon key with user JWTs.
6. **Auth in server actions** — \\\`auth()\\\` works in server components and route handlers but needs \\\`await\\\` in Next.js 15+.
7. **Cross-origin auth** — Clerk sessions are domain-scoped. Multi-domain setups need satellite domains or custom auth forwarding.

## Evaluation criteria

- [ ] Middleware protects all non-public routes
- [ ] API routes verify \\\`userId\\\` before processing requests
- [ ] RBAC checks use role hierarchy, not string equality
- [ ] Supabase RLS policies reference the Clerk JWT user ID
- [ ] Webhook endpoint verifies svix signature before processing
- [ ] No auth tokens stored in localStorage (HTTP-only cookies only)
- [ ] Organization-scoped queries filter by \\\`orgId\\\` from the auth context
- [ ] Error responses distinguish 401 (unauthenticated) from 403 (unauthorized)
- [ ] Auth state is not duplicated between Clerk and application database
- [ ] Token refresh and session expiry are handled gracefully in the UI`,

    agentDocs: {
      codex: `# Codex — Clerk Auth Patterns

## Environment
- Codex runs in a sandboxed environment: file I/O only, no browser, no GUI
- Network access may be restricted — Clerk API calls may not work in sandbox
- Working directory is the project root

## When this skill is active
- Use \`auth()\` from \`@clerk/nextjs/server\` for server-side auth checks
- Always \`await auth()\` in Next.js 15+ (it returns a Promise)
- Verify \`userId\` before any data access or mutation
- Use Clerk's middleware, not custom auth wrappers
- Integrate with Supabase via JWT template, not service role key for user context

## Tool usage
- Read \`middleware.ts\` to check route protection coverage
- Read \`supabase/migrations/\` for RLS policy verification
- Use grep to find unprotected API routes: \`rg "export async function" app/api/ --type ts\`
- Check for service role key usage: \`rg "SUPABASE_SERVICE_ROLE" --type ts\`

## Testing expectations
- Verify middleware blocks unauthenticated access to protected routes
- Test RBAC with different org roles
- Verify webhook signature validation rejects tampered payloads
- Test RLS policies with different user contexts

## Common failure modes
- Missing \`await\` on \`auth()\` in Next.js 15+ returns a Promise object, not user data
- Service role key in client-side code bypasses all RLS
- Webhook handler not idempotent causes duplicate processing on retries

## Output format
- Write auth-related code to the appropriate files
- Summarize auth flow changes and their security implications
- Reference Clerk documentation for provider-specific configurations`,

      cursor: `# Cursor — Clerk Auth Patterns

## IDE context
- You have access to the full project via file editing, search, and multi-file operations
- Linter feedback is available in real time
- You can run terminal commands for builds, tests, and git operations

## When this skill applies
- Always use \`@clerk/nextjs/server\` for server-side auth, not manual JWT parsing
- Protect routes via middleware, not per-route auth checks alone
- Use Clerk Organizations for multi-tenant RBAC, not custom role tables
- Integrate with Supabase via JWT templates for RLS, not service role key
- Verify webhooks with svix before processing any event

## Code style
- Middleware in \`middleware.ts\` at project root
- Auth utilities in \`lib/auth.ts\`
- Webhook handlers in \`app/api/webhooks/\`
- RLS migrations in \`supabase/migrations/\` with descriptive names
- RBAC utilities in \`lib/rbac.ts\`

## Cursor features to leverage
- Search for \`auth()\` calls to verify consistent auth usage
- Check all API routes for auth verification
- Grep for \`SUPABASE_SERVICE_ROLE\` to find potential RLS bypasses
- Use multi-file edit for auth refactors across route handlers

## Review checklist
- [ ] Middleware protects all non-public routes
- [ ] \`auth()\` is awaited in all server contexts
- [ ] No \`SUPABASE_SERVICE_ROLE_KEY\` in client-side code
- [ ] Webhook handlers verify svix signatures
- [ ] RBAC uses role hierarchy, not exact string matching
- [ ] RLS policies reference Clerk user ID correctly`,

      claude: `# Claude — Clerk Auth Patterns

## Interaction patterns
- Ask which auth provider is already in use before recommending changes
- Check if Clerk Organizations are needed before suggesting custom RBAC
- Verify the Next.js version to determine if \`auth()\` needs \`await\`
- Map the auth flow end-to-end before suggesting point fixes

## Response structure
1. **Current auth state** — what's already implemented
2. **Gap analysis** — what's missing or misconfigured
3. **Implementation plan** — ordered steps with code changes
4. **Verification** — how to test the auth flow end-to-end

## Chain-of-thought guidance
- Trace the auth flow from browser to database: cookie → middleware → route → RLS
- Consider both authenticated and unauthenticated paths
- Check for auth bypass vectors: direct API access, missing middleware routes
- Verify that error responses use correct status codes (401 vs 403)

## Output formatting
- Use sequence diagrams for auth flows when they span multiple services
- Code blocks with file paths for all implementation changes
- Tables for role/permission mappings
- Checklists for migration steps when changing auth providers

## Constraints
- Never suggest storing auth tokens in localStorage
- Never recommend the service role key for client-side Supabase access
- Always recommend svix signature verification for Clerk webhooks
- Prefer Clerk's built-in components over custom sign-in UIs`,

      agents: `# AGENTS.md — Clerk Auth Patterns

## Purpose
Implement and verify Clerk-based authentication patterns including middleware protection, RBAC, Supabase RLS integration, and webhook handling for Next.js applications.

## Review checklist
1. Middleware protects all non-public routes with \`clerkMiddleware\`
2. API routes verify \`userId\` from \`auth()\` before any data access
3. RBAC checks use a role hierarchy function, not string equality
4. Supabase RLS policies reference the Clerk JWT user ID via a SQL function
5. Webhook endpoints verify svix signatures before processing events
6. No auth tokens are stored in localStorage or exposed to client JavaScript
7. Organization-scoped queries filter by \`orgId\` from the auth context
8. Error responses correctly distinguish 401 from 403 status codes

## Quality gates
- Middleware matcher excludes static assets and includes all API routes
- Every Supabase table with user data has RLS enabled and at least one policy
- Webhook handlers are idempotent (safe for retries)
- RBAC role definitions are centralized, not scattered across handlers

## Related skills
- \`security-best-practices\`: general secure coding defaults
- \`api-security\`: API-specific auth patterns (OAuth, JWT, CORS)
- \`security-threat-model\`: threat modeling auth flows

## Escalation criteria
- Escalate to a human when migrating between auth providers (Clerk ↔ Auth0)
- Escalate when Clerk Organizations don't map cleanly to the data model
- Escalate when cross-domain auth is required (satellite domains)`,
    },
  },

  // -------------------------------------------------------------------------
  // 4. OAuth & JWT API Security
  // -------------------------------------------------------------------------
  {
    slug: "api-security",
    title: "OAuth & JWT API Security",
    description:
      "OAuth 2.0, JWT verification, rate limiting, input validation, CORS configuration, API key management, webhook verification, and abuse prevention.",
    category: "security",
    accent: "signal-blue",
    tags: ["api", "rate-limiting", "cors", "validation", "webhooks"],
    body: `# OAuth & JWT API Security

Comprehensive API security covering OAuth 2.0 authorization flows, JWT verification, rate limiting, input validation, CORS configuration, API key management, webhook signature verification, and abuse prevention. Designed for Next.js API routes and serverless architectures.

## When to use

- Building or securing REST or GraphQL APIs
- Implementing OAuth 2.0 authorization flows
- Adding rate limiting to prevent abuse
- Configuring CORS for cross-origin API access
- Verifying incoming webhooks from third-party services
- Managing API keys for service-to-service communication
- Protecting against common API attack patterns (replay, IDOR, enumeration)

## When NOT to use

- Browser-only authentication with no API surface — use \\\`auth-patterns\\\` instead
- Network-level DDoS protection — use edge infrastructure (Cloudflare, Vercel)
- Full threat modeling — use \\\`security-threat-model\\\` instead

## Core concepts

| Concept | Description |
|---------|-------------|
| OAuth 2.0 | Authorization framework for delegated access, not authentication |
| JWT | JSON Web Token — self-contained signed claims for stateless verification |
| PKCE | Proof Key for Code Exchange — prevents auth code interception |
| CORS | Cross-Origin Resource Sharing — browser-enforced origin access control |
| Rate limiting | Request throttling to prevent abuse and ensure fair usage |
| API key | Opaque secret for identifying and authenticating API clients |
| Webhook signature | HMAC hash proving the webhook payload is from the claimed sender |
| Idempotency key | Client-provided key ensuring repeated requests produce the same result |

### JWT anatomy

| Section | Contains | Verified? |
|---------|----------|-----------|
| Header | Algorithm, token type | Parsed |
| Payload | Claims (sub, iat, exp, iss, custom) | Parsed + validated |
| Signature | HMAC or RSA signature of header.payload | Cryptographically verified |

### OAuth 2.0 flow comparison

| Flow | Best for | Client type |
|------|----------|-------------|
| Authorization Code + PKCE | SPAs, mobile apps | Public |
| Authorization Code | Server-rendered apps | Confidential |
| Client Credentials | Service-to-service | Confidential |
| Device Code | CLI tools, smart TVs | Public (no browser) |

## Workflow

### Step 1: JWT verification middleware

\\\`\\\`\\\`typescript
import { jwtVerify, createRemoteJWKSet } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const JWKS_URL = new URL(process.env.JWKS_URL!);
const JWKS = createRemoteJWKSet(JWKS_URL);

export async function verifyJwt(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Missing token" }, { status: 401 }) };
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.JWT_ISSUER!,
      audience: process.env.JWT_AUDIENCE!,
      algorithms: ["RS256"],
    });

    if (!payload.sub) {
      return { error: NextResponse.json({ error: "Invalid token" }, { status: 401 }) };
    }

    return { payload };
  } catch {
    return { error: NextResponse.json({ error: "Token verification failed" }, { status: 401 }) };
  }
}
\\\`\\\`\\\`

### Step 2: Rate limiting middleware

\\\`\\\`\\\`typescript
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

type RateLimitConfig = {
  max: number;
  windowMs: number;
};

export function getRateLimitKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return ip;
}

export async function rateLimit(
  request: Request,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const key = getRateLimitKey(request);
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return null;
  }

  entry.count++;

  if (entry.count > config.max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.max),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(entry.resetAt),
        },
      }
    );
  }

  return null;
}
\\\`\\\`\\\`

For production, replace the in-memory store with Upstash Redis or Vercel KV:

\\\`\\\`\\\`typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "api-ratelimit",
});
\\\`\\\`\\\`

### Step 3: CORS configuration

\\\`\\\`\\\`typescript
const ALLOWED_ORIGINS = new Set([
  "https://yourdomain.com",
  "https://app.yourdomain.com",
]);

if (process.env.NODE_ENV === "development") {
  ALLOWED_ORIGINS.add("http://localhost:3000");
}

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

export function handlePreflight(request: Request): NextResponse | null {
  if (request.method !== "OPTIONS") return null;
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}
\\\`\\\`\\\`

### Step 4: Webhook signature verification

\\\`\\\`\\\`typescript
import { createHmac, timingSafeEqual } from "crypto";

type WebhookVerifyConfig = {
  secret: string;
  signatureHeader: string;
  timestampHeader?: string;
  maxAgeMs?: number;
};

export async function verifyWebhookSignature(
  request: Request,
  config: WebhookVerifyConfig
): Promise<{ valid: true; body: string } | { valid: false; error: string }> {
  const signature = request.headers.get(config.signatureHeader);
  if (!signature) return { valid: false, error: "Missing signature header" };

  if (config.timestampHeader) {
    const timestamp = request.headers.get(config.timestampHeader);
    if (!timestamp) return { valid: false, error: "Missing timestamp header" };

    const maxAge = config.maxAgeMs ?? 300_000;
    const age = Date.now() - Number(timestamp) * 1000;
    if (age > maxAge) return { valid: false, error: "Timestamp too old" };
  }

  const body = await request.text();
  const expected = createHmac("sha256", config.secret).update(body).digest("hex");
  const sig = signature.replace(/^sha256=/, "");

  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { valid: false, error: "Invalid signature" };
  }

  return { valid: true, body };
}
\\\`\\\`\\\`

### Step 5: API key management

\\\`\\\`\\\`typescript
import { createHash, randomBytes } from "crypto";

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const raw = randomBytes(32).toString("base64url");
  const prefix = raw.slice(0, 8);
  const hash = createHash("sha256").update(raw).digest("hex");
  return { key: \\\`sk_\\\${raw}\\\`, hash, prefix };
}

export function hashApiKey(key: string): string {
  const raw = key.replace(/^sk_/, "");
  return createHash("sha256").update(raw).digest("hex");
}

export async function verifyApiKey(
  request: Request
): Promise<{ valid: true; clientId: string } | { valid: false }> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer sk_")) return { valid: false };

  const hash = hashApiKey(authHeader.slice(7));
  const client = await lookupApiKeyHash(hash);

  if (!client) return { valid: false };
  return { valid: true, clientId: client.id };
}
\\\`\\\`\\\`

## Examples

### Example 1: Complete secured API route

\\\`\\\`\\\`typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyJwt } from "@/lib/auth/jwt";
import { rateLimit } from "@/lib/rate-limit";
import { corsHeaders, handlePreflight } from "@/lib/cors";

const UpdateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(50_000),
});

export async function OPTIONS(request: Request) {
  return handlePreflight(request) ?? new NextResponse(null, { status: 405 });
}

export async function PUT(request: Request) {
  const limited = await rateLimit(request, { max: 20, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await verifyJwt(request as any);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422, headers: corsHeaders(request) }
    );
  }

  const result = await updateResource(auth.payload.sub!, parsed.data);

  return NextResponse.json(result, { headers: corsHeaders(request) });
}
\\\`\\\`\\\`

### Example 2: Stripe webhook handler

\\\`\\\`\\\`typescript
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdate(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionCanceled(event.data.object);
      break;
  }

  return NextResponse.json({ received: true });
}
\\\`\\\`\\\`

### Example 3: CORS preflight + secured endpoint pattern

\\\`\\\`\\\`typescript
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://app.example.com",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const response = NextResponse.json({ data: "..." });
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}
\\\`\\\`\\\`

## Decision tree

- User-facing API → JWT auth + rate limiting + Zod validation + CORS
- Service-to-service API → API keys + IP allowlist + mutual TLS
- Public read-only API → rate limiting + CORS + no auth required
- Webhook receiver → signature verification + timestamp check + idempotency
- OAuth integration → Authorization Code + PKCE for SPAs, Client Credentials for servers
- Cross-origin access needed → explicit CORS allowlist, never wildcard in production
- High-value mutations → idempotency keys + audit logging
- If unsure about auth method → JWT for user context, API keys for service identity

## Edge cases and gotchas

1. **JWT \\\`alg: none\\\` attack** — always specify allowed algorithms explicitly in verification. Never accept \\\`none\\\`.
2. **CORS wildcard with credentials** — browsers reject \\\`Access-Control-Allow-Origin: *\\\` when \\\`credentials: include\\\` is set. Use explicit origin matching.
3. **Rate limiter in serverless** — in-memory stores reset on cold starts. Use Redis or an edge-level rate limiter for persistence.
4. **Webhook replay attacks** — without timestamp validation, an attacker can replay captured webhooks indefinitely. Always check the timestamp window.
5. **API key in query string** — query strings appear in server logs, CDN logs, and referrer headers. Always send keys in the Authorization header.
6. **JWT clock skew** — different servers may have slightly different clocks. Allow a small leeway (30s) when validating \\\`exp\\\` and \\\`nbf\\\` claims.
7. **CORS misconfiguration on errors** — if your error handler doesn't include CORS headers, browsers will show a CORS error instead of the actual error response.
8. **Double CORS headers** — middleware and route handlers both adding CORS headers results in duplicate values. Apply CORS at one layer only.
9. **Webhook signature timing attacks** — use \\\`timingSafeEqual\\\` for signature comparison, never \\\`===\\\`.

## Evaluation criteria

- [ ] JWT verification uses explicit algorithm allowlist (no \\\`alg: none\\\`)
- [ ] Rate limiting applied to all mutation endpoints with appropriate windows
- [ ] CORS uses explicit origin allowlist, not wildcard, in production
- [ ] Webhook endpoints verify signatures with timing-safe comparison
- [ ] API keys are hashed at rest, never stored in plaintext
- [ ] OAuth flows use PKCE for public clients
- [ ] Error responses include CORS headers to avoid masking real errors
- [ ] Idempotency keys supported for high-value mutations
- [ ] Rate limit headers (Retry-After, X-RateLimit-*) returned in 429 responses
- [ ] No secrets in query strings, URL paths, or client-side code
- [ ] Request validation runs before any business logic or data access`,

    agentDocs: {
      codex: `# Codex — OAuth & JWT API Security

## Environment
- Codex runs in a sandboxed environment: file I/O only, no browser, no GUI
- Network access may be restricted — external JWT key fetching may not work in sandbox
- Working directory is the project root

## When this skill is active
- Verify JWTs with explicit algorithm allowlists — never accept \`alg: none\`
- Use \`jose\` library for JWT operations, not \`jsonwebtoken\` (better ESM support)
- Implement rate limiting with Upstash Redis for serverless persistence
- CORS origins must be explicit allowlists, never \`*\` in production
- Webhook signatures must use \`timingSafeEqual\`, never \`===\`

## Tool usage
- Read API route files to check for missing auth or rate limiting
- Use grep to find unprotected routes: \`rg "export async function" app/api/ --type ts\`
- Check CORS config: \`rg "Access-Control" --type ts\`
- Verify webhook handlers: \`rg "webhook" app/api/ --type ts -l\`

## Testing expectations
- Test JWT verification rejects expired, malformed, and \`alg: none\` tokens
- Test rate limiter returns 429 with correct headers after threshold
- Test CORS rejects requests from non-allowlisted origins
- Test webhook signature verification rejects tampered payloads

## Common failure modes
- In-memory rate limiter resets on serverless cold starts — use Redis
- Missing CORS headers on error responses masks real errors in the browser
- JWT JWKS endpoint unreachable in sandbox — mock the key set for tests

## Output format
- Write security middleware to \`lib/\` with clear module boundaries
- Summarize each control and its purpose
- Include test file stubs for verification`,

      cursor: `# Cursor — OAuth & JWT API Security

## IDE context
- You have access to the full project via file editing, search, and multi-file operations
- Linter feedback is available in real time
- You can run terminal commands for builds, tests, and git operations

## When this skill applies
- Every API route must have rate limiting configured
- JWT verification must specify allowed algorithms explicitly
- CORS must use an origin allowlist, never wildcard in production
- Webhook handlers must verify signatures before processing
- API keys must be hashed before storage, never stored in plaintext

## Code style
- JWT utilities in \`lib/auth/jwt.ts\`
- Rate limiting in \`lib/rate-limit.ts\`
- CORS utilities in \`lib/cors.ts\`
- Webhook verification in \`lib/webhooks/verify.ts\`
- API key management in \`lib/auth/api-keys.ts\`

## Cursor features to leverage
- Search for API routes missing auth middleware
- Grep for \`Access-Control-Allow-Origin: "*"\` to find wildcard CORS
- Check for \`===\` in signature verification (should be \`timingSafeEqual\`)
- Use multi-file edit to add rate limiting across all API routes

## Review checklist
- [ ] All API routes have rate limiting with sensible limits
- [ ] JWT verification specifies \`algorithms: ["RS256"]\` or equivalent
- [ ] CORS origin allowlist matches deployment domains
- [ ] Webhook signature verification uses \`timingSafeEqual\`
- [ ] API keys are hashed with SHA-256 before database storage
- [ ] Rate limit responses include \`Retry-After\` and \`X-RateLimit-*\` headers`,

      claude: `# Claude — OAuth & JWT API Security

## Interaction patterns
- Ask about the API architecture before recommending security patterns
- Identify whether it's user-facing, service-to-service, or public API
- Check which auth provider is in use before suggesting JWT patterns
- Map the full request lifecycle: origin → middleware → handler → database

## Response structure
1. **API surface map** — what endpoints exist and their auth requirements
2. **Gap analysis** — missing security controls per endpoint
3. **Implementation** — concrete code for each security layer
4. **Testing** — verification steps for each control

## Chain-of-thought guidance
- Consider the full CORS flow: preflight → actual request → error responses
- Think about serverless constraints: cold starts reset in-memory state
- Verify that rate limiting keys are not spoofable (use \`x-real-ip\`, not \`X-Forwarded-For\`)
- Check that webhook handlers are idempotent for retry safety

## Output formatting
- Use tables for endpoint security matrices (endpoint × control)
- Code blocks with file paths for all implementations
- Sequence diagrams for OAuth flows when explaining to stakeholders
- Checklists for security audit preparation

## Constraints
- Never recommend \`alg: none\` or disabling JWT signature verification
- Never suggest CORS wildcard with credentials
- Never recommend storing API keys in plaintext
- Always use timing-safe comparison for cryptographic operations`,

      agents: `# AGENTS.md — OAuth & JWT API Security

## Purpose
Secure API endpoints with layered controls: OAuth 2.0 authorization, JWT verification, rate limiting, CORS enforcement, webhook signature verification, and API key management.

## Review checklist
1. JWT verification specifies explicit algorithm allowlists (no \`alg: none\`)
2. Rate limiting is applied to all mutation and authentication endpoints
3. CORS uses explicit origin allowlists, not wildcard, in production
4. Webhook endpoints verify signatures using timing-safe comparison
5. API keys are hashed at rest with SHA-256 or better
6. OAuth flows use PKCE for public clients (SPAs, mobile)
7. Error responses include CORS headers to prevent masking
8. Rate limit responses include \`Retry-After\` and \`X-RateLimit-*\` headers

## Quality gates
- No API route processes requests without at least one auth check
- In-memory rate limit stores are only used in development, not production
- CORS configuration is centralized, not duplicated across handlers
- Webhook handlers are idempotent (safe for retries from providers)

## Related skills
- \`auth-patterns\`: Clerk-specific auth integration and RBAC
- \`security-best-practices\`: general secure coding defaults
- \`security-threat-model\`: systematic threat analysis for APIs

## Escalation criteria
- Escalate to a human when implementing custom OAuth 2.0 server (not just client)
- Escalate when API security requirements include mutual TLS or certificate pinning
- Escalate when rate limiting needs cross-region coordination`,
    },
  },
];
