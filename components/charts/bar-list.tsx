import { cn } from "@/lib/cn";

export type BarListItem = {
  label: string;
  value: number;
  secondary?: string;
};

type BarListProps = {
  items: BarListItem[];
  maxValue?: number;
  compact?: boolean;
  className?: string;
};

export function BarList({ items, maxValue, compact, className }: BarListProps) {
  if (items.length === 0) return null;

  const max = maxValue ?? Math.max(...items.map((item) => item.value), 1);

  if (compact) {
    return (
      <div className={cn("grid gap-2", className)}>
        {items.map((item) => {
          const pct =
            item.value > 0
              ? Math.max(4, Math.round((item.value / max) * 100))
              : 0;
          return (
            <div key={item.label} className="flex items-center gap-3">
              <span className="w-18 shrink-0 text-[0.68rem] font-medium uppercase tracking-[0.06em] text-ink-faint">
                {item.label}
              </span>
              <div
                className="h-1 flex-1 overflow-hidden rounded-full"
                style={{ background: "var(--color-line)" }}
              >
                {pct > 0 && (
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: `color-mix(in srgb, var(--color-accent) 50%, transparent)`,
                    }}
                  />
                )}
              </div>
              <span className="w-6 shrink-0 text-right text-xs tabular-nums text-ink">
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-2.5", className)}>
      {items.map((item) => {
        const pct = Math.max(2, Math.round((item.value / max) * 100));
        return (
          <div key={item.label} className="grid gap-1">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-xs text-ink-soft">
                {item.label}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs font-medium tabular-nums text-ink">
                  {item.value}
                </span>
                {item.secondary && (
                  <span className="text-[0.65rem] text-ink-faint">
                    {item.secondary}
                  </span>
                )}
              </div>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: "var(--color-line)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: `color-mix(in srgb, var(--color-accent) 50%, transparent)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
