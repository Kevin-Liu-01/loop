import type { CategoryDefinition, CategoryBrief, SkillRecord } from "@/lib/types";

export function buildVersionLabel(version: number): string {
  return `v${version}`;
}

export function parseVersionSegment(segment: string): number | null {
  const match = /^v(\d+)$/i.exec(segment.trim());
  if (!match) {
    return null;
  }

  const version = Number(match[1]);
  return Number.isInteger(version) && version > 0 ? version : null;
}

export function buildSkillVersionHref(slug: string, version: number): string {
  return `/skills/${slug}/${buildVersionLabel(version)}`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatDateTime(value: string): string {
  return `${formatDate(value)} · ${formatTime(value)}`;
}

export function formatAutomationSchedule(schedule: string): string {
  if (!schedule) {
    return "Manual";
  }

  if (schedule === "FREQ=HOURLY;INTERVAL=6") {
    return "Every 6 hours";
  }

  if (schedule === "FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;BYHOUR=9;BYMINUTE=0") {
    return "Daily · 9:00 AM";
  }

  if (schedule === "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=9;BYMINUTE=0") {
    return "Weekdays · 9:00 AM";
  }

  if (schedule === "FREQ=WEEKLY;BYDAY=MO;BYHOUR=9;BYMINUTE=0") {
    return "Monday · 9:00 AM";
  }

  return schedule;
}

export function byUpdatedAtDesc<T extends { updatedAt?: string; publishedAt?: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftValue = left.updatedAt ?? left.publishedAt ?? "";
    const rightValue = right.updatedAt ?? right.publishedAt ?? "";
    return +new Date(rightValue) - +new Date(leftValue);
  });
}

export function getCategory(
  categories: CategoryDefinition[],
  slug: string
): CategoryDefinition | undefined {
  return categories.find((category) => category.slug === slug);
}

export function getBrief(briefs: CategoryBrief[], slug: string): CategoryBrief | undefined {
  return briefs.find((brief) => brief.slug === slug);
}

export function getSkill(skills: SkillRecord[], slug: string): SkillRecord | undefined {
  return skills.find((skill) => skill.slug === slug);
}
