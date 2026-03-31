"use client";

import { useState } from "react";

import Image from "next/image";

import { AutomationIcon, GlobeIcon } from "@/components/frontier-icons";
import { cn } from "@/lib/cn";
import { EXTERNAL_SKILL_SOURCES, type ExternalSkillSource } from "@/lib/external-skill-sources";
import { getNextWeeklyImportRunUtc } from "@/lib/weekly-import-schedule";

const SOURCE_ICON_OVERRIDES: Record<string, string> = {
  "cursor-directory": "/brands/cursor.svg",
  "anthropic-skills": "/brands/anthropic.svg",
  "awesome-mcp-servers": "/brands/anthropic.svg",
};

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return `In ${diffDays} days`;
}

function resolveIcon(source: ExternalSkillSource): string {
  return SOURCE_ICON_OVERRIDES[source.id] ?? source.iconUrl;
}

type ImportSourcesListProps = {
  isAdmin?: boolean;
};

export function ImportSourcesList({ isAdmin }: ImportSourcesListProps) {
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const nextImport = getNextWeeklyImportRunUtc();

  async function handleAdminTrigger() {
    setRunning(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/admin/imports", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setLastResult(`Imported ${data.imported}, skipped ${data.skipped}, errors ${data.errors}`);
      } else {
        setLastResult(data.error ?? "Import failed");
      }
    } catch (err) {
      setLastResult(err instanceof Error ? err.message : "Network error");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="grid gap-3">
      {/* Next import ribbon */}
      <div className="flex items-center gap-2.5 rounded-lg border border-accent/15 bg-accent/[0.04] px-3 py-2.5 dark:bg-accent/[0.06]">
        <AutomationIcon className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0 flex-1">
          <span className="text-xs font-medium text-ink">
            Next import: {formatRelativeDate(nextImport)}
          </span>
        </div>
        <span className="shrink-0 text-[0.6875rem] tabular-nums text-ink-faint">
          {nextImport.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>
      </div>

      {/* Sources */}
      <div className="grid gap-1">
        {EXTERNAL_SKILL_SOURCES.map((source) => (
          <a
            className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-paper-2/70 dark:hover:bg-paper-2/40"
            href={source.homepage}
            key={source.id}
            rel="noreferrer"
            target="_blank"
          >
            <SourceIcon source={source} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[0.8125rem] font-medium text-ink group-hover:text-accent transition-colors">
                  {source.name}
                </span>
                <span className={cn(
                  "shrink-0 rounded-sm px-1 py-px text-[0.5625rem] font-semibold uppercase tracking-wide",
                  source.trustTier === "official"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-paper-2 text-ink-faint dark:bg-paper-2/80"
                )}>
                  {source.trustTier}
                </span>
              </div>
              <p className="m-0 mt-0.5 line-clamp-2 text-[0.6875rem] leading-relaxed text-ink-soft">
                {source.description}
              </p>
            </div>
          </a>
        ))}
      </div>

      {isAdmin && (
        <div className="border-t border-line pt-2">
          <button
            type="button"
            onClick={handleAdminTrigger}
            disabled={running}
            className={cn(
              "w-full rounded-lg border border-accent/20 bg-accent/5 px-3 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/10",
              running && "cursor-not-allowed opacity-60"
            )}
          >
            {running ? "Running import…" : "Run import now"}
          </button>
          {lastResult && (
            <p className="mt-1.5 text-[0.65rem] text-ink-soft">{lastResult}</p>
          )}
        </div>
      )}
    </div>
  );
}

function SourceIcon({ source }: { source: ExternalSkillSource }) {
  const iconUrl = resolveIcon(source);
  const isLocal = iconUrl.startsWith("/");

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line/60 bg-paper-3 dark:bg-paper-2/80">
      {isLocal ? (
        <Image
          alt=""
          className="h-4 w-4 dark:invert"
          height={16}
          src={iconUrl}
          unoptimized
          width={16}
        />
      ) : iconUrl.includes("github.com") ? (
        <Image
          alt=""
          className="h-5 w-5 rounded-sm"
          height={20}
          src={iconUrl}
          unoptimized
          width={20}
        />
      ) : iconUrl.includes("simpleicons.org") ? (
        <Image
          alt=""
          className="h-4 w-4 dark:invert"
          height={16}
          src={iconUrl}
          unoptimized
          width={16}
        />
      ) : (
        <GlobeIcon className="h-4 w-4 text-ink-faint" />
      )}
    </div>
  );
}
