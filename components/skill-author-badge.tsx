import Link from "next/link";

import { BadgeCheckIcon } from "lucide-react";

import { LoopLogo } from "@/components/loop-logo";
import { cn } from "@/lib/cn";
import { resolveAuthorIcon } from "@/lib/icon-resolution";
import { getSkillPublisherName } from "@/lib/skill-authoring";
import type { SkillAuthorRecord, SkillRecord } from "@/lib/types";

type SkillAuthorBadgeProps = {
  author?: SkillAuthorRecord;
  ownerName?: string;
  /** Explicit icon override – when omitted the resolver infers from ownerName. */
  iconUrl?: string;
  compact?: boolean;
  className?: string;
  linked?: boolean;
};

function AuthorAvatar({
  author,
  compact,
  name,
  iconUrl,
}: {
  author?: SkillAuthorRecord;
  compact: boolean;
  name: string;
  iconUrl?: string;
}) {
  const size = compact ? "size-4" : "size-6";

  if (author?.slug === "loop") {
    return (
      <LoopLogo
        className={cn("shrink-0 text-accent", size)}
        chipClassName="fill-ink"
      />
    );
  }

  const { src, isMonochrome } = resolveAuthorIcon({
    authorLogoUrl: author?.logoUrl,
    iconUrl,
    ownerName: name,
  });

  if (src) {
    return (
      <img
        alt={`${name} logo`}
        className={cn(
          "shrink-0 rounded-full object-cover",
          size,
          isMonochrome && "brightness-0 dark:invert",
        )}
        src={src}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-accent/10 font-semibold uppercase text-accent",
        size,
        compact ? "text-[0.55rem]" : "text-[0.65rem]",
      )}
    >
      {name.charAt(0)}
    </span>
  );
}

function VerifiedTag({
  label,
  compact,
}: {
  label?: string;
  compact: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium leading-none text-accent",
        compact ? "text-[0.625rem]" : "text-xs",
      )}
    >
      <BadgeCheckIcon className={cn("shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
      <span>{label || "Verified"}</span>
    </span>
  );
}

export function SkillAuthorBadge({
  author,
  ownerName,
  iconUrl,
  compact = false,
  className,
  linked = true,
}: SkillAuthorBadgeProps) {
  const name = getSkillPublisherName({
    author,
    ownerName,
  } as Pick<SkillRecord, "author" | "ownerName">);

  const body = compact ? (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-ink-soft",
        className,
      )}
    >
      <AuthorAvatar author={author} compact name={name} iconUrl={iconUrl} />
      <span className="font-medium text-ink">{name}</span>
      {author?.verified ? (
        <VerifiedTag compact label={author.badgeLabel} />
      ) : null}
    </span>
  ) : (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-line/70 bg-paper-3/60 py-1.5 pl-2 pr-3 text-sm backdrop-blur-sm dark:bg-paper-2/40",
        "transition-colors",
        linked && author?.websiteUrl && "hover:border-accent/40 hover:bg-paper-3/90 dark:hover:bg-paper-2/60",
        className,
      )}
    >
      <AuthorAvatar author={author} compact={false} name={name} iconUrl={iconUrl} />
      <span className="font-medium text-ink">{name}</span>
      {author?.verified ? (
        <VerifiedTag compact={false} label={author.badgeLabel} />
      ) : null}
    </span>
  );

  if (linked && author?.websiteUrl) {
    return (
      <Link className="w-fit" href={author.websiteUrl} rel="noreferrer" target="_blank">
        {body}
      </Link>
    );
  }

  return body;
}
