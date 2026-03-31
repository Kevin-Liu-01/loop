"use client";

import { useState, useTransition } from "react";

import { CheckIcon, LinkIcon, WalletIcon } from "@/components/frontier-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { Tip } from "@/components/ui/tip";
import { cn } from "@/lib/cn";

type ConnectPanelProps = {
  hasSubscription: boolean;
  connectAccountId: string | null;
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
      <span className="shrink-0 text-ink-faint">{label}</span>
      <span className="min-w-0 truncate text-right font-medium text-ink">{children}</span>
    </div>
  );
}

export function ConnectPanel({ hasSubscription, connectAccountId }: ConnectPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConnect() {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/connect/onboard", { method: "POST" });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        setError(payload.error ?? "Unable to start Stripe Connect onboarding.");
        return;
      }

      window.location.href = payload.url;
    });
  }

  if (!hasSubscription) {
    return (
      <div className="grid gap-0 rounded-none border border-line bg-paper-3/92">
        <div className="flex items-center gap-3 border-b border-line p-5 sm:p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-paper-2 shadow-[0_1px_0_0_rgba(0,0,0,0.04)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)]">
            <WalletIcon className="h-4.5 w-4.5 text-ink-soft" />
          </span>
          <div>
            <p className="m-0 text-sm font-semibold tracking-tight text-ink">Payouts unavailable</p>
            <p className="m-0 text-xs text-ink-faint">Requires Operator subscription</p>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <p className="m-0 max-w-[48ch] text-sm leading-relaxed text-ink-muted">
            Subscribe to Operator first, then connect your Stripe account here to receive payments for your skills.
          </p>
        </div>
      </div>
    );
  }

  if (connectAccountId) {
    return (
      <div className="grid gap-0 rounded-none border border-line bg-paper-3/92">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-success/25 bg-success/8 shadow-[0_1px_0_0_rgba(16,185,129,0.08)]">
              <CheckIcon className="h-4.5 w-4.5 text-success" />
            </span>
            <div>
              <p className="m-0 text-sm font-semibold tracking-tight text-ink">Connected</p>
              <p className="m-0 text-xs text-ink-faint">Payments will be deposited directly</p>
            </div>
          </div>
          <Tip content="Stripe payouts are enabled and active" side="left">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft">
              <StatusDot tone="fresh" pulse />
              active
            </span>
          </Tip>
        </div>
        <div className="divide-y divide-line/60 px-5 sm:px-6">
          <DetailRow label="Account">
            <Tip content={connectAccountId} side="left">
              <span className="text-xs tabular-nums">{connectAccountId}</span>
            </Tip>
          </DetailRow>
          <DetailRow label="Type">
            <Badge color="green">Express</Badge>
          </DetailRow>
          <DetailRow label="Payouts">
            <span className="text-success">Enabled</span>
          </DetailRow>
        </div>
        <div className="p-5 sm:p-6">
          <p className="m-0 text-xs leading-relaxed text-ink-faint">
            Manage payout schedule and tax documents from your Stripe Express dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-0 rounded-none border border-line bg-paper-3/92">
      <div className="flex items-center gap-3 border-b border-line p-5 sm:p-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-paper-2 shadow-[0_1px_0_0_rgba(0,0,0,0.04)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)]">
          <LinkIcon className="h-4.5 w-4.5 text-ink-soft" />
        </span>
        <div>
          <p className="m-0 text-sm font-semibold tracking-tight text-ink">Not connected</p>
          <p className="m-0 text-xs text-ink-faint">Link a Stripe account to receive payouts</p>
        </div>
      </div>
      <div className="grid gap-4 p-5 sm:p-6">
        <p className="m-0 max-w-[48ch] text-sm leading-relaxed text-ink-muted">
          You'll be redirected to Stripe to verify your identity and bank details. The process takes a few minutes and can be resumed later.
        </p>
        <div>
          <Button disabled={isPending} onClick={handleConnect} type="button">
            <LinkIcon className="h-3.5 w-3.5" />
            {isPending ? "Redirecting..." : "Connect Stripe account"}
          </Button>
        </div>
        {error ? (
          <p className="m-0 text-sm text-danger">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
