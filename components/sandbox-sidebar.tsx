"use client";

import { useEffect, useState, useCallback } from "react";

import {
  PlusIcon,
  MessageIcon,
  TerminalIcon,
  TrashIcon,
} from "@/components/frontier-icons";
import { Button } from "@/components/ui/button";
import { useAppTimezone } from "@/hooks/use-app-timezone";
import { cn } from "@/lib/cn";
import { formatRelativeDate } from "@/lib/format";
import { sandboxHeaderHeight, sandboxHeaderBase, sandboxEyebrow } from "@/lib/sandbox-ui";

type ConversationSummary = {
  id: string;
  title: string;
  messageCount: number;
  model?: string;
  createdAt: string;
  updatedAt: string;
};

type SandboxSidebarProps = {
  currentId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  version: number;
  className?: string;
};

export function SandboxSidebar({
  currentId,
  onSelect,
  onDelete,
  onNew,
  version,
  className,
}: SandboxSidebarProps) {
  const { timeZone } = useAppTimezone();
  const [conversations, setConversations] = useState<ConversationSummary[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetch("/api/conversations?channel=sandbox&limit=30")
      .then((r) => r.json())
      .then((data) => setConversations(data.conversations ?? []))
      .catch(() => setConversations([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, version]);

  return (
    <div className={cn("flex h-full min-h-0 min-w-0 flex-col", className)}>
      {/* Header */}
      <div className={cn(sandboxHeaderBase, sandboxHeaderHeight, "justify-between")}>
        <div className="flex items-center gap-2.5">
          <TerminalIcon className="h-3.5 w-3.5 text-accent" />
          <span className={sandboxEyebrow}>Sessions</span>
        </div>
        <Button
          onClick={onNew}
          size="icon-sm"
          variant="ghost"
          aria-label="New session"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* New session */}
      <div className="shrink-0 border-b border-line px-3 py-2.5">
        <button
          className="flex w-full items-center gap-2 border border-dashed border-line px-3 py-2 text-left text-xs font-medium text-ink-faint transition-colors hover:border-accent/40 hover:text-accent"
          onClick={onNew}
          type="button"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          New session
        </button>
      </div>

      {/* Conversation list */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <div className="grid gap-0">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[52px] animate-pulse border-b border-line/60 bg-paper-2/30"
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <div className="flex h-8 w-8 items-center justify-center border border-line bg-paper-3">
              <MessageIcon className="h-4 w-4 text-ink-faint/60" />
            </div>
            <div className="grid gap-1">
              <p className="text-xs font-medium text-ink-faint">
                No sessions yet
              </p>
              <p className="text-[0.6875rem] leading-relaxed text-ink-faint/60">
                Start a conversation to see it here.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-0">
            {conversations.map((c) => {
              const isActive = c.id === currentId;
              return (
                <button
                  key={c.id}
                  className={cn(
                    "group relative flex w-full items-start gap-2.5 border-b border-line/60 px-4 py-3 text-left transition-colors",
                    isActive
                      ? "bg-accent/[0.06]"
                      : "hover:bg-paper-2/50",
                  )}
                  onClick={() => onSelect(c.id)}
                  type="button"
                >
                  {isActive && (
                    <span className="absolute inset-y-0 left-0 w-[2px] bg-accent" />
                  )}

                  <div className="grid min-w-0 flex-1 gap-1">
                    <span
                      className={cn(
                        "truncate text-sm font-medium leading-snug",
                        isActive
                          ? "text-accent"
                          : "text-ink group-hover:text-ink",
                      )}
                    >
                      {c.title || "Untitled session"}
                    </span>
                    <div className="flex items-center gap-1.5 text-[0.6875rem] tabular-nums text-ink-faint">
                      <MessageIcon className="h-3 w-3" />
                      <span>{c.messageCount}</span>
                      <span className="text-line-strong">·</span>
                      <span>{formatRelativeDate(c.updatedAt, timeZone)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Delete session"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-faint/0 transition-colors group-hover:text-ink-faint hover:!text-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(c.id);
                    }}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
