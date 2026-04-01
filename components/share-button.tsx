"use client";

import { useCallback, useState } from "react";

import { ShareIcon } from "@/components/frontier-icons";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/shadcn/tooltip";

type ShareButtonProps = {
  href: string;
};

export function ShareButton({ href }: ShareButtonProps) {
  const [shared, setShared] = useState(false);

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined"
      ? `${window.location.origin}${href}`
      : href;

    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch {
        /* user cancelled or not supported – fall through to clipboard */
      }
    }

    await navigator.clipboard.writeText(url);
    setShared(true);
    window.setTimeout(() => setShared(false), 1400);
  }, [href]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleShare}
          size="icon-sm"
          type="button"
          variant="soft"
        >
          {shared ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <ShareIcon />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{shared ? "Link copied!" : "Share skill"}</TooltipContent>
    </Tooltip>
  );
}
