import { cn } from "@/lib/cn";

type PanelProps = {
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

type PanelHeadProps = {
  className?: string;
  children: React.ReactNode;
};

export function Panel({ compact, className, children, ...rest }: PanelProps) {
  return (
    <div
      className={cn(
        "grid gap-5 rounded-2xl border border-line bg-paper-3/92 p-6",
        compact && "p-5",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PanelHead({ className, children }: PanelHeadProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      {children}
    </div>
  );
}
