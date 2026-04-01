"use client";

import { Children, useMemo, useState } from "react";
import { Chevron, DayPicker } from "react-day-picker";
import type { MonthProps } from "react-day-picker";

import { AutomationDayModal, type DayAutomationEntry } from "@/components/automation-day-modal";
import { AutomationIcon } from "@/components/frontier-icons";
import { Badge } from "@/components/ui/badge";
import { SkillIcon } from "@/components/ui/skill-icon";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/cn";
import { formatNextRun, getRunDatesForMonth, isScheduledOnDate } from "@/lib/schedule";
import { formatTagLabel, getTagColorForCategory } from "@/lib/tag-utils";
import type { AutomationSummary, SkillRecord } from "@/lib/types";

const LEGEND_COLLAPSED_LIMIT = 12;

type AutomationColorSet = { bg: string; ring: string; border: string };

const AUTOMATION_COLORS: AutomationColorSet[] = [
  { bg: "bg-accent",          ring: "ring-accent/60",        border: "border-accent/50" },
  { bg: "bg-emerald-500",     ring: "ring-emerald-500/60",   border: "border-emerald-500/50" },
  { bg: "bg-sky-500",         ring: "ring-sky-500/60",       border: "border-sky-500/50" },
  { bg: "bg-violet-500",      ring: "ring-violet-500/60",    border: "border-violet-500/50" },
  { bg: "bg-amber-500",       ring: "ring-amber-500/60",     border: "border-amber-500/50" },
  { bg: "bg-rose-500",        ring: "ring-rose-500/60",      border: "border-rose-500/50" },
];

type AutomationCalendarProps = {
  automations: AutomationSummary[];
  onDaySelect?: (date: Date) => void;
  onEditAutomation?: (automation: AutomationSummary) => void;
  /** Sidebar uses slightly larger day type for scanability */
  variant?: "default" | "sidebar";
  skillMap?: Map<string, SkillRecord>;
  /** Cap the number of legend rows shown before "Show more". Defaults to 12. */
  maxLegendRows?: number;
};

type DayAutomation = {
  automation: AutomationSummary;
  color: AutomationColorSet;
};

/** Full-width header row: prev | caption | next, then grid (react-day-picker v9 `navLayout="around"` order). */
function AutomationMonth({ className, children, calendarMonth: _cm, displayIndex: _di, ...rest }: MonthProps) {
  const ch = Children.toArray(children);
  if (ch.length < 4) {
    return (
      <div className={cn("w-full", className)} {...rest}>
        {children}
      </div>
    );
  }
  const [prev, caption, next, grid] = ch;
  return (
    <div className={cn("w-full", className)} {...rest}>
      <div className="flex w-full items-center justify-between gap-2 border-b border-line px-0.5 pb-3 pt-1">
        <div className="flex min-h-9 min-w-9 shrink-0 items-center justify-start [&>button]:static">
          {prev}
        </div>
        <div className="min-w-0 flex flex-1 justify-center px-1">{caption}</div>
        <div className="flex min-h-9 min-w-9 shrink-0 items-center justify-end [&>button]:static">
          {next}
        </div>
      </div>
      {grid}
    </div>
  );
}

function AutomationLegend({
  automations,
  legendRowsAreClickable,
  limit,
  month,
  onEditAutomation,
  skillMap,
}: {
  automations: AutomationSummary[];
  legendRowsAreClickable: boolean;
  limit: number;
  month: Date;
  onEditAutomation?: (automation: AutomationSummary) => void;
  skillMap?: Map<string, SkillRecord>;
}) {
  const [expanded, setExpanded] = useState(false);
  const canCollapse = automations.length > limit;
  const visible = canCollapse && !expanded ? automations.slice(0, limit) : automations;
  const hiddenCount = automations.length - limit;

  return (
    <div className="grid gap-1 border-t border-line pt-3">
      {visible.map((automation, index) => {
        const colorSet = AUTOMATION_COLORS[index % AUTOMATION_COLORS.length];
        const year = month.getFullYear();
        const m = month.getMonth();
        const count = getRunDatesForMonth(automation.cadence, year, m, automation.preferredDay).length;
        const nextRun = formatNextRun(automation.cadence, automation.preferredHour ?? 12, automation.preferredDay);
        const schedule = automation.schedule;
        const isActive = automation.status === "ACTIVE";
        const linkedSkill = automation.matchedSkillSlugs[0]
          ? skillMap?.get(automation.matchedSkillSlugs[0])
          : undefined;
        const skillSlug = automation.matchedSkillSlugs[0];

        const content = (
          <div className="flex items-center gap-2">
            <div className={cn(
              "relative flex h-5 w-5 shrink-0 items-center justify-center",
              linkedSkill || skillSlug ? colorSet.border : "border-line",
              "border"
            )}>
              {linkedSkill ? (
                <SkillIcon flush iconUrl={linkedSkill.iconUrl} size={20} slug={linkedSkill.slug} />
              ) : skillSlug ? (
                <SkillIcon flush size={20} slug={skillSlug} />
              ) : (
                <AutomationIcon className="h-2.5 w-2.5 text-ink-faint" />
              )}
              <span
                aria-hidden
                className={cn("absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full border border-paper-3", colorSet.bg)}
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0">
              <div className="flex items-center gap-1.5">
                <span className="min-w-0 truncate text-xs font-medium text-ink">{automation.name}</span>
                {/*linkedSkill && (
                  <Badge color={getTagColorForCategory(linkedSkill.category)} size="sm">
                    {formatTagLabel(linkedSkill.category)}
                  </Badge>
                )*/}
              </div>
              <div className="flex mt-[-0.1rem] items-center gap-1.5 text-[0.625rem] text-ink-faint">
                <StatusDot tone={isActive ? "fresh" : "idle"} pulse={isActive} size="sm" />
                <span className="flex items-center gap-0.5">                
                  <AutomationIcon className="h-2.5 w-2.5" />
                  {schedule}
                </span>
                <span className="tabular-nums">{count} runs</span>
                <span className="ml-auto tabular-nums text-white">{nextRun}</span>
              </div>
            </div>
          </div>
        );

        return legendRowsAreClickable && onEditAutomation ? (
          <button
            className={cn(
              "border border-transparent px-1.5 py-1.5 text-left transition-colors",
              "hover:border-accent/20 hover:bg-paper-2/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            )}
            key={automation.id}
            onClick={() => onEditAutomation(automation)}
            type="button"
          >
            {content}
          </button>
        ) : (
          <div className="px-1.5 py-1.5" key={automation.id}>
            {content}
          </div>
        );
      })}
      {canCollapse && (
        <button
          className="mt-1 px-1 text-left text-[0.6875rem] font-medium text-ink-faint transition-colors hover:text-ink-soft"
          onClick={() => setExpanded((prev) => !prev)}
          type="button"
        >
          {expanded ? "Show less" : `Show ${hiddenCount} more…`}
        </button>
      )}
    </div>
  );
}

export function AutomationCalendar({
  automations,
  maxLegendRows = LEGEND_COLLAPSED_LIMIT,
  onDaySelect,
  onEditAutomation,
  variant = "default",
  skillMap,
}: AutomationCalendarProps) {
  const [month, setMonth] = useState(new Date());
  const sidebar = variant === "sidebar";
  const [modalDate, setModalDate] = useState<Date | null>(null);

  const activeAutomations = useMemo(
    () => automations.filter((a) => a.status === "ACTIVE"),
    [automations]
  );

  const dayMap = useMemo(() => {
    const map = new Map<string, DayAutomation[]>();
    const year = month.getFullYear();
    const m = month.getMonth();

    activeAutomations.forEach((automation, index) => {
      const color = AUTOMATION_COLORS[index % AUTOMATION_COLORS.length];
      const dates = getRunDatesForMonth(automation.cadence, year, m, automation.preferredDay);

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
    () => Array.from(dayMap.keys()).map((iso) => new Date(iso + "T12:00:00")),
    [dayMap]
  );

  const modalEntries = useMemo((): DayAutomationEntry[] => {
    if (!modalDate) return [];
    return automations
      .map((automation, index) => ({
        automation,
        color: AUTOMATION_COLORS[index % AUTOMATION_COLORS.length],
      }))
      .filter(({ automation }) => isScheduledOnDate(automation.cadence, modalDate, automation.preferredDay));
  }, [modalDate, automations]);

  const navBtn = cn(
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-none border border-line bg-paper-3",
    "text-ink-soft shadow-none transition-[background-color,border-color,color,fill]",
    "hover:border-line-strong hover:bg-paper-2 hover:text-ink",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
    "dark:border-line-strong/60 dark:bg-paper-2/95 dark:text-ink-soft dark:hover:border-line-strong/80 dark:hover:bg-white/10 dark:hover:text-ink"
  );
  const legendRowsAreClickable = typeof onEditAutomation === "function";

  return (
    <div className={cn("grid gap-4", sidebar && "gap-5")}>
      <div className="grid gap-0 overflow-hidden rounded-none border border-line bg-paper-3 p-1.5 dark:bg-paper-2/60">
        <DayPicker
          mode="single"
          month={month}
          navLayout="around"
          modifiers={{ scheduled: scheduledDays }}
          modifiersClassNames={{
            scheduled:
              "bg-accent/[0.08] ring-1 ring-inset ring-accent/25 data-[selected=true]:bg-accent/15 data-[selected=true]:ring-accent/40"
          }}
          onMonthChange={setMonth}
          onSelect={(day) => {
            if (day) {
              setModalDate(day);
              onDaySelect?.(day);
            }
          }}
          selected={modalDate ?? undefined}
          showOutsideDays
          classNames={{
            root: cn("automation-calendar w-full", sidebar && "select-none"),
            months: "w-full",
            month: "w-full",
            month_grid: "w-full border-collapse",
            month_caption: "flex min-w-0 items-center justify-center border-0 p-0",
            caption_label: cn(
              "min-w-0 truncate font-serif font-medium tracking-[-0.03em] text-ink",
              sidebar ? "text-[1.125rem] leading-tight" : "text-[1.0625rem] leading-tight"
            ),
            nav: "flex items-center gap-1",
            chevron: "fill-current text-current",
            button_previous: navBtn,
            button_next: navBtn,
            weekdays:
              "flex w-full gap-px border-b border-line bg-line/80 pb-0 pt-0 dark:bg-line/50",
            weekday:
              "flex-1 bg-paper-3 py-2 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-soft dark:bg-paper-2/90",
            week: "mt-px flex w-full gap-px bg-line/80 first:mt-0 dark:bg-line/50",
            day: "relative min-w-0 flex-1 align-top bg-paper-3 p-0 text-center dark:bg-paper-2/90",
            day_button: cn(
              "relative flex min-h-[3.85rem] w-full flex-col items-center justify-start gap-1.5 rounded-none border-0 px-0.5 pt-2 pb-2",
              "tabular-nums text-ink transition-[background-color,color] duration-150",
              sidebar ? "text-[0.9375rem] font-medium" : "text-sm font-medium",
              "hover:bg-paper-2/90 dark:hover:bg-white/[0.07]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
            ),
            selected: "bg-accent/12! font-semibold text-accent! ring-1 ring-inset ring-accent/35!",
            today:
              "bg-paper-2/50 font-semibold text-accent ring-1 ring-inset ring-accent/35 data-[selected=true]:bg-accent/12!",
            outside: "text-ink-faint/50 opacity-70",
            disabled: "pointer-events-none text-ink-faint/25"
          }}
          components={{
            Month: AutomationMonth,
            Chevron: ({ className, disabled, ...props }) => (
              <Chevron
                {...props}
                className={cn(
                  "h-3.5 w-3.5 shrink-0 fill-current text-current",
                  disabled && "opacity-40",
                  className
                )}
                size={14}
              />
            ),
            DayButton: ({ day, modifiers: _modifiers, className, ...props }) => {
              const key = day.isoDate;
              const entries = dayMap.get(key);

              return (
                <button className={cn(className)} type="button" {...props}>
                  <span className="leading-none tabular-nums">{day.date.getDate()}</span>
                  {entries && entries.length > 0 && (
                    <div className="flex w-full max-w-full flex-col items-center gap-0.5">
                      <div className="flex min-h-[14px] w-full flex-wrap items-center justify-center gap-0.5 px-0.5">
                        {entries.slice(0, 3).map((entry, i) => {
                          const linkedSkill = !sidebar
                            ? entry.automation.matchedSkillSlugs[0]
                              ? skillMap?.get(entry.automation.matchedSkillSlugs[0])
                              : undefined
                            : undefined;
                          return linkedSkill ? (
                            <SkillIcon
                              className={cn("border-2", entry.color.border)}
                              flush
                              iconUrl={linkedSkill.iconUrl}
                              key={`${entry.automation.id}-${i}`}
                              size={16}
                              slug={linkedSkill.slug}
                            />
                          ) : (
                            <span
                              className={cn("h-2 w-2 shrink-0", entry.color.bg)}
                              key={`${entry.automation.id}-${i}`}
                              title={entry.automation.name}
                            />
                          );
                        })}
                      </div>
                      {entries.length > 3 && (
                        <span className="text-[9px] font-medium leading-none text-ink-faint">
                          +{entries.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            }
          }}
        />
      </div>

      <AutomationDayModal
        date={modalDate}
        entries={modalEntries}
        onClose={() => setModalDate(null)}
        onEditAutomation={onEditAutomation ? (automation) => {
          setModalDate(null);
          onEditAutomation(automation);
        } : undefined}
        open={modalDate !== null}
        skillMap={skillMap}
      />

      {activeAutomations.length > 0 && (
        <AutomationLegend
          automations={activeAutomations}
          legendRowsAreClickable={legendRowsAreClickable}
          limit={maxLegendRows}
          month={month}
          onEditAutomation={onEditAutomation}
          skillMap={skillMap}
        />
      )}
    </div>
  );
}
