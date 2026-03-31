"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import { SkillIcon } from "@/components/ui/skill-icon";
import { AutomationIcon } from "@/components/frontier-icons";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/cn";
import { formatAutomationSchedule } from "@/lib/format";
import { formatNextRun } from "@/lib/schedule";
import { formatTagLabel, getTagColorForCategory } from "@/lib/tag-utils";
import type { AutomationSummary, SkillRecord } from "@/lib/types";

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
  skillMap?: Map<string, SkillRecord>;
};

const dayTitleFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

function AutomationRunIcon({
  skill,
  accentColor,
}: {
  skill?: SkillRecord;
  accentColor: string;
}) {
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center border border-line bg-paper-2 dark:bg-paper-2/60">
      {skill ? (
        <SkillIcon className="rounded-md" iconUrl={skill.iconUrl} size={22} slug={skill.slug} />
      ) : (
        <AutomationIcon className="h-4 w-4 text-ink-faint" />
      )}
      <span
        aria-hidden
        className={cn("absolute -right-0.5 -top-0.5 h-2 w-2 border border-paper-3", accentColor)}
      />
    </div>
  );
}

export function AutomationDayModal({ open, onClose, date, entries, onEditAutomation, skillMap }: AutomationDayModalProps) {
  const title = date ? dayTitleFormatter.format(date) : "";
  const isClickable = typeof onEditAutomation === "function";
  const activeCount = entries.filter(({ automation }) => automation.status === "ACTIVE").length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="gap-0 overflow-hidden p-0" maxWidth="lg">
        <DialogHeader className="gap-1 space-y-0">
          <DialogTitle>Scheduled runs</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span>{title}</span>
            {entries.length > 0 && (
              <Badge color="blue" size="sm">
                {activeCount} active
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 border border-dashed border-line bg-paper-2/40 px-4 py-10 text-center dark:bg-black/20">
              <AutomationIcon className="h-5 w-5 text-ink-faint" />
              <p className="m-0 text-sm text-ink-soft">No automations on this day.</p>
            </div>
          ) : (
            <ul className="m-0 grid list-none gap-2 p-0">
              {entries.map(({ automation, color }) => {
                const linkedSkill = automation.matchedSkillSlugs[0]
                  ? skillMap?.get(automation.matchedSkillSlugs[0])
                  : undefined;
                const isActive = automation.status === "ACTIVE";
                const schedule = formatAutomationSchedule(automation.schedule);
                const nextRun = formatNextRun(automation.schedule);

                const inner = (
                  <div className="flex items-start gap-3.5">
                    <AutomationRunIcon accentColor={color} skill={linkedSkill} />

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium leading-tight text-ink">
                          {automation.name}
                        </span>
                        <Badge
                          color={isActive ? "green" : "neutral"}
                          size="sm"
                        >
                          <StatusDot
                            className="mr-1"
                            pulse={isActive}
                            tone={isActive ? "fresh" : "idle"}
                          />
                          {isActive ? "active" : "paused"}
                        </Badge>
                      </div>

                      {linkedSkill && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-ink-soft">{linkedSkill.title}</span>
                          <Badge
                            color={getTagColorForCategory(linkedSkill.category)}
                            size="sm"
                          >
                            {formatTagLabel(linkedSkill.category)}
                          </Badge>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[0.6875rem] text-ink-faint">
                        <span className="flex items-center gap-1">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                          {schedule}
                        </span>
                        <span className="tabular-nums">
                          Next: <span className="text-ink-soft">{nextRun}</span>
                        </span>
                      </div>
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
