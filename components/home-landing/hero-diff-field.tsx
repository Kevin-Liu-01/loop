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
    xPx: -320,
    yPx: 6,
    zPx: -180,
    rotateYDeg: 28,
    rotateZDeg: 0,
    scale: 1,
    baseOpacity: 0.6,
    parallaxStrength: 0.3,
  },
  {
    xPx: 0,
    yPx: 0,
    zPx: 60,
    rotateYDeg: 0,
    rotateZDeg: 0,
    scale: 1,
    baseOpacity: 1,
    parallaxStrength: 0.7,
  },
  {
    xPx: 320,
    yPx: 6,
    zPx: -180,
    rotateYDeg: -28,
    rotateZDeg: 0,
    scale: 1,
    baseOpacity: 0.6,
    parallaxStrength: 0.3,
  },
];

/* ── Diff line ──────────────────────────────────────────────── */

function HeroDiffLine({ line, index }: { line: DiffSceneLine; index: number }) {
  const isAdded = line.type === "added";
  const isRemoved = line.type === "removed";

  return (
    <motion.div
      className={cn(
        "grid grid-cols-[2px_1.1rem_1fr] items-baseline",
        isAdded && "bg-[oklch(0.26_0.06_145/0.30)]",
        isRemoved && "bg-[oklch(0.26_0.06_25/0.25)]",
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, delay: index * 0.018 }}
    >
      <span
        className={cn(
          "self-stretch",
          isAdded && "bg-[oklch(0.60_0.16_145)]",
          isRemoved && "bg-[oklch(0.60_0.14_25)]",
        )}
      />
      <span
        className={cn(
          "select-none text-center text-[0.6rem] font-bold leading-[1.7]",
          isAdded && "text-[oklch(0.72_0.16_145)]",
          isRemoved && "text-[oklch(0.72_0.14_25)]",
          !isAdded && !isRemoved && "text-white/15",
        )}
      >
        {isAdded ? "+" : isRemoved ? "−" : " "}
      </span>
      <code
        className={cn(
          "truncate pr-3 text-[0.6rem] leading-[1.7]",
          isAdded && "text-[oklch(0.88_0.06_145)]",
          isRemoved &&
            "text-[oklch(0.78_0.06_25)] line-through decoration-[oklch(0.78_0.06_25/0.3)]",
          !isAdded && !isRemoved && "text-white/35",
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
    <div className="border-b border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className="h-4 w-4 shrink-0 brightness-0 invert"
          src={scene.iconUrl}
        />
        <span className="truncate font-serif text-[0.8rem] font-medium tracking-[-0.02em] text-white/90">
          {scene.skillTitle}
        </span>
        <span
          className="shrink-0 rounded-full px-2 py-[2px] text-[0.55rem] font-semibold uppercase tracking-wide leading-none"
          style={{
            background: `color-mix(in oklch, ${accent}, transparent 85%)`,
            color: accent,
            boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${accent}, transparent 72%)`,
          }}
        >
          {formatTagLabel(scene.category)}
        </span>
        <span className="flex shrink-0 items-center gap-1 font-mono text-[0.6rem] tabular-nums leading-none">
          <span className="text-white/30">{scene.versionFrom}</span>
          <span className="text-white/15">→</span>
          <span className="text-white/60">{scene.versionTo}</span>
        </span>
        <div className="ml-auto flex items-center gap-1">
          {added > 0 && (
            <span className="rounded-[3px] px-1.5 py-[3px] text-[0.5rem] font-bold tabular-nums text-[oklch(0.78_0.14_145)] bg-[oklch(0.42_0.12_145/0.2)] border border-[oklch(0.42_0.12_145/0.2)]">
              +{added}
            </span>
          )}
          {removed > 0 && (
            <span className="rounded-[3px] px-1.5 py-[3px] text-[0.5rem] font-bold tabular-nums text-[oklch(0.78_0.12_25)] bg-[oklch(0.42_0.10_25/0.2)] border border-[oklch(0.42_0.10_25/0.2)]">
              −{removed}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Card chrome ────────────────────────────────────────────── */

const CARD_BODY_HEIGHT = 280;

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
        "relative overflow-hidden border font-mono shadow-2xl",
        glow
          ? "border-white/[0.10] ring-1 ring-white/[0.06]"
          : "border-white/[0.06]",
      )}
      style={{
        background: "linear-gradient(180deg, rgb(18,18,23) 0%, rgb(12,12,16) 100%)",
        ...(accentColor
          ? {
              boxShadow: glow
                ? `0 0 0 1px color-mix(in oklch, ${accentColor} 12%, transparent), 0 12px 60px -8px color-mix(in oklch, ${accentColor} 30%, transparent), 0 2px 6px rgba(0,0,0,0.5)`
                : `0 8px 40px -10px color-mix(in oklch, ${accentColor} 18%, transparent), 0 2px 6px rgba(0,0,0,0.4)`,
            }
          : { boxShadow: "0 8px 40px -10px rgba(0,0,0,0.6)" }),
      }}
    >
      {children}
    </div>
  );
}

/* ── Card body with fixed height and fade ──────────────────── */

function DiffCardBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative" style={{ height: CARD_BODY_HEIGHT }}>
      <div className="h-full overflow-hidden py-1">{children}</div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
        style={{ background: "linear-gradient(to top, rgb(12,12,16), transparent)" }}
      />
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
        zIndex: placement.zPx > 0 ? 2 : 1,
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
    <div className="flex items-center justify-center gap-1.5 border-t border-white/[0.05] bg-white/[0.015] py-2">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className={cn(
            "h-1 rounded-full transition-all duration-300",
            i === active
              ? "w-5 bg-accent/70"
              : "w-1 bg-white/15 hover:bg-white/30",
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
          <DiffCardBody>
            {leftScene.lines.map((line, i) => (
              <HeroDiffLine key={`l-${leftScene.skillTitle}-${i}`} line={line} index={i} />
            ))}
          </DiffCardBody>
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
              <DiffCardBody>
                {activeScene.lines.map((line, i) => (
                  <HeroDiffLine
                    key={`c-${activeScene.skillTitle}-${i}`}
                    line={line}
                    index={i}
                  />
                ))}
              </DiffCardBody>
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
          <DiffCardBody>
            {rightScene.lines.map((line, i) => (
              <HeroDiffLine key={`r-${rightScene.skillTitle}-${i}`} line={line} index={i} />
            ))}
          </DiffCardBody>
        </DiffCardChrome>
      </FloatingCard>
    </motion.div>
  );
}
