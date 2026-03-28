import type { LoopRunRecord, UsageEventRecord } from "@/lib/types";

export type RouteUsageSummary = {
  route: string;
  count: number;
  errorCount: number;
  avgDurationMs: number;
  lastAt: string;
};

export type UsageOverview = {
  totals: {
    pageViews: number;
    interactions: number;
    apiCalls: number;
    errorCalls: number;
    avgApiDurationMs: number;
  };
  routeUsage: RouteUsageSummary[];
  recentEvents: UsageEventRecord[];
  activityCounts: Array<{
    label: string;
    count: number;
  }>;
};

export type SkillUsageSummary = {
  pageViews: number;
  copies: number;
  saves: number;
  refreshes: number;
  apiCalls: number;
  lastSeenAt: string | null;
  recentEvents: UsageEventRecord[];
};

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

export function formatUsageEvent(event: UsageEventRecord): string {
  if (event.kind === "api_call") {
    return `${event.method ?? "CALL"} ${event.route ?? event.label}`;
  }

  return event.label;
}

export function buildUsageOverview(events: UsageEventRecord[]): UsageOverview {
  const pageViews = events.filter((event) => event.kind === "page_view").length;
  const apiEvents = events.filter((event) => event.kind === "api_call");
  const interactions = events.length - pageViews - apiEvents.length;
  const routeMap = new Map<string, { count: number; errorCount: number; durations: number[]; lastAt: string }>();

  for (const event of apiEvents) {
    const route = event.route ?? event.label;
    const current = routeMap.get(route) ?? {
      count: 0,
      errorCount: 0,
      durations: [],
      lastAt: event.at
    };

    current.count += 1;
    current.errorCount += event.ok === false || (event.status ?? 200) >= 400 ? 1 : 0;
    if (typeof event.durationMs === "number") {
      current.durations.push(event.durationMs);
    }
    if (event.at > current.lastAt) {
      current.lastAt = event.at;
    }

    routeMap.set(route, current);
  }

  const routeUsage = Array.from(routeMap.entries())
    .map(([route, value]) => ({
      route,
      count: value.count,
      errorCount: value.errorCount,
      avgDurationMs: average(value.durations),
      lastAt: value.lastAt
    }))
    .sort((left, right) => right.count - left.count || right.lastAt.localeCompare(left.lastAt))
    .slice(0, 6);

  const activityLabels: Array<[UsageEventRecord["kind"], string]> = [
    ["page_view", "views"],
    ["copy_prompt", "prompt copies"],
    ["copy_url", "link copies"],
    ["skill_save", "setup saves"],
    ["skill_refresh", "manual refreshes"],
    ["skill_import", "imports"],
    ["skill_create", "created skills"],
    ["automation_create", "automations"],
    ["agent_run", "agent runs"],
    ["search", "searches"]
  ];

  const activityCounts = activityLabels
    .map(([kind, label]) => ({
      label,
      count: events.filter((event) => event.kind === kind).length
    }))
    .filter((entry) => entry.count > 0)
    .slice(0, 6);

  return {
    totals: {
      pageViews,
      interactions,
      apiCalls: apiEvents.length,
      errorCalls: apiEvents.filter((event) => event.ok === false || (event.status ?? 200) >= 400).length,
      avgApiDurationMs: average(apiEvents.map((event) => event.durationMs ?? 0).filter((value) => value > 0))
    },
    routeUsage,
    recentEvents: events.slice().sort((left, right) => right.at.localeCompare(left.at)).slice(0, 12),
    activityCounts
  };
}

export function buildSkillUsageSummary(
  skillSlug: string,
  events: UsageEventRecord[],
  loopRuns: LoopRunRecord[]
): SkillUsageSummary {
  const relevantEvents = events
    .filter((event) => event.skillSlug === skillSlug || event.path?.includes(`/skills/${skillSlug}`))
    .sort((left, right) => right.at.localeCompare(left.at));

  return {
    pageViews: relevantEvents.filter((event) => event.kind === "page_view").length,
    copies: relevantEvents.filter((event) => event.kind === "copy_prompt" || event.kind === "copy_url").length,
    saves: relevantEvents.filter((event) => event.kind === "skill_save").length,
    refreshes: Math.max(
      relevantEvents.filter((event) => event.kind === "skill_refresh").length,
      loopRuns.filter((run) => run.slug === skillSlug).length
    ),
    apiCalls: relevantEvents.filter((event) => event.kind === "api_call").length,
    lastSeenAt: relevantEvents[0]?.at ?? null,
    recentEvents: relevantEvents.slice(0, 8)
  };
}
