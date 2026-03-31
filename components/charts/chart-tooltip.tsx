import { cn } from "@/lib/cn";

export type TooltipRow = {
  label: string;
  value: string | number;
  color?: string;
  dashed?: boolean;
};

type ChartTooltipContentProps = {
  label: string;
  rows: TooltipRow[];
  className?: string;
};

export function ChartTooltipContent({
  label,
  rows,
  className,
}: ChartTooltipContentProps) {
  return (
    <div
      className={cn(
        "pointer-events-none whitespace-nowrap border border-line bg-paper px-2.5 py-1.5 shadow-sm",
        "text-[0.6875rem] leading-snug",
        className
      )}
    >
      <p className="m-0 mb-0.5 font-medium tabular-nums text-ink">{label}</p>
      <div className="grid gap-px">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            {row.color != null && (
              <span
                className="h-[2px] w-2.5 shrink-0 rounded-full"
                style={{
                  background: row.color,
                  opacity: row.dashed ? 0.55 : 1,
                }}
              />
            )}
            <span className="text-ink-faint">{row.label}</span>
            <span className="ml-auto pl-3 font-medium tabular-nums text-ink">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
