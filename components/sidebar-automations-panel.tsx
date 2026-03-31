"use client";

import { useState } from "react";

import { AutomationEditModal } from "@/components/automation-edit-modal";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHead } from "@/components/ui/panel";
import { formatAutomationSchedule } from "@/lib/format";
import { formatNextRun } from "@/lib/schedule";
import type { AutomationSummary } from "@/lib/types";

type SidebarAutomationsPanelProps = {
  automations: AutomationSummary[];
};

export function SidebarAutomationsPanel({ automations }: SidebarAutomationsPanelProps) {
  const [editTarget, setEditTarget] = useState<AutomationSummary | null>(null);

  return (
    <>
      <Panel compact square>
        <PanelHead>
          <div className="flex items-center gap-2">
            <h3 className="m-0 text-sm font-semibold tracking-tight text-ink">Automations</h3>
            <Badge color="blue">{automations.length}</Badge>
          </div>
          <LinkButton href="/settings/automations" size="sm" variant="ghost">
            Open desk
          </LinkButton>
        </PanelHead>

        <div className="grid gap-2">
          {automations.map((auto) => {
            const isActive = auto.status === "ACTIVE";

            return (
              <button
                className="grid gap-3 rounded-none border border-line bg-paper-3/85 p-3 text-left transition-colors hover:border-accent/20 hover:bg-paper-2/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent dark:bg-paper-2/30"
                key={auto.id}
                onClick={() => setEditTarget(auto)}
                type="button"
              >
                <div className="flex items-center gap-2">
                  <strong className="min-w-0 flex-1 truncate text-sm text-ink">{auto.name}</strong>
                  <Badge color={isActive ? "green" : "neutral"}>{isActive ? "active" : "paused"}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-ink-soft">
                  <div className="grid gap-0.5 rounded-none border border-line bg-paper-2/70 px-2.5 py-2 dark:bg-paper-2/40">
                    <span className="uppercase tracking-[0.08em] text-ink-faint">schedule</span>
                    <span className="font-medium text-ink-soft">
                      {formatAutomationSchedule(auto.schedule)}
                    </span>
                  </div>
                  <div className="grid gap-0.5 rounded-none border border-line bg-paper-2/70 px-2.5 py-2 dark:bg-paper-2/40">
                    <span className="uppercase tracking-[0.08em] text-ink-faint">next</span>
                    <span className="font-medium text-ink-soft">{formatNextRun(auto.schedule)}</span>
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
        />
      )}
    </>
  );
}
