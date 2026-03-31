"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ActiveOperation,
  ActiveOperationKind,
  ActiveOperationStatus,
} from "@/lib/active-operations";
import { createOperationId, isTerminalStatus } from "@/lib/active-operations";

type ActiveOperationsContextValue = {
  operations: ActiveOperation[];
  activeOperations: ActiveOperation[];
  addOperation: (
    kind: ActiveOperationKind,
    opts: {
      label: string;
      slug?: string;
      href?: string;
      trigger?: "manual" | "automation";
      totalSteps?: number;
      description?: string;
    }
  ) => string;
  updateOperation: (
    id: string,
    patch: Partial<
      Pick<
        ActiveOperation,
        | "status"
        | "progress"
        | "totalSteps"
        | "completedSteps"
        | "latestMessage"
        | "errorMessage"
        | "description"
      >
    >
  ) => void;
  removeOperation: (id: string) => void;
  clearCompleted: () => void;
};

const ActiveOperationsContext = createContext<ActiveOperationsContextValue | null>(null);

const TERMINAL_LINGER_MS = 4_000;

export function ActiveOperationsProvider({ children }: { children: React.ReactNode }) {
  const [operations, setOperations] = useState<ActiveOperation[]>([]);
  const lingerTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timers = lingerTimers.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
    };
  }, []);

  const scheduleRemoval = useCallback((id: string) => {
    if (lingerTimers.current.has(id)) return;
    const timer = setTimeout(() => {
      setOperations((prev) => prev.filter((op) => op.id !== id));
      lingerTimers.current.delete(id);
    }, TERMINAL_LINGER_MS);
    lingerTimers.current.set(id, timer);
  }, []);

  const addOperation = useCallback(
    (
      kind: ActiveOperationKind,
      opts: {
        label: string;
        slug?: string;
        href?: string;
        trigger?: "manual" | "automation";
        totalSteps?: number;
        description?: string;
      }
    ): string => {
      const id = createOperationId(kind);
      const op: ActiveOperation = {
        id,
        kind,
        label: opts.label,
        description: opts.description,
        status: "queued",
        progress: 0,
        totalSteps: opts.totalSteps ?? 0,
        completedSteps: 0,
        startedAt: Date.now(),
        slug: opts.slug,
        href: opts.href,
        trigger: opts.trigger ?? "manual",
      };
      setOperations((prev) => [op, ...prev]);
      return id;
    },
    []
  );

  const updateOperation = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<
          ActiveOperation,
          | "status"
          | "progress"
          | "totalSteps"
          | "completedSteps"
          | "latestMessage"
          | "errorMessage"
          | "description"
        >
      >
    ) => {
      setOperations((prev) =>
        prev.map((op) => {
          if (op.id !== id) return op;
          const updated = { ...op, ...patch };
          if (patch.status && isTerminalStatus(patch.status)) {
            scheduleRemoval(id);
          }
          return updated;
        })
      );
    },
    [scheduleRemoval]
  );

  const removeOperation = useCallback((id: string) => {
    setOperations((prev) => prev.filter((op) => op.id !== id));
    const timer = lingerTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      lingerTimers.current.delete(id);
    }
  }, []);

  const clearCompleted = useCallback(() => {
    setOperations((prev) => prev.filter((op) => !isTerminalStatus(op.status)));
    for (const [id, timer] of lingerTimers.current.entries()) {
      clearTimeout(timer);
      lingerTimers.current.delete(id);
    }
  }, []);

  const activeOperations = operations.filter((op) => !isTerminalStatus(op.status));

  const value: ActiveOperationsContextValue = {
    operations,
    activeOperations,
    addOperation,
    updateOperation,
    removeOperation,
    clearCompleted,
  };

  return (
    <ActiveOperationsContext.Provider value={value}>
      {children}
    </ActiveOperationsContext.Provider>
  );
}

export function useActiveOperations(): ActiveOperationsContextValue {
  const ctx = useContext(ActiveOperationsContext);
  if (!ctx) {
    throw new Error("useActiveOperations must be used within an ActiveOperationsProvider");
  }
  return ctx;
}
