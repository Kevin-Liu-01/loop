import type { UserSkillCadence } from "@/lib/types";

export const DEFAULT_WEEKLY_DAY = 1; // Monday

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function formatTime12h(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h12}:05 ${ampm}`;
}

function resolveDay(preferredDay?: number): number {
  if (preferredDay !== undefined && preferredDay >= 0 && preferredDay <= 6) {
    return preferredDay;
  }
  return DEFAULT_WEEKLY_DAY;
}

// ---------------------------------------------------------------------------
// Schedule label
// ---------------------------------------------------------------------------

export function formatScheduleLabel(
  cadence: UserSkillCadence,
  preferredHour: number,
  preferredDay?: number,
): string {
  if (cadence === "manual") return "Manual";
  const time = formatTime12h(preferredHour);
  if (cadence === "weekly") return `${DAY_LABELS[resolveDay(preferredDay)]} · ${time}`;
  return `Daily · ${time}`;
}

// ---------------------------------------------------------------------------
// Next run
// ---------------------------------------------------------------------------

export function getNextRunDate(
  cadence: UserSkillCadence,
  preferredHour: number,
  preferredDay?: number,
): Date | null {
  if (cadence === "manual") return null;

  const now = new Date();
  const candidate = new Date(now);
  candidate.setUTCHours(preferredHour, 5, 0, 0);

  if (cadence === "daily") {
    if (candidate <= now) {
      candidate.setUTCDate(candidate.getUTCDate() + 1);
    }
    return candidate;
  }

  const targetDay = resolveDay(preferredDay);
  const dayOfWeek = candidate.getUTCDay();
  let daysUntil = (targetDay - dayOfWeek + 7) % 7;
  if (daysUntil === 0 && candidate <= now) {
    daysUntil = 7;
  }
  candidate.setUTCDate(candidate.getUTCDate() + daysUntil);
  return candidate;
}

function formatRelativeDate(next: Date): string {
  const now = new Date();
  const diff = next.getTime() - now.getTime();
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (hours < 1) return "< 1h";
  if (hours < 24) return `in ${hours}h`;
  if (days === 1) return "tomorrow";
  if (days < 7) return `in ${days} days`;

  return next.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatNextRun(
  cadence: UserSkillCadence,
  preferredHour: number,
  preferredDay?: number,
): string {
  const next = getNextRunDate(cadence, preferredHour, preferredDay);
  if (!next) return "—";
  return formatRelativeDate(next);
}

// ---------------------------------------------------------------------------
// Calendar helpers
// ---------------------------------------------------------------------------

export function getRunDatesForMonth(
  cadence: UserSkillCadence,
  year: number,
  month: number,
  preferredDay?: number,
): Date[] {
  if (cadence === "manual") return [];

  const dates: Date[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const targetDay = resolveDay(preferredDay);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    if (cadence === "daily") {
      dates.push(date);
    } else if (cadence === "weekly" && date.getDay() === targetDay) {
      dates.push(date);
    }
  }

  return dates;
}

export function countMonthlyRuns(
  cadence: UserSkillCadence,
  year: number,
  month: number,
  preferredDay?: number,
): number {
  return getRunDatesForMonth(cadence, year, month, preferredDay).length;
}

export function isScheduledOnDate(
  cadence: UserSkillCadence,
  date: Date,
  preferredDay?: number,
): boolean {
  if (cadence === "manual") return false;
  if (cadence === "daily") return true;
  return date.getDay() === resolveDay(preferredDay);
}
