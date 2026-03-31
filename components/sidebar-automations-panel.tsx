"use client";

import { useMemo, useState } from "react";

import { AutomationEditModal } from "@/components/automation-edit-modal";
import { AutomationIcon } from "@/components/frontier-icons";
import { SkillIcon } from "@/components/ui/skill-icon";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHead } from "@/components/ui/panel";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/cn";
import { formatAutomationSchedule } from "@/lib/format";
import { formatNextRun } from "@/lib/schedule";
import { formatTagLabel, getTagColorForCategory } from "@/lib/tag-utils";
import type { AutomationSummary, SkillRecord } from "@/lib/types";

type SidebarAutomationsPanelProps = {
  automations: AutomationSummary[];
  skills?: SkillRecord[];
};

export function SidebarAutomationsPanel({ automations, skills = [] }: SidebarAutomationsPanelProps) {
  const [editTarget, setEditTarget] = useState<AutomationSummary | null>(null);
  const skillMap = useMemo(() => new Map(skills.map((s) => [s.slug, s])), [skills]);

  const editSkill = editTarget?.matchedSkillSlugs[0]
    ? skillMap.get(editTarget.matchedSkillSlugs[0])
    : undefined;

  const activeCount = automations.filter((a) => a.status === "ACTIVE").length;

  return (
    <>
      <Panel compact square>
        <PanelHead>
          <div className="flex items-center gap-2">
            <h3 className="m-0 text-sm font-semibold tracking-tight text-ink">Automations</h3>
            <Badge color="blue" size="sm">{automations.length}</Badge>
            {activeCount > 0 && (
              <span className="flex items-center gap-1 text-[0.6875rem] text-ink-faint">
                <StatusDot tone="fresh" pulse />
                {activeCount} active
              </span>
            )}
          </div>
          <LinkButton href="/settings/automations" size="sm" variant="ghost">
            Open desk
          </LinkButton>
        </PanelHead>

        <div className="grid gap-2">
          {automations.map((auto) => {
            const isActive = auto.status === "ACTIVE";
            const linkedSkill = auto.matchedSkillSlugs[0]
              ? skillMap.get(auto.matchedSkillSlugs[0])
              : undefined;

            return (
              <button
                className={cn(
                  "group grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border border-line bg-paper-3/85 p-3 text-left transition-colors dark:bg-paper-2/30",
                  isActive
                    ? "hover:border-accent/20 hover:bg-paper-2/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                    : "opacity-60 hover:opacity-80"
                )}
                key={auto.id}
                onClick={() => setEditTarget(auto)}
                type="button"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-line bg-paper-2 dark:bg-paper-2/60">
                  {linkedSkill ? (
                    <SkillIcon className="rounded-md" iconUrl={linkedSkill.iconUrl} size={20} slug={linkedSkill.slug} />
                  ) : (
                    <AutomationIcon className="h-3.5 w-3.5 text-ink-faint" />
                  )}
                </div>

                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <strong className="min-w-0 flex-1 truncate text-sm text-ink">{auto.name}</strong>
                    <Badge color={isActive ? "green" : "neutral"} size="sm">
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
                      <span className="truncate text-xs text-ink-soft">{linkedSkill.title}</span>
                      <Badge color={getTagColorForCategory(linkedSkill.category)} size="sm">
                        {formatTagLabel(linkedSkill.category)}
                      </Badge>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <div className="flex-1 border border-line bg-paper-2/70 px-2 py-1.5 dark:bg-paper-2/40">
                      <span className="block text-[0.6rem] uppercase tracking-[0.08em] text-ink-faint">schedule</span>
                      <span className="block text-xs font-medium text-ink-soft">
                        {formatAutomationSchedule(auto.schedule)}
                      </span>
                    </div>
                    <div className="flex-1 border border-line bg-paper-2/70 px-2 py-1.5 dark:bg-paper-2/40">
                      <span className="block text-[0.6rem] uppercase tracking-[0.08em] text-ink-faint">next</span>
                      <span className="block text-xs font-medium tabular-nums text-ink-soft">{formatNextRun(auto.schedule)}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      {editTarget && (
        <AutomationEditModal
          automation={editTarget}
          onClose={() => setEditTarget(null)}
          open
          skillCategory={editSkill?.category}
          skillIconUrl={editSkill?.iconUrl}
          skillName={editSkill?.title}
          skillSlug={editSkill?.slug}
          sources={editSkill?.sources}
        />
      )}
    </>
  );
}
