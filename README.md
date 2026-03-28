# Loop

Loop is a Next.js operator desk for self-updating agent skills.

It does four jobs:

1. shows a catalog of skills you can browse, track, import, or write
2. refreshes tracked skills from external sources and saves each refresh as a new version
3. exposes the update run itself with logs, source scans, summaries, and diffs
4. lets you run agents against those skills, attached prompts, and imported MCP servers

Internally the package name is still `skillwire`. The product name and UI are `Loop`.

## Product model

### Core objects

- `loop` / `skill`
  - The main knowledge object.
  - Has a body, description, tags, category, sources, automation settings, updates, and versions.
- `source`
  - A URL the refresh pipeline scans.
  - Can be `rss`, `atom`, `docs`, `blog`, `github`, or `watchlist`.
- `update`
  - One refresh pass over a tracked skill.
  - Stores summary, what changed, experiments, source items, changed sections, editor model, and whether the body changed.
- `version`
  - Every saved skill revision gets a stable URL like `/skills/frontend-frontier/v4`.
- `automation`
  - A Codex automation or Loop-managed schedule used to refresh a skill on a cadence.
- `MCP`
  - An imported server definition that can be attached to agents. `http` and `stdio` MCPs can execute; other transports are treated as metadata.
- `usage event`
  - A persisted observability record for page views, copies, searches, skill actions, agent runs, and API calls.

### Skill origins

- `repo`
  - A `SKILL.md` found inside this project.
- `codex`
  - A `SKILL.md` found in `~/.codex/skills`.
- `user`
  - A skill created or tracked inside Loop.
- `remote`
  - A skill imported from a URL and normalized into Loop’s versioned format.

User and remote skills win over repo and Codex skills when slugs overlap. That is deliberate. The tracked version should be the one you actually operate.

## User journeys

### 1. Find a skill

Route: `/`

The home desk is intentionally the shortest path:

- browse the catalog
- filter by category
- search by name, tag, or category
- open a tracked skill directly
- track a catalog skill into your editable set

The search UI is backed by a persisted search index. Blank search shows the full skill catalog. Typed search hits only skill documents.

Relevant files:

- [app/page.tsx](/Users/kevinliu/Downloads/Dedalus/app/page.tsx)
- [components/desk-home-shell.tsx](/Users/kevinliu/Downloads/Dedalus/components/desk-home-shell.tsx)
- [components/skills-explorer.tsx](/Users/kevinliu/Downloads/Dedalus/components/skills-explorer.tsx)
- [app/api/search/route.ts](/Users/kevinliu/Downloads/Dedalus/app/api/search/route.ts)
- [lib/search.ts](/Users/kevinliu/Downloads/Dedalus/lib/search.ts)

### 2. Import or create your own

Route: `/skills/new`

You can either:

- import a remote skill from a URL
- create a new user skill from scratch

Both paths normalize into the same tracked, versioned data model so the app treats them the same after creation.

Relevant files:

- [app/skills/new/page.tsx](/Users/kevinliu/Downloads/Dedalus/app/skills/new/page.tsx)
- [components/import-skill-form.tsx](/Users/kevinliu/Downloads/Dedalus/components/import-skill-form.tsx)
- [components/user-skill-form.tsx](/Users/kevinliu/Downloads/Dedalus/components/user-skill-form.tsx)
- [app/api/imports/route.ts](/Users/kevinliu/Downloads/Dedalus/app/api/imports/route.ts)
- [app/api/skills/route.ts](/Users/kevinliu/Downloads/Dedalus/app/api/skills/route.ts)
- [lib/imports.ts](/Users/kevinliu/Downloads/Dedalus/lib/imports.ts)
- [lib/user-skills.ts](/Users/kevinliu/Downloads/Dedalus/lib/user-skills.ts)

### 3. Set it up and refresh it

Routes:

- `/skills/[slug]`
- `/skills/[slug]/[version]`
- `/admin`

Tracked skills expose:

- the prompt / how to use the skill
- tracked sources
- automation settings
- latest update summary
- logs from the latest run
- before/after diff
- version history
- usage and recent calls

The admin desk is the operational view:

- claim an admin session
- track repo or Codex skills into editable skills
- run manual refreshes
- watch source logs stream in
- inspect stored run history
- create and manage automations
- review system-wide observability

Relevant files:

- [components/skill-detail-page.tsx](/Users/kevinliu/Downloads/Dedalus/components/skill-detail-page.tsx)
- [components/skill-setup-form.tsx](/Users/kevinliu/Downloads/Dedalus/components/skill-setup-form.tsx)
- [app/admin/page.tsx](/Users/kevinliu/Downloads/Dedalus/app/admin/page.tsx)
- [components/loop-update-dashboard.tsx](/Users/kevinliu/Downloads/Dedalus/components/loop-update-dashboard.tsx)
- [components/automation-manager.tsx](/Users/kevinliu/Downloads/Dedalus/components/automation-manager.tsx)
- [components/observability-panels.tsx](/Users/kevinliu/Downloads/Dedalus/components/observability-panels.tsx)

### 4. Run agents against the catalog

Route: `/agents`

Agent Studio lets you:

- choose a provider and model
- attach selected skills
- attach imported MCP servers
- run against AI Gateway, OpenAI, or OpenAI-compatible endpoints

Relevant files:

- [app/agents/page.tsx](/Users/kevinliu/Downloads/Dedalus/app/agents/page.tsx)
- [components/agent-studio.tsx](/Users/kevinliu/Downloads/Dedalus/components/agent-studio.tsx)
- [app/api/agents/run/route.ts](/Users/kevinliu/Downloads/Dedalus/app/api/agents/run/route.ts)
- [lib/agents.ts](/Users/kevinliu/Downloads/Dedalus/lib/agents.ts)
- [lib/mcp-runtime.ts](/Users/kevinliu/Downloads/Dedalus/lib/mcp-runtime.ts)

## How the refresh engine works

The refresh pipeline is the center of the product.

High-level flow:

1. load the current snapshot and tracked skill documents
2. decide which skills are due for refresh
3. fetch signals from each skill’s watchlist
4. synthesize a revision draft
5. rewrite the skill body if the sources justify it
6. save a new version instead of mutating the old one
7. persist run logs, summaries, diffs, and source results
8. rebuild the snapshot and search index

There are two output modes:

- local JSON stores in `content/generated/*`
- Vercel Blob persistence when `BLOB_READ_WRITE_TOKEN` is configured

Important nuance:

The agent does not “search the entire web” by magic. It scans the sources attached to each tracked skill. If you want broader coverage, add better sources.

Relevant files:

- [lib/refresh.ts](/Users/kevinliu/Downloads/Dedalus/lib/refresh.ts)
- [lib/source-signals.ts](/Users/kevinliu/Downloads/Dedalus/lib/source-signals.ts)
- [lib/loop-updates.ts](/Users/kevinliu/Downloads/Dedalus/lib/loop-updates.ts)
- [lib/text-diff.ts](/Users/kevinliu/Downloads/Dedalus/lib/text-diff.ts)
- [lib/update-digest.ts](/Users/kevinliu/Downloads/Dedalus/lib/update-digest.ts)
- [app/api/refresh/route.ts](/Users/kevinliu/Downloads/Dedalus/app/api/refresh/route.ts)
- [app/api/admin/loops/update/route.ts](/Users/kevinliu/Downloads/Dedalus/app/api/admin/loops/update/route.ts)

## Data and persistence

Loop is file-backed by default and Blob-backed when configured.

### Generated local files

These are runtime stores, not source-of-truth docs:

- `content/generated/skillwire-snapshot.local.json`
- `content/generated/skillwire-search.local.json`
- `content/generated/skillwire-system.local.json`
- `content/generated/skillwire-user-skills.local.json`

### What each store contains

- snapshot
  - the assembled app view: categories, skills, MCPs, automations, daily briefs
- search index
  - tokenized search corpus for fast catalog search
- system state
  - refresh runs, loop runs, billing events, subscriptions, usage events
- user skills
  - user-authored and tracked skills with version history

### Where source content comes from

- repo `SKILL.md` files
- `~/.codex/skills`
- `~/.codex/automations`
- imported remote skills
- imported MCP manifests
- tracked source URLs per user skill

Relevant files:

- [lib/content.ts](/Users/kevinliu/Downloads/Dedalus/lib/content.ts)
- [lib/system-state.ts](/Users/kevinliu/Downloads/Dedalus/lib/system-state.ts)
- [lib/user-skills.ts](/Users/kevinliu/Downloads/Dedalus/lib/user-skills.ts)
- [lib/imports.ts](/Users/kevinliu/Downloads/Dedalus/lib/imports.ts)

## Observability

Loop stores usage and operational telemetry because otherwise “self-updating” turns into folklore.

What gets recorded:

- page views
- prompt and URL copies
- searches
- skill creation, import, tracking, saving, refresh
- automation creation
- agent runs
- API calls with route, method, status, duration, and success/failure
- refresh runs and per-loop run logs
- Stripe webhook-derived billing events

Where it shows up:

- `/admin` for system-wide usage and route activity
- each skill detail page for per-skill usage
- refresh dashboards for loop run logs, source scans, and diffs

Relevant files:

- [lib/usage.ts](/Users/kevinliu/Downloads/Dedalus/lib/usage.ts)
- [lib/usage-server.ts](/Users/kevinliu/Downloads/Dedalus/lib/usage-server.ts)
- [components/usage-beacon.tsx](/Users/kevinliu/Downloads/Dedalus/components/usage-beacon.tsx)
- [app/api/usage/route.ts](/Users/kevinliu/Downloads/Dedalus/app/api/usage/route.ts)
- [components/observability-panels.tsx](/Users/kevinliu/Downloads/Dedalus/components/observability-panels.tsx)

## Auth and admin

There is currently a lightweight operator session model, not a full user auth product.

- admin access is based on an allowlisted email
- the session token is signed server-side
- the admin UI can trigger manual refreshes

Relevant files:

- [lib/admin.ts](/Users/kevinliu/Downloads/Dedalus/lib/admin.ts)
- [app/api/admin/session/route.ts](/Users/kevinliu/Downloads/Dedalus/app/api/admin/session/route.ts)
- [components/admin-update-controls.tsx](/Users/kevinliu/Downloads/Dedalus/components/admin-update-controls.tsx)

If you want real production auth next, use Auth.js or Clerk and bind operator rights to verified accounts.

## Billing

Stripe is wired for subscription checkout, portal sessions, and webhook ingestion.

Relevant files:

- [lib/stripe.ts](/Users/kevinliu/Downloads/Dedalus/lib/stripe.ts)
- [app/api/billing/checkout/route.ts](/Users/kevinliu/Downloads/Dedalus/app/api/billing/checkout/route.ts)
- [app/api/billing/portal/route.ts](/Users/kevinliu/Downloads/Dedalus/app/api/billing/portal/route.ts)
- [app/api/stripe/webhook/route.ts](/Users/kevinliu/Downloads/Dedalus/app/api/stripe/webhook/route.ts)

## Environment variables

### Core app

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CRON_SECRET=replace-me
ADMIN_EMAILS=kk23907751@gmail.com
ADMIN_SESSION_SECRET=replace-me
```

### AI and refresh

```bash
OPENAI_API_KEY=
SKILLWIRE_MODEL=gpt-5-mini
AI_GATEWAY_API_KEY=
OPENROUTER_API_KEY=
GROQ_API_KEY=
TOGETHER_API_KEY=
```

### Persistence

```bash
BLOB_READ_WRITE_TOKEN=
```

### Billing

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_OPERATOR=
```

## Local development

```bash
pnpm install
pnpm content:build
pnpm dev
```

Useful commands:

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm content:refresh
```

`pnpm dev` runs a pre-clean step to wipe stale `.next` artifacts before booting. This exists because webpack occasionally decides to become a cryptid.

## API surface

### Main routes

- `/` catalog desk
- `/skills/new` import or create
- `/skills/[slug]` redirect to latest version
- `/skills/[slug]/[version]` versioned skill detail
- `/admin` updates, automations, observability
- `/agents` agent studio

### Main APIs

- `GET /api/search`
- `POST /api/skills`
- `POST /api/skills/track`
- `POST /api/imports`
- `POST /api/refresh`
- `POST /api/admin/loops/update`
- `POST /api/automations`
- `POST /api/agents/run`
- `POST /api/chat`
- `POST /api/usage`
- `GET /api/models`
- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- `POST /api/stripe/webhook`

## Deployment notes

This app is designed for Vercel, but it runs locally without Vercel services.

For a real deploy:

1. set `NEXT_PUBLIC_SITE_URL`
2. set `CRON_SECRET`
3. configure `BLOB_READ_WRITE_TOKEN` if you want shared persistence
4. configure AI keys for refresh and agent runs
5. configure Stripe keys if billing is enabled
6. keep the cron entry in [vercel.json](/Users/kevinliu/Downloads/Dedalus/vercel.json)

## Testing

Current tests cover:

- admin session helpers
- automation serialization
- remote import parsing
- loop update normalization
- search index behavior
- user skill versioning and updates

Files:

- [test/admin.test.ts](/Users/kevinliu/Downloads/Dedalus/test/admin.test.ts)
- [test/automations.test.ts](/Users/kevinliu/Downloads/Dedalus/test/automations.test.ts)
- [test/imports.test.ts](/Users/kevinliu/Downloads/Dedalus/test/imports.test.ts)
- [test/loop-updates.test.ts](/Users/kevinliu/Downloads/Dedalus/test/loop-updates.test.ts)
- [test/search.test.ts](/Users/kevinliu/Downloads/Dedalus/test/search.test.ts)
- [test/user-skills.test.ts](/Users/kevinliu/Downloads/Dedalus/test/user-skills.test.ts)

## Short version

If you want the whole mental model in one sentence:

Loop scans skills, lets you track or import them, refreshes them from watched sources, saves every refresh as a versioned revision, records the run, and exposes the whole thing in one operational UI.
