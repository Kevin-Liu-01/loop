import { cn } from "@/lib/cn";

export type StatusDotTone = "fresh" | "stale" | "error" | "idle";

type StatusDotProps = {
  tone: StatusDotTone;
  className?: string;
  pulse?: boolean;
};

const toneStyles: Record<StatusDotTone, string> = {
  fresh: "bg-emerald-500",
  stale: "bg-amber-500",
  error: "bg-red-500",
  idle: "bg-zinc-300"
};

export function StatusDot({ tone, pulse, className }: StatusDotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        toneStyles[tone],
        pulse && "animate-pulse",
        className
      )}
    />
  );
}
