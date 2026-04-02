import { cn } from "@/lib/cn";

type SkeletonProps = {
  className?: string;
  style?: React.CSSProperties;
};

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton rounded-none", className)}
      style={style}
    />
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <Skeleton className={cn("h-3 w-full", className)} />;
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <Skeleton className={cn("h-40 w-full", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-3 border border-line bg-paper-3 p-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-7 shrink-0" />
        <div className="min-w-0 flex-1 grid gap-1.5">
          <SkeletonLine className="w-1/3" />
          <SkeletonLine className="w-2/3 h-2" />
        </div>
      </div>
      <div className="grid gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
