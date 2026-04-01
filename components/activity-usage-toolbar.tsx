"use client";

import { useMemo } from "react";

import { Select } from "@/components/ui/select";
import { useUsageComparisonOptional } from "@/components/usage-comparison-context";
import { useTimezone } from "@/hooks/use-timezone";
import {
  USAGE_COMPARISON_LABELS,
  USAGE_COMPARISON_MODES,
  type UsageComparisonMode,
} from "@/lib/usage-comparison-modes";
import { SUGGESTED_TIME_ZONES } from "@/lib/usage-timezones";
import type { UsageOverview } from "@/lib/usage";
import { cn } from "@/lib/cn";

const compactSelect =
  "min-h-0 h-8 rounded-none border-line bg-paper-3 px-2 py-0 text-xs dark:bg-paper-2/90";

export function ActivityUsageToolbar({ overview }: { overview: UsageOverview }) {
  const ctx = useUsageComparisonOptional();
  const mode = ctx?.mode ?? "yesterday_same_time";
  const setMode = ctx?.setMode;
  const { timeZone, setTimeZone, browserTimeZone } = useTimezone(overview.timeZone);

  const zoneOptions = useMemo(() => {
    const set = new Set<string>([...SUGGESTED_TIME_ZONES]);
    set.add(browserTimeZone);
    set.add(timeZone);
    set.add(overview.timeZone);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [browserTimeZone, timeZone, overview.timeZone]);

  const footnote = overview.comparisonFootnotes[mode];

  const comparisonOptions = USAGE_COMPARISON_MODES.map((m) => ({
    value: m,
    label: USAGE_COMPARISON_LABELS[m],
  }));

  const zoneSelectOptions = zoneOptions.map((z) => ({
    value: z,
    label: z === browserTimeZone ? `${z} (browser)` : z,
  }));

  return (
    <div className="grid gap-2 border-b border-line/80 pb-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid min-w-0 gap-1">
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            Compare to
          </span>
          <Select
            className={cn(compactSelect, !setMode && "opacity-60")}
            disabled={!setMode}
            onChange={(v) => setMode?.(v as UsageComparisonMode)}
            options={comparisonOptions}
            value={mode}
          />
        </div>
        <div className="grid min-w-0 flex-1 gap-1">
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            Time zone
          </span>
          <Select
            className={compactSelect}
            onChange={setTimeZone}
            options={zoneSelectOptions}
            value={timeZone}
          />
        </div>
      </div>
      {footnote ? (
        <p className="m-0 text-[0.62rem] leading-snug text-ink-faint">{footnote}</p>
      ) : null}
    </div>
  );
}
