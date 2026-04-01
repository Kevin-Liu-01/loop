"use client";

import { useState } from "react";

import { CheckIcon, ClipboardIcon } from "@/components/frontier-icons";
import { Button } from "@/components/ui/button";
import type { ButtonSize, ButtonVariant } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/shadcn/tooltip";
import { postUsageEvent } from "@/components/usage-beacon";
import { cn } from "@/lib/cn";
import type { CategorySlug, UsageEventKind } from "@/lib/types";

type CopyButtonProps = {
  value: string;
  label?: string;
  iconOnly?: boolean;
  /** Full-width CTA style — prominent dark button spanning the container. */
  block?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /** Match compact row actions (e.g. skill header) — same icon size as sm LinkButton + Play icon */
  iconSize?: "sm" | "md";
  usageEvent?: {
    kind: Exclude<UsageEventKind, "api_call">;
    label: string;
    path?: string;
    skillSlug?: string;
    categorySlug?: CategorySlug;
    details?: string;
  };
};

const iconSizeClass: Record<NonNullable<CopyButtonProps["iconSize"]>, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4"
};

export function CopyButton({
  value,
  label = "Copy",
  iconOnly,
  block,
  variant,
  size,
  className,
  iconSize = "md",
  usageEvent,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    if (usageEvent) {
      postUsageEvent(usageEvent);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  const ic = iconSizeClass[iconSize];

  if (iconOnly) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={className}
            onClick={handleCopy}
            size={size ?? "icon-sm"}
            type="button"
            variant={variant ?? "soft"}
          >
            {copied ? <CheckIcon className={ic} /> : <ClipboardIcon className={ic} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{copied ? "Copied!" : label}</TooltipContent>
      </Tooltip>
    );
  }

  if (block) {
    return (
      <Button
        className={cn("w-full justify-center text-sm font-semibold", className)}
        onClick={handleCopy}
        size={size ?? "default"}
        type="button"
        variant={variant ?? "primary"}
      >
        {copied ? <CheckIcon className={ic} /> : <ClipboardIcon className={ic} />}
        <span>{copied ? "Copied!" : label}</span>
      </Button>
    );
  }

  return (
    <Button
      className={className}
      onClick={handleCopy}
      size={size ?? "sm"}
      type="button"
      variant={variant ?? "soft"}
    >
      {copied ? <CheckIcon className={ic} /> : <ClipboardIcon className={ic} />}
      <span>{copied ? "Copied" : label}</span>
    </Button>
  );
}
