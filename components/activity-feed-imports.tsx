"use client";

import Link from "next/link";

import { SkillIcon, McpIcon } from "@/components/ui/skill-icon";
import { Badge } from "@/components/ui/badge";
import { EmptyCard } from "@/components/ui/empty-card";
import { SparkIcon } from "@/components/frontier-icons";
import { RelativeTime } from "@/components/relative-time";
import { buildSkillVersionHref, buildMcpVersionHref } from "@/lib/format";
import type { RecentImportItem } from "@/lib/db/recent-imports";

type ActivityFeedImportsProps = {
  imports: RecentImportItem[];
};

export function ActivityFeedImports({ imports }: ActivityFeedImportsProps) {
  if (imports.length === 0) {
    return (
      <EmptyCard icon={<SparkIcon className="h-5 w-5" />}>
        <p className="m-0 text-sm">No imports yet. New skills and MCPs will appear here after the weekly scan.</p>
      </EmptyCard>
    );
  }

  return (
    <div className="grid gap-0">
      {imports.map((item) => {
        const href =
          item.kind === "skill"
            ? buildSkillVersionHref(item.slug, 1)
            : buildMcpVersionHref(item.slug, 1);

        return (
          <Link
            className="group flex items-start gap-2.5 border-t border-line py-2.5 first:border-t-0 first:pt-0"
            href={href}
            key={`${item.kind}-${item.id}`}
          >
            {item.kind === "skill" ? (
              <SkillIcon
                className="mt-0.5 shrink-0 rounded-md"
                iconUrl={item.iconUrl}
                size={24}
                slug={item.slug}
              />
            ) : (
              <McpIcon
                className="mt-0.5 shrink-0"
                homepageUrl={item.sourceUrl}
                iconUrl={item.iconUrl}
                name={item.slug}
                size={24}
              />
            )}
            <div className="min-w-0 grid flex-1 gap-0.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-[0.8125rem] font-medium leading-snug text-ink group-hover:text-ink-soft">
                  {item.title}
                </span>
                <Badge muted>{item.kind}</Badge>
              </div>
              <p className="m-0 line-clamp-1 text-xs text-ink-soft">{item.description}</p>
              <div className="flex items-center gap-1.5 text-[0.6875rem] text-ink-faint">
                {item.authorName && <span>{item.authorName} ·</span>}
                <RelativeTime date={item.importedAt} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
