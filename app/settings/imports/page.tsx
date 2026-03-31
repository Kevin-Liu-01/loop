import { auth } from "@clerk/nextjs/server";

import {
  AutomationIcon,
  ClockIcon,
  DownloadIcon,
  GlobeIcon,
} from "@/components/frontier-icons";
import { SettingsSectionPage } from "@/components/settings-section-page";
import { SettingsImportsCustomSourceForm } from "@/components/settings-imports-custom-source-form";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHead } from "@/components/ui/panel";
import { getUserSubscription } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { EXTERNAL_SKILL_SOURCES } from "@/lib/external-skill-sources";
import { getNextWeeklyImportRunUtc } from "@/lib/weekly-import-schedule";

export const dynamic = "force-dynamic";

function formatNextRun(when: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "shortGeneric",
    timeZone: "UTC",
  }).format(when);
}

export default async function SettingsImportsPage() {
  const { userId } = await auth();
  const subscription = userId ? await getUserSubscription(userId) : null;
  const isOperator = subscription !== null;
  const nextRunUtc = getNextWeeklyImportRunUtc();

  return (
    <SettingsSectionPage sectionId="imports">
      <div className="grid gap-6">
        <Panel>
          <PanelHead>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-line bg-paper-2/80">
                <ClockIcon className="h-5 w-5 text-ink-soft" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="m-0 font-serif text-lg font-medium tracking-[-0.02em] text-ink">
                  Next scheduled import
                </h2>
                <p className="mt-1 m-0 text-sm text-ink-muted">
                  Platform imports run weekly on{" "}
                  <span className="font-medium text-ink-soft">Mondays at 09:00 UTC</span>.
                </p>
              </div>
            </div>
            <span title="Next scheduled import run (UTC)">
              <Badge color="neutral" className="shrink-0">
                {formatNextRun(nextRunUtc)}
              </Badge>
            </span>
          </PanelHead>
        </Panel>

        <Panel>
          <PanelHead>
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-line bg-paper-2/80">
                <GlobeIcon className="h-5 w-5 text-ink-soft" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="m-0 font-serif text-lg font-medium tracking-[-0.02em] text-ink">
                  Auto-import sources
                </h2>
                <p className="mt-1 m-0 max-w-[62ch] text-sm text-ink-muted">
                  Registries Loop syncs from on the weekly cadence. Paths are relative to the repository root.
                </p>
              </div>
            </div>
          </PanelHead>

          <ul className="m-0 grid list-none gap-0 divide-y divide-line rounded-none border border-line p-0">
            {EXTERNAL_SKILL_SOURCES.map((source) => (
              <li className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4" key={source.id}>
                <div className="min-w-0">
                  <p className="m-0 font-medium tracking-tight text-ink">{source.name}</p>
                  <p className="mt-1 m-0 text-xs text-ink-muted">
                    {source.org}/{source.repo}
                    <span className="text-ink-faint"> · </span>
                    <span className="text-ink-soft">{source.branch}</span>
                  </p>
                  <p className="mt-2 m-0 text-[0.6875rem] leading-relaxed text-ink-faint">
                    {source.skillsPath || "(repo root)"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span title={source.trustTier === "official" ? "Maintained by the vendor" : "Community-maintained source"}>
                    <Badge color={source.trustTier === "official" ? "orange" : "neutral"}>
                      {source.trustTier === "official" ? "Official" : "Community"}
                    </Badge>
                  </span>
                  <span title={source.id}>
                    <Badge color="neutral" className="max-w-[14rem] truncate font-normal">
                      {source.id}
                    </Badge>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHead>
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-line bg-paper-2/80">
                <DownloadIcon className="h-5 w-5 text-ink-soft" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="m-0 font-serif text-lg font-medium tracking-[-0.02em] text-ink">
                  Import history
                </h2>
                <p className="mt-1 m-0 max-w-[62ch] text-sm text-ink-muted">
                  Recent runs from <code className="font-mono text-[0.8125rem] text-ink-soft">weekly_import_runs</code>{" "}
                  will appear here.
                </p>
              </div>
            </div>
          </PanelHead>
          <div className="rounded-none border border-dashed border-line bg-paper-2/40 px-4 py-10 text-center dark:bg-paper-2/20">
            <AutomationIcon className="mx-auto h-8 w-8 text-ink-faint" aria-hidden />
            <p className="mt-3 m-0 text-sm font-medium text-ink-soft">No import runs to show yet</p>
            <p className="mt-1 m-0 text-xs text-ink-faint">
              History will list status, duration, and errors once the dashboard reads from Supabase.
            </p>
          </div>
        </Panel>

        <Panel
          className={cn(
            !isOperator && "relative overflow-hidden",
            !isOperator && "after:pointer-events-none after:absolute after:inset-0 after:bg-paper/55 after:backdrop-blur-[0.5px] dark:after:bg-paper/40"
          )}
        >
          <PanelHead>
            <div className="flex min-w-0 flex-1 flex-wrap items-start gap-3">
              <div className="min-w-0">
                <h2 className="m-0 font-serif text-lg font-medium tracking-[-0.02em] text-ink">
                  Add custom import source
                </h2>
                <p className="mt-1 m-0 max-w-[62ch] text-sm text-ink-muted">
                  Register another GitHub repository and skills directory for the weekly import job.
                </p>
              </div>
              {!isOperator ? (
                <span title="Subscribe to the Operator plan to add custom import sources">
                  <Badge color="orange" className="shrink-0">Upgrade to Operator</Badge>
                </span>
              ) : null}
            </div>
          </PanelHead>

          <div className="relative z-[1] grid gap-4">
            <SettingsImportsCustomSourceForm isOperator={isOperator} />
          </div>
        </Panel>
      </div>
    </SettingsSectionPage>
  );
}
