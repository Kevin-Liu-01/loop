import type { UserSkillCadence } from "@/lib/types";

export const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
] as const;

export const CADENCE_SIMPLE_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "manual", label: "Manual" },
] as const;

// ---------------------------------------------------------------------------
// Cron time slots — 24 hourly slots across the day (UTC)
// ---------------------------------------------------------------------------

export type CronSlot = {
  hour: number;
  label: string;
  description: string;
};

export const CRON_SLOTS: CronSlot[] = [
  { hour: 0,  label: "12:05 AM UTC", description: "Asia-Pacific morning" },
  { hour: 1,  label: "1:05 AM UTC",  description: "East Asia midday" },
  { hour: 2,  label: "2:05 AM UTC",  description: "East Asia afternoon" },
  { hour: 3,  label: "3:05 AM UTC",  description: "India morning" },
  { hour: 4,  label: "4:05 AM UTC",  description: "India midday" },
  { hour: 5,  label: "5:05 AM UTC",  description: "Europe early morning" },
  { hour: 6,  label: "6:05 AM UTC",  description: "Europe morning" },
  { hour: 7,  label: "7:05 AM UTC",  description: "UK morning" },
  { hour: 8,  label: "8:05 AM UTC",  description: "Europe work hours" },
  { hour: 9,  label: "9:05 AM UTC",  description: "Europe midday" },
  { hour: 10, label: "10:05 AM UTC", description: "US East early morning" },
  { hour: 11, label: "11:05 AM UTC", description: "US East morning" },
  { hour: 12, label: "12:05 PM UTC", description: "US East midday" },
  { hour: 13, label: "1:05 PM UTC",  description: "US East afternoon" },
  { hour: 14, label: "2:05 PM UTC",  description: "US West morning" },
  { hour: 15, label: "3:05 PM UTC",  description: "US West midday" },
  { hour: 16, label: "4:05 PM UTC",  description: "US West afternoon" },
  { hour: 17, label: "5:05 PM UTC",  description: "US West end of day" },
  { hour: 18, label: "6:05 PM UTC",  description: "US evening" },
  { hour: 19, label: "7:05 PM UTC",  description: "US late evening" },
  { hour: 20, label: "8:05 PM UTC",  description: "Americas night" },
  { hour: 21, label: "9:05 PM UTC",  description: "Pacific evening" },
  { hour: 22, label: "10:05 PM UTC", description: "Asia-Pacific early" },
  { hour: 23, label: "11:05 PM UTC", description: "Asia-Pacific pre-dawn" },
];

export const DEFAULT_PREFERRED_HOUR = 12;

export function isValidCronSlotHour(hour: number): boolean {
  return Number.isInteger(hour) && hour >= 0 && hour <= 23;
}

export const PREFERRED_HOUR_SELECT_OPTIONS = CRON_SLOTS.map((slot) => ({
  value: String(slot.hour),
  label: `${slot.label} \u2014 ${slot.description}`,
}));

// ---------------------------------------------------------------------------
// Day-of-week options (for weekly cadence)
// ---------------------------------------------------------------------------

export const DEFAULT_PREFERRED_DAY = 1; // Monday

export const DAY_OF_WEEK_OPTIONS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
] as const;

export function isValidDayOfWeek(day: number): boolean {
  return Number.isInteger(day) && day >= 0 && day <= 6;
}
