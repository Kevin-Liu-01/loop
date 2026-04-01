"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { SITE_HEADER_HEIGHT_PX } from "@/lib/ui-layout";

export type SectionTab = {
  id: string;
  label: string;
};

type SkillSectionNavProps = {
  sections: SectionTab[];
};

export function SkillSectionNav({ sections }: SkillSectionNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const navRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibleSet = useRef(new Set<string>());
  const programmaticScrollRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const navH = navRef.current?.getBoundingClientRect().height ?? 0;
    const deadZone = SITE_HEADER_HEIGHT_PX + navH;

    const pickActive = () => {
      if (programmaticScrollRef.current) return;
      for (const s of sections) {
        if (visibleSet.current.has(s.id)) {
          setActiveId(s.id);
          return;
        }
      }
    };

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleSet.current.add(entry.target.id);
          } else {
            visibleSet.current.delete(entry.target.id);
          }
        }
        pickActive();
      },
      {
        root: null,
        rootMargin: `-${deadZone}px 0px -55% 0px`,
        threshold: 0,
      }
    );

    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];

    for (const el of targets) observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [sections]);

  useEffect(() => {
    return () => {
      clearTimeout(scrollTimerRef.current);
    };
  }, []);

  const handleClick = useCallback(
    (id: string) => {
      setActiveId(id);
      programmaticScrollRef.current = true;
      clearTimeout(scrollTimerRef.current);

      const target = document.getElementById(id);
      if (!target) {
        programmaticScrollRef.current = false;
        return;
      }

      const navH = navRef.current?.getBoundingClientRect().height ?? 0;
      const y =
        target.getBoundingClientRect().top +
        window.scrollY -
        SITE_HEADER_HEIGHT_PX -
        navH;

      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });

      scrollTimerRef.current = setTimeout(() => {
        programmaticScrollRef.current = false;
      }, 800);
    },
    []
  );

  if (sections.length === 0) return null;

  return (
    <nav
      ref={navRef}
      aria-label="Page sections"
      className={cn(
        "sticky z-30 flex items-center gap-1 overflow-x-auto border-b border-line",
        "bg-paper/90 px-4 backdrop-blur-md sm:px-5 lg:px-6"
      )}
      style={{ top: SITE_HEADER_HEIGHT_PX }}
    >
      {sections.map((section) => (
        <button
          className={cn(
            "shrink-0 cursor-pointer border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors active:scale-[0.97]",
            activeId === section.id
              ? "border-accent text-accent"
              : "border-transparent text-ink-faint hover:text-ink-muted hover:border-line"
          )}
          key={section.id}
          onClick={() => handleClick(section.id)}
          type="button"
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}
