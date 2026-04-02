import { cn } from "@/lib/cn";

export type StepStatus = "pending" | "running" | "done" | "error";

type Step = {
  key: string;
  label?: string;
  status: StepStatus;
};

type StepIndicatorProps = {
  steps: Step[];
  className?: string;
};

const DOT_STATUS: Record<StepStatus, string> = {
  pending: "bg-line-strong",
  running: "bg-accent animate-pulse",
  done: "bg-success",
  error: "bg-danger",
};

const LINE_STATUS: Record<StepStatus, string> = {
  pending: "bg-line",
  running: "bg-accent/40",
  done: "bg-success/40",
  error: "bg-danger/40",
};

export function StepIndicator({ steps, className }: StepIndicatorProps) {
  if (steps.length === 0) return null;

  return (
    <div
      className={cn("flex items-center gap-0", className)}
      role="group"
      aria-label="Step progress"
    >
      {steps.map((step, i) => (
        <div className="flex items-center" key={step.key}>
          <span
            aria-label={step.label ? `${step.label}: ${step.status}` : step.status}
            className={cn(
              "inline-block h-2 w-2 shrink-0 rounded-full transition-colors duration-300",
              DOT_STATUS[step.status]
            )}
          />
          {i < steps.length - 1 && (
            <span
              aria-hidden="true"
              className={cn(
                "inline-block h-px w-3 shrink-0 transition-colors duration-300",
                LINE_STATUS[steps[i + 1]?.status ?? "pending"]
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

type StepIndicatorCompactProps = {
  completed: number;
  total: number;
  hasError?: boolean;
  className?: string;
};

export function StepIndicatorCompact({
  completed,
  total,
  hasError,
  className,
}: StepIndicatorCompactProps) {
  const steps: Step[] = Array.from({ length: total }, (_, i) => ({
    key: String(i),
    status: hasError && i === completed
      ? "error"
      : i < completed
        ? "done"
        : i === completed
          ? "running"
          : "pending",
  }));

  return <StepIndicator className={className} steps={steps} />;
}
