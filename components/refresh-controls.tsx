"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { CheckIcon, RefreshIcon } from "@/components/frontier-icons";
import { BrailleSpinner } from "@/components/ui/braille-spinner";
import { Button } from "@/components/ui/button";
import { useAppTimezone } from "@/hooks/use-app-timezone";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";

interface RefreshResponse {
  error?: string;
  generatedAt?: string;
  skills?: number;
  dailyBriefs?: number;
}

interface RefreshResult {
  generatedAt: string;
  skills: number;
  dailyBriefs: number;
}

function ResultTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="grid gap-0.5 rounded-none border border-line bg-paper-2/40 p-3 dark:bg-black/20">
      <span className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-ink-soft">
        {label}
      </span>
      <strong className="text-sm font-semibold tabular-nums tracking-[-0.03em] text-ink">
        {value}
      </strong>
    </div>
  );
}

export function RefreshControls() {
  const { timeZone } = useAppTimezone();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<RefreshResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleRefresh() {
    setResult(null);
    setErrorMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/refresh?mode=full", {
        method: "POST",
      });
      const payload = (await response.json()) as RefreshResponse;

      if (!response.ok) {
        setErrorMessage(payload.error ?? "Refresh failed.");
        return;
      }

      setResult({
        dailyBriefs: payload.dailyBriefs ?? 0,
        generatedAt: payload.generatedAt
          ? formatDateTime(payload.generatedAt, timeZone)
          : formatDateTime(new Date().toISOString(), timeZone),
        skills: payload.skills ?? 0,
      });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-0 rounded-none border border-line bg-paper-3/92">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border shadow-[0_1px_0_0_rgba(0,0,0,0.04)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)]",
              result
                ? "border-success/25 bg-success/8"
                : "border-line bg-paper-2"
            )}
          >
            {result ? (
              <CheckIcon className="h-4.5 w-4.5 text-success" />
            ) : isPending ? (
              <BrailleSpinner className="text-base text-ink-soft" />
            ) : (
              <RefreshIcon className="h-4.5 w-4.5 text-ink-soft" />
            )}
          </span>
          <div>
            <p className="m-0 text-sm font-semibold tracking-tight text-ink">
              {isPending
                ? "Refreshing..."
                : result
                  ? "Refresh complete"
                  : "Manual refresh"}
            </p>
            <p className="m-0 text-xs text-ink-faint">
              {isPending
                ? "Rebuilding snapshot, skills, and briefs"
                : result
                  ? `Finished at ${result.generatedAt}`
                  : "Rebuild the local Loop snapshot on demand"}
            </p>
          </div>
        </div>
        <Button
          disabled={isPending}
          onClick={handleRefresh}
          type="button"
          size="sm"
        >
          {isPending ? (
            <BrailleSpinner className="text-sm" />
          ) : (
            <RefreshIcon className="h-3.5 w-3.5" />
          )}
          {isPending ? "Running..." : "Run full refresh"}
        </Button>
      </div>

      {result ? (
        <div className="grid grid-cols-3 gap-3 p-5 sm:p-6">
          <ResultTile label="Skills" value={result.skills} />
          <ResultTile label="Briefs" value={result.dailyBriefs} />
          <ResultTile
            label="Finished"
            value={
              result.generatedAt.split(",")[1]?.trim() ?? result.generatedAt
            }
          />
        </div>
      ) : null}

      {errorMessage ? (
        <div className="border-t border-danger/20 bg-danger/5 px-5 py-3 sm:px-6">
          <p className="m-0 text-sm text-danger">{errorMessage}</p>
        </div>
      ) : null}

      {!result && !errorMessage ? (
        <div className="p-5 sm:p-6">
          <p className="m-0 text-xs leading-relaxed text-ink-faint">
            Safe to run repeatedly. Walks the refresh pipeline: re-reads
            sources, regenerates artifacts, and updates counters.
          </p>
        </div>
      ) : null}
    </div>
  );
}
