"use client";

import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";

import { Button } from "@/components/ui/button";
import { textFieldArea, textFieldBase } from "@/components/ui/field";
import { cn } from "@/lib/cn";

const DRAFT_KEY = "skillwire.chat.draft";

type SkillChatProps = {
  starterPrompt: string;
  enabled: boolean;
};

function messageToText(message: { content?: unknown; parts?: Array<{ type?: string; text?: string }> }): string {
  if (typeof message.content === "string") {
    return message.content;
  }

  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text ?? "")
      .join("\n");
  }

  return "";
}

export function SkillChat({ starterPrompt, enabled }: SkillChatProps) {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState(starterPrompt);

  useEffect(() => {
    const saved = window.localStorage.getItem(DRAFT_KEY);
    if (saved) {
      setInput(saved);
    }
  }, [setInput]);

  useEffect(() => {
    window.localStorage.setItem(DRAFT_KEY, input);
  }, [input]);

  return (
    <div className="grid gap-5 rounded-2xl border border-line bg-paper-3/92 p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-ink-soft">In-house copilot</span>
          <h2>Interrogate the desk.</h2>
        </div>
        <small className="text-ink-soft">{enabled ? "AI SDK online" : "Add OPENAI_API_KEY to enable answers"}</small>
      </div>

      <div className="chat-transcript">
        {messages.length === 0 ? (
          <div className="chat-message chat-message--assistant">
            Ask for a skill, a category brief, or the next move. Answers use the local snapshot, not live web search.
          </div>
        ) : null}

        {messages.map((message) => (
          <div
            className={`chat-message ${
              message.role === "user" ? "chat-message--user" : "chat-message--assistant"
            }`}
            key={message.id}
          >
            {messageToText(message)}
          </div>
        ))}
      </div>

      <form
        className="grid gap-4"
        onSubmit={(event) => {
          if (!enabled) {
            event.preventDefault();
            return;
          }
          event.preventDefault();
          if (!input.trim()) {
            return;
          }
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
          <Button onClick={() => setInput(starterPrompt)} type="button" variant="ghost">
            Reset prompt
          </Button>
          <Button disabled={!enabled || status === "submitted"} type="submit">
            {status === "submitted" ? "Thinking" : "Ask Loop"}
          </Button>
        </div>
      </form>
    </div>
  );
}
