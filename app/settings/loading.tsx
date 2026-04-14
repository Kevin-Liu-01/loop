import { BrailleSpinner } from "@/components/ui/braille-spinner";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="flex items-center gap-2 text-ink-muted">
        <BrailleSpinner className="text-sm" />
      </div>

      <div className="grid gap-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
