"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SearchIcon } from "@/components/frontier-icons";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { EmptyCard } from "@/components/ui/empty-card";
import { FilterChip } from "@/components/ui/filter-chip";
import { PageShell } from "@/components/ui/page-shell";
import { StatusDot } from "@/components/ui/status-dot";
import { Button } from "@/components/ui/button";
import { textFieldBase } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { computeFreshness } from "@/lib/freshness";
import { formatRelativeDate } from "@/lib/format";
import type {
  CategoryDefinition,
  LoopRunRecord,
  SkillRecord
} from "@/lib/types";

type HomeShellProps = {
  categories: CategoryDefinition[];
  skills: SkillRecord[];
  loopRuns: LoopRunRecord[];
};

function filterSkills(
  skills: SkillRecord[],
  query: string,
  categoryFilter: string
): SkillRecord[] {
  const normalized = query.trim().toLowerCase();

  return skills
    .filter((s) => (categoryFilter === "all" ? true : s.category === categoryFilter))
    .filter((s) => {
      if (!normalized) return true;
      const haystack = [s.title, s.description, s.category, ...s.tags]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    })
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

function originLabel(skill: SkillRecord): string {
  if (skill.origin === "user") {
    return skill.automation?.enabled ? "auto" : "tracked";
  }
  return skill.origin === "remote" ? "imported" : "catalog";
}

export function HomeShell({ categories, skills, loopRuns }: HomeShellProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const saved = window.localStorage.getItem("loop.home.filter");
    if (saved) setCategoryFilter(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("loop.home.filter", categoryFilter);
  }, [categoryFilter]);

  const filtered = useMemo(
    () => filterSkills(skills, deferredQuery, categoryFilter),
    [skills, deferredQuery, categoryFilter]
  );

  const trackedCount = skills.filter((s) => s.origin === "user").length;

  const handleNewSkill = useCallback(() => {
    window.dispatchEvent(new Event("loop:open-new-skill"));
  }, []);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of skills) {
      counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
    }
    return counts;
  }, [skills]);

  return (
    <>
      <SiteHeader onNewSkill={handleNewSkill} />

      <PageShell narrow className="grid gap-5 pt-8">
        <div className="grid gap-1">
          <h1 className="m-0 text-2xl font-semibold tracking-tight text-ink">
            Skills
          </h1>
          <p className="m-0 text-sm text-ink-soft">
            {skills.length} total · {trackedCount} tracked
          </p>
        </div>

        <label className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            className={cn(textFieldBase, "pl-10")}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills..."
            value={query}
          />
        </label>

        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by category">
          <FilterChip
            active={categoryFilter === "all"}
            onClick={() => setCategoryFilter("all")}
            type="button"
          >
            All
          </FilterChip>
          {categories.map((cat) => (
            <FilterChip
              active={categoryFilter === cat.slug}
              key={cat.slug}
              onClick={() => setCategoryFilter(cat.slug)}
              type="button"
            >
              {cat.title}
              <span className="text-[0.65rem] opacity-60">
                {categoryCounts.get(cat.slug) ?? 0}
              </span>
            </FilterChip>
          ))}
        </div>

        <div className="text-xs text-ink-faint tabular-nums">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </div>

        <div className="grid gap-0">
          {filtered.length > 0 ? (
            filtered.map((skill) => {
              const freshness = computeFreshness(skill, loopRuns);
              const summary =
                skill.updates?.[0]?.whatChanged ?? skill.description;

              return (
                <article
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-line py-3.5 first:border-t-0 first:pt-0 max-sm:grid-cols-1"
                  key={skill.slug}
                >
                  <Link className="group grid min-w-0 gap-1" href={skill.href}>
                    <div className="flex items-center gap-2">
                      <StatusDot tone={freshness.tone} />
                      <span className="truncate text-[0.94rem] font-semibold text-ink group-hover:text-ink-soft">
                        {skill.title}
                      </span>
                      <Badge className="shrink-0">{skill.category}</Badge>
                      <Badge className="shrink-0" muted>
                        {skill.versionLabel}
                      </Badge>
                    </div>
                    <p className="m-0 line-clamp-1 pl-4 text-sm text-ink-soft">
                      {summary}
                    </p>
                    <span className="pl-4 text-xs text-ink-faint">
                      {formatRelativeDate(skill.updatedAt)} · {originLabel(skill)} ·{" "}
                      {freshness.label}
                    </span>
                  </Link>

                  <div className="flex items-center gap-2 max-sm:pl-4">
                    <Button
                      onClick={() => router.push(skill.href)}
                      size="sm"
                      variant="ghost"
                    >
                      Open
                    </Button>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyCard>No skills match your search.</EmptyCard>
          )}
        </div>
      </PageShell>
    </>
  );
}
