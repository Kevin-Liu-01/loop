"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";

import { BotIcon, PlusIcon, ResetIcon, SendIcon, StopIcon } from "@/components/frontier-icons";
import { ChatMessageBubble } from "@/components/chat-message-bubble";
import { ConversationHistory } from "@/components/conversation-history";
import { Button } from "@/components/ui/button";
import { textFieldArea, textFieldBase } from "@/components/ui/field";
import { messageToText } from "@/lib/chat";
import { Tip } from "@/components/ui/tip";
import { cn } from "@/lib/cn";

const DRAFT_KEY = "loop.chat.draft";
const CONVERSATION_KEY = "loop.chat.conversationId";

type SkillChatProps = {
  starterPrompt: string;
  enabled: boolean;
};

export function SkillChat({ starterPrompt, enabled }: SkillChatProps) {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState(starterPrompt);
  const conversationIdRef = useRef<string | null>(null);
  const prevMessageCountRef = useRef(0);
  const timestampsRef = useRef<Map<string, string>>(new Map());

  function getTimestamp(messageId: string): string {
    let ts = timestampsRef.current.get(messageId);
    if (!ts) {
      ts = new Date().toISOString();
      timestampsRef.current.set(messageId, ts);
    }
    return ts;
  }

  useEffect(() => {
    const saved = window.localStorage.getItem(DRAFT_KEY);
    if (saved) {
      setInput(saved);
    }
    conversationIdRef.current = window.localStorage.getItem(CONVERSATION_KEY);
  }, [setInput]);

  useEffect(() => {
    window.localStorage.setItem(DRAFT_KEY, input);
  }, [input]);

  const saveConversation = useCallback(async () => {
    if (messages.length === 0) return;

    const serialized = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: messageToText(m),
      createdAt: getTimestamp(m.id)
    }));

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: conversationIdRef.current,
          channel: "copilot",
          title: serialized[0]?.content.slice(0, 80) || "Copilot chat",
          messages: serialized
        })
      });

      if (response.ok) {
        const data = (await response.json()) as { id: string };
        conversationIdRef.current = data.id;
        window.localStorage.setItem(CONVERSATION_KEY, data.id);
      }
    } catch {
      // silent — persistence is best-effort
    }
  }, [messages]);

  useEffect(() => {
    if (
      status === "ready" &&
      messages.length > 0 &&
      messages.length !== prevMessageCountRef.current
    ) {
      prevMessageCountRef.current = messages.length;
      saveConversation();
    }
  }, [status, messages.length, saveConversation]);

  return (
    <div className="grid gap-5 rounded-2xl border border-line bg-paper-3/92 p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="flex items-center gap-1.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ink-soft">
            <BotIcon className="h-3.5 w-3.5" />
            In-house copilot
          </span>
          <h2>Interrogate the desk.</h2>
        </div>
        <div className="flex items-center gap-4">
          <ConversationHistory
            channel="copilot"
            onSelect={async (id) => {
              try {
                const res = await fetch(`/api/conversations/${id}`);
                if (!res.ok) return;
                const { conversation } = await res.json();
                conversationIdRef.current = conversation.id;
                window.localStorage.setItem(CONVERSATION_KEY, conversation.id);
                window.location.reload();
              } catch { /* silent */ }
            }}
          />
          <Tip content={enabled ? "Copilot is connected and ready" : "Set the OPENAI_API_KEY environment variable to enable"} side="bottom">
            <small className="text-ink-soft">{enabled ? "AI SDK online" : "Add OPENAI_API_KEY to enable answers"}</small>
          </Tip>
        </div>
      </div>

      <div className="chat-transcript">
        {messages.length === 0 ? (
          <div className="chat-message chat-message--assistant">
            Ask for a skill, a category brief, or the next move. Answers use the local snapshot, not live web search.
          </div>
        ) : null}

        {messages.map((message) => (
          <ChatMessageBubble
            key={message.id}
            role={message.role as "user" | "assistant"}
            text={messageToText(message)}
            createdAt={getTimestamp(message.id)}
          />
        ))}
      </div>

      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!enabled || !input.trim()) return;
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <textarea
          className={cn(textFieldBase, textFieldArea)}
          disabled={!enabled}
          onChange={(event) => setInput(event.target.value)}
          placeholder="How should I use the SEO + GEO skill on a pricing page?"
          rows={4}
          value={input}
        />
        <div className="flex flex-wrap gap-3">
          <Tip content="Clear the thread and start fresh" side="top">
            <Button
              onClick={() => {
                conversationIdRef.current = null;
                prevMessageCountRef.current = 0;
                timestampsRef.current.clear();
                window.localStorage.removeItem(CONVERSATION_KEY);
                window.location.reload();
              }}
              type="button"
              variant="ghost"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              New chat
            </Button>
          </Tip>
          <Tip content="Restore the default starter prompt" side="top">
            <Button onClick={() => setInput(starterPrompt)} type="button" variant="ghost">
              <ResetIcon className="h-3.5 w-3.5" />
              Reset prompt
            </Button>
          </Tip>
          <Button disabled={!enabled || status === "submitted"} type="submit">
            {status === "submitted" ? (
              <>
                <StopIcon className="h-3.5 w-3.5" />
                Thinking
              </>
            ) : (
              <>
                <SendIcon className="h-3.5 w-3.5" />
                Ask Loop
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
