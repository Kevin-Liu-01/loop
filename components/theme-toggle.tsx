"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/cn";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isLight = resolvedTheme === "light";

  return (
    <button
      aria-label={mounted ? (isLight ? "Switch to dark mode" : "Switch to light mode") : "Toggle theme"}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-paper-2/80 text-ink-soft transition-colors duration-150 hover:border-accent/40 hover:text-ink",
        className
      )}
      onClick={() => setTheme(isLight ? "dark" : "light")}
      type="button"
    >
      {mounted ? (
        isLight ? (
          <Moon className="h-3.5 w-3.5" strokeWidth={1.7} />
        ) : (
          <Sun className="h-3.5 w-3.5" strokeWidth={1.7} />
        )
      ) : (
        <span className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
