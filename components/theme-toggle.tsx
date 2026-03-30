"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/use-theme";
import { cn } from "@/lib/cn";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();

  return (
    <button
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-paper-2/80 text-ink-soft transition-colors duration-150 hover:border-accent/40 hover:text-ink",
        className
      )}
      onClick={toggle}
      type="button"
    >
      {theme === "light" ? (
        <Moon className="h-3.5 w-3.5" strokeWidth={1.7} />
      ) : (
        <Sun className="h-3.5 w-3.5" strokeWidth={1.7} />
      )}
    </button>
  );
}
