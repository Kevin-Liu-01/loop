"use client";

import { useState } from "react";

import { postUsageEvent } from "@/components/usage-beacon";
import type { CategorySlug, UsageEventKind } from "@/lib/types";

type CopyButtonProps = {
  value: string;
  label?: string;
  usageEvent?: {
    kind: Exclude<UsageEventKind, "api_call">;
    label: string;
    path?: string;
    skillSlug?: string;
    categorySlug?: CategorySlug;
    details?: string;
  };
};

export function CopyButton({ value, label = "Copy", usageEvent }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    if (usageEvent) {
      postUsageEvent(usageEvent);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button className="copy-button" onClick={handleCopy} type="button">
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}
