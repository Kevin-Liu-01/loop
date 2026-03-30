import { getLoopSnapshot } from "@/lib/refresh";
import { listLoopRuns, listUsageEvents } from "@/lib/system-state";

export async function getSystemSnapshot() {
  const [snapshot, loopRuns, usageEvents] = await Promise.all([
    getLoopSnapshot(),
    listLoopRuns(),
    listUsageEvents()
  ]);

  return {
    snapshot,
    systemState: { loopRuns, usageEvents }
  };
}
