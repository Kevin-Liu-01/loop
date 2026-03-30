export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqSection = {
  id: string;
  title: string;
  items: FaqItem[];
};

export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: "general",
    title: "General",
    items: [
      {
        question: "What is Loop?",
        answer:
          "Loop is an operator desk for self-updating agent skills. It lets you browse, track, import, and author versioned skill playbooks — then keeps them current by scanning the sources they depend on and proposing targeted updates.",
      },
      {
        question: "Why does Loop exist?",
        answer:
          "Agent skills go stale. Docs change, APIs ship new versions, repos refactor. Without tooling, \"self-updating\" is guesswork. Loop exists to close that gap: it monitors sources, refreshes skills into new versions, and records every run so you can see exactly what changed and why.",
      },
      {
        question: "Who is Loop for?",
        answer:
          "Anyone who operates AI agents and wants their skill playbooks to stay accurate over time — prompt engineers, AI-ops teams, developer-tool authors, and agent builders who publish reusable skills.",
      },
      {
        question: "What problem does Loop solve?",
        answer:
          "Skills are only as good as the information they encode. When upstream documentation, libraries, or APIs change, skills silently become wrong. Loop continuously monitors your tracked sources, proposes diffs, and gates updates behind evals so skills evolve instead of rot.",
      },
      {
        question: "Is Loop open source?",
        answer:
          "Loop's codebase is a Next.js application. Check the repo and license file for current availability and contribution guidelines.",
      },
    ],
  },
  {
    id: "skills",
    title: "Skills",
    items: [
      {
        question: "What is a skill?",
        answer:
          "A skill is the main knowledge object in Loop: a versioned playbook with a body, description, tags, category, tracked sources, automation settings, and a complete version history. Skills can come from your repo, the Codex directory, a remote URL, or be written from scratch.",
      },
      {
        question: "Where do skills come from?",
        answer:
          "Skills have four origins. Repo skills are SKILL.md files found inside your project. Codex skills are SKILL.md files in ~/.codex/skills. User skills are created or tracked inside Loop. Remote skills are imported from a URL and normalized into Loop's versioned format.",
      },
      {
        question: "Can I create my own skills?",
        answer:
          "Yes. You can create a new skill from scratch or import one from a remote URL. Both paths normalize into the same tracked, versioned data model so the app treats them identically after creation. Creating and publishing skills requires the Operator plan.",
      },
      {
        question: "What happens when I track a skill?",
        answer:
          "Tracking a catalog skill copies it into your editable set. From there you can attach sources, configure automations, edit the body, and receive refresh updates. The tracked version takes priority over the original when slugs overlap — that's by design.",
      },
      {
        question: "What is a skill version?",
        answer:
          "Every saved revision of a skill creates a new version with a stable URL like /skills/frontend-frontier/v4. Loop never mutates an existing version; it always appends. This gives you a complete audit trail and the ability to diff any two revisions.",
      },
      {
        question: "Can I sell skills on Loop?",
        answer:
          "Yes. Operator subscribers can set marketplace pricing on their skills. Revenue is routed to your bank account through Stripe Connect. You'll need to complete Connect onboarding (identity, bank details, compliance) before payouts start flowing.",
      },
      {
        question: "What is the skill catalog?",
        answer:
          "The catalog is the home view of Loop — a browsable, searchable collection of all available skills. You can filter by category, search by name or tag, open skill detail pages, and track skills into your editable set from here.",
      },
    ],
  },
  {
    id: "refresh",
    title: "Refresh engine",
    items: [
      {
        question: "How does the refresh engine work?",
        answer:
          "The refresh pipeline loads tracked skills from Supabase, decides which are due for a refresh based on their automation config (cadence, lastRunAt), fetches signals from each skill's source watchlist, synthesizes a revision draft via the configured AI model, rewrites the skill body if sources justify it, saves a new version, and persists run logs and diffs — all to Supabase.",
      },
      {
        question: "What are sources?",
        answer:
          "Sources are URLs the refresh pipeline scans. They can be RSS feeds, Atom feeds, documentation pages, blog posts, GitHub repos, or custom watchlist entries. Each tracked skill can have multiple sources that Loop monitors for upstream changes.",
      },
      {
        question: "How often are skills refreshed?",
        answer:
          "That depends on your configuration. You can trigger a manual refresh any time from Settings → Refresh. Automated refreshes run on a daily cron by default. Individual skills can also have automations with custom RRULE cadences — hourly, daily, weekly, or any recurrence pattern you define.",
      },
      {
        question: "Does Loop search the entire internet for updates?",
        answer:
          "No. Loop scans the specific sources attached to each tracked skill. It does not crawl the web broadly. If you want broader coverage, add more or better sources to the skill's watchlist.",
      },
      {
        question: "What is a \"full refresh\"?",
        answer:
          "A full refresh rebuilds the entire Loop snapshot: skills, briefs, and all derived content. It re-reads configured sources and regenerates artifacts. It's safe to run repeatedly — the last run wins. Use it after imports, registry changes, or when the catalog looks stale.",
      },
      {
        question: "What is the difference between a manual refresh and an automation?",
        answer:
          "A manual refresh (Settings → Refresh) rebuilds the shared snapshot content layer immediately. Automations execute agent runs on their own cadence against specific skills. Manual refresh doesn't pause or reschedule automations — they operate independently.",
      },
    ],
  },
  {
    id: "automations",
    title: "Automations",
    items: [
      {
        question: "What are automations?",
        answer:
          "Automations run an agent on a schedule against a selected skill. Each skill's automation config — prompt, cadence, and status — is stored directly on the skill in Supabase. Loop's daily cron checks which skills are due, fetches signals from their sources, and runs the agent to draft a revision.",
      },
      {
        question: "How do automation schedules work?",
        answer:
          "You pick a cadence (daily, weekly, or manual) when configuring a skill's automation. Loop converts this to an RRULE schedule internally. The monthly calendar on the Automations settings page shows projected run dates. Times follow the server's timezone, so confirm your deployment TZ if something fires at an unexpected hour.",
      },
      {
        question: "Where are automations stored?",
        answer:
          "Automations are stored as a JSONB column on the skill in Supabase — not in local files. This means they work identically in local development and on production. The automation config includes enabled state, cadence, status, prompt, and last run timestamp.",
      },
      {
        question: "Can I edit automations from different places?",
        answer:
          "Yes. You can edit an automation from the Settings → Automations page, from the calendar day modal, from the skill detail sidebar, and from the activity dashboard. All surfaces open the same edit modal and save to the same Supabase column.",
      },
      {
        question: "Can I pause an automation?",
        answer:
          "Yes. Paused automations keep their configuration but won't dispatch. Use pause when iterating on prompts or when an external API quota is tight. Disabling an automation sets enabled to false — you can re-enable it any time without losing your configuration.",
      },
      {
        question: "Do automations require a paid plan?",
        answer:
          "Yes. Creating or editing automations requires the Operator plan ($19/mo). This keeps scheduled compute and storage tied to a paid workspace and reduces abuse of long-running agent jobs.",
      },
      {
        question: "Can I change a skill's body without recreating the automation?",
        answer:
          "Yes. Each automation is part of its skill. Changing the skill's body, sources, or agent prompt affects the next run automatically — no need to recreate the automation unless you want a different schedule entirely.",
      },
    ],
  },
  {
    id: "mcp",
    title: "MCP integration",
    items: [
      {
        question: "What is MCP?",
        answer:
          "MCP (Model Context Protocol) is an open standard for connecting AI agents to external tools and services. An MCP server exposes a set of tools — file operations, API calls, search, database queries — that any compatible client can discover and invoke at runtime.",
      },
      {
        question: "How does Loop integrate with MCP?",
        answer:
          "Loop can import MCP server definitions from any URL that serves a JSON manifest with an mcpServers object. Imported servers are persisted, versioned, and cataloged alongside your skills. When attached to an agent run, Loop's runtime connects to the server, lists available tools, and makes them callable by the AI model.",
      },
      {
        question: "Which MCP transports does Loop support?",
        answer:
          "Loop supports stdio and HTTP transports for runtime execution. Stdio servers are spawned as child processes; HTTP servers receive JSON-RPC calls over the network. Other transports (SSE, WebSocket) are stored as metadata but cannot be executed yet.",
      },
      {
        question: "What MCP servers ship with Loop?",
        answer:
          "Loop's seed catalog includes 35+ servers across developer platforms (GitHub, Vercel, Cloudflare), databases (Supabase, Neon, Prisma), productivity (Slack, Notion, Linear), search (Brave, Exa, Firecrawl), browser automation (Playwright, Puppeteer), payments (Stripe), design (Figma), and more. You can also import any server from a URL.",
      },
      {
        question: "Can I attach MCP servers to agent runs?",
        answer:
          "Yes. When starting an agent run, you select which MCP servers to attach. Loop's runtime initializes each server, discovers its tools, and injects them into the model's tool catalog. The agent can then call tools across multiple servers in a single conversation.",
      },
    ],
  },
  {
    id: "sandbox",
    title: "Sandbox",
    items: [
      {
        question: "What is the Sandbox?",
        answer:
          "The Sandbox is an isolated agent chat environment. It provisions a Vercel Sandbox session (a secure, ephemeral runtime) and connects it to your chosen AI provider and model. You can attach skills from your catalog and run them in a safe, contained environment.",
      },
      {
        question: "What can I do in the Sandbox?",
        answer:
          "You can choose an AI provider and model, attach skills from the catalog, and have a full conversation with the agent. The Sandbox supports code execution in Node.js and Python runtimes, letting you test skills interactively before deploying automations.",
      },
      {
        question: "What AI providers are supported?",
        answer:
          "Loop supports OpenAI, Vercel AI Gateway, OpenRouter, Groq, and Together AI. You can configure provider API keys through environment variables and select your preferred provider and model from the Sandbox sidebar.",
      },
      {
        question: "Is the Sandbox safe to run untrusted code in?",
        answer:
          "Yes. Sandbox sessions run inside Vercel's Firecracker microVMs — ephemeral, isolated environments that are destroyed after use. They're designed for running AI-generated and user-generated code safely.",
      },
    ],
  },
  {
    id: "billing",
    title: "Billing & pricing",
    items: [
      {
        question: "How much does Loop cost?",
        answer:
          "Loop has two tiers. Free Signal ($0) lets you browse the catalog and explore skills. Operator ($19/mo) unlocks creating and publishing skills, attaching automations, setting marketplace pricing, the full operator workflow, and receiving payouts via Stripe Connect.",
      },
      {
        question: "What's included in the free tier?",
        answer:
          "Free Signal gives you access to the full skill catalog, search, skill detail views, and the Sandbox for testing. Authoring, automations, marketplace pricing, and payouts are gated behind the Operator plan.",
      },
      {
        question: "What does the Operator plan include?",
        answer:
          "Operator ($19/mo) unlocks five key capabilities: create and publish skills, attach automations to skills, set marketplace pricing, access the full operator workflow, and receive payouts via Stripe Connect.",
      },
      {
        question: "How do I upgrade to Operator?",
        answer:
          "Go to Settings → Subscription and click \"Upgrade to Operator.\" You'll be taken to a Stripe Checkout page. After payment, the subscription is attached to your account and features unlock immediately.",
      },
      {
        question: "How do I cancel my subscription?",
        answer:
          "Open Settings → Subscription and click \"Manage billing\" to open the Stripe customer portal. From there you can cancel at the end of your current billing period, update payment methods, or download invoices.",
      },
      {
        question: "How do payouts work for skill sellers?",
        answer:
          "Payouts use Stripe Connect (Express accounts). You must have an active Operator subscription before onboarding. Stripe handles identity verification, bank details, and compliance. Payout speed and holds are controlled by Stripe and your bank country — Loop doesn't hold funds beyond what Stripe's Connect rules require.",
      },
      {
        question: "Why is Connect separate from my subscription?",
        answer:
          "Subscriptions (Operator) pay Loop for product access. Connect is how you receive payouts from buyers. They serve different purposes. You need an active Operator subscription before Connect onboarding is available, so we know the workspace is paid and in good standing.",
      },
    ],
  },
  {
    id: "observability",
    title: "Observability & system health",
    items: [
      {
        question: "What usage data does Loop track?",
        answer:
          "Loop records page views, interactions, prompt and URL copies, searches, skill creation and import events, automation runs, and API calls with route, method, status, duration, and success/failure. This data powers the usage dashboards and system health views.",
      },
      {
        question: "Where can I see system health?",
        answer:
          "Go to Settings → System health. You'll see rolling 24-hour totals for views, interactions, API traffic, and average API latency, along with time-series charts, route-level breakdowns, and recent events.",
      },
      {
        question: "Is usage data used for billing?",
        answer:
          "No. The health view is designed for spotting spikes, regressions, or noisy endpoints. It is not billing-grade metering. Billing is handled entirely through Stripe subscriptions.",
      },
      {
        question: "What do the 24-hour rolling windows mean?",
        answer:
          "Rolling 24-hour totals compare \"right now\" vs \"yesterday at the same time.\" They reset continuously, not at calendar midnight. This helps you spot real-time trends without waiting for daily reports.",
      },
      {
        question: "How should I interpret a spike in API calls?",
        answer:
          "A jump in API calls often correlates with automations, sandbox sessions, or refresh jobs running. Cross-check the route list: repeated paths point to the feature to throttle or optimize first.",
      },
      {
        question: "Does Loop surface raw request bodies?",
        answer:
          "No. The health dashboard only shows aggregates and labels safe for operators. If you need deeper traces, use your hosting provider's logs or request an export under your data agreement.",
      },
    ],
  },
  {
    id: "data",
    title: "Data & security",
    items: [
      {
        question: "Where is my data stored?",
        answer:
          "Loop uses Supabase (Postgres) as the single source of truth for all data: skills, automation configs, sources, versions, usage events, and run logs. There are no local filesystem stores in production. Everything is read from and written to Supabase.",
      },
      {
        question: "How is authentication handled?",
        answer:
          "Loop uses Clerk for user authentication. Sign-in and sign-up are handled through Clerk's managed flows. Billing metadata (Stripe customer ID, Connect account ID) is stored on your Clerk user profile.",
      },
      {
        question: "Is my data private?",
        answer:
          "Yes. Row-level security (RLS) is enabled on all database tables. Anonymous access is blocked by default, and the service role bypasses RLS only for server-side operations. Your skills, automations, and usage data are tied to your authenticated account.",
      },
      {
        question: "What happens to my data if I cancel?",
        answer:
          "Canceling the Operator plan stops access to paid features at the end of your billing period. Your skills, versions, and history remain in the database. You can always re-subscribe to regain full access.",
      },
    ],
  },
  {
    id: "technical",
    title: "Technical",
    items: [
      {
        question: "What tech stack does Loop use?",
        answer:
          "Loop is built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4. It uses Clerk for authentication, Supabase (Postgres) for all persistence, Stripe for billing and payouts, Vercel for hosting (Sandbox, Analytics, Speed Insights), and the Vercel AI SDK for agent interactions.",
      },
      {
        question: "Can I self-host Loop?",
        answer:
          "Loop is designed for Vercel but runs locally without Vercel services. For a deploy you need Supabase credentials, Clerk API keys, NEXT_PUBLIC_SITE_URL, CRON_SECRET, AI provider keys for refresh and agent runs, and Stripe keys if billing is enabled.",
      },
      {
        question: "What AI models power the refresh engine?",
        answer:
          "The refresh pipeline uses the model configured in LOOP_MODEL (defaults to a capable OpenAI model). You can also configure OpenRouter, Groq, Together AI, or any OpenAI-compatible endpoint through environment variables.",
      },
      {
        question: "What is the command palette?",
        answer:
          "Press ⌘K (or Ctrl+K) anywhere in the app to open the command palette. It lets you quickly search skills, jump to categories, open the Sandbox, or navigate to Settings without leaving the keyboard.",
      },
      {
        question: "Does Loop support MCP servers?",
        answer:
          "Yes — MCP is a first-class integration. Loop imports, versions, and executes MCP server definitions with full stdio and HTTP transport support. See the MCP integration section above for details on transports, the seed catalog, and agent attachment.",
      },
      {
        question: "What is the daily brief?",
        answer:
          "Daily briefs are generated summaries of skill activity and refresh results. They aggregate what changed across your tracked skills and provide a concise digest of recent updates.",
      },
      {
        question: "Are there any local filesystem dependencies?",
        answer:
          "No. In production, Loop reads and writes exclusively to Supabase. The only filesystem reads are during local development, where SKILL.md files from the repo and ~/.codex/skills are synced to the database on refresh. Automations, sources, skill content, and all configuration live in Supabase.",
      },
    ],
  },
];
