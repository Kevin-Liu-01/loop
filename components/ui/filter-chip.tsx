import { cn } from "@/lib/cn";

type FilterChipProps = {
  active?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function FilterChip({ active, className, ...rest }: FilterChipProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-line bg-paper-3 px-3 py-1.5 text-sm text-ink-soft transition-colors duration-150",
        active && "border-accent bg-accent text-white",
        !active && "hover:border-accent hover:bg-accent hover:text-white",
        className
      )}
      {...rest}
    />
  );
}
