import { cn } from "@/lib/cn";
import type { LoopUpdateSourceLog } from "@/lib/types";

type RunMetadataBarProps = {
  trigger: string;
  editorModel: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  status: "success" | "error" | "running";
  /** Pass sourceLogs for the full variant to show source/signal counts. */
  sourceLogs?: LoopUpdateSourceLog[];
  searchesUsed?: number;
  addedSourceCount?: number;
  /** "compact" = 2x2 grid (inline), "full" = wider grid with sources/signals. */
  variant?: "compact" | "full";
  className?: string;
};

const statCell = "grid gap-1 bg-paper-3 p-3";
const statCellBordered = "grid gap-1 border border-line bg-paper-3 p-3";
const label = "text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-ink-soft";
const value = "text-sm font-semibold tracking-[-0.03em]";

function formatDuration(startedAt: string, finishedAt: string): string {
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function CompactBar({
  trigger,
  editorModel,
  startedAt,
  finishedAt,
  status,
  searchesUsed,
  addedSourceCount,
  className,
}: RunMetadataBarProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
      <div className={statCellBordered}>
        <small className={label}>trigger</small>
        <strong className={value}>{trigger}</strong>
      </div>
      <div className={statCellBordered}>
        <small className={label}>editor</small>
        <strong className={cn(value, "truncate")}>{editorModel ?? "pending"}</strong>
      </div>
      <div className={statCellBordered}>
        <small className={label}>duration</small>
        <strong className={value}>
          {startedAt && finishedAt ? formatDuration(startedAt, finishedAt) : "running..."}
        </strong>
      </div>
      <div className={statCellBordered}>
        <small className={label}>status</small>
        <strong
          className={cn(
            value,
            status === "error" && "text-danger",
            status === "running" && "text-warning",
          )}
        >
          {status}
        </strong>
      </div>
      {(searchesUsed ?? 0) > 0 && (
        <div className={statCellBordered}>
          <small className={label}>web searches</small>
          <strong className={value}>{searchesUsed}</strong>
        </div>
      )}
      {(addedSourceCount ?? 0) > 0 && (
        <div className={statCellBordered}>
          <small className={label}>sources discovered</small>
          <strong className={cn(value, "text-emerald-600 dark:text-emerald-400")}>
            +{addedSourceCount}
          </strong>
        </div>
      )}
    </div>
  );
}

function FullBar({
  trigger,
  editorModel,
  startedAt,
  finishedAt,
  status,
  sourceLogs = [],
  searchesUsed,
  addedSourceCount,
  className,
}: RunMetadataBarProps) {
  const totalSignals = sourceLogs.reduce((acc, s) => acc + s.itemCount, 0);
  const sourcesDone = sourceLogs.filter((s) => s.status === "done").length;
  const hasSearchMetrics = (searchesUsed ?? 0) > 0 || (addedSourceCount ?? 0) > 0;

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 xl:grid-cols-6",
        className
      )}
    >
      <div className={statCell}>
        <small className={label}>trigger</small>
        <strong className={value}>{trigger}</strong>
      </div>
      <div className={statCell}>
        <small className={label}>editor</small>
        <strong className={cn(value, "truncate")}>{editorModel ?? "pending"}</strong>
      </div>
      <div className={statCell}>
        <small className={label}>duration</small>
        <strong className={value}>
          {startedAt && finishedAt ? formatDuration(startedAt, finishedAt) : "running..."}
        </strong>
      </div>
      <div className={statCell}>
        <small className={label}>status</small>
        <strong
          className={cn(
            value,
            status === "error" && "text-danger",
            status === "running" && "text-warning",
            status === "success" && "text-success"
          )}
        >
          {status}
        </strong>
      </div>
      <div className={statCell}>
        <small className={label}>sources</small>
        <strong className={value}>
          {sourcesDone}/{sourceLogs.length} complete
        </strong>
      </div>
      <div className={statCell}>
        <small className={label}>signals</small>
        <strong className={value}>{totalSignals} captured</strong>
      </div>
      {hasSearchMetrics && (
        <>
          {(searchesUsed ?? 0) > 0 && (
            <div className={statCell}>
              <small className={label}>web searches</small>
              <strong className={value}>{searchesUsed}</strong>
            </div>
          )}
          {(addedSourceCount ?? 0) > 0 && (
            <div className={statCell}>
              <small className={label}>sources discovered</small>
              <strong className={cn(value, "text-emerald-600 dark:text-emerald-400")}>
                +{addedSourceCount}
              </strong>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function RunMetadataBar(props: RunMetadataBarProps) {
  const { variant = "compact" } = props;
  return variant === "full" ? <FullBar {...props} /> : <CompactBar {...props} />;
}
