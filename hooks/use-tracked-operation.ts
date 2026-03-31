"use client";

import { useCallback, useRef } from "react";

import { useActiveOperations } from "@/components/active-operations-provider";
import type { ActiveOperationKind } from "@/lib/active-operations";

type TrackedOperationOptions = {
  kind: ActiveOperationKind;
  label: string;
  slug?: string;
  href?: string;
  trigger?: "manual" | "automation";
  totalSteps?: number;
};

type OperationHandle = {
  id: string;
  advance: (patch?: { message?: string; description?: string }) => void;
  complete: (message?: string) => void;
  fail: (errorMessage: string) => void;
};

export function useTrackedOperation() {
  const { addOperation, updateOperation } = useActiveOperations();
  const handleRef = useRef<OperationHandle | null>(null);

  const start = useCallback(
    (opts: TrackedOperationOptions): OperationHandle => {
      const id = addOperation(opts.kind, {
        label: opts.label,
        slug: opts.slug,
        href: opts.href,
        trigger: opts.trigger ?? "manual",
        totalSteps: opts.totalSteps,
      });

      updateOperation(id, { status: "running" });

      let completed = 0;
      const total = opts.totalSteps ?? 0;

      const handle: OperationHandle = {
        id,
        advance(patch) {
          completed += 1;
          const progress = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
          updateOperation(id, {
            completedSteps: completed,
            progress,
            latestMessage: patch?.message,
            description: patch?.description,
          });
        },
        complete(message) {
          updateOperation(id, {
            status: "done",
            progress: 100,
            latestMessage: message ?? "Complete",
          });
        },
        fail(errorMessage) {
          updateOperation(id, {
            status: "error",
            errorMessage,
            latestMessage: errorMessage,
          });
        },
      };

      handleRef.current = handle;
      return handle;
    },
    [addOperation, updateOperation]
  );

  return { start, current: handleRef };
}
