"use client";

import { useCallback, useRef } from "react";

import { useActiveOperations } from "@/components/active-operations-provider";
import { computeProgress } from "@/lib/active-operations";
import { streamLoopUpdate } from "@/lib/stream-loop-update";
import type { ActiveOperationKind } from "@/lib/active-operations";
import type { StreamLoopCallbacks } from "@/lib/stream-loop-update";
import type {
  AgentReasoningStep,
  LoopUpdateResult,
  LoopUpdateSourceLog,
  LoopUpdateTarget,
} from "@/lib/types";

type TrackedUpdateCallbacks = {
  onStart?: (loop: LoopUpdateTarget) => void;
  onSource?: (source: LoopUpdateSourceLog) => void;
  onMessage?: (message: string) => void;
  onReasoningStep?: (step: AgentReasoningStep) => void;
  onComplete?: (result: LoopUpdateResult, sources: LoopUpdateSourceLog[]) => void;
  onError?: (message: string) => void;
};

type TrackedUpdateOptions = {
  slug: string;
  origin: string;
  label: string;
  href?: string;
  trigger?: "manual" | "automation";
  kind?: ActiveOperationKind;
  callbacks?: TrackedUpdateCallbacks;
};

export function useTrackedLoopUpdate() {
  const { addOperation, updateOperation } = useActiveOperations();
  const totalSourcesRef = useRef(0);
  const completedSourcesRef = useRef(0);

  const run = useCallback(
    async (opts: TrackedUpdateOptions): Promise<void> => {
      const kind = opts.kind ?? "skill-update";
      const id = addOperation(kind, {
        label: opts.label,
        slug: opts.slug,
        href: opts.href,
        trigger: opts.trigger ?? "manual",
      });
      totalSourcesRef.current = 0;
      completedSourcesRef.current = 0;

      const bridgedCallbacks: StreamLoopCallbacks = {
        onStart(loop: LoopUpdateTarget) {
          totalSourcesRef.current = loop.sources.length;
          updateOperation(id, {
            status: "running",
            totalSteps: loop.sources.length,
            latestMessage: `Scanning ${loop.sources.length} sources...`,
          });
          opts.callbacks?.onStart?.(loop);
        },

        onSource(source: LoopUpdateSourceLog) {
          if (source.status === "done" || source.status === "error") {
            completedSourcesRef.current += 1;
          }
          const progress = computeProgress(
            completedSourcesRef.current,
            totalSourcesRef.current
          );
          updateOperation(id, {
            completedSteps: completedSourcesRef.current,
            progress,
            latestMessage: `${source.label}: ${source.note ?? source.status}`,
          });
          opts.callbacks?.onSource?.(source);
        },

        onMessage(message: string) {
          updateOperation(id, { latestMessage: message });
          opts.callbacks?.onMessage?.(message);
        },

        onReasoningStep(step: AgentReasoningStep) {
          updateOperation(id, {
            status: "completing",
            latestMessage: step.reasoning.slice(0, 100),
          });
          opts.callbacks?.onReasoningStep?.(step);
        },

        onComplete(result: LoopUpdateResult, sources: LoopUpdateSourceLog[]) {
          updateOperation(id, {
            status: "done",
            progress: 100,
            completedSteps: totalSourcesRef.current,
            latestMessage: result.changed
              ? `Updated to ${result.nextVersionLabel}`
              : "No material changes",
          });
          opts.callbacks?.onComplete?.(result, sources);
        },

        onError(message: string) {
          updateOperation(id, {
            status: "error",
            errorMessage: message,
            latestMessage: message,
          });
          opts.callbacks?.onError?.(message);
        },
      };

      try {
        await streamLoopUpdate(opts.slug, opts.origin, bridgedCallbacks);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Update failed.";
        updateOperation(id, {
          status: "error",
          errorMessage: message,
          latestMessage: message,
        });
        throw err;
      }
    },
    [addOperation, updateOperation]
  );

  return { run };
}
