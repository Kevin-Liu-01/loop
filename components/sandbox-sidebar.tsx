"use client";

import { useEffect, useState, useCallback } from "react";

import {
  PlusIcon,
  MessageIcon,
  TerminalIcon,
} from "@/components/frontier-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatRelativeDate } from "@/lib/format";

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
  onNew: () => void;
  version: number;
  className?: string;
};

export function SandboxSidebar({
  currentId,
  onSelect,
  onNew,
  version,
  className
}: SandboxSidebarProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>(
    []
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
      <div className="flex shrink-0 items-center justify-between border-b border-line/40 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <TerminalIcon className="h-3.5 w-3.5 text-accent/60" />
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
            Sessions
          </span>
        </div>
        <Button
          onClick={onNew}
          size="icon-sm"
          variant="ghost"
          aria-label="New session"
          className="h-7 w-7"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Conversation list */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-3 pt-2">
        {isLoading ? (
          <div className="grid gap-1.5 p-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[52px] animate-pulse rounded-xl bg-paper-2/40"
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-3.5 px-4 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-line/40 bg-paper-3/60 shadow-sm dark:bg-paper-2/60">
              <MessageIcon className="h-4.5 w-4.5 text-ink-faint/60" />
            </div>
            <div className="grid gap-1">
              <p className="text-[0.75rem] font-medium text-ink-faint">
                No sessions yet
              </p>
              <p className="text-[0.65rem] leading-relaxed text-ink-faint/60">
                Start a conversation to see it here.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-0.5">
            {conversations.map((c) => {
              const isActive = c.id === currentId;
              return (
                <button
                  key={c.id}
                  className={cn(
                    "group grid gap-1.5 rounded-xl px-3 py-3 text-left transition-all duration-150",
                    isActive
                      ? "bg-accent/[0.07] shadow-[inset_0_0_0_1px_rgba(232,101,10,0.12)]"
                      : "hover:bg-paper-3/50 dark:hover:bg-paper-2/60",
                  )}
                  onClick={() => onSelect(c.id)}
                  type="button"
                >
                  <span
                    className={cn(
                      "truncate text-[0.8rem] font-medium leading-snug",
                      isActive
                        ? "text-accent"
                        : "text-ink group-hover:text-ink",
                    )}
                  >
                    {c.title || "Untitled session"}
                  </span>
                  <span className="flex items-center gap-1.5 text-[0.6rem] tabular-nums text-ink-faint/70">
                    <span>{c.messageCount} msgs</span>
                    <span aria-hidden className="opacity-30">
                      ·
                    </span>
                    <span>{formatRelativeDate(c.updatedAt)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
