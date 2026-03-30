"use client";

import { useEffect, useReducer } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { BotIcon, UserIcon } from "@/components/frontier-icons";
import { SandboxToolBlock } from "@/components/ui/sandbox-tool-block";
import { cn } from "@/lib/cn";

type MessagePart = {
  type: string;
  text?: string;
  toolInvocation?: {
    toolName: string;
    args: Record<string, unknown>;
    result?: Record<string, unknown>;
    state: string;
  };
  [key: string]: unknown;
};

type SandboxMessageProps = {
  role: "user" | "assistant" | "system";
  parts: MessagePart[];
  createdAt?: Date;
};

type SavedMessageProps = {
  role: string;
  content: string;
  createdAt: string;
};

function formatMessageTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function Timestamp({ date }: { date: Date }) {
  const [, tick] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60_000);

  let relative: string;
  if (mins < 1) relative = "just now";
  else if (mins < 60) relative = `${mins}m ago`;
  else {
    const hours = Math.floor(mins / 60);
    relative = hours < 24 ? `${hours}h ago` : formatMessageTime(date);
  }

  return (
    <time
      dateTime={date.toISOString()}
      className="text-[0.6rem] tabular-nums text-ink-faint"
      suppressHydrationWarning
    >
      {formatMessageTime(date)} · {relative}
    </time>
  );
}

function UserBubble({
  text,
  timestamp
}: {
  text: string;
  timestamp: Date;
}) {
  return (
    <div className="flex justify-end gap-3">
      <div className="grid max-w-[75%] gap-1.5">
        <div className="rounded-2xl rounded-br-md bg-accent px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
          <span className="whitespace-pre-wrap">{text}</span>
        </div>
        <div className="flex justify-end px-1">
          <Timestamp date={timestamp} />
        </div>
      </div>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10">
        <UserIcon className="h-3.5 w-3.5 text-accent" />
      </div>
    </div>
  );
}

function AssistantBubble({
  children,
  timestamp
}: {
  children: React.ReactNode;
  timestamp: Date;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-paper-2">
        <BotIcon className="h-3.5 w-3.5 text-ink-soft" />
      </div>
      <div className="min-w-0 flex-1 grid gap-1.5">
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs font-semibold text-ink">Agent</span>
          <Timestamp date={timestamp} />
        </div>
        <div className="rounded-2xl rounded-tl-md border border-line bg-paper-3/80 px-4 py-3 text-sm leading-relaxed shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

export function SandboxMessage({ role, parts, createdAt }: SandboxMessageProps) {
  const timestamp = createdAt ?? new Date();

  if (role === "user") {
    const text = parts
      .filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join("");
    return <UserBubble text={text} timestamp={timestamp} />;
  }

  return (
    <AssistantBubble timestamp={timestamp}>
      {parts.map((part, i) => {
        if (part.type === "text" && part.text) {
          return (
            <div key={i} className="chat-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {part.text}
              </ReactMarkdown>
            </div>
          );
        }
        if (part.type === "tool-invocation" && part.toolInvocation) {
          const inv = part.toolInvocation;
          return (
            <SandboxToolBlock
              key={i}
              toolName={inv.toolName}
              input={inv.args}
              output={
                inv.state === "result"
                  ? (inv.result as Record<string, unknown>)
                  : undefined
              }
              state={inv.state as "partial-call" | "call" | "result"}
            />
          );
        }
        return null;
      })}
    </AssistantBubble>
  );
}

export function SavedMessage({ role, content, createdAt }: SavedMessageProps) {
  const timestamp = new Date(createdAt);

  if (role === "user") {
    return <UserBubble text={content} timestamp={timestamp} />;
  }

  return (
    <AssistantBubble timestamp={timestamp}>
      <div className="chat-markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </AssistantBubble>
  );
}
