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
          "Loop is an operator desk for self-updating agent skills. It lets you browse, track, fork, import, and author versioned skill playbooks – then keeps them current by scanning the sources they depend on and proposing targeted updates.",
      },
      {
        question: "Why does Loop exist?",
        answer:
          "Agent skills go stale. Docs change, APIs ship new versions, repos refactor. Without tooling, \"self-updating\" is guesswork. Loop exists to close that gap: it monitors sources, refreshes skills into new versions, and records every run so you can see exactly what changed and why.",
      },
      {
        question: "Who is Loop for?",
        answer:
          "Anyone who operates AI agents and wants their skill playbooks to stay accurate over time – prompt engineers, AI-ops teams, developer-tool authors, verified publishers, and agent builders who publish reusable skills. Loop also automatically imports high-signal skills weekly from trusted sources like Anthropic, OpenAI, and Cursor Directory so your catalog stays current.",
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
          "A skill is the main knowledge object in Loop: a versioned playbook with a body, description, tags, category, tracked sources, automation settings, agent docs, research profile, and a complete version history. Skills can come from your repo, the Codex directory, a remote URL, or be written from scratch.",
      },
      {
        question: "Where do skills come from?",
        answer:
          "Skills have four origins. Repo skills are SKILL.md files found inside your project. Codex skills are SKILL.md files in ~/.codex/skills. User skills are created or forked inside Loop. Remote skills are imported from a URL or discovered from trusted providers like Anthropic, OpenAI, and Cursor Directory, then normalized into Loop's versioned format.",
      },
      {
        question: "Can I create my own skills?",
        answer:
          "Yes. Free accounts can create up to 2 skills. Operator subscribers ($19/mo) get unlimited skills. The new-skill modal lets you discover skills from external sources, import from a URL, or create from scratch. All paths normalize into the same tracked, versioned data model.",
      },
      {
        question: "What happens when I fork a skill?",
        answer:
          "Forking a catalog skill creates your own editable copy. From there you can attach sources, configure automations, edit the body, add agent docs, and receive refresh updates. The forked version is private by default. A 'forked from' badge tracks lineage back to the original.",
      },
      {
        question: "What is a skill version?",
        answer:
          "Every saved revision of a skill creates a new version with a stable URL like /skills/frontend-frontier/v4. Loop never mutates an existing version; it always appends. This gives you a complete audit trail and the ability to diff any two revisions.",
      },
      {
        question: "Can I download or share a skill as markdown?",
        answer:
          "Yes. Every skill detail page has a 'Download .md' button that saves the skill body as a markdown file. The 'Copy link' button copies a raw markdown URL (e.g., /api/skills/{slug}/raw) that agents can fetch directly. The 'Copy prompt' button gives you a ready-to-paste instruction for any agent. You can also append ?v=N to the raw URL to pin a specific version.",
      },
      {
        question: "Can I sell skills on Loop?",
        answer:
          "Yes. Operator subscribers can set marketplace pricing on their skills. Revenue is routed to your bank account through Stripe Connect. You'll need to complete Connect onboarding (identity, bank details, compliance) before payouts start flowing.",
      },
      {
        question: "What is the skill catalog?",
        answer:
          "The catalog is the home view of Loop – a browsable, searchable collection of all public skills. Skills are sorted by quality score and featured rank. You can filter by category, search by name or tag, open skill detail pages, and fork skills into your editable set from here.",
      },
      {
        question: "What are public, member, and private skills?",
        answer:
          "Every skill has a visibility setting. Public skills appear in the catalog for everyone, including anonymous visitors. Member skills are visible only to signed-in users. Private skills are visible only to their owner, the attached verified author, and admins. You can toggle between public and private from the skill detail page or the author studio.",
      },
      {
        question: "What are agent docs?",
        answer:
          "Agent docs are platform-specific configuration files attached to a skill – AGENTS.md, cursor.md, claude.md, and codex.md. Each file contains instructions tailored to a specific agent platform. You can add or edit all four from the Author Studio's 'Agent docs' tab. Changes save via the same PATCH endpoint and sync immediately.",
      },
      {
        question: "What are skill icons?",
        answer:
          "Every skill and MCP server can display a brand-aware icon. Loop resolves icons through a priority chain: explicit icon URL on the skill, verified author logo, brand inference from the owner name (using a built-in map of 70+ brand logos), and finally a Lucide icon fallback based on category. You can override the icon from the author studio.",
      },
      {
        question: "What is the research engine?",
        answer:
          "Some skills have a research profile that documents how they were discovered, validated, and ranked. The research panel on a skill's detail page shows the discovery process, search queries used, trust signals, upstream source links, and the reason a skill was featured – giving you full provenance for catalog content.",
      },
    ],
  },
  {
    id: "authors",
    title: "Authors & publishers",
    items: [
      {
        question: "What is a verified author?",
        answer:
          "A verified author is a publisher with a confirmed identity in Loop's skill_authors system. Verified authors display a checkmark badge on every skill they publish. The badge label varies – 'Official' for first-party providers like Anthropic and OpenAI, and 'Verified' for trusted community sources like Cursor Directory.",
      },
      {
        question: "Which providers are verified?",
        answer:
          "Loop ships with five verified provider authors. Anthropic and OpenAI are marked as Official (first-party providers). Cursor Directory, Awesome Agent Skills, and Awesome MCP Servers are marked as Verified (trusted community sources). Skills imported from any of these sources automatically receive verified author attribution.",
      },
      {
        question: "How does author verification work for imported skills?",
        answer:
          "When a skill is imported from a known provider – whether through the weekly import cron, the admin bulk import, or a manual URL paste – Loop automatically matches the source URL to a registered provider and links the skill to that provider's verified author record. This means the verified badge and correct logo appear immediately without any manual step.",
      },
      {
        question: "Can I become a verified author?",
        answer:
          "Verified author records are currently managed at the platform level. If you publish skills under a consistent identity and want a verified badge, reach out to the Loop team. Your Clerk account can be linked to an author record, which gives you edit permissions on all skills tied to your profile.",
      },
      {
        question: "What is the Author Studio?",
        answer:
          "The Author Studio is the editing interface for skills you own. It lets you edit the skill body, description, tags, category, icon, attribution line (owner name), agent docs, sources, and automation settings. When a verified author is attached, the studio shows their badge in the preview. The attribution line is a fallback displayed when no verified author profile is linked.",
      },
    ],
  },
  {
    id: "automations",
    title: "Automations & updates",
    items: [
      {
        question: "What are automations?",
        answer:
          "Automations run an agent on a schedule against a selected skill. Each skill's automation config – prompt, cadence, model, and status – is stored directly on the skill in Supabase. Loop's cron checks which skills are due, fetches signals from their sources, and runs the agent to draft a revision.",
      },
      {
        question: "How do I manually trigger an update?",
        answer:
          "On the skill detail page, click 'Run automation now' in the update panel. This triggers the same agent pipeline as a scheduled automation but records the run as a manual trigger. Manual runs update the lastRunAt timestamp, which affects when the next scheduled automation fires.",
      },
      {
        question: "Is there a cooldown on manual updates?",
        answer:
          "Yes. Manual updates have a 15-minute cooldown to prevent excessive API usage. If you trigger a manual run within 1 hour of a scheduled automation, Loop warns you that the scheduled run will be skipped to avoid duplicate work.",
      },
      {
        question: "How do automation schedules work?",
        answer:
          "You pick a cadence (daily, weekly, or manual) when configuring a skill's automation. Loop converts this to an RRULE schedule internally. The automation calendar on the settings page shows projected run dates with color-coded dots for each skill, and clicking a day opens a modal listing all automations scheduled for that date.",
      },
      {
        question: "Can Operator subscribers choose the AI model?",
        answer:
          "Yes. Operator subscribers can select a preferred model (GPT-4o, GPT-4o Mini, Claude Sonnet 4, Claude Haiku 3.5) for each automation. Free accounts use the default model. The model dropdown is in the automation edit modal.",
      },
      {
        question: "Where are automations stored?",
        answer:
          "Automations are stored as a JSONB column on the skill in Supabase – not in local files. The config includes enabled state, cadence, status, prompt, preferred model, and last run timestamp.",
      },
      {
        question: "Can I edit automations from different places?",
        answer:
          "Yes. You can edit an automation from Settings > Automations, from the calendar day modal, from the skill detail sidebar, from the activity dashboard, and from the skill's meta bar. All surfaces open the same edit modal and save to the same Supabase column.",
      },
      {
        question: "Can I pause an automation?",
        answer:
          "Yes. Paused automations keep their configuration but won't dispatch. Use pause when iterating on prompts or when an external API quota is tight. Disabling an automation sets enabled to false – you can re-enable it any time without losing your configuration.",
      },
      {
        question: "Do automations require a paid plan?",
        answer:
          "Yes. Creating or editing automations requires the Operator plan ($19/mo). This keeps scheduled compute and storage tied to a paid workspace and reduces abuse of long-running agent jobs.",
      },
    ],
  },
  {
    id: "imports",
    title: "Imports & sources",
    items: [
      {
        question: "What are weekly imports?",
        answer:
          "Every Monday at 09:00 UTC, Loop's import cron scans all registered skill sources, discovers new skills, and imports them into the catalog with proper attribution, verified author linkage, icons, and agent docs. Skills from known providers automatically receive their verified author badge.",
      },
      {
        question: "Which sources does Loop import from?",
        answer:
          "Loop imports from five built-in sources. Anthropic Skills and OpenAI Skills are official, canonical repos – Loop imports skill files directly from their maintained directories. Cursor Directory is a community-curated collection of Cursor rules imported as canonical files. Awesome Agent Skills and Awesome MCP Servers are lead-list sources – Loop parses their README links to discover candidate repos with SKILL.md files. Each source has a trust tier (official or community) that is tagged on imported skills.",
      },
      {
        question: "What is the difference between canonical and lead-list sources?",
        answer:
          "Canonical sources (like Anthropic Skills, OpenAI Skills, and Cursor Directory) have a structured skills directory that Loop reads directly. Lead-list sources (like Awesome Agent Skills and Awesome MCP Servers) are curated README files – Loop parses the GitHub links, checks each linked repo for a SKILL.md, and imports those that have one. Canonical imports are more reliable; lead-list imports cast a wider net.",
      },
      {
        question: "Can I import a skill from any URL?",
        answer:
          "Yes. Paste any markdown or README URL into the import form at Settings > Imports (or the 'Import' tab in the new-skill modal). Loop fetches the content, parses frontmatter and markdown, infers the title, category, and tags, and creates a versioned skill. If the URL matches a known provider (e.g., a GitHub repo under anthropics/ or openai/), the skill is automatically linked to that provider's verified author.",
      },
      {
        question: "Can I add custom import sources?",
        answer:
          "Operator subscribers can register additional GitHub repositories as import sources from Settings > Imports. Specify the org, repo, branch, and skills path, and Loop will include it in the weekly scan. Custom sources default to the community trust tier.",
      },
      {
        question: "Where can I see import settings?",
        answer:
          "Go to Settings > Imports to see all auto-import sources with their trust tier badges, the next scheduled import date, import history, and the custom source form. The activity dashboard on the catalog page also shows recent imports in a dedicated tab.",
      },
      {
        question: "Do I get notified about new imports?",
        answer:
          "Yes. After each weekly import, Loop sends a digest email to admin accounts via Resend. The email lists all newly imported skills with links, descriptions, and source attribution. You can manage email preferences (weekly digest and automation alerts) from your account settings.",
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
          "MCP (Model Context Protocol) is an open standard for connecting AI agents to external tools and services. An MCP server exposes a set of tools – file operations, API calls, search, database queries – that any compatible client can discover and invoke at runtime.",
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
          "Loop's catalog includes 70+ servers across developer platforms (GitHub, GitLab, Vercel, Cloudflare, Netlify), databases (Supabase, Neon, Prisma, MongoDB, Redis), productivity (Slack, Notion, Linear, Atlassian), search (Brave, Exa, Firecrawl, Perplexity), browser automation (Playwright, Puppeteer), payments (Stripe, PayPal), design (Figma), observability (Grafana, Sentry, PagerDuty), AI providers (OpenAI, Hugging Face), infrastructure (AWS, Azure, GCP, Docker, Kubernetes), and security (Snyk, Auth0, SonarQube). Each server displays its actual brand logo.",
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
          "Yes. Sandbox sessions run inside Vercel's Firecracker microVMs – ephemeral, isolated environments that are destroyed after use. They're designed for running AI-generated and user-generated code safely.",
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
          "Loop has two tiers. Free ($0) lets you browse the catalog, create up to 2 skills, and explore the Sandbox. Operator ($19/mo) unlocks unlimited skills, AI-powered automations with model selection, custom import sources, marketplace pricing, Stripe Connect payouts, and priority support.",
      },
      {
        question: "What's included in the free tier?",
        answer:
          "Free gives you full catalog access, search, skill detail views, the Sandbox, and up to 2 skills. You can fork public skills, download skill markdown, and use the raw URL API. Automations, model selection, custom import sources, and marketplace pricing require Operator.",
      },
      {
        question: "What does the Operator plan include?",
        answer:
          "Operator ($19/mo) unlocks: unlimited skills, AI-powered automations with configurable cadence, preferred model selection for automation runs, custom import sources, marketplace pricing, Stripe Connect payouts, and priority support.",
      },
      {
        question: "How do I upgrade to Operator?",
        answer:
          "Go to Settings > Subscription and click 'Upgrade to Operator.' You'll be taken to a Stripe Checkout page. After payment, the subscription is attached to your account and features unlock immediately. The sign-in and sign-up pages also explain Operator benefits.",
      },
      {
        question: "How do I cancel my subscription?",
        answer:
          "Open Settings > Subscription and click 'Manage billing' to open the Stripe customer portal. From there you can cancel at the end of your current billing period, update payment methods, or download invoices.",
      },
      {
        question: "How do payouts work for skill sellers?",
        answer:
          "Payouts use Stripe Connect (Express accounts). You must have an active Operator subscription before onboarding. Stripe handles identity verification, bank details, and compliance. Payout speed and holds are controlled by Stripe and your bank country.",
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
          "Loop records page views, interactions, prompt and URL copies, searches, skill creation and import events, automation runs, and API calls with route, method, status, duration, and success/failure. This data powers the usage dashboards, the activity dashboard, and per-skill observability panels.",
      },
      {
        question: "Where can I see system health?",
        answer:
          "Go to Settings > System health. You'll see rolling 24-hour totals for views, interactions, API traffic, and average API latency, along with time-series charts, route-level breakdowns, and recent events.",
      },
      {
        question: "Is there per-skill observability?",
        answer:
          "Yes. Each skill's detail sidebar includes a skill-level observability panel showing usage metrics specific to that skill – views, copies, API hits, and automation runs. This helps you understand which skills get the most traffic and engagement.",
      },
      {
        question: "What is the activity dashboard?",
        answer:
          "The activity dashboard is accessible from the catalog home page. It combines usage overview tiles and charts with two tabs: an automations tab showing the automation calendar with color-coded run dates, and an imports tab listing recent imports with source attribution and trust tier badges.",
      },
      {
        question: "Is usage data used for billing?",
        answer:
          "No. The health view is designed for spotting spikes, regressions, or noisy endpoints. It is not billing-grade metering. Billing is handled entirely through Stripe subscriptions.",
      },
      {
        question: "What do the 24-hour rolling windows mean?",
        answer:
          "Rolling 24-hour totals compare 'right now' vs 'yesterday at the same time.' They reset continuously, not at calendar midnight. This helps you spot real-time trends without waiting for daily reports.",
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
          "Loop uses Supabase (Postgres) as the single source of truth for all data: skills, skill authors, automation configs, sources, versions, usage events, custom import sources, email preferences, and run logs. Everything is read from and written to Supabase.",
      },
      {
        question: "How is authentication handled?",
        answer:
          "Loop uses Clerk for user authentication with custom sign-in and sign-up pages. Social providers (Google, GitHub) and email are supported. Billing metadata (Stripe customer ID, Connect account ID) is stored on your Clerk user profile. Your Clerk account can also be linked to a verified skill author record for publisher permissions.",
      },
      {
        question: "Is my data private?",
        answer:
          "Yes. Row-level security (RLS) is enabled on all database tables. Anonymous access is blocked by default, and the service role bypasses RLS only for server-side operations. Your skills, automations, and usage data are tied to your authenticated account.",
      },
      {
        question: "What happens to my data if I cancel?",
        answer:
          "Canceling the Operator plan stops access to paid features at the end of your billing period. Your skills, versions, author profile, and history remain in the database. You can always re-subscribe to regain full access.",
      },
      {
        question: "What email preferences are available?",
        answer:
          "Loop stores two email preference flags per user: weekly digest (import summaries after the Monday cron) and automation alerts (notifications about automation runs and failures). Both are enabled by default and can be configured from your account settings.",
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
          "Loop is built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4. It uses Clerk for authentication, Supabase (Postgres) for all persistence, Stripe for billing and payouts, Vercel for hosting (Sandbox, Analytics, Speed Insights), Resend for transactional email, and the Vercel AI SDK for agent interactions.",
      },
      {
        question: "Can I self-host Loop?",
        answer:
          "Loop is designed for Vercel but runs locally without Vercel services. For a deploy you need Supabase credentials, Clerk API keys, NEXT_PUBLIC_SITE_URL, CRON_SECRET, AI provider keys for refresh and agent runs, Resend API key for emails, and Stripe keys if billing is enabled.",
      },
      {
        question: "What AI models power automations?",
        answer:
          "The automation pipeline uses the model configured in LOOP_MODEL by default (an OpenAI model). Operator subscribers can choose a preferred model per automation (GPT-4o, GPT-4o Mini, Claude Sonnet 4, Claude Haiku 3.5). You can also configure OpenRouter, Groq, Together AI, or any OpenAI-compatible endpoint.",
      },
      {
        question: "What is the raw skill URL API?",
        answer:
          "Every public skill has a raw markdown endpoint at /api/skills/{slug}/raw that returns the skill body as text/markdown. Append ?v=N to pin a specific version. This URL is what agents fetch when you paste a skill link into their context – no HTML, just clean markdown with YAML frontmatter. There's also /api/skills/raw/all, which returns a plain-text index of all public skills and MCP servers for agent discovery.",
      },
      {
        question: "What is the skill icon API?",
        answer:
          "Each skill exposes a /api/skills/{slug}/icon endpoint that returns the resolved icon URL. Loop resolves icons through a priority chain: explicit icon URL, verified author logo, brand inference from the owner name, and finally a Lucide category fallback. MCP servers have a similar endpoint at /api/mcps/{name}/icon.",
      },
      {
        question: "What is the command palette?",
        answer:
          "Press Cmd+K (or Ctrl+K) anywhere in the app to open the command palette. It lets you quickly search skills, jump to categories, open the Sandbox, or navigate to Settings without leaving the keyboard.",
      },
      {
        question: "Does Loop support MCP servers?",
        answer:
          "Yes – MCP is a first-class integration. Loop imports, versions, and executes MCP server definitions with full stdio and HTTP transport support. See the MCP integration section above for details on transports, the seed catalog, and agent attachment.",
      },
      {
        question: "How does Loop send emails?",
        answer:
          "Loop uses the Resend API for transactional email. Set the RESEND_API_KEY and optionally RESEND_FROM_EMAIL environment variables. Loop sends a weekly digest email after the import cron runs and a welcome email when new users sign up via the Clerk webhook. Users can manage their email preferences (weekly digest and automation alerts) from account settings.",
      },
      {
        question: "What is the skill detail page?",
        answer:
          "The skill detail page is the primary view for any skill. It displays the full skill body, a sticky section nav for in-page navigation, a meta bar showing origin, freshness, next automation run, and source count, the research panel (when available), an activity section with update history, and a sidebar with the use-skill panel, version timeline, automation controls, and per-skill observability.",
      },
    ],
  },
];
