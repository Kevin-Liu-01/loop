"use client";

import { CheckIcon, CreditCardIcon, ZapIcon } from "@/components/frontier-icons";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/cn";

type SubscriptionPanelProps = {
  email: string;
  hasSubscription: boolean;
  planSlug: string | null;
  status: string | null;
};

const OPERATOR_FEATURES = [
  "Create & publish skills",
  "Attach automations to skills",
  "Set marketplace pricing",
  "Full operator workflow",
  "Receive payouts via Connect",
];

function FeatureCheck({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-muted">
      <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
      {children}
    </li>
  );
}

function StatusLabel({ status }: { status: string | null }) {
  const normalized = (status ?? "active").toLowerCase();
  const tone =
    normalized === "active"
      ? "fresh"
      : normalized === "past_due"
        ? "stale"
        : normalized === "canceled"
          ? "error"
          : "idle";

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-tight text-ink-soft">
      <StatusDot tone={tone} pulse={tone === "fresh"} />
      {normalized}
    </span>
  );
}

export function SubscriptionPanel({
  email,
  hasSubscription,
  planSlug,
  status,
}: SubscriptionPanelProps) {
  if (!hasSubscription) {
    return (
      <div className="grid gap-6 rounded-none border border-line bg-paper-3/92 p-0">
        <div className="grid gap-4 border-b border-line p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-paper-2 shadow-[0_1px_0_0_rgba(0,0,0,0.04)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)]">
              <CreditCardIcon className="h-4.5 w-4.5 text-ink-soft" />
            </span>
            <div>
              <p className="m-0 text-lg font-semibold tracking-[-0.03em] text-ink">Free Signal</p>
              <p className="m-0 text-xs text-ink-faint">{email}</p>
            </div>
          </div>
          <p className="m-0 max-w-[44ch] text-sm leading-relaxed text-ink-muted">
            Browse the catalog and explore skills. Upgrade to Operator to unlock authoring, automations, and payouts.
          </p>
        </div>

        <div className="grid gap-5 px-5 pb-6 sm:px-6">
          <div className="grid gap-3">
            <p className="m-0 text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">
              Operator includes
            </p>
            <ul className="m-0 grid gap-2 p-0 list-none">
              {OPERATOR_FEATURES.map((f) => (
                <FeatureCheck key={f}>{f}</FeatureCheck>
              ))}
            </ul>
          </div>
          <LinkButton href="/api/billing/checkout?plan=operator" size="sm">
            <ZapIcon className="h-3.5 w-3.5" />
            Upgrade to Operator — $19/mo
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-0 rounded-none border border-line bg-paper-3/92">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/25 bg-accent/8 shadow-[0_1px_0_0_rgba(232,101,10,0.08)]">
            <ZapIcon className="h-4.5 w-4.5 text-accent" />
          </span>
          <div>
            <p className="m-0 text-lg font-semibold tracking-[-0.03em] text-ink">Operator</p>
            <p className="m-0 text-xs text-ink-faint">{email}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge color="orange">{(planSlug ?? "operator").charAt(0).toUpperCase() + (planSlug ?? "operator").slice(1)}</Badge>
          <StatusLabel status={status} />
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6">
        <ul className="m-0 grid grid-cols-1 gap-2 p-0 list-none sm:grid-cols-2">
          {OPERATOR_FEATURES.map((f) => (
            <FeatureCheck key={f}>{f}</FeatureCheck>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2">
          <LinkButton href="/api/billing/portal" size="sm" variant="ghost">
            Manage billing
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
