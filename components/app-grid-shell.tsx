import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/cn";

type AppGridShellProps = {
  header: React.ReactNode;
  children: React.ReactNode;
  /**
   * Fill space below the header so children (e.g. sandbox) can use h-full / flex-1.
   */
  fillViewport?: boolean;
  /** Extra classes on the scrollable region above the footer */
  bodyClassName?: string;
};

/**
 * Full-bleed grid frame: viewport borders, header, flex main, footer.
 * Center column rules in children should use flex-1 min-h-0 so they span header–footer.
 */
export function AppGridShell({ header, children, fillViewport, bodyClassName }: AppGridShellProps) {
  return (
    <div
      className={cn(
        "flex w-full max-w-full flex-col border border-line bg-paper/90 backdrop-blur-xl dark:bg-paper/82",
        fillViewport ? "h-dvh max-h-dvh overflow-hidden" : "min-h-dvh",
      )}
    >
      <header
        className="sticky top-0 z-60 w-full shrink-0 border-b border-line bg-paper/95 backdrop-blur-xl dark:bg-paper/88"
        role="banner"
      >
        {header}
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col",
            fillViewport ? "overflow-hidden" : "",
            bodyClassName
          )}
        >
          {children}
        </div>
        {!fillViewport && <SiteFooter />}
      </div>
    </div>
  );
}
