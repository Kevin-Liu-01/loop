export type ActiveOperationKind =
  | "skill-update"
  | "mcp-upload"
  | "skill-import"
  | "automation-run"
  | "refresh";

export type ActiveOperationStatus =
  | "queued"
  | "running"
  | "completing"
  | "done"
  | "error";

export type ActiveOperation = {
  id: string;
  kind: ActiveOperationKind;
  label: string;
  description?: string;
  status: ActiveOperationStatus;
  progress: number;
  totalSteps: number;
  completedSteps: number;
  startedAt: number;
  slug?: string;
  href?: string;
  trigger: "manual" | "automation";
  latestMessage?: string;
  errorMessage?: string;
};

export function isTerminalStatus(status: ActiveOperationStatus): boolean {
  return status === "done" || status === "error";
}

export function computeElapsedLabel(startedAt: number): string {
  const elapsed = Math.max(0, Date.now() - startedAt);
  if (elapsed < 1000) return "just now";
  const seconds = Math.floor(elapsed / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`;
}

export function computeProgress(completedSteps: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  return Math.min(100, Math.round((completedSteps / totalSteps) * 100));
}

let operationCounter = 0;

export function createOperationId(kind: ActiveOperationKind): string {
  operationCounter += 1;
  return `${kind}-${Date.now()}-${operationCounter}`;
}
