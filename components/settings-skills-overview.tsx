"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { SkillInline } from "@/components/skill-inline";
import { Badge } from "@/components/ui/badge";
import { EmptyCard } from "@/components/ui/empty-card";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import { formatRelativeDate } from "@/lib/format";
import type { LoopRunRecord, SkillRecord } from "@/lib/types";

type SettingsSkillsOverviewProps = {
  skills: SkillRecord[];
  latestRuns: Record<string, LoopRunRecord>;
};

type SortKey = "title" | "updated" | "status";

function automationStatusLabel(skill: SkillRecord): { label: string; color: "green" | "neutral" | "orange" | "red" } {
  if (!skill.automation?.enabled) return { label: "Disabled", color: "neutral" };
  if (skill.automation.status === "paused") return { label: "Paused", color: "orange" };
  if ((skill.automation.consecutiveFailures ?? 0) >= 3) return { label: "Failing", color: "red" };
  return { label: "Active", color: "green" };
}

function runStatusLabel(run?: LoopRunRecord): { label: string; color: "green" | "neutral" | "red" } {
  if (!run) return { label: "No runs", color: "neutral" };
  if (run.status === "error") return { label: "Error", color: "red" };
  return { label: run.bodyChanged ? run.nextVersionLabel ?? "Updated" : "No diff", color: "green" };
}

export function SettingsSkillsOverview({ skills, latestRuns }: SettingsSkillsOverviewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const lower = filter.toLowerCase();
    return skills.filter(
      (skill) =>
        skill.title.toLowerCase().includes(lower) ||
        skill.slug.toLowerCase().includes(lower) ||
        skill.category.toLowerCase().includes(lower)
    );
  }, [skills, filter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "title":
          return a.title.localeCompare(b.title);
        case "updated":
          return new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf();
        case "status": {
          const aStatus = automationStatusLabel(a).label;
          const bStatus = automationStatusLabel(b).label;
          return aStatus.localeCompare(bStatus);
        }
        default:
          return 0;
      }
    });
  }, [filtered, sortKey]);

  if (skills.length === 0) {
    return (
      <EmptyCard>
        No authored skills yet. Create your first skill to see it here.
      </EmptyCard>
    );
  }

  const sortButtons: { key: SortKey; label: string }[] = [
    { key: "updated", label: "Recently updated" },
    { key: "title", label: "Name" },
    { key: "status", label: "Automation status" },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="h-9 flex-1 rounded-lg border border-line bg-paper-2 px-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent/40 focus:outline-none"
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter skills..."
          type="text"
          value={filter}
        />
        <div className="flex gap-1">
          {sortButtons.map((btn) => (
            <button
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                sortKey === btn.key
                  ? "bg-accent/12 text-accent"
                  : "text-ink-soft hover:bg-paper-3 hover:text-ink"
              )}
              key={btn.key}
              onClick={() => setSortKey(btn.key)}
              type="button"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs font-medium text-ink-faint">
        {sorted.length} skill{sorted.length === 1 ? "" : "s"}
      </div>

      <Panel compact square className="divide-y divide-line overflow-hidden">
        {sorted.map((skill) => {
          const automation = automationStatusLabel(skill);
          const latestRun = latestRuns[skill.slug];
          const run = runStatusLabel(latestRun);
          const sourceCount = skill.sources?.length ?? 0;

          return (
            <div
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:grid-cols-[minmax(0,1.5fr)_repeat(4,auto)]"
              key={skill.slug}
            >
              <div className="grid gap-1">
                <SkillInline
                  category={skill.category}
                  href={skill.href}
                  iconUrl={skill.iconUrl}
                  slug={skill.slug}
                  title={skill.title}
                  versionLabel={skill.versionLabel}
                />
                <p className="m-0 line-clamp-1 text-xs text-ink-soft">
                  {skill.description}
                </p>
                <span className="text-xs text-ink-faint">
                  {sourceCount} source{sourceCount === 1 ? "" : "s"}
                </span>
              </div>

              <div className="hidden sm:block">
                <Badge color={automation.color}>{automation.label}</Badge>
              </div>

              <div className="hidden sm:block">
                <Badge color={run.color}>{run.label}</Badge>
              </div>

              <span className="hidden text-xs tabular-nums text-ink-soft sm:block">
                {latestRun ? formatRelativeDate(latestRun.finishedAt) : "—"}
              </span>

              <div className="flex gap-2">
                <Link
                  className="text-xs font-medium text-ink-soft transition-colors hover:text-ink"
                  href={`${skill.href}#author-studio`}
                >
                  Studio
                </Link>
                <Link
                  className="text-xs font-medium text-ink-soft transition-colors hover:text-ink"
                  href={`${skill.href}#activity`}
                >
                  Activity
                </Link>
              </div>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}
