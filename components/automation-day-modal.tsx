"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/cn";
import { formatAutomationSchedule } from "@/lib/format";
import { formatNextRun } from "@/lib/schedule";
import type { AutomationSummary } from "@/lib/types";

export type DayAutomationEntry = {
  automation: AutomationSummary;
  color: string;
};

type AutomationDayModalProps = {
  open: boolean;
  onClose: () => void;
  date: Date | null;
  entries: DayAutomationEntry[];
  onEditAutomation?: (automation: AutomationSummary) => void;
};

const dayTitleFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function AutomationDayModal({ open, onClose, date, entries, onEditAutomation }: AutomationDayModalProps) {
  const title = date ? dayTitleFormatter.format(date) : "";
  const isClickable = typeof onEditAutomation === "function";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="gap-0 overflow-hidden p-0" maxWidth="lg">
        <DialogHeader className="gap-1 space-y-0">
          <DialogTitle>Scheduled runs</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {entries.length === 0 ? (
            <p className="m-0 border border-dashed border-line bg-paper-2/40 px-4 py-8 text-center text-sm text-ink-soft dark:bg-black/20">
              No automations on this day.
            </p>
          ) : (
            <ul className="m-0 grid list-none gap-3 p-0">
              {entries.map(({ automation, color }) => {
                const inner = (
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", color)}
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium leading-tight text-ink">{automation.name}</span>
                        {automation.status === "PAUSED" ? (
                          <Badge color="neutral" size="sm">
                            Paused
                          </Badge>
                        ) : null}
                      </div>
                      <p className="m-0 text-xs text-ink-soft">
                        {formatAutomationSchedule(automation.schedule)}
                      </p>
                      <p className="m-0 text-xs text-ink-faint">
                        Next:{" "}
                        <span className="tabular-nums text-ink-soft">{formatNextRun(automation.schedule)}</span>
                      </p>
                      {automation.matchedSkillSlugs.length > 0 ? (
                        <p className="m-0 text-[0.72rem] leading-snug text-ink-faint">
                          Skills:{" "}
                          <span className="text-ink-soft">
                            {automation.matchedSkillSlugs.join(", ")}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                );

                return isClickable ? (
                  <li key={automation.id}>
                    <button
                      className={cn(
                        "w-full border border-line/80 bg-paper-2/35 p-4 text-left transition-colors dark:bg-black/25",
                        "hover:border-accent/25 hover:bg-paper-2/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      )}
                      onClick={() => onEditAutomation(automation)}
                      type="button"
                    >
                      {inner}
                    </button>
                  </li>
                ) : (
                  <li
                    className="border border-line/80 bg-paper-2/35 p-4 dark:bg-black/25"
                    key={automation.id}
                  >
                    {inner}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter>
          <LinkButton href="/settings/automations" size="sm" variant="soft">
            Manage automations
          </LinkButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
