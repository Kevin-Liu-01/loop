import Link from "next/link";

import { cn } from "@/lib/cn";

type LinkButtonVariant = "primary" | "ghost";
type LinkButtonSize = "default" | "sm";

type LinkButtonProps = {
  variant?: LinkButtonVariant;
  size?: LinkButtonSize;
  className?: string;
  href: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "className">;

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150";

const variants: Record<LinkButtonVariant, string> = {
  primary:
    "border border-accent bg-accent text-white hover:bg-accent-hover hover:border-accent-hover",
  ghost:
    "border border-line bg-paper-3 text-ink hover:border-accent hover:bg-accent hover:text-white"
};

const sizes: Record<LinkButtonSize, string> = {
  default: "min-h-10 rounded-2xl px-4 py-2 text-sm",
  sm: "min-h-8 rounded-full px-3 py-1.5 text-xs"
};

export function LinkButton({
  variant = "primary",
  size = "default",
  className,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  );
}
