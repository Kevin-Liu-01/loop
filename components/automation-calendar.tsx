"use client";

import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/cn";
import { getRunDatesForMonth } from "@/lib/schedule";
import type { AutomationSummary } from "@/lib/types";

const ACCENT_COLORS = [
  "bg-accent/80",
  "bg-emerald-500/70",
  "bg-sky-500/70",
  "bg-violet-500/70",
  "bg-amber-500/70",
  "bg-rose-500/70"
];

type AutomationCalendarProps = {
  automations: AutomationSummary[];
  onDaySelect?: (date: Date) => void;
};

type DayAutomation = {
  automation: AutomationSummary;
  color: string;
};

export function AutomationCalendar({ automations, onDaySelect }: AutomationCalendarProps) {
  const [month, setMonth] = useState(new Date());

  const activeAutomations = useMemo(
    () => automations.filter((a) => a.status === "ACTIVE"),
    [automations]
  );

  const dayMap = useMemo(() => {
    const map = new Map<string, DayAutomation[]>();
    const year = month.getFullYear();
    const m = month.getMonth();

    activeAutomations.forEach((automation, index) => {
      const color = ACCENT_COLORS[index % ACCENT_COLORS.length];
      const dates = getRunDatesForMonth(automation.schedule, year, m);

      dates.forEach((date) => {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const existing = map.get(key) ?? [];
        existing.push({ automation, color });
        map.set(key, existing);
      });
    });

    return map;
  }, [activeAutomations, month]);

  const scheduledDays = useMemo(
    () => Array.from(dayMap.keys()).map((iso) => new Date(iso + "T00:00:00")),
    [dayMap]
  );

  return (
    <div className="grid gap-4">
      <DayPicker
        mode="single"
        month={month}
        onMonthChange={setMonth}
        onSelect={(day) => day && onDaySelect?.(day)}
        modifiers={{ scheduled: scheduledDays }}
        classNames={{
          root: "automation-calendar",
          months: "w-full",
          month_grid: "w-full border-collapse",
          month_caption: "flex items-center justify-between px-1 pb-4",
          caption_label: "text-base font-semibold tracking-tight text-ink font-serif",
          nav: "flex items-center gap-1",
          button_previous: cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-xl border border-line bg-paper-3 text-ink-soft",
            "transition-colors hover:border-accent hover:text-ink"
          ),
          button_next: cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-xl border border-line bg-paper-3 text-ink-soft",
            "transition-colors hover:border-accent hover:text-ink"
          ),
          weekdays: "border-b border-line",
          weekday: "pb-2 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint",
          week: "",
          day: "relative p-0 text-center",
          day_button: cn(
            "relative flex h-12 w-full flex-col items-center justify-start gap-0.5 rounded-xl pt-1.5",
            "text-sm tabular-nums text-ink transition-colors",
            "hover:bg-paper-2"
          ),
          selected: "bg-accent/10! text-accent! font-semibold",
          today: "font-bold text-accent",
          outside: "text-ink-faint/40",
          disabled: "text-ink-faint/20"
        }}
        components={{
          DayButton: ({ day, modifiers: _modifiers, className, ...props }) => {
            const key = day.isoDate;
            const entries = dayMap.get(key);

            return (
              <button className={className} {...props}>
                <span>{day.date.getDate()}</span>
                {entries && entries.length > 0 && (
                  <span className="flex items-center gap-0.5">
                    {entries.slice(0, 4).map((entry, i) => (
                      <span
                        className={cn("h-1.5 w-1.5 rounded-full", entry.color)}
                        key={`${entry.automation.id}-${i}`}
                        title={entry.automation.name}
                      />
                    ))}
                    {entries.length > 4 && (
                      <span className="text-[9px] text-ink-faint">+{entries.length - 4}</span>
                    )}
                  </span>
                )}
              </button>
            );
          }
        }}
      />

      {activeAutomations.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3">
          {activeAutomations.map((automation, index) => {
            const color = ACCENT_COLORS[index % ACCENT_COLORS.length];
            const year = month.getFullYear();
            const m = month.getMonth();
            const count = getRunDatesForMonth(automation.schedule, year, m).length;

            return (
              <div className="flex items-center gap-2 text-xs text-ink-soft" key={automation.id}>
                <span className={cn("h-2 w-2 rounded-full", color)} />
                <span className="max-w-[140px] truncate">{automation.name}</span>
                <span className="tabular-nums text-ink-faint">{count} runs</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
