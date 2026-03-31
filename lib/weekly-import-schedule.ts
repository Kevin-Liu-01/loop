/**
 * Platform weekly skill import cron: Mondays at 09:00 UTC.
 */
export function getNextWeeklyImportRunUtc(now: Date = new Date()): Date {
  const hourUtc = 9;
  const minuteUtc = 0;
  for (let dayOffset = 0; dayOffset < 10; dayOffset += 1) {
    const d = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + dayOffset,
        hourUtc,
        minuteUtc,
        0,
        0
      )
    );
    if (d.getUTCDay() !== 1) continue;
    if (d.getTime() > now.getTime()) return d;
  }
  const fallback = new Date(now);
  fallback.setUTCDate(fallback.getUTCDate() + 7);
  fallback.setUTCHours(hourUtc, minuteUtc, 0, 0);
  return fallback;
}
