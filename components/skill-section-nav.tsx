"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

export type SectionTab = {
  id: string;
  label: string;
};

type SkillSectionNavProps = {
  sections: SectionTab[];
  scrollContainerId: string;
};

export function SkillSectionNav({ sections, scrollContainerId }: SkillSectionNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibleSet = useRef(new Set<string>());

  useEffect(() => {
    const container = document.getElementById(scrollContainerId);
    if (!container) return;

    const pickActive = () => {
      const ids = sections.map((s) => s.id);
      for (const id of ids) {
        if (visibleSet.current.has(id)) {
          setActiveId(id);
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
      { root: container, rootMargin: "-10% 0px -60% 0px", threshold: 0 }
    );

    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];

    for (const el of targets) observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [sections, scrollContainerId]);

  const handleClick = useCallback(
    (id: string) => {
      const container = document.getElementById(scrollContainerId);
      const target = document.getElementById(id);
      if (!container || !target) return;

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const offset = targetRect.top - containerRect.top + container.scrollTop - 56;

      container.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
    },
    [scrollContainerId]
  );

  if (sections.length === 0) return null;

  return (
    <nav
      aria-label="Page sections"
      className="sticky top-0 z-20 flex items-center gap-1 overflow-x-auto border-b border-line bg-paper/90 px-4 backdrop-blur-md sm:px-5 lg:px-6"
    >
      {sections.map((section) => (
        <button
          className={cn(
            "shrink-0 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors",
            activeId === section.id
              ? "border-accent text-accent"
              : "border-transparent text-ink-faint hover:text-ink-muted"
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
