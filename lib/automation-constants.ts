export const CADENCE_OPTIONS = [
  { value: "daily-9", label: "Daily · 9:00 AM" },
  { value: "weekdays-9", label: "Weekdays · 9:00 AM" },
  { value: "weekly-mon", label: "Monday · 9:00 AM" },
  { value: "hourly-6", label: "Every 6 hours" }
] as const;

export type CadenceValue = (typeof CADENCE_OPTIONS)[number]["value"];

const RRULE_TO_CADENCE: Record<string, CadenceValue> = {
  "FREQ=HOURLY;INTERVAL=6": "hourly-6",
  "FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;BYHOUR=9;BYMINUTE=0": "daily-9",
  "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=9;BYMINUTE=0": "weekdays-9",
  "FREQ=WEEKLY;BYDAY=MO;BYHOUR=9;BYMINUTE=0": "weekly-mon"
};

const CADENCE_TO_RRULE: Record<CadenceValue, string> = {
  "hourly-6": "FREQ=HOURLY;INTERVAL=6",
  "daily-9": "FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;BYHOUR=9;BYMINUTE=0",
  "weekdays-9": "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=9;BYMINUTE=0",
  "weekly-mon": "FREQ=WEEKLY;BYDAY=MO;BYHOUR=9;BYMINUTE=0"
};

export function rruleToCadence(rrule: string): CadenceValue {
  return RRULE_TO_CADENCE[rrule] ?? "daily-9";
}

export function cadenceToRRule(cadence: CadenceValue): string {
  return CADENCE_TO_RRULE[cadence];
}
