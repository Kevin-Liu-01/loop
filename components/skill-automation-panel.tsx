"use client";

import { useMemo, useState } from "react";

import { AutomationCalendar } from "@/components/automation-calendar";
import { AutomationEditModal } from "@/components/automation-edit-modal";
import {
  ClockIcon,
  FlowIcon,
  RefreshIcon,
  SearchIcon,
  SettingsIcon,
  SparkIcon,
  TimelineIcon,
} from "@/components/frontier-icons";
import { TrackSkillButton } from "@/components/track-skill-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Panel, PanelHead } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import { formatAutomationSchedule } from "@/lib/format";
import { countMonthlyRuns, formatNextRun } from "@/lib/schedule";
import type { AutomationSummary, SkillOrigin } from "@/lib/types";

type SkillAutomationPanelProps = {
  slug: string;
  skillTitle: string;
  origin: SkillOrigin;
  sourceCount: number;
  automation?: AutomationSummary;
  canManage?: boolean;
};

function MetricCard({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-1 rounded-none border px-3.5 py-3",
        accent
          ? "border-accent/20 bg-accent/8"
          : "border-line bg-paper-3/90 dark:bg-paper-2/40",
      )}
    >
      <span className="flex items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-[0.08em] text-ink-soft">
        {icon}
        {label}
      </span>
      <strong className="text-sm font-semibold tracking-[-0.03em] text-ink">
        {value}
      </strong>
    </div>
  );
}

function PromptPreview({ prompt }: { prompt?: string }) {
  if (!prompt?.trim()) {
    return (
      <div className="rounded-none border border-dashed border-line bg-paper-3/70 px-4 py-3 text-sm text-ink-soft dark:bg-paper-2/30">
        No automation brief yet. Add one so refreshes optimize for the right deltas instead of free-associating into the void.
      </div>
    );
  }

  return (
    <div className="rounded-none border border-line bg-paper-3/90 px-4 py-3 dark:bg-paper-2/40">
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
        Automation brief
      </span>
      <p className="m-0 mt-2 line-clamp-4 text-sm leading-relaxed text-ink-soft">
        {prompt}
      </p>
    </div>
  );
}

export function SkillAutomationPanel({
  slug,
  skillTitle,
  origin,
  sourceCount,
  automation,
  canManage = false,
}: SkillAutomationPanelProps) {
  const [editOpen, setEditOpen] = useState(false);
  const isTracked = origin === "user";
  const isActive = automation?.status === "ACTIVE";
  const now = useMemo(() => new Date(), []);
  const monthlyRuns = automation
    ? countMonthlyRuns(automation.schedule, now.getFullYear(), now.getMonth())
    : 0;
  const nextRun = automation?.schedule ? formatNextRun(automation.schedule) : "On demand";
  const scheduleLabel =
    automation?.schedule && automation.schedule.trim()
      ? formatAutomationSchedule(automation.schedule)
      : "Manual only";

  if (!isTracked) {
    return (
      <section className="grid gap-5 border-t border-line pt-8" id="automation">
        <h2 className="m-0 font-serif text-xl font-medium tracking-[-0.02em] text-ink">
          Automation
        </h2>
        <Panel className="overflow-hidden">
          <div className="dither-gradient-orange -mx-6 -mt-6 mb-1 px-6 pb-5 pt-6">
            <PanelHead className="items-start">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Badge>Track to unlock</Badge>
                  <Badge muted>Featured on skill pages</Badge>
                </div>
                <h3 className="m-0 text-xl font-semibold tracking-tight text-ink">
                  Make this skill self-updating
                </h3>
                <p className="m-0 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
                  Tracking creates your editable copy, puts automation controls on the skill page,
                  and gives you refresh traces, diffs, and schedule management without bouncing
                  back to settings.
                </p>
              </div>
              <TrackSkillButton
                label="Track and automate"
                redirectTo="detail"
                showFeedback
                size="sm"
                slug={slug}
                variant="primary"
              />
            </PanelHead>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              icon={<SearchIcon className="h-3 w-3" />}
              label="Source stack"
              value={`${sourceCount} tracked source${sourceCount === 1 ? "" : "s"}`}
            />
            <MetricCard
              accent
              icon={<ClockIcon className="h-3 w-3" />}
              label="Cadence"
              value="Visible on page"
            />
            <MetricCard
              icon={<RefreshIcon className="h-3 w-3" />}
              label="Refresh UX"
              value="Logs, diffs, history"
            />
          </div>
        </Panel>
      </section>
    );
  }

  return (
    <>
      <section className="grid gap-5 border-t border-line pt-8" id="automation">
        <h2 className="m-0 font-serif text-xl font-medium tracking-[-0.02em] text-ink">
          Automation
        </h2>
        <Panel className="overflow-hidden">
          <div className="dither-gradient-orange -mx-6 -mt-6 mb-1 px-6 pb-5 pt-6">
            <PanelHead className="items-start">
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{isActive ? "Active" : "Paused"}</Badge>
                  <Badge muted>{scheduleLabel}</Badge>
                  <Badge muted>{sourceCount} sources</Badge>
                </div>
                <h3 className="m-0 text-xl font-semibold tracking-tight text-ink">
                  Refresh control plane
                </h3>
                <p className="m-0 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
                  {canManage
                    ? "Automation should live with the skill. Edit the cadence here, inspect the latest refresh trace below, and jump out to settings only when you want the global desk."
                    : "Automation is attached to the skill, but only the owner can change cadence or trigger runs. You can still inspect the current setup and refresh trace."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {automation && canManage ? (
                  <Button onClick={() => setEditOpen(true)} size="sm" type="button">
                    <SettingsIcon className="h-3.5 w-3.5" />
                    Edit automation
                  </Button>
                ) : null}
                <Button
                  onClick={() =>
                    document
                      .getElementById("run-log")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <TimelineIcon className="h-3.5 w-3.5" />
                  Open refresh trace
                </Button>
                <LinkButton href="/settings/automations" size="sm" variant="soft">
                  <FlowIcon className="h-3.5 w-3.5" />
                  {canManage ? "Automation desk" : "View automation desk"}
                </LinkButton>
              </div>
            </PanelHead>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={<ClockIcon className="h-3 w-3" />}
              label="Next run"
              value={nextRun}
              accent={isActive}
            />
            <MetricCard
              icon={<RefreshIcon className="h-3 w-3" />}
              label="Schedule"
              value={scheduleLabel}
            />
            <MetricCard
              icon={<SparkIcon className="h-3 w-3" />}
              label="Runs this month"
              value={`${monthlyRuns}`}
            />
            <MetricCard
              icon={<SearchIcon className="h-3 w-3" />}
              label="Sources watched"
              value={`${sourceCount}`}
            />
          </div>

          {automation?.schedule?.trim() && (
            <AutomationCalendar
              automations={[automation]}
              variant="sidebar"
            />
          )}

          <PromptPreview prompt={automation?.prompt} />
        </Panel>
      </section>

      {automation ? (
        <AutomationEditModal
          automation={automation}
          onClose={() => setEditOpen(false)}
          open={editOpen}
          skillName={skillTitle}
        />
      ) : null}
    </>
  );
}
