import { cn } from "@/lib/cn";

export type ProgressBarSize = "sm" | "md" | "lg";
export type ProgressBarVariant = "accent" | "success" | "danger" | "neutral";
export type ProgressBarStatus = "active" | "done" | "error";

type ProgressBarProps = {
  /** 0-100. Pass `undefined` for indeterminate mode. */
  progress?: number;
  status?: ProgressBarStatus;
  variant?: ProgressBarVariant;
  size?: ProgressBarSize;
  /** Use rounded-full (banner) vs rounded-none (panel). Default: true. */
  rounded?: boolean;
  className?: string;
};

const SIZE_CLASSES: Record<ProgressBarSize, string> = {
  sm: "h-px",
  md: "h-1.5",
  lg: "h-2.5",
};

const FILL_VARIANTS: Record<ProgressBarVariant, string> = {
  accent: "bg-accent",
  success: "bg-success",
  danger: "bg-danger",
  neutral: "bg-ink-muted",
};

function resolveVariant(
  status: ProgressBarStatus | undefined,
  variant: ProgressBarVariant | undefined
): ProgressBarVariant {
  if (variant) return variant;
  if (status === "done") return "success";
  if (status === "error") return "danger";
  return "accent";
}

export function ProgressBar({
  progress,
  status = "active",
  variant,
  size = "md",
  rounded = true,
  className,
}: ProgressBarProps) {
  const resolved = resolveVariant(status, variant);
  const isActive = status === "active";
  const indeterminate = progress === undefined || (isActive && progress === 0);
  const pct = indeterminate ? 0 : Math.min(100, Math.max(0, progress ?? 0));
  const rounding = rounded ? "rounded-full" : "rounded-none";

  return (
    <div
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={indeterminate ? undefined : pct}
      className={cn(
        "relative w-full overflow-hidden bg-line/60",
        SIZE_CLASSES[size],
        rounding,
        className
      )}
      role="progressbar"
    >
      {!indeterminate && (
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-[width] duration-500 ease-out",
            rounding,
            FILL_VARIANTS[resolved],
            isActive && "operation-progress-shimmer"
          )}
          style={{ width: `${Math.max(isActive ? 4 : 0, pct)}%` }}
        />
      )}
      {indeterminate && isActive && (
        <div
          className={cn(
            "absolute inset-0 operation-indeterminate-bar",
            rounding,
            `${FILL_VARIANTS[resolved]}/60`
          )}
        />
      )}
    </div>
  );
}
