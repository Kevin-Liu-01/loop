import { getLoopSnapshot } from "@/lib/refresh";
import { listLoopRuns, listUsageEventsForOverview } from "@/lib/system-state";

export type GetSystemSnapshotOptions = {
  /** IANA timezone for usage fetch window + overview (default UTC). */
  timeZone?: string;
  /** Include private skills (for settings/admin views). */
  includePrivate?: boolean;
};

export async function getSystemSnapshot(options?: GetSystemSnapshotOptions) {
  const timeZone = options?.timeZone ?? "UTC";
  const [snapshot, loopRuns, usageEvents] = await Promise.all([
    getLoopSnapshot({ includePrivate: options?.includePrivate }),
    listLoopRuns(),
    listUsageEventsForOverview(timeZone),
  ]);

  return {
    snapshot,
    systemState: { loopRuns, usageEvents },
  };
}
