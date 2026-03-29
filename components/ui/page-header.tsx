import { cn } from "@/lib/cn";

type PageHeaderProps = {
  className?: string;
  children: React.ReactNode;
};

type PageHeaderLeadProps = {
  className?: string;
  children: React.ReactNode;
};

type PageHeaderSubProps = {
  className?: string;
  children: React.ReactNode;
};

type PageHeaderActionsProps = {
  className?: string;
  children: React.ReactNode;
};

export function PageHeader({ className, children }: PageHeaderProps) {
  return (
    <section
      className={cn(
        "flex flex-wrap items-end justify-between gap-5 border-b border-line pb-5 max-lg:flex-col max-lg:items-start",
        className
      )}
    >
      {children}
    </section>
  );
}

export function PageHeaderLead({ className, children }: PageHeaderLeadProps) {
  return <div className={cn("grid max-w-[56rem] gap-2", className)}>{children}</div>;
}

export function PageHeaderTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h1
      className={cn(
        "m-0 text-balance font-semibold tracking-[-0.04em] text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] max-md:text-[clamp(1.5rem,8vw,2rem)]",
        className
      )}
    >
      {children}
    </h1>
  );
}

export function PageHeaderSub({ className, children }: PageHeaderSubProps) {
  return <p className={cn("m-0 text-sm leading-6 text-ink-soft", className)}>{children}</p>;
}

export function PageHeaderActions({ className, children }: PageHeaderActionsProps) {
  return <div className={cn("flex shrink-0 flex-wrap gap-2", className)}>{children}</div>;
}
