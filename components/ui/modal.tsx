"use client";

import { useCallback, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type ModalShellProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "full";
  children: React.ReactNode;
};

const maxWidthMap: Record<NonNullable<ModalShellProps["maxWidth"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
  full: "max-w-[calc(100vw-2rem)]"
};

export function ModalShell({ open, onClose, title, maxWidth = "xl", children }: ModalShellProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center pt-[10vh] max-sm:pt-4">
      <div
        className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative z-10 grid w-full gap-0 rounded-2xl border border-line bg-paper shadow-2xl max-sm:mx-3",
          maxWidthMap[maxWidth]
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="m-0 text-lg font-semibold tracking-tight text-ink">
            {title}
          </h2>
          <Button
            onClick={onClose}
            size="icon-sm"
            type="button"
            variant="soft"
          >
            &times;
          </Button>
        </div>

        {children}
      </div>
    </div>
  );
}
