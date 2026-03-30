"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { THEME_ATTRIBUTE, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

function getSnapshot(): Theme {
  if (typeof document === "undefined") return "light";
  return (document.documentElement.getAttribute(THEME_ATTRIBUTE) as Theme) ?? "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(onStoreChange: () => void): () => void {
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === THEME_ATTRIBUTE) {
        onStoreChange();
        break;
      }
    }
  });

  observer.observe(document.documentElement, { attributes: true });
  return () => observer.disconnect();
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(getSnapshot() === "light" ? "dark" : "light");
  }, [setTheme]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange() {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (!stored) {
        setTheme(mq.matches ? "dark" : "light");
      }
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setTheme]);

  return { theme, setTheme, toggle };
}
