import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "ghost";
type ButtonSize = "default" | "sm";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

type ButtonLinkProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  href: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

const base = "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150";

const variants: Record<ButtonVariant, string> = {
  primary: "border border-accent bg-accent text-white hover:bg-accent-hover hover:border-accent-hover",
  ghost: "border border-line bg-paper-3 text-ink hover:border-accent hover:bg-accent hover:text-white"
};

const sizes: Record<ButtonSize, string> = {
  default: "min-h-10 rounded-2xl px-4 py-2 text-sm",
  sm: "min-h-8 rounded-full px-3 py-1.5 text-xs"
};

export function Button({ variant = "primary", size = "default", className, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  );
}

export function ButtonLink({ variant = "primary", size = "default", className, ...rest }: ButtonLinkProps) {
  return (
    <a
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  );
}
