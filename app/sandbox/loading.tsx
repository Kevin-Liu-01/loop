import { AppGridShell } from "@/components/app-grid-shell";
import { BrailleSpinner } from "@/components/ui/braille-spinner";
import { PageShell } from "@/components/ui/page-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function SandboxLoading() {
  return (
    <AppGridShell
      fillViewport
      header={
        <div className="flex min-h-[52px] items-center gap-3 px-4 py-2.5 max-md:px-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-4 w-14" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-24 max-sm:w-9" />
        </div>
      }
    >
      <PageShell inset className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 gap-0">
          <div className="flex w-72 shrink-0 flex-col gap-3 border-r border-line p-4 max-lg:hidden">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-6 w-5/6" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3">
            <BrailleSpinner className="text-2xl text-ink-muted" />
          </div>
        </div>
      </PageShell>
    </AppGridShell>
  );
}
