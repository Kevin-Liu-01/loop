import { cn } from "@/lib/cn";

type SkillRowProps = {
  className?: string;
  children: React.ReactNode;
};

export function SkillRow({ className, children }: SkillRowProps) {
  return (
    <article
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-t border-line py-4 first:border-t-0 first:pt-0 max-lg:grid-cols-1",
        className
      )}
    >
      {children}
    </article>
  );
}

export function SkillRowContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("grid min-w-0 gap-1.5", className)}>{children}</div>;
}

export function SkillRowHead({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}

export function SkillRowTitle({ className, children, ...rest }: { className?: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cn("text-base font-semibold text-ink hover:text-ink-soft", className)} {...rest}>
      {children}
    </a>
  );
}

export function SkillRowBadges({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("flex flex-wrap gap-1.5", className)}>{children}</span>;
}

export function SkillRowDesc({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "m-0 line-clamp-2 text-sm leading-relaxed text-ink-soft",
        className
      )}
    >
      {children}
    </p>
  );
}

export function SkillRowMeta({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("text-xs text-ink-faint", className)}>{children}</span>;
}

export function SkillRowAction({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("shrink-0 pt-0.5 max-lg:justify-self-start", className)}>
      {children}
    </div>
  );
}
