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
          <button className="palette-backdrop" onClick={() => setIsOpen(false)} type="button" />
          <div className="palette-shell palette-shell--open">
            <div className="palette-panel">
              <div className="palette-header">
                <span className="eyebrow">Command palette</span>
                <span className="palette-shortcut">Esc</span>
              </div>
              <input
                className="palette-input"
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
              <div className="palette-list">
                {filteredItems.map((item) => (
                  <button
                    className="palette-item"
                    key={`${item.section}-${item.href}`}
                    onClick={() => openHref(item.href)}
                    type="button"
                  >
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.section}</small>
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
