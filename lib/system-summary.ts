import { getSkillwireSnapshot } from "@/lib/refresh";
import { readSystemStateStore } from "@/lib/system-state";

export async function getSystemSnapshot() {
  const [snapshot, systemState] = await Promise.all([getSkillwireSnapshot(), readSystemStateStore()]);

  return {
    snapshot,
    systemState
  };
}
