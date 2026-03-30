const WEEKDAY_MAP: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6
};

type ParsedRRule = {
  freq: string;
  interval: number;
  byDay: number[];
  byHour: number;
  byMinute: number;
};

function parseRRule(rrule: string): ParsedRRule | null {
  if (!rrule) return null;

  const parts = Object.fromEntries(
    rrule.split(";").map((segment) => {
      const [key, value] = segment.split("=");
      return [key, value];
    })
  );

  const byDayStr = parts.BYDAY ?? "";
  const byDay = byDayStr
    ? byDayStr.split(",").map((d) => WEEKDAY_MAP[d] ?? -1).filter((d) => d >= 0)
    : [0, 1, 2, 3, 4, 5, 6];

  return {
    freq: parts.FREQ ?? "DAILY",
    interval: parseInt(parts.INTERVAL ?? "1", 10),
    byDay,
    byHour: parseInt(parts.BYHOUR ?? "0", 10),
    byMinute: parseInt(parts.BYMINUTE ?? "0", 10)
  };
}

export function getRunDatesForMonth(rrule: string, year: number, month: number): Date[] {
  const parsed = parseRRule(rrule);
  if (!parsed) return [];

  const dates: Date[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  if (parsed.freq === "HOURLY") {
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(year, month, day));
    }
    return dates;
  }

  const byDaySet = new Set(parsed.byDay);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    if (byDaySet.has(date.getDay())) {
      dates.push(date);
    }
  }

  return dates;
}

export function getNextRunDate(rrule: string): Date | null {
  const parsed = parseRRule(rrule);
  if (!parsed) return null;

  const now = new Date();
  const byDaySet = new Set(parsed.byDay);

  for (let offset = 0; offset < 14; offset++) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(parsed.byHour, parsed.byMinute, 0, 0);

    if (parsed.freq === "HOURLY") {
      if (offset === 0) {
        const nextHour = Math.ceil(now.getHours() / parsed.interval) * parsed.interval;
        candidate.setHours(nextHour, 0, 0, 0);
        if (candidate > now) return candidate;
        candidate.setDate(candidate.getDate() + 1);
        candidate.setHours(0, 0, 0, 0);
      }
      return candidate;
    }

    if (!byDaySet.has(candidate.getDay())) continue;
    if (candidate > now) return candidate;
  }

  return null;
}

export function countMonthlyRuns(rrule: string, year: number, month: number): number {
  return getRunDatesForMonth(rrule, year, month).length;
}

export function formatNextRun(rrule: string): string {
  const next = getNextRunDate(rrule);
  if (!next) return "—";

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
