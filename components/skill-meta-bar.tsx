import { AutomationIcon, GlobeIcon } from "@/components/frontier-icons";
import { RelativeTime } from "@/components/relative-time";
import { formatNextRun } from "@/lib/schedule";
import type { SkillRecord } from "@/lib/types";

export function originLabel(skill: SkillRecord): string {
  if (skill.origin === "user") {
    return skill.automation?.enabled ? "Auto" : "Tracked";
  }
  return skill.origin === "remote" ? "Imported" : "Catalog";
}

export function SkillMetaBar({
  skill,
  freshness,
}: {
  skill: SkillRecord;
  freshness: { label: string };
}) {
  const automation = skill.automations?.[0];
  const cadence = skill.automation?.cadence ?? automation?.cadence;
  const preferredHour = skill.automation?.preferredHour ?? automation?.preferredHour ?? 12;
  const preferredDay = skill.automation?.preferredDay ?? automation?.preferredDay;
  const nextRun =
    skill.automation?.enabled && cadence ? formatNextRun(cadence, preferredHour, preferredDay) : null;
  const srcCount = skill.sources?.length ?? 0;

  const details = [originLabel(skill), freshness.label];
  if (nextRun && nextRun !== "–") details.push(`Next ${nextRun}`);

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.6875rem] leading-none text-ink-faint">
      <span className="inline-flex items-center gap-1">
        <AutomationIcon className="h-3 w-3 text-ink-faint/70" />
        <RelativeTime date={skill.updatedAt} />
      </span>

      <span>{details.join(" · ")}</span>

      {srcCount > 0 && (
        <span className="inline-flex items-center gap-1">
          <GlobeIcon className="h-3 w-3 text-ink-faint/70" />
          {srcCount} source{srcCount === 1 ? "" : "s"}
        </span>
      )}
    </div>
  );
}
