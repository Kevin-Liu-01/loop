"use client";

import { PackageIcon } from "@/components/frontier-icons";
import type { PackageInfo } from "@/lib/sandbox-inspect-types";

type PackagesTabProps = {
  packages: PackageInfo[];
  isLoading: boolean;
};

export function PackagesTab({ packages, isLoading }: PackagesTabProps) {
  if (isLoading && packages.length === 0) {
    return (
      <div className="grid gap-2 p-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-5 animate-pulse rounded-lg bg-paper-2/40" />
        ))}
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2.5 px-4 py-10 text-center">
        <PackageIcon className="h-5 w-5 text-ink-faint/30" />
        <p className="text-xs font-medium text-ink-faint/60">No packages installed.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-0 p-4">
      <div className="grid gap-0">
        {packages.map((pkg) => (
          <div
            key={pkg.name}
            className="flex items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-[0.7rem] transition-colors hover:bg-paper-3/30"
          >
            <span className="min-w-0 truncate font-medium text-ink">{pkg.name}</span>
            <span className="shrink-0 font-mono text-[0.6rem] tabular-nums text-ink-faint/60">
              {pkg.version}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 border-t border-line/20 pt-3 text-[0.55rem] font-medium tabular-nums text-ink-faint/50">
        {packages.length} package{packages.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
