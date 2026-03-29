import { cn } from "@/lib/cn";

type PageShellProps = {
  narrow?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

export function PageShell({ narrow, className, children, ...rest }: PageShellProps) {
  return (
    <main
      className={cn(
        "mx-auto w-[min(1180px,calc(100vw-32px))] pt-22 pb-18 max-md:w-[min(100vw-20px,1180px)] max-md:pt-21 max-md:pb-14",
        narrow && "w-[min(1160px,calc(100vw-32px))]",
        className
      )}
      {...rest}
    >
      {children}
    </main>
  );
}
