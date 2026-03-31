import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { SkillIcon } from "@/components/ui/skill-icon";
import { cn } from "@/lib/cn";
import { formatTagLabel, getTagColorForCategory } from "@/lib/tag-utils";
import type { CategorySlug } from "@/lib/types";

type SkillInlineProps = {
  slug: string;
  title: string;
  iconUrl?: string | null;
  category: CategorySlug;
  versionLabel?: string;
  href?: string;
  /** "sm" for legend rows, sidebar, day modal; "md" for cards, settings rows, modal headers */
  size?: "sm" | "md";
  className?: string;
};

const SIZES = {
  sm: { icon: 16, text: "text-xs", badge: "sm" as const },
  md: { icon: 24, text: "text-sm", badge: "sm" as const },
} as const;

export function SkillInline({
  slug,
  title,
  iconUrl,
  category,
  versionLabel,
  href,
  size = "md",
  className,
}: SkillInlineProps) {
  const s = SIZES[size];

  const content = (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <SkillIcon
        className="shrink-0 rounded-md"
        iconUrl={iconUrl}
        size={s.icon}
        slug={slug}
      />
      <span className={cn("min-w-0 truncate font-medium text-ink", s.text)}>
        {title}
      </span>
      <Badge color={getTagColorForCategory(category)} size={s.badge}>
        {formatTagLabel(category)}
      </Badge>
      {versionLabel ? (
        <Badge color="neutral" size={s.badge}>
          {versionLabel}
        </Badge>
      ) : null}
    </span>
  );

  if (href) {
    return (
      <Link
        className="group inline-flex min-w-0 transition-opacity hover:opacity-80"
        href={href}
      >
        {content}
      </Link>
    );
  }

  return content;
}
