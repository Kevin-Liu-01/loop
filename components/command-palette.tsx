"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PaletteItem = {
  label: string;
  href: string;
  section: string;
  hint?: string;
};

type CommandPaletteProps = {
  items: PaletteItem[];
};

const STORAGE_KEY = "skillwire.palette.query";

export function CommandPalette({ items }: CommandPaletteProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const savedQuery = window.localStorage.getItem(STORAGE_KEY);
    if (savedQuery) {
      setQuery(savedQuery);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, query);
  }, [query]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((value) => !value);
      }

      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onOpenRequest() {
      setIsOpen(true);
    }

    window.addEventListener("skillwire:open-palette", onOpenRequest);
    return () => window.removeEventListener("skillwire:open-palette", onOpenRequest);
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return items.slice(0, 12);
    }

    return items
      .filter((item) => {
        return (
          item.label.toLowerCase().includes(normalizedQuery) ||
          item.section.toLowerCase().includes(normalizedQuery) ||
          item.hint?.toLowerCase().includes(normalizedQuery)
        );
      })
      .slice(0, 12);
  }, [items, query]);

  function openHref(href: string) {
    router.push(href);
    setIsOpen(false);
  }

  return (
    <>
      {isOpen ? (
        <>
          <button className="fixed inset-0 z-80 border-0 bg-black/56" onClick={() => setIsOpen(false)} type="button" />
          <div className="fixed inset-6 z-90 grid translate-y-0 place-items-[start_center] opacity-100 transition-all duration-200 pointer-events-auto">
            <div className="w-[min(720px,calc(100vw-32px))] rounded-2xl border border-line bg-paper-3/88 p-7 shadow-none backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[0.72rem] uppercase tracking-[0.18em]">Command palette</span>
                <span className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-ink-soft">Esc</span>
              </div>
              <input
                className="min-h-[52px] w-full rounded-[14px] border border-line bg-paper-3 px-4 py-4 text-ink outline-none transition-all duration-200 focus:border-line-strong focus:shadow-[0_0_0_4px_rgba(244,244,245,1)]"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && filteredItems[0]) {
                    event.preventDefault();
                    openHref(filteredItems[0].href);
                  }
                }}
                placeholder="Jump to a skill, category, or brief"
                ref={inputRef}
                value={query}
              />
              <div className="grid gap-3">
                {filteredItems.map((item) => (
                  <button
                    className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-line bg-paper-3 p-4 text-left text-ink transition-all duration-200 hover:border-accent hover:bg-accent hover:text-white"
                    key={`${item.section}-${item.href}`}
                    onClick={() => openHref(item.href)}
                    type="button"
                  >
                    <span>
                      <strong className="block font-semibold text-inherit">{item.label}</strong>
                      <small className="block text-sm text-inherit opacity-60">{item.section}</small>
                    </span>
                    <span>{item.hint ?? "Open"}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
