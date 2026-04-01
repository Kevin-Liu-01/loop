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

/* ── Line metadata helper ─────────────────────────────────── */

type LineMeta = { lineNum: number; isOddContext: boolean };

function computeLineMeta(lines: DiffSceneLine[]): LineMeta[] {
  let num = 1;
  let ctxIndex = 0;
  return lines.map((line) => {
    const isEmpty = line.type === "context" && !line.value;
    if (isEmpty) return { lineNum: num, isOddContext: false };
    const current = num;
    num++;
    const isCtx = line.type === "context";
    const odd = isCtx ? ctxIndex % 2 === 1 : false;
    if (isCtx) ctxIndex++;
    else ctxIndex = 0;
    return { lineNum: current, isOddContext: odd };
  });
}

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

function HeroDiffLine({
  line,
  index,
  lineNum,
  isOddContext,
}: {
  line: DiffSceneLine;
  index: number;
  lineNum: number;
  isOddContext: boolean;
}) {
  const isAdded = line.type === "added";
  const isRemoved = line.type === "removed";
  const isContext = line.type === "context";
  const isHeading = isContext && line.value.startsWith("##");
  const isEmpty = isContext && !line.value;

  const rowBg = isAdded
    ? "var(--hdc-add-bg)"
    : isRemoved
      ? "var(--hdc-rem-bg)"
      : isOddContext && !isEmpty
        ? "var(--hdc-ctx-bg-odd)"
        : undefined;

  return (
    <motion.div
      className="grid grid-cols-[2.2rem_2px_1.1rem_1fr] items-baseline"
      style={{ background: rowBg }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, delay: index * 0.018 }}
    >
      <span
        className="select-none self-stretch pr-1.5 text-right text-[0.5rem] leading-[1.85] tabular-nums"
        style={{
          color: "var(--hdc-ln)",
          borderRight: "1px solid var(--hdc-ln-border)",
        }}
      >
        {isEmpty ? "" : lineNum}
      </span>
      <span
        className="self-stretch"
        style={{
          background: isAdded
            ? "var(--hdc-add-bar)"
            : isRemoved
              ? "var(--hdc-rem-bar)"
              : undefined,
        }}
      />
      <span
        className="select-none text-center text-[0.6rem] font-bold leading-[1.7]"
        style={{
          color: isAdded
            ? "var(--hdc-add-sign)"
            : isRemoved
              ? "var(--hdc-rem-sign)"
              : "transparent",
        }}
      >
        {isAdded ? "+" : isRemoved ? "−" : " "}
      </span>
      <span
        className={cn(
          "truncate pr-3 text-[0.6rem] leading-[1.7]",
          isRemoved && "line-through",
          isHeading && "font-semibold",
        )}
        style={{
          color: isAdded
            ? "var(--hdc-add-text)"
            : isRemoved
              ? "var(--hdc-rem-text)"
              : isHeading
                ? "var(--hdc-heading-text)"
                : "var(--hdc-ctx-text)",
          textDecorationColor: isRemoved ? "var(--hdc-rem-strike)" : undefined,
        }}
      >
        {line.value || "\u00A0"}
      </span>
    </motion.div>
  );
}

/* ── Card header ────────────────────────────────────────────── */

function HeroCardHeader({ scene }: { scene: DiffScene }) {
  const added = scene.lines.filter((l) => l.type === "added").length;
  const removed = scene.lines.filter((l) => l.type === "removed").length;
  const accent = CATEGORY_ACCENT[scene.category] ?? "oklch(0.70 0.12 55)";

  return (
    <div
      className="border-b"
      style={{ borderColor: "var(--hdc-divider)", background: "var(--hdc-tint)" }}
    >
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className="h-4 w-4 shrink-0"
          src={scene.iconUrl}
          style={{ filter: "var(--hdc-icon-filter)" }}
        />
        <span
          className="truncate font-serif text-[0.8rem] font-medium tracking-[-0.02em]"
          style={{ color: "var(--hdc-text)" }}
        >
          {scene.skillTitle}
        </span>
        <span
          className="inline-flex h-[1.15rem] shrink-0 items-center rounded-full px-2 text-[0.55rem] font-semibold uppercase tracking-wide"
          style={{
            background: `color-mix(in oklch, ${accent}, transparent 85%)`,
            color: accent,
            boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${accent}, transparent 72%)`,
          }}
        >
          {formatTagLabel(scene.category)}
        </span>
        <span
          className="inline-flex h-[1.15rem] shrink-0 items-center gap-1.5 rounded-md px-2 text-[0.55rem] tabular-nums"
          style={{
            background: "var(--hdc-ver-bg)",
            border: "1px solid var(--hdc-ver-border)",
          }}
        >
          <span style={{ color: "var(--hdc-ver-old)" }}>{scene.versionFrom}</span>
          <span className="text-[0.5rem]" style={{ color: "var(--hdc-ver-arrow)" }}>→</span>
          <span className="font-semibold" style={{ color: "var(--hdc-ver-new)" }}>{scene.versionTo}</span>
        </span>
        <div className="ml-auto flex items-center gap-1">
          {added > 0 && (
            <span
              className="inline-flex h-[1.15rem] items-center rounded-[3px] px-1.5 text-[0.55rem] font-bold tabular-nums border"
              style={{
                color: "var(--hdc-badge-add-text)",
                background: "var(--hdc-badge-add-bg)",
                borderColor: "var(--hdc-badge-add-border)",
              }}
            >
              +{added}
            </span>
          )}
          {removed > 0 && (
            <span
              className="inline-flex h-[1.15rem] items-center rounded-[3px] px-1.5 text-[0.55rem] font-bold tabular-nums border"
              style={{
                color: "var(--hdc-badge-rem-text)",
                background: "var(--hdc-badge-rem-bg)",
                borderColor: "var(--hdc-badge-rem-border)",
              }}
            >
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
      className="relative overflow-hidden shadow-2xl"
      style={{
        border: `1px solid ${glow ? "var(--hdc-border-glow)" : "var(--hdc-border)"}`,
        ...(glow ? { boxShadow: `0 0 0 1px var(--hdc-ring)` } : {}),
        background: `linear-gradient(180deg, var(--hdc-bg-from) 0%, var(--hdc-bg-to) 100%)`,
        ...(accentColor
          ? {
              boxShadow: glow
                ? `0 0 0 1px color-mix(in oklch, ${accentColor} 12%, transparent), 0 12px 60px -8px color-mix(in oklch, ${accentColor} 30%, transparent), 0 2px 6px rgba(0,0,0,0.18)`
                : `0 8px 40px -10px color-mix(in oklch, ${accentColor} 18%, transparent), 0 2px 6px rgba(0,0,0,0.12)`,
            }
          : { boxShadow: "0 8px 40px -10px rgba(0,0,0,0.15)" }),
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
        style={{ background: "linear-gradient(to top, var(--hdc-fade-to), transparent)" }}
      />
    </div>
  );
}

/* ── Diff lines renderer (computes line numbers + parity) ──── */

function DiffLines({ scene, prefix }: { scene: DiffScene; prefix: string }) {
  const meta = computeLineMeta(scene.lines);
  return (
    <>
      {scene.lines.map((line, i) => (
        <HeroDiffLine
          key={`${prefix}-${scene.skillTitle}-${i}`}
          line={line}
          index={i}
          lineNum={meta[i]!.lineNum}
          isOddContext={meta[i]!.isOddContext}
        />
      ))}
    </>
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
    <div
      className="flex items-center justify-center gap-1.5 border-t py-2"
      style={{ borderColor: "var(--hdc-divider)", background: "var(--hdc-tint)" }}
    >
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className={cn(
            "h-1 rounded-full transition-all duration-300",
            i === active ? "w-5 bg-accent/70" : "w-1",
          )}
          style={
            i !== active
              ? { background: "var(--hdc-dot-inactive)" }
              : undefined
          }
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
            <DiffLines scene={leftScene} prefix="l" />
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
                <DiffLines scene={activeScene} prefix="c" />
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
            <DiffLines scene={rightScene} prefix="r" />
          </DiffCardBody>
        </DiffCardChrome>
      </FloatingCard>
    </motion.div>
  );
}
