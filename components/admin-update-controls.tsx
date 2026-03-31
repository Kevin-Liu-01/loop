"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { KeyIcon, LogOutIcon, RefreshIcon } from "@/components/frontier-icons";
import { Badge, EyebrowPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldGroup, textFieldBase } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";

type RefreshResponse = {
  error?: string;
  generatedAt?: string;
  skills?: number;
  dailyBriefs?: number;
};

type AdminUpdateControlsProps = {
  currentAdminEmail: string | null;
  primaryAdminEmail: string;
};

export function AdminUpdateControls({ currentAdminEmail, primaryAdminEmail }: AdminUpdateControlsProps) {
  const router = useRouter();
  const [email, setEmail] = useState(currentAdminEmail ?? primaryAdminEmail);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isClaimPending, startClaimTransition] = useTransition();
  const [isRefreshPending, startRefreshTransition] = useTransition();
  const [isSignOutPending, startSignOutTransition] = useTransition();

  const hasAccess = Boolean(currentAdminEmail);

  function handleClaim(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    startClaimTransition(async () => {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const payload = (await response.json()) as { error?: string; email?: string };
      if (!response.ok) {
        setErrorMessage(payload.error ?? "Unable to claim admin access.");
        return;
      }

      setStatusMessage(`Operator access claimed for ${payload.email ?? email}.`);
      router.refresh();
    });
  }

  function handleRefresh() {
    setStatusMessage(null);
    setErrorMessage(null);

    startRefreshTransition(async () => {
      const response = await fetch("/api/refresh?mode=full", {
        method: "POST"
      });

      const payload = (await response.json()) as RefreshResponse;
      if (!response.ok) {
        setErrorMessage(payload.error ?? "Update run failed.");
        return;
      }

      const generatedAt = payload.generatedAt ? new Date(payload.generatedAt).toLocaleString() : "just now";
      setStatusMessage(
        `Refresh finished at ${generatedAt}. ${payload.skills ?? 0} skills and ${payload.dailyBriefs ?? 0} briefs updated.`
      );
      router.refresh();
    });
  }

  function handleSignOut() {
    setStatusMessage(null);
    setErrorMessage(null);

    startSignOutTransition(async () => {
      const response = await fetch("/api/admin/session", {
        method: "DELETE"
      });

      if (!response.ok) {
        setErrorMessage("Unable to clear admin access.");
        return;
      }

      setStatusMessage("Operator access cleared.");
      router.refresh();
    });
  }

  return (
    <Panel className="gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <EyebrowPill>Access</EyebrowPill>
          <h2 className="m-0 text-[1.15rem] font-semibold tracking-[-0.03em]">Manual refresh</h2>
        </div>
        <small className="text-sm text-ink-soft">{hasAccess ? currentAdminEmail : primaryAdminEmail}</small>
      </div>

      {hasAccess ? (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-3 text-ink-soft">
            <Badge color="green">Signed in</Badge>
            <span className="text-ink-soft leading-7">This session can run a full refresh.</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={isRefreshPending || isClaimPending || isSignOutPending}
              onClick={handleRefresh}
              type="button"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              {isRefreshPending ? "Running..." : "Run refresh"}
            </Button>
            <Button
              disabled={isRefreshPending || isClaimPending || isSignOutPending}
              onClick={handleSignOut}
              type="button"
              variant="ghost"
            >
              <LogOutIcon className="h-3.5 w-3.5" />
              {isSignOutPending ? "Clearing..." : "Sign out"}
            </Button>
          </div>
        </div>
      ) : (
        <form className="grid gap-4" onSubmit={handleClaim}>
          <FieldGroup>
            <span>Admin email</span>
            <input
              autoCapitalize="off"
              autoComplete="email"
              className={textFieldBase}
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder={primaryAdminEmail}
              required
              type="email"
              value={email}
            />
          </FieldGroup>
          <div className="flex flex-wrap gap-3">
            <Button disabled={isClaimPending || isRefreshPending || isSignOutPending} type="submit">
              <KeyIcon className="h-3.5 w-3.5" />
              {isClaimPending ? "Claiming..." : "Claim access"}
            </Button>
          </div>
        </form>
      )}

      {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}
      {statusMessage ? <p className="text-ink-soft leading-7">{statusMessage}</p> : null}
    </Panel>
  );
}
