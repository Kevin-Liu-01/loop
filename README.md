<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/brand/loop-mark-light.svg" />
    <source media="(prefers-color-scheme: light)" srcset="public/brand/loop-mark.svg" />
    <img src="public/brand/loop-mark.svg" alt="Loop" width="72" height="64" />
  </picture>
</p>

<h1 align="center">Loop</h1>

<p align="center">
  An operator desk for self-updating agent skills, built with Next.js.
</p>

<p align="center">
  <a href="#product-model">Product model</a> · <a href="#architecture">Architecture</a> · <a href="#local-development">Local dev</a> · <a href="#deployment">Deploy</a>
</p>

---

The name "Loop" was inspired by **Aryan Mahajan** — thanks for the spark.

It does four jobs:

1. shows a catalog of skills you can browse, track, import, or write
2. refreshes tracked skills from external sources and saves each refresh as a new version
3. exposes the update run itself with logs, source scans, summaries, and diffs
4. lets you run agents against those skills, attached prompts, and imported MCP servers

## Product model

### Core objects

- **skill** — the main knowledge object. Has a body, description, tags, category, sources, automation settings, updates, and versions. All skills live in Supabase.
- **source** — a URL the refresh pipeline scans. Can be `rss`, `atom`, `docs`, `blog`, `github`, or `watchlist`.
- **update** — one refresh pass over a tracked skill. Stores summary, what changed, experiments, source items, changed sections, editor model, and whether the body changed.
- **version** — every saved skill revision gets a stable URL like `/skills/frontend-frontier/v4`.
- **automation** — a schedule that refreshes a skill on a cadence. Stored as a JSONB column on the skill in Supabase (`skills.automation`).
- **MCP** — an imported server definition that can be attached to agents. `http` and `stdio` MCPs can execute; other transports are treated as metadata.
- **usage event** — a persisted observability record for page views, copies, searches, skill actions, agent runs, and API calls.

### Skill origins

- **repo** — a `SKILL.md` found inside this project (dev only, synced to DB on refresh).
- **codex** — a `SKILL.md` found in `~/.codex/skills` (dev only, synced to DB on refresh).
- **user** — a skill created or tracked inside Loop. This is the primary production origin.
- **remote** — a skill imported from a URL and normalized into Loop's versioned format.

User and remote skills win over repo and Codex skills when slugs overlap. The tracked version should be the one you actually operate.

## Architecture

### Data layer

Loop uses **Supabase (Postgres)** as the single source of truth. There are no local filesystem stores in production.

| Table | What it holds |
|-------|--------------|
| `skills` | All skill data: body, metadata, `sources` JSONB, `automation` JSONB, `updates` JSONB |
| `skill_versions` | Immutable version snapshots |
| `categories` | Category definitions and source configs |
| `mcps` | MCP server definitions |
| `briefs` | Daily category signal briefs |
| `loop_runs` | Refresh run logs and outcomes |
| `usage_events` | Observability telemetry |

Row-level security (RLS) is enabled on all tables. Anonymous access is blocked by default.

### Auth

Loop uses **Clerk** for user authentication. Sign-in/sign-up are managed flows. Billing metadata (Stripe customer ID, Connect account ID) is stored on the Clerk user profile.

### Billing

**Stripe** handles subscription checkout, portal sessions, webhook ingestion, and Connect payouts for skill sellers.

### Automation system

Automations are stored as part of each skill's `automation` JSONB column in Supabase:

```typescript
type SkillAutomationState = {
  enabled: boolean;
  cadence: "daily" | "weekly" | "manual";
  status: "active" | "paused";
  prompt: string;
  lastRunAt?: string;
};
```

The daily cron (`GET /api/refresh`) checks which skills have active automations that are due, fetches signals from their sources, runs an agent to draft a revision, and saves the result as a new version — all against Supabase.

There are no TOML files, no local filesystem paths, and no hardcoded directories in the automation system.

## User journeys

### 1. Find a skill

Route: `/`

The home desk is the shortest path: browse the catalog, filter by category, search by name/tag/category, open a skill, or track it into your editable set.

### 2. Import or create your own

Route: `/skills/new`

You can import a remote skill from a URL or create a new user skill from scratch. Both normalize into the same tracked, versioned data model.

### 3. Set it up and refresh it

Routes: `/skills/[slug]`, `/skills/[slug]/[version]`, `/settings`

Tracked skills expose:

- the prompt and how to use the skill
- tracked sources
- automation settings (editable from calendar, sidebar, and dashboard)
- latest update summary with before/after diff
- version history
- usage and recent calls

Settings pages provide:

- `/settings/automations` — create, edit, pause, and schedule automations with a monthly calendar view
- `/settings/refresh` — trigger manual full refreshes
- `/settings/health` — system-wide usage, API traffic, and route breakdowns
- `/settings/subscription` — manage your Operator plan
- `/settings/connect` — Stripe Connect onboarding for payouts

### 4. Run agents against the catalog

Routes: `/sandbox`, `/agents`

The Sandbox provisions a secure Vercel Sandbox session. You choose a provider/model, attach skills, and chat with the agent. Supports code execution in Node.js and Python runtimes.

## How the refresh engine works

The refresh pipeline is the center of the product.

1. Load tracked skill documents from Supabase
2. Decide which skills are due for refresh (check `automation.enabled`, `cadence`, `lastRunAt`)
3. Fetch signals from each skill's source watchlist
4. Synthesize a revision draft via the configured AI model
5. Rewrite the skill body if sources justify it
6. Save a new version (immutable — never mutates the old one)
7. Persist run logs, summaries, diffs, and source results
8. Record the run outcome

The agent does not "search the entire web." It scans the specific sources attached to each tracked skill. If you want broader coverage, add better sources.

Relevant files:

- `lib/refresh.ts` — the main refresh pipeline
- `lib/source-signals.ts` — signal fetching from sources
- `lib/loop-updates.ts` — update normalization
- `lib/text-diff.ts` — before/after diffing
- `app/api/refresh/route.ts` — cron endpoint

## How skills are created and updated

### Creation paths

| Flow | Endpoint | What happens |
|------|----------|-------------|
| User creates from scratch | `POST /api/skills` | Validates input, inserts into Supabase with `origin: "user"` |
| User tracks a catalog skill | `POST /api/skills/track` | Merges skill + category sources, writes to Supabase |
| Import a remote skill | `POST /api/imports` | Fetches, normalizes, inserts into Supabase |
| Filesystem sync (dev only) | `refreshLoopSnapshot()` | Reads `SKILL.md` files, upserts into Supabase |

### Update paths

| Flow | Trigger | What happens |
|------|---------|-------------|
| Daily cron | `GET /api/refresh` (Vercel cron) | Checks due automations, fetches signals, agent rewrites, saves to Supabase |
| Manual refresh | `POST /api/admin/loops/update` | Same pipeline, triggered on demand |
| Edit automation | `PATCH /api/automations/[slug]` | Updates `skills.automation` JSONB in Supabase |
| Disable automation | `DELETE /api/automations/[slug]` | Sets `automation.enabled = false` in Supabase |
| Create automation | `POST /api/automations` | Sets `skills.automation` JSONB in Supabase |

### Seed data (development only)

The `lib/db/seed-data/` directory contains bootstrap data for development: skill source configs, MCP definitions, and skill definitions. These are applied via CLI scripts (`npx tsx lib/db/seed-automations.ts`) and are **never imported by any production code path**. In production, all data flows through the API → Supabase.

## Observability

Loop stores usage and operational telemetry in Supabase.

What gets recorded: page views, interactions, prompt/URL copies, searches, skill CRUD, automation runs, agent runs, API calls with route/method/status/duration.

Where it shows up:

- `/settings/health` — system-wide usage, route activity, 24h rolling charts
- each skill detail page — per-skill usage
- refresh dashboards — loop run logs, source scans, and diffs

## Environment variables

### Core app

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CRON_SECRET=replace-me
```

### Auth (Clerk)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### Database (Supabase)

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### AI and refresh

```bash
OPENAI_API_KEY=
LOOP_MODEL=gpt-5-mini
AI_GATEWAY_API_KEY=
OPENROUTER_API_KEY=
GROQ_API_KEY=
TOGETHER_API_KEY=
```

### Billing (Stripe)

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_OPERATOR=
```

## Local development

```bash
pnpm install
pnpm dev
```

Useful commands:

```bash
pnpm test          # run tests
pnpm typecheck     # TypeScript check
pnpm build         # production build
```

### Seed data (optional, for bootstrapping)

```bash
npx tsx lib/db/seed-automations.ts   # apply sources + automation config to skills
npx tsx lib/db/seed-skills.ts        # seed skill definitions
npx tsx lib/db/seed-mcps.ts          # seed MCP server definitions
```

These scripts are idempotent and safe to re-run.

## API surface

### Main routes

- `/` — catalog desk
- `/skills/new` — import or create
- `/skills/[slug]` — redirect to latest version
- `/skills/[slug]/[version]` — versioned skill detail
- `/sandbox` — agent sandbox
- `/settings` — automations, refresh, health, subscription, connect

### Main APIs

- `GET  /api/search` — catalog search
- `POST /api/skills` — create a user skill
- `POST /api/skills/track` — track a catalog skill
- `POST /api/imports` — import a remote skill or MCP
- `GET  /api/refresh` — cron-triggered refresh
- `POST /api/admin/loops/update` — manual skill refresh
- `GET  /api/automations` — list automations (derived from skills)
- `POST /api/automations` — create an automation on a skill
- `PATCH /api/automations/[slug]` — update automation config
- `DELETE /api/automations/[slug]` — disable an automation
- `POST /api/agents/run` — run an agent with attached skills
- `POST /api/chat` — sandbox chat
- `POST /api/usage` — record usage events
- `GET  /api/models` — list available AI models
- `POST /api/billing/checkout` — Stripe checkout session
- `POST /api/billing/portal` — Stripe customer portal
- `POST /api/stripe/webhook` — Stripe webhook handler

## Deployment

This app is designed for Vercel but runs locally without Vercel services.

For a production deploy:

1. Set `NEXT_PUBLIC_SITE_URL` to your production domain
2. Set `CRON_SECRET` for the daily refresh cron
3. Configure Supabase env vars (URL, anon key, service role key)
4. Configure Clerk env vars (publishable key, secret key)
5. Configure AI keys for refresh and agent runs
6. Configure Stripe keys if billing is enabled
7. The cron schedule is in `vercel.json`

## Testing

Tests cover:

- automation cadence mappings, schedule formatting, and calendar scheduling
- seed data validation (minimum 4 sources per skill, actionable prompts)
- admin session helpers
- remote import parsing
- loop update normalization
- user skill versioning and updates
- settings navigation
- usage overview computations

Run all tests:

```bash
pnpm test
```

## Brand and OpenGraph

### Logos

| File | Variant |
|------|---------|
| `public/brand/loop-mark.svg` | Gear mark — dark chip (for light backgrounds) |
| `public/brand/loop-mark-light.svg` | Gear mark — light chip (for dark backgrounds) |
| `public/brand/loop-icon-accent.svg` | App icon — accent orange background with white gear |
| `app/icon.svg` | Favicon — dark background with white gear |

The mark is a golden-ratio gear with a detachable chip. The animated React version lives in `components/loop-logo.tsx` (spinning gear + floating chip on hover), with path data in `lib/loop-logo-paths.ts`.

### OpenGraph images

OG images are generated dynamically at `/og` via `next/og` (`app/og/route.tsx`). The route accepts optional `title`, `description`, and `category` query params. When none are provided it renders the default card.

The card uses:

- warm dark gradient background with radial orange glow
- the gear icon as a header lockup
- `Neue Montreal` (Book + Bold) loaded from local TTF files in `app/og/`
- a product screenshot from `/images/og.png` bleeding off the right edge

SEO metadata helpers (titles, descriptions, OG images, JSON-LD) are centralized in `lib/seo.ts`.

## Short version

Loop scans skills, lets you track or import them, refreshes them from watched sources, saves every refresh as a versioned revision, records the run, and exposes the whole thing in one operational UI — backed entirely by Supabase.
