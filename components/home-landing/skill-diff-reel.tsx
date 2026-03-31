"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/cn";
import { formatTagLabel } from "@/lib/tag-utils";
import { DIFF_SCENES, type DiffScene, type DiffSceneLine } from "@/lib/home-landing/skill-diff-scenes";

const SCENE_DURATION_MS = 5_500;

function DiffLineRow({ line, index }: { line: DiffSceneLine; index: number }) {
  const isAdded = line.type === "added";
  const isRemoved = line.type === "removed";

  return (
    <motion.div
      className={cn(
        "grid grid-cols-[1.125rem_minmax(0,1fr)] items-baseline",
        isAdded && "bg-[oklch(0.26_0.06_145/0.35)]",
        isRemoved && "bg-[oklch(0.26_0.06_25/0.3)]"
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, delay: index * 0.02 }}
    >
      <span
        className={cn(
          "select-none text-center text-[0.6875rem] font-bold leading-[1.7]",
          isAdded && "text-[oklch(0.72_0.16_145)]",
          isRemoved && "text-[oklch(0.72_0.14_25)]",
          !isAdded && !isRemoved && "text-ink-faint/40"
        )}
      >
        {isAdded ? "+" : isRemoved ? "\u2212" : " "}
      </span>
      <code
        className={cn(
          "whitespace-pre-wrap break-words pr-3 text-[0.6875rem] leading-[1.7]",
          isAdded && "text-[oklch(0.88_0.06_145)]",
          isRemoved && "text-[oklch(0.78_0.06_25)] line-through decoration-[oklch(0.78_0.06_25/0.3)]",
          !isAdded && !isRemoved && "text-ink-soft/70"
        )}
      >
        {line.value || "\u00A0"}
      </code>
    </motion.div>
  );
}

function SceneHeader({ scene }: { scene: DiffScene }) {
  const added = scene.lines.filter((l) => l.type === "added").length;
  const removed = scene.lines.filter((l) => l.type === "removed").length;

  return (
    <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3 py-2">
      <span className="truncate text-[0.6875rem] font-semibold text-white/90">
        {scene.skillTitle}
      </span>
      <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[0.6rem] font-medium text-white/50">
        {formatTagLabel(scene.category)}
      </span>
      <span className="shrink-0 text-[0.6rem] tabular-nums text-white/40">
        {scene.versionFrom} → {scene.versionTo}
      </span>
      <div className="ml-auto flex items-center gap-1.5">
        {added > 0 && (
          <span className="rounded-md bg-[oklch(0.42_0.12_145/0.25)] px-1.5 py-0.5 text-[0.6rem] font-bold tabular-nums text-[oklch(0.78_0.14_145)]">
            +{added}
          </span>
        )}
        {removed > 0 && (
          <span className="rounded-md bg-[oklch(0.42_0.10_25/0.25)] px-1.5 py-0.5 text-[0.6rem] font-bold tabular-nums text-[oklch(0.78_0.12_25)]">
            &minus;{removed}
          </span>
        )}
      </div>
    </div>
  );
}

export function SkillDiffReel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % DIFF_SCENES.length);
    }, SCENE_DURATION_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const scene = DIFF_SCENES[activeIndex]!;

  return (
    <div className="grid h-full gap-0 overflow-hidden rounded-xl border border-white/[0.06] bg-[rgb(18,18,22)] font-mono shadow-2xl shadow-black/40">
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.skillTitle}
          className="grid grid-rows-[auto_1fr] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SceneHeader scene={scene} />
          <div className="overflow-hidden">
            {scene.lines.map((line, i) => (
              <DiffLineRow key={`${scene.skillTitle}-${i}`} line={line} index={i} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Scene indicator dots */}
      <div className="flex items-center justify-center gap-1.5 border-t border-white/[0.06] py-2">
        {DIFF_SCENES.map((s, i) => (
          <button
            key={s.skillTitle}
            type="button"
            onClick={() => {
              setActiveIndex(i);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = setInterval(() => {
                  setActiveIndex((prev) => (prev + 1) % DIFF_SCENES.length);
                }, SCENE_DURATION_MS);
              }
            }}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              i === activeIndex
                ? "w-4 bg-accent/80"
                : "w-1 bg-white/20 hover:bg-white/40"
            )}
            aria-label={`Show ${s.skillTitle} diff`}
          />
        ))}
      </div>
    </div>
  );
}
