"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CopyIcon, ExternalLinkIcon, MoreHorizontalIcon, PlugIcon, TerminalIcon, WorkflowIcon } from "lucide-react";

import {
  ActivityDashboard,
  shouldShowActivityDashboard,
} from "@/components/activity-dashboard";
import { SkillAuthorBadge } from "@/components/skill-author-badge";
import { McpIcon, SkillIcon } from "@/components/ui/skill-icon";
import { UsageComparisonProvider } from "@/components/usage-comparison-context";
import { AppGridShell } from "@/components/app-grid-shell";
import { ArrowRightIcon, SearchIcon } from "@/components/frontier-icons";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { EmptyCard } from "@/components/ui/empty-card";
import { FilterChip } from "@/components/ui/filter-chip";
import { PageShell } from "@/components/ui/page-shell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import { StatusDot } from "@/components/ui/status-dot";
import { Button } from "@/components/ui/button";
import { textFieldSearch } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { computeFreshness } from "@/lib/freshness";
import { buildMcpVersionHref } from "@/lib/format";
import { supportsSandboxMcp } from "@/lib/mcp-utils";
import { formatNextRun } from "@/lib/schedule";
import { pageHeaderSub, pageInsetPadX, pageInsetPadY } from "@/lib/ui-layout";
import { RelativeTime } from "@/components/relative-time";
import type {
  AutomationSummary,
  CategoryDefinition,
  ImportedMcpDocument,
  LoopRunRecord,
  SkillRecord
} from "@/lib/types";
import type { UsageOverview } from "@/lib/usage";

type HomeTab = "skills" | "mcps";

type HomeShellProps = {
  automations: AutomationSummary[];
  categories: CategoryDefinition[];
  mcps: ImportedMcpDocument[];
  skills: SkillRecord[];
  loopRuns: LoopRunRecord[];
  usageOverview: UsageOverview;
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
    .sort((a, b) => {
      const featuredDelta = (b.featuredRank ?? 0) - (a.featuredRank ?? 0);
      if (featuredDelta !== 0) return featuredDelta;

      const qualityDelta = (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
      if (qualityDelta !== 0) return qualityDelta;

      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }

      return +new Date(b.updatedAt) - +new Date(a.updatedAt);
    });
}

function originLabel(skill: SkillRecord): string {
  if (skill.origin === "user") {
    return skill.automation?.enabled ? "auto" : "tracked";
  }
  return skill.origin === "remote" ? "imported" : "catalog";
}

function skillMetaSegments(
  skill: SkillRecord,
  freshness: { label: string }
): string[] {
  const segments = [originLabel(skill), freshness.label];

  const schedule = skill.automations?.[0]?.schedule;
  if (skill.automation?.enabled && schedule) {
    const next = formatNextRun(schedule);
    if (next !== "—") segments.push(`Next ${next}`);
  }

  const srcCount = skill.sources?.length ?? 0;
  if (srcCount > 0) {
    segments.push(`${srcCount} source${srcCount === 1 ? "" : "s"}`);
  }

  return segments;
}

const MCP_TAG_GROUPS = [
  "all", "official", "database", "search", "browser", "productivity",
  "developer-tools", "infra", "ai", "security", "utility",
] as const;

function filterMcps(mcps: ImportedMcpDocument[], query: string, tagFilter: string): ImportedMcpDocument[] {
  const normalized = query.trim().toLowerCase();
  return mcps
    .filter((m) => {
      if (tagFilter === "all") return true;
      return m.tags.some((t) => t === tagFilter || t.includes(tagFilter));
    })
    .filter((m) => {
      if (!normalized) return true;
      const haystack = [m.name, m.description, ...m.tags].join(" ").toLowerCase();
      return haystack.includes(normalized);
    })
    .sort((a, b) => {
      const sandboxDelta = Number(supportsSandboxMcp(b)) - Number(supportsSandboxMcp(a));
      if (sandboxDelta !== 0) return sandboxDelta;

      const verificationRank = (status?: ImportedMcpDocument["verificationStatus"]) => {
        switch (status) {
          case "verified":
            return 3;
          case "partial":
            return 2;
          case "unverified":
            return 1;
          case "broken":
          default:
            return 0;
        }
      };

      const verificationDelta =
        verificationRank(b.verificationStatus) - verificationRank(a.verificationStatus);
      if (verificationDelta !== 0) return verificationDelta;

      return a.name.localeCompare(b.name);
    });
}

export function HomeShell({ automations, categories, mcps = [], skills, loopRuns, usageOverview }: HomeShellProps) {
  const router = useRouter();
  const [tab, setTab] = useState<HomeTab>("skills");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [mcpTagFilter, setMcpTagFilter] = useState("all");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const saved = window.localStorage.getItem("loop.home.filter");
    if (saved) setCategoryFilter(saved);
    const savedTab = window.localStorage.getItem("loop.home.tab") as HomeTab | null;
    if (savedTab === "skills" || savedTab === "mcps") setTab(savedTab);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("loop.home.filter", categoryFilter);
  }, [categoryFilter]);

  useEffect(() => {
    window.localStorage.setItem("loop.home.tab", tab);
  }, [tab]);

  function switchTab(next: HomeTab) {
    setTab(next);
    setQuery("");
    if (next === "skills") setMcpTagFilter("all");
    else setCategoryFilter("all");
  }

  const filtered = useMemo(
    () => filterSkills(skills, deferredQuery, categoryFilter),
    [skills, deferredQuery, categoryFilter]
  );

  const filteredMcps = useMemo(
    () => filterMcps(mcps, deferredQuery, mcpTagFilter),
    [mcps, deferredQuery, mcpTagFilter]
  );

  const mcpTagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of mcps) {
      for (const t of m.tags) {
        for (const group of MCP_TAG_GROUPS) {
          if (group !== "all" && (t === group || t.includes(group))) {
            counts.set(group, (counts.get(group) ?? 0) + 1);
          }
        }
      }
    }
    return counts;
  }, [mcps]);

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

  const showActivitySidebar = shouldShowActivityDashboard(usageOverview, automations);

  const skillsList = (
    <div className="grid gap-0">
      {filtered.length > 0 ? (
        filtered.map((skill) => {
          const freshness = computeFreshness(skill, loopRuns);
          const summary = skill.updates?.[0]?.whatChanged ?? skill.description;

          return (
            <article
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-line py-3 first:border-t-0 first:pt-0 max-sm:grid-cols-1"
              key={skill.slug}
            >
              <Link className="group min-w-0" href={skill.href}>
                <div className="flex items-start gap-2.5">
                  <SkillIcon className="mt-0.5 rounded-md" iconUrl={skill.iconUrl} size={28} slug={skill.slug} />
                  <div className="min-w-0 grid flex-1 gap-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <StatusDot tone={freshness.tone} />
                      <span className="truncate font-serif text-[0.94rem] font-medium text-ink group-hover:text-ink-soft">
                        {skill.title}
                      </span>
                      <Badge>{skill.category}</Badge>
                      <Badge muted>{skill.versionLabel}</Badge>
                    </div>
                    <p className="m-0 line-clamp-1 text-sm text-ink-soft">{summary}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                      <SkillAuthorBadge author={skill.author} compact linked={false} ownerName={skill.ownerName} />
                      <span>
                        <RelativeTime date={skill.updatedAt} /> · {skillMetaSegments(skill, freshness).join(" · ")}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-1.5 max-sm:pl-4">
                {skill.automation?.enabled && (
                  <Button
                    onClick={() => router.push(`${skill.href}#automation`)}
                    size="icon-sm"
                    title="View automation"
                    variant="ghost"
                  >
                    <WorkflowIcon className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button onClick={() => router.push(skill.href)} size="sm" variant="ghost">
                  Open
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon-sm" variant="ghost" type="button">
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => router.push(`${skill.href}#automation`)}>
                      <WorkflowIcon />
                      View automation
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigator.clipboard.writeText(skill.href)}>
                      <CopyIcon />
                      Copy link
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => router.push(`/sandbox?skill=${skill.slug}`)}>
                      <TerminalIcon />
                      Open in sandbox
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => window.open(skill.href, "_blank")}>
                      <ExternalLinkIcon />
                      Open in new tab
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </article>
          );
        })
      ) : (
        <EmptyCard icon={<SearchIcon className="h-6 w-6" />}>No skills match your search.</EmptyCard>
      )}
    </div>
  );

  const mcpsList = (
    <div className="grid gap-0">
      {filteredMcps.length > 0 ? (
        filteredMcps.map((mcp) => {
          const isRunnable = supportsSandboxMcp(mcp);
          const sandboxHref = `/sandbox?mcp=${encodeURIComponent(mcp.slug ?? mcp.name)}`;
          const mcpHref = buildMcpVersionHref(mcp.name, mcp.version);
          return (
            <article
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-line py-3 first:border-t-0 first:pt-0 max-sm:grid-cols-1"
              key={mcp.id}
            >
              <Link className="group min-w-0" href={mcpHref}>
                <div className="flex items-start gap-2.5">
                  <McpIcon className="mt-0.5" homepageUrl={mcp.homepageUrl} iconUrl={mcp.iconUrl} name={mcp.name} size={28} />
                  <div className="min-w-0 grid flex-1 gap-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-block h-2 w-2 shrink-0 rounded-full",
                          isRunnable ? "bg-emerald-500" : "bg-ink-faint/40"
                        )}
                      />
                      <span className="truncate font-serif text-[0.94rem] font-medium text-ink group-hover:text-ink-soft">
                        {mcp.name}
                      </span>
                      <Badge>{mcp.transport}</Badge>
                      <Badge muted>{mcp.versionLabel}</Badge>
                    </div>
                    <p className="m-0 line-clamp-1 text-sm text-ink-soft">{mcp.description}</p>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
                      {mcp.envKeys.length > 0 && (
                        <span>{mcp.envKeys.length} env key{mcp.envKeys.length !== 1 ? "s" : ""}</span>
                      )}
                      {mcp.envKeys.length > 0 && mcp.tags.length > 0 && <span>·</span>}
                      {mcp.tags.slice(0, 3).map((t) => (
                        <span className="rounded bg-paper-3 px-1.5 py-0.5 text-[0.625rem] font-medium" key={t}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-1.5 max-sm:pl-4">
                <Button onClick={() => router.push(mcpHref)} size="sm" variant="ghost">
                  Open
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon-sm" variant="ghost" type="button">
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => navigator.clipboard.writeText(mcp.manifestUrl)}>
                      <CopyIcon />
                      Copy manifest URL
                    </DropdownMenuItem>
                    {mcp.homepageUrl && (
                      <DropdownMenuItem onSelect={() => window.open(mcp.homepageUrl, "_blank")}>
                        <ExternalLinkIcon />
                        Open homepage
                      </DropdownMenuItem>
                    )}
                    {isRunnable ? (
                      <DropdownMenuItem onSelect={() => router.push(sandboxHref)}>
                        <TerminalIcon />
                        Open in sandbox
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </article>
          );
        })
      ) : (
        <EmptyCard icon={<PlugIcon className="h-6 w-6" />}>No MCPs match your search.</EmptyCard>
      )}
    </div>
  );

  const skillsFilters = (
    <div className="grid gap-3">
      <label className="relative block">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
        <input
          className={textFieldSearch}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills..."
          value={query}
        />
      </label>

      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter by category">
        <FilterChip active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")} type="button">
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
            <span className="text-[0.65rem] opacity-60">{categoryCounts.get(cat.slug) ?? 0}</span>
          </FilterChip>
        ))}
      </div>

      <div className="text-[0.6875rem] font-medium tabular-nums tracking-wide text-ink-faint">
        {filtered.length} result{filtered.length !== 1 ? "s" : ""}
      </div>

      {skillsList}
    </div>
  );

  const mcpsFilters = (
    <div className="grid gap-3">
      <label className="relative block">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
        <input
          className={textFieldSearch}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search MCPs..."
          value={query}
        />
      </label>

      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter by tag">
        {MCP_TAG_GROUPS.map((tag) => (
          <FilterChip
            active={mcpTagFilter === tag}
            key={tag}
            onClick={() => setMcpTagFilter(tag)}
            type="button"
          >
            {tag === "all" ? "All" : tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, " ")}
            {tag !== "all" && (
              <span className="text-[0.65rem] opacity-60">{mcpTagCounts.get(tag) ?? 0}</span>
            )}
          </FilterChip>
        ))}
      </div>

      <div className="text-[0.6875rem] font-medium tabular-nums tracking-wide text-ink-faint">
        {filteredMcps.length} result{filteredMcps.length !== 1 ? "s" : ""}
      </div>

      {mcpsList}
    </div>
  );

  const executableMcpCount = mcps.filter((mcp) => supportsSandboxMcp(mcp)).length;

  const pageTitle = (
    <div className="grid gap-2">
      <h1 className="m-0 flex items-baseline gap-4 font-serif text-2xl font-medium tracking-[-0.03em]">
        <button
          className={cn(
            "transition-colors",
            tab === "skills" ? "text-ink" : "text-ink-faint hover:text-ink-soft"
          )}
          onClick={() => switchTab("skills")}
          type="button"
        >
          Skills
        </button>
        <button
          className={cn(
            "transition-colors",
            tab === "mcps" ? "text-ink" : "text-ink-faint hover:text-ink-soft"
          )}
          onClick={() => switchTab("mcps")}
          type="button"
        >
          MCPs
        </button>
      </h1>
      <p className={pageHeaderSub}>
        {tab === "skills" ? (
          <>
            <span className="tabular-nums">{skills.length}</span> in catalog ·{" "}
            <span className="tabular-nums">{trackedCount}</span> tracked
          </>
        ) : (
          <>
            <span className="tabular-nums">{mcps.length}</span> server{mcps.length !== 1 ? "s" : ""}
            {executableMcpCount > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400">
                {" "}· {executableMcpCount} executable
              </span>
            )}
          </>
        )}
      </p>
    </div>
  );

  const activeFilters = tab === "skills" ? skillsFilters : mcpsFilters;

  return (
    <AppGridShell header={<SiteHeader onNewSkill={handleNewSkill} />}>
      <PageShell inset narrow className="flex min-h-0 flex-1 flex-col">
        {showActivitySidebar ? (
          <UsageComparisonProvider>
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <div
              className={cn(
                "flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto border-line lg:border-r",
                pageInsetPadX,
                pageInsetPadY
              )}
            >
              <header className="min-w-0">{pageTitle}</header>
              {activeFilters}
            </div>

            <aside
              aria-label="Activity insights"
              className={cn(
                "flex min-h-0 w-full flex-col gap-4 overflow-y-auto border-t border-line lg:w-[min(360px,36vw)] lg:max-w-[360px] lg:min-w-[280px] lg:shrink-0 lg:border-t-0",
                pageInsetPadX,
                pageInsetPadY
              )}
            >
              <header className="min-w-0">
                <h2 className="m-0 font-serif text-2xl font-medium tracking-[-0.03em] text-ink">
                  Activity
                </h2>
              </header>
              <ActivityDashboard
                automations={automations}
                overview={usageOverview}
                variant="sidebar"
              />
            </aside>
          </div>
          </UsageComparisonProvider>
        ) : (
          <div
            className={cn(
              "grid min-h-0 flex-1 gap-4 overflow-y-auto",
              pageInsetPadX,
              pageInsetPadY
            )}
          >
            <header className="min-w-0">{pageTitle}</header>
            <div className="grid min-w-0 gap-4">{activeFilters}</div>
          </div>
        )}
      </PageShell>
    </AppGridShell>
  );
}
