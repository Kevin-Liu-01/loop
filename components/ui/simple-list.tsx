import { cn } from "@/lib/cn";

type SimpleListProps = {
  tight?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function SimpleList({ tight, className, children }: SimpleListProps) {
  return (
    <div className={cn("grid gap-0", tight && "gap-0", className)}>
      {children}
    </div>
  );
}

type SimpleListItemProps = {
  link?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

export function SimpleListItem({ link, className, children, ...rest }: SimpleListItemProps) {
  return (
    <article
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 border-t border-line bg-transparent py-4 first:border-t-0 first:pt-0",
        link && "transition-[border-color,transform,background] duration-150 hover:bg-transparent",
        className
      )}
      {...rest}
    >
      {children}
    </article>
  );
}

export function SimpleListIcon({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-paper-3 text-ink-soft [&>svg]:h-4 [&>svg]:w-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SimpleListBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("grid min-w-0 flex-1 gap-1.5", className)}>{children}</div>;
}

export function SimpleListRow({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      {children}
    </div>
  );
}

export function SimpleListMeta({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink-soft", className)}>
      {children}
    </div>
  );
}
