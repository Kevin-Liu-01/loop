import Link from "next/link";

import { buildSkillVersionHref, formatRelativeDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { VersionReference } from "@/lib/types";

type VersionTimelineProps = {
  slug: string;
  currentVersion: number;
  versions: VersionReference[];
};

export function VersionTimeline({ slug, currentVersion, versions }: VersionTimelineProps) {
  return (
    <nav className="grid gap-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
        Versions
      </h3>
      <div className="grid gap-0">
        {versions.map((v) => {
          const isCurrent = v.version === currentVersion;
          return (
            <Link
              className={cn(
                "flex min-w-0 items-baseline justify-between gap-3 border-l-2 py-2 pl-3 pr-1 text-sm transition-colors",
                isCurrent
                  ? "border-accent font-semibold text-ink"
                  : "border-line text-ink-soft hover:border-ink-muted hover:text-ink"
              )}
              href={buildSkillVersionHref(slug, v.version)}
              key={v.version}
            >
              <span className="truncate">{v.label}</span>
              <span className="shrink-0 text-xs text-ink-muted">
                {formatRelativeDate(v.updatedAt)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
