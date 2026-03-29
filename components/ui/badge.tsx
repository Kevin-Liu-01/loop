import { cn } from "@/lib/cn";

type BadgeProps = {
  muted?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Badge({ muted, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-line bg-paper-3 px-2 py-0.5 text-xs font-medium text-ink-soft",
        muted && "border-transparent bg-paper-2",
        className
      )}
    >
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
