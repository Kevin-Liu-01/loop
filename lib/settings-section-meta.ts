import type { SettingsNavId } from "@/lib/settings-nav";

export type SettingsInfoBlock = {
  title: string;
  body: string;
};

export type SettingsSectionMeta = {
  heading: string;
  lead: string;
  /** Context above the primary control panel */
  beforePrimary: SettingsInfoBlock[];
  /** Extra detail below the primary control panel */
  afterPrimary: SettingsInfoBlock[];
};

export const SETTINGS_SECTION_META: Record<SettingsNavId, SettingsSectionMeta> = {
  skills: {
    heading: "Your skills",
    lead:
      "All your authored skills in one place. See automation status, latest run outcomes, and jump into any skill to edit or trigger a refresh.",
    beforePrimary: [
      {
        title: "Skill lifecycle",
        body:
          "Each skill starts as a draft. Once you add sources and enable automation, Loop refreshes it on schedule – fetching signals, running the editor agent, and minting new revisions automatically.",
      },
      {
        title: "Automation at a glance",
        body:
          "The status column shows whether automation is active, paused, or disabled. Skills with consecutive failures are automatically paused until you intervene.",
      },
    ],
    afterPrimary: [
      {
        title: "Managing skills",
        body:
          "Click any skill to open its detail page. Use the Studio tab to edit content, trigger refreshes, and tune automation. Use the Activity tab to inspect run traces and diffs.",
      },
      {
        title: "Imports vs authored",
        body:
          "This page shows skills you authored. Imported skills from external registries appear under Imports – they sync automatically and don't count toward your authoring limits.",
      },
    ],
  },
  subscription: {
    heading: "Subscription & billing",
    lead:
      "Your Loop workspace runs on the Operator plan when subscribed. Billing is handled securely by Stripe; you can open the customer portal any time to update payment methods, invoices, or cancel.",
    beforePrimary: [
      {
        title: "What Operator unlocks",
        body:
          "Create and publish skills, attach automations, set marketplace pricing, and use the full operator workflow. Without an active subscription, catalog browsing still works, but authoring and payouts stay gated.",
      },
      {
        title: "Checkout & receipts",
        body:
          "When you upgrade, Stripe Checkout collects payment and attaches the subscription to your account. Confirmation emails and receipts come from Stripe–keep the same email as your Clerk sign-in for the least confusion.",
      },
    ],
    afterPrimary: [
      {
        title: "Managing your plan",
        body:
          "Use “Manage billing” in the panel (when available) to open Stripe’s customer portal: update cards, download invoices, or cancel at period end. If something fails, check that `STRIPE_PRICE_*` env vars match your Stripe dashboard.",
      },
      {
        title: "Support",
        body:
          "If a charge looks wrong or the portal won’t load, grab the Stripe customer id from your operator dashboard or email receipt and contact support with timestamps–we can trace webhook delivery on our side.",
      },
    ],
  },
  connect: {
    heading: "Stripe Connect & payouts",
    lead:
      "Connect lets Loop route skill revenue to your bank account. Onboarding runs on Stripe’s hosted flow: identity, bank details, and compliance are handled there; we only store your connected account id on your user profile.",
    beforePrimary: [
      {
        title: "Why Connect is separate",
        body:
          "Subscriptions (Operator) pay Loop for product access. Connect is how you receive payouts from buyers. You need an active Operator subscription before Connect onboarding is available, so we know the workspace is paid and in good standing.",
      },
      {
        title: "Express accounts",
        body:
          "We use Stripe Express: a lightweight connected account with a Stripe-hosted dashboard for taxes, payouts, and verification. You’ll be redirected to Stripe to finish or refresh onboarding whenever requirements change.",
      },
    ],
    afterPrimary: [
      {
        title: "Return URLs",
        body:
          "After onboarding, Stripe sends you back to Loop with status query params. If you land on “refresh”, Stripe needs another pass–open Connect again from here. “Complete” means the return handshake fired; check Stripe if payouts are still paused.",
      },
      {
        title: "Payout timing",
        body:
          "Payout speed and holds are controlled by Stripe and your bank country. Loop doesn’t hold funds beyond what Stripe’s Connect rules require–see your Express dashboard for balance and payout schedule.",
      },
    ],
  },
  refresh: {
    heading: "Content & snapshot refresh",
    lead:
      "Refresh rebuilds the local Loop snapshot: skills, briefs, and related generated content. Use it after imports, registry changes, or when the catalog looks stale–runs are server-side and may take a few seconds.",
    beforePrimary: [
      {
        title: "What “full refresh” does",
        body:
          "The job walks the refresh pipeline: re-reads configured sources, regenerates derived artifacts where applicable, and updates counters you see in the response. It’s safe to run repeatedly; the last run wins.",
      },
      {
        title: "When to run it",
        body:
          "After editing category registry, pulling new remote skills, or if the home catalog doesn’t match what you expect on disk. For single-skill issues, prefer the skill page or automation tools first.",
      },
    ],
    afterPrimary: [
      {
        title: "Operational notes",
        body:
          "Large refreshes can be IO-heavy. If a run fails, read the error string in the panel–often it’s a missing env, blob permission, or transient network issue. Fix the cause and run again.",
      },
      {
        title: "Automation vs manual refresh",
        body:
          "Automations execute on their own cadence; this button is manual and immediate. It doesn’t pause or reschedule automations–it only rebuilds the shared snapshot content layer they rely on.",
      },
    ],
  },
  automations: {
    heading: "Automations",
    lead:
      "Automations run your agent on a schedule against selected skills. Each automation stores its prompt, cadence (RRULE), and status in your workspace; Loop triggers runs and logs outcomes alongside skill activity.",
    beforePrimary: [
      {
        title: "Cadence & time zones",
        body:
          "Schedules use RRULE semantics. Times follow the server’s automation pipeline–if something fires “at the wrong hour”, confirm your machine or deployment TZ and how cron interprets the rule.",
      },
      {
        title: "Skills & prompts",
        body:
          "Each automation binds to one skill. Changing the skill’s body or agent prompt affects the next run–no need to recreate the automation unless you want a different skill or schedule.",
      },
    ],
    afterPrimary: [
      {
        title: "Pausing & safety",
        body:
          "Paused automations keep their configuration but won’t dispatch. Use pause when iterating on prompts or when an external API quota is tight. Deletes are permanent–export or note prompts before removal.",
      },
      {
        title: "Operator requirement",
        body:
          "Creating or editing automations requires Operator. That keeps scheduled compute and storage tied to a paid workspace and reduces abuse of long-running agent jobs.",
      },
    ],
  },
  imports: {
    heading: "Skill imports",
    lead:
      "Loop pulls skill definitions from configured GitHub sources on a weekly cadence. Built-in registries stay aligned with upstream; Operator workspaces can register additional repos to scan.",
    beforePrimary: [
      {
        title: "Weekly schedule",
        body:
          "Imports run automatically every Monday (UTC). The next run time shown here is derived from that schedule–exact wall-clock time in your locale may differ from cron drift or maintenance windows.",
      },
      {
        title: "Trust tiers",
        body:
          "Official sources are first-party or canonical upstreams we treat as high-signal. Community sources are curated lists or mirrors used for discovery; verify content before relying on them in production workflows.",
      },
    ],
    afterPrimary: [
      {
        title: "Import history",
        body:
          "Run logs from `weekly_import_runs` will surface here once wired to the UI. Until then, use server logs or your database console if you need to audit a specific import window.",
      },
      {
        title: "Custom sources (Operator)",
        body:
          "Adding a custom GitHub source is limited to Operator subscribers so extra registry scans stay tied to paid workspaces. Upgrade from Subscription settings, then return here to register org, repo, branch, and skills path.",
      },
    ],
  },
  health: {
    heading: "System health & usage",
    lead:
      "This view summarizes recent usage: page views, interactions, API traffic, route-level latency, and rolling windows. It’s meant for spotting spikes, regressions, or noisy endpoints–not for billing-grade metering.",
    beforePrimary: [
      {
        title: "How metrics are collected",
        body:
          "Events are recorded as you use Loop: navigation, skill actions, and API calls aggregate into the tiles and charts. Latency averages are sampled from recorded durations–expect jitter under load.",
      },
      {
        title: "24h windows",
        body:
          "Rolling 24h totals help compare “right now” vs “yesterday same window” in other parts of the app. They reset continuously, not at calendar midnight, unless noted elsewhere in the UI.",
      },
    ],
    afterPrimary: [
      {
        title: "Interpreting spikes",
        body:
          "A jump in API calls often correlates with automations, sandbox sessions, or refresh jobs. Cross-check the route list: repeated paths point to the feature to throttle or optimize first.",
      },
      {
        title: "Privacy",
        body:
          "We don’t surface raw request bodies here–only aggregates and labels safe for operators. If you need deeper traces, use your hosting provider’s logs or ask for an export under your data agreement.",
      },
    ],
  },
};
