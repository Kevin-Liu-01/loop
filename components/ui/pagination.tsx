import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";

const PAGE_SIZE_DEFAULT = 30;

type PaginationProps = {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE_DEFAULT): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function totalPages(totalItems: number, pageSize = PAGE_SIZE_DEFAULT): number {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize = PAGE_SIZE_DEFAULT,
  onPageChange,
  className,
}: PaginationProps) {
  const pages = totalPages(totalItems, pageSize);

  if (pages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const pageNumbers = buildPageNumbers(currentPage, pages);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-between gap-4 pt-4", className)}
    >
      <span className="text-[0.6875rem] font-medium tabular-nums text-ink-faint">
        {start}&ndash;{end} of {totalItems}
      </span>

      <div className="flex items-center gap-1">
        <button
          aria-label="Previous page"
          className={cn(
            buttonBase,
            buttonSizes["icon-sm"],
            buttonVariants.soft,
            "disabled:opacity-30"
          )}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {pageNumbers.map((entry, i) =>
          entry === "ellipsis" ? (
            <span
              className="flex size-7 items-center justify-center text-xs text-ink-faint"
              key={`ellipsis-${i}`}
            >
              &hellip;
            </span>
          ) : (
            <button
              className={cn(
                buttonBase,
                buttonSizes["icon-sm"],
                entry === currentPage ? buttonVariants.primary : buttonVariants.soft,
                "tabular-nums text-[0.6875rem]"
              )}
              key={entry}
              onClick={() => onPageChange(entry)}
              type="button"
            >
              {entry}
            </button>
          )
        )}

        <button
          aria-label="Next page"
          className={cn(
            buttonBase,
            buttonSizes["icon-sm"],
            buttonVariants.soft,
            "disabled:opacity-30"
          )}
          disabled={currentPage >= pages}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </nav>
  );
}

function buildPageNumbers(
  current: number,
  total: number
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const result: (number | "ellipsis")[] = [1];

  if (current > 3) result.push("ellipsis");

  const rangeStart = Math.max(2, current - 1);
  const rangeEnd = Math.min(total - 1, current + 1);

  for (let i = rangeStart; i <= rangeEnd; i++) {
    result.push(i);
  }

  if (current < total - 2) result.push("ellipsis");

  result.push(total);

  return result;
}
