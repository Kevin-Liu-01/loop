"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
    <div className="card admin-update-card">
      <div className="section-head section-head--compact">
        <div>
          <span className="eyebrow-pill">Access</span>
          <h2>Manual refresh</h2>
        </div>
        <small>{hasAccess ? currentAdminEmail : primaryAdminEmail}</small>
      </div>

      {hasAccess ? (
        <div className="admin-update-card__stack">
          <div className="admin-pill-row">
            <span className="badge badge--signal-blue">signed in</span>
            <span className="admin-update-card__hint">This session can run a full refresh.</span>
          </div>
          <div className="hero-actions">
            <button
              className="button"
              disabled={isRefreshPending || isClaimPending || isSignOutPending}
              onClick={handleRefresh}
              type="button"
            >
              {isRefreshPending ? "Running..." : "Run refresh"}
            </button>
            <button
              className="button button--ghost"
              disabled={isRefreshPending || isClaimPending || isSignOutPending}
              onClick={handleSignOut}
              type="button"
            >
              {isSignOutPending ? "Clearing..." : "Sign out"}
            </button>
          </div>
        </div>
      ) : (
        <form className="admin-update-card__stack" onSubmit={handleClaim}>
          <label className="field-group">
            <span>Admin email</span>
            <input
              autoCapitalize="off"
              autoComplete="email"
              className="text-field"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder={primaryAdminEmail}
              required
              type="email"
              value={email}
            />
          </label>
          <div className="hero-actions">
            <button className="button" disabled={isClaimPending || isRefreshPending || isSignOutPending} type="submit">
              {isClaimPending ? "Claiming..." : "Claim access"}
            </button>
          </div>
        </form>
      )}

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      {statusMessage ? <p className="admin-update-card__status">{statusMessage}</p> : null}
    </div>
  );
}
