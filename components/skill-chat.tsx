"use client";

import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";

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
    <div className="chat-shell">
      <div className="section-head">
        <div>
          <span className="eyebrow">In-house copilot</span>
          <h2>Interrogate the desk.</h2>
        </div>
        <small>{enabled ? "AI SDK online" : "Add OPENAI_API_KEY to enable answers"}</small>
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
        className="chat-form"
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
          className="chat-input"
          disabled={!enabled}
          onChange={(event) => setInput(event.target.value)}
          placeholder="How should I use the SEO + GEO skill on a pricing page?"
          rows={4}
          value={input}
        />
        <div className="chat-actions">
          <button className="button button--ghost" onClick={() => setInput(starterPrompt)} type="button">
            Reset prompt
          </button>
          <button className="button" disabled={!enabled || status === "submitted"} type="submit">
            {status === "submitted" ? "Thinking" : "Ask Loop"}
          </button>
        </div>
      </form>
    </div>
  );
}
