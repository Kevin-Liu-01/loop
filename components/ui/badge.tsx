import { cn } from "@/lib/cn";
import { TAG_COLOR_CLASSES, type TagColor } from "@/lib/tag-utils";

type BadgeProps = {
  /** @deprecated Use `color` instead for semantic coloring. Kept for backward compat. */
  muted?: boolean;
  color?: TagColor;
  /** Smaller size for inline/dense contexts */
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
};

const BASE =
  "inline-flex max-w-[min(14rem,100%)] shrink-0 items-center justify-center rounded-full border font-medium leading-none tracking-tight whitespace-nowrap tabular-nums";

const SIZE_CLASSES = {
  sm: "h-5 px-2 text-[0.625rem]",
  md: "h-6 px-2.5 text-[0.6875rem]",
} as const;

const MUTED_CLASSES =
  "border-transparent bg-paper-2 text-ink-faint ring-1 ring-inset ring-line/50 dark:ring-line/35";

const DEFAULT_CLASSES = "border-line bg-paper-3 text-ink-soft";

export function Badge({
  muted,
  color,
  size = "md",
  className,
  children,
}: BadgeProps) {
  const colorClass = color
    ? TAG_COLOR_CLASSES[color]
    : muted
      ? MUTED_CLASSES
      : DEFAULT_CLASSES;

  return (
    <span className={cn(BASE, SIZE_CLASSES[size], colorClass, className)}>
      {children}
    </span>
  );
}

type EyebrowPillProps = {
  className?: string;
  children: React.ReactNode;
};

export function EyebrowPill({ className, children }: EyebrowPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-line bg-paper-3 px-3 py-1.5 text-sm text-ink-soft",
        className
      )}
    >
      {children}
    </span>
  );
}
