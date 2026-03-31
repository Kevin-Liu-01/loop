"use client";

import { useRef, useState, useEffect } from "react";

import { ChevronDownIcon, ChevronUpIcon } from "@/components/frontier-icons";
import { cn } from "@/lib/cn";

type ExpandableContentProps = {
  maxHeight?: number;
  className?: string;
  children: React.ReactNode;
};

export function ExpandableContent({
  maxHeight = 400,
  className,
  children
}: ExpandableContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [clamped, setClamped] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setClamped(el.scrollHeight > maxHeight + 40);
  }, [maxHeight, children]);

  return (
    <div className={cn("relative", className)}>
      <div
        ref={contentRef}
        style={
          !expanded && clamped ? { maxHeight, overflow: "hidden" } : undefined
        }
      >
        {children}
      </div>

      {clamped && !expanded && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-paper to-transparent" />
      )}

      {clamped && (
        <button
          className="relative z-10 my-2 mx-4 flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          onClick={() => setExpanded((prev) => !prev)}
          type="button"
        >
          {expanded ? (
            <>
              <ChevronUpIcon className="h-3.5 w-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDownIcon className="h-3.5 w-3.5" />
              Show all
            </>
          )}
        </button>
      )}
    </div>
  );
}
