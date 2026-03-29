import { cn } from "@/lib/cn";

type EmptyCardProps = {
  className?: string;
  children: React.ReactNode;
};

export function EmptyCard({ className, children }: EmptyCardProps) {
  return (
    <div
      className={cn(
        "grid min-h-30 place-items-center rounded-[18px] border border-dashed border-line-strong bg-transparent p-7 text-center text-ink-soft",
        className
      )}
    >
      {children}
    </div>
  );
}
