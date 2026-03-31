"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useTransform,
  type MotionValue,
} from "motion/react";

import { cn } from "@/lib/cn";
import { formatTagLabel } from "@/lib/tag-utils";
import {
  DIFF_SCENES,
  type DiffScene,
  type DiffSceneLine,
} from "@/lib/home-landing/skill-diff-scenes";
import { useMouseParallax } from "@/hooks/use-mouse-parallax";

const CATEGORY_ACCENT: Record<string, string> = {
  frontend: "oklch(0.72 0.16 55)",
  a2a: "oklch(0.68 0.14 265)",
  security: "oklch(0.68 0.16 25)",
  ops: "oklch(0.70 0.14 155)",
  infra: "oklch(0.65 0.12 230)",
  social: "oklch(0.70 0.15 330)",
};

const SCENE_INTERVAL_MS = 5_500;

/* ── Card placement presets ─────────────────────────────────── */

type CardPlacement = {
  xPx: number;
  yPx: number;
  zPx: number;
  rotateYDeg: number;
  rotateZDeg: number;
  scale: number;
  baseOpacity: number;
  parallaxStrength: number;
};

const CARD_PLACEMENTS: CardPlacement[] = [
  {
    xPx: -360,
    yPx: 10,
    zPx: -60,
    rotateYDeg: 6,
    rotateZDeg: 1.5,
    scale: 0.88,
    baseOpacity: 0.55,
    parallaxStrength: 0.35,
  },
  {
    xPx: 0,
    yPx: 0,
    zPx: 30,
    rotateYDeg: 0,
    rotateZDeg: 0,
    scale: 1,
    baseOpacity: 1,
    parallaxStrength: 0.7,
  },
  {
    xPx: 360,
    yPx: 10,
    zPx: -60,
    rotateYDeg: -6,
    rotateZDeg: -1.5,
    scale: 0.88,
    baseOpacity: 0.55,
    parallaxStrength: 0.35,
  },
];

/* ── Diff line ──────────────────────────────────────────────── */

function HeroDiffLine({ line, index }: { line: DiffSceneLine; index: number }) {
  const isAdded = line.type === "added";
  const isRemoved = line.type === "removed";

  return (
    <motion.div
      className={cn(
        "grid grid-cols-[1rem_1fr] items-baseline",
        isAdded && "bg-[oklch(0.26_0.06_145/0.35)]",
        isRemoved && "bg-[oklch(0.26_0.06_25/0.3)]",
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, delay: index * 0.018 }}
    >
      <span
        className={cn(
          "select-none text-center text-[0.625rem] font-bold leading-[1.65]",
          isAdded && "text-[oklch(0.72_0.16_145)]",
          isRemoved && "text-[oklch(0.72_0.14_25)]",
          !isAdded && !isRemoved && "text-white/20",
        )}
      >
        {isAdded ? "+" : isRemoved ? "\u2212" : " "}
      </span>
      <code
        className={cn(
          "truncate pr-2 text-[0.625rem] leading-[1.65]",
          isAdded && "text-[oklch(0.88_0.06_145)]",
          isRemoved &&
            "text-[oklch(0.78_0.06_25)] line-through decoration-[oklch(0.78_0.06_25/0.3)]",
          !isAdded && !isRemoved && "text-white/40",
        )}
      >
        {line.value || "\u00A0"}
      </code>
    </motion.div>
  );
}

/* ── Card header ────────────────────────────────────────────── */

function HeroCardHeader({ scene }: { scene: DiffScene }) {
  const added = scene.lines.filter((l) => l.type === "added").length;
  const removed = scene.lines.filter((l) => l.type === "removed").length;
  const accent = CATEGORY_ACCENT[scene.category] ?? "oklch(0.70 0.12 55)";

  return (
    <div className="relative border-b border-white/[0.06]">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: accent, opacity: 0.5 }}
      />
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <span className="truncate font-serif text-[0.8rem] font-medium tracking-[-0.02em] text-white/90">
          {scene.skillTitle}
        </span>
        <span
          className="shrink-0 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide"
          style={{
            background: `color-mix(in oklch, ${accent}, transparent 82%)`,
            color: accent,
          }}
        >
          {formatTagLabel(scene.category)}
        </span>
        <span className="shrink-0 font-mono text-[0.5rem] tabular-nums text-white/30">
          {scene.versionFrom} &rarr; {scene.versionTo}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {added > 0 && (
            <span className="px-1.5 py-0.5 text-[0.55rem] font-bold tabular-nums text-[oklch(0.78_0.14_145)] bg-[oklch(0.42_0.12_145/0.25)]">
              +{added}
            </span>
          )}
          {removed > 0 && (
            <span className="px-1.5 py-0.5 text-[0.55rem] font-bold tabular-nums text-[oklch(0.78_0.12_25)] bg-[oklch(0.42_0.10_25/0.25)]">
              &minus;{removed}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Card chrome ────────────────────────────────────────────── */

function DiffCardChrome({
  children,
  glow,
  accentColor,
}: {
  children: React.ReactNode;
  glow?: boolean;
  accentColor?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden border border-white/[0.07] bg-[rgb(14,14,18)] font-mono shadow-2xl shadow-black/60",
        glow && "ring-1 ring-white/[0.08]",
      )}
      style={
        glow && accentColor
          ? { boxShadow: `0 8px 60px -12px color-mix(in oklch, ${accentColor}, transparent 70%), 0 1px 3px rgba(0,0,0,0.4)` }
          : undefined
      }
    >
      {children}
    </div>
  );
}

/* ── Floating card with parallax ────────────────────────────── */

function FloatingCard({
  placement,
  mouseX,
  mouseY,
  className,
  children,
}: {
  placement: CardPlacement;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  className?: string;
  children: React.ReactNode;
}) {
  const pxVal = useTransform(
    mouseX,
    (v) => placement.xPx + v * placement.parallaxStrength * 20,
  );
  const pyVal = useTransform(
    mouseY,
    (v) => placement.yPx + v * placement.parallaxStrength * 12,
  );

  return (
    <motion.div
      className={cn("col-start-1 row-start-1 w-full max-w-[380px]", className)}
      style={{
        x: pxVal,
        y: pyVal,
        z: placement.zPx,
        rotateY: placement.rotateYDeg,
        rotateZ: placement.rotateZDeg,
        scale: placement.scale,
        opacity: placement.baseOpacity,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Scene indicator dots ───────────────────────────────────── */

function SceneDots({
  count,
  active,
  onSelect,
}: {
  count: number;
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 border-t border-white/[0.06] py-2">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className={cn(
            "h-1 rounded-full transition-all duration-300",
            i === active
              ? "w-4 bg-accent/80"
              : "w-1 bg-white/20 hover:bg-white/40",
          )}
          aria-label={`Show diff scene ${i + 1}`}
        />
      ))}
    </div>
  );
}

/* ── Main export ────────────────────────────────────────────── */

export function HeroDiffField() {
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const { x: mouseX, y: mouseY } = useMouseParallax(1);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) return;

    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % DIFF_SCENES.length);
    }, SCENE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleDotSelect = useCallback((i: number) => {
    setActiveIndex(i);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % DIFF_SCENES.length);
      }, SCENE_INTERVAL_MS);
    }
  }, []);

  const activeScene = DIFF_SCENES[activeIndex]!;
  const leftScene = DIFF_SCENES[(activeIndex + 1) % DIFF_SCENES.length]!;
  const rightScene = DIFF_SCENES[(activeIndex + 2) % DIFF_SCENES.length]!;

  const centerAccent = CATEGORY_ACCENT[activeScene.category] ?? "oklch(0.70 0.12 55)";

  return (
    <motion.div
      className="relative mx-auto grid h-[340px] w-full max-w-[1000px] place-items-center sm:h-[380px]"
      style={{ perspective: "1600px", transformStyle: "preserve-3d" as const }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.8,
        delay: 0.35,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      }}
    >
      {/* Left card — desktop only */}
      <FloatingCard
        placement={CARD_PLACEMENTS[0]!}
        mouseX={mouseX}
        mouseY={mouseY}
        className="pointer-events-none hidden lg:block"
      >
        <DiffCardChrome accentColor={CATEGORY_ACCENT[leftScene.category]}>
          <HeroCardHeader scene={leftScene} />
          <div className="overflow-hidden">
            {leftScene.lines.slice(0, 14).map((line, i) => (
              <HeroDiffLine key={`l-${leftScene.skillTitle}-${i}`} line={line} index={i} />
            ))}
          </div>
        </DiffCardChrome>
      </FloatingCard>

      {/* Center card — animated reel */}
      <FloatingCard
        placement={CARD_PLACEMENTS[1]!}
        mouseX={mouseX}
        mouseY={mouseY}
      >
        <DiffCardChrome glow accentColor={centerAccent}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScene.skillTitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <HeroCardHeader scene={activeScene} />
              <div className="overflow-hidden">
                {activeScene.lines.map((line, i) => (
                  <HeroDiffLine
                    key={`c-${activeScene.skillTitle}-${i}`}
                    line={line}
                    index={i}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
          <SceneDots
            count={DIFF_SCENES.length}
            active={activeIndex}
            onSelect={handleDotSelect}
          />
        </DiffCardChrome>
      </FloatingCard>

      {/* Right card — desktop only */}
      <FloatingCard
        placement={CARD_PLACEMENTS[2]!}
        mouseX={mouseX}
        mouseY={mouseY}
        className="pointer-events-none hidden lg:block"
      >
        <DiffCardChrome accentColor={CATEGORY_ACCENT[rightScene.category]}>
          <HeroCardHeader scene={rightScene} />
          <div className="overflow-hidden">
            {rightScene.lines.slice(0, 14).map((line, i) => (
              <HeroDiffLine key={`r-${rightScene.skillTitle}-${i}`} line={line} index={i} />
            ))}
          </div>
        </DiffCardChrome>
      </FloatingCard>
    </motion.div>
  );
}
