"use client";

import { useEffect, useState } from "react";
import { gridToBraille, makeGrid } from "unicode-animations";

import { cn } from "@/lib/cn";

interface Spinner {
  readonly frames: string[];
  readonly interval: number;
}

// ---------------------------------------------------------------------------
// 4×4 perimeter path (clockwise from top-left) — 12 positions
// ---------------------------------------------------------------------------
const PERIM: [number, number][] = [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 3],
  [2, 3],
  [3, 3],
  [3, 2],
  [3, 1],
  [3, 0],
  [2, 0],
  [1, 0],
];

function frame4x4(dots: [number, number][]): string {
  const g = makeGrid(4, 4);
  for (const [r, c] of dots) {
    g[r][c] = true;
  }
  return gridToBraille(g);
}

// ---------------------------------------------------------------------------
// Built-in 4×4 spinners
// ---------------------------------------------------------------------------

function buildOrbit(): Spinner {
  const trail = 3;
  const frames = Array.from({ length: PERIM.length }, (_, i) => {
    const dots: [number, number][] = [];
    for (let t = 0; t < trail; t++) {
      dots.push(PERIM[(i - t + PERIM.length) % PERIM.length]);
    }
    return frame4x4(dots);
  });
  return { frames, interval: 80 };
}

function buildScan(): Spinner {
  const frames = Array.from({ length: 4 }, (_, col) =>
    frame4x4([
      [0, col],
      [1, col],
      [2, col],
      [3, col],
    ])
  );
  return { frames, interval: 100 };
}

function buildBreathe(): Spinner {
  const rings: [number, number][][] = [
    [
      [1, 1],
      [1, 2],
      [2, 1],
      [2, 2],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 0],
      [1, 3],
      [2, 0],
      [2, 3],
      [3, 0],
      [3, 1],
      [3, 2],
      [3, 3],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 0],
      [1, 1],
      [1, 2],
      [1, 3],
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
      [3, 0],
      [3, 1],
      [3, 2],
      [3, 3],
    ],
  ];
  const seq = [[], rings[0], rings[1], rings[2], rings[1], rings[0]] as [
    number,
    number,
  ][][];
  return { frames: seq.map((dots) => frame4x4(dots)), interval: 120 };
}

function buildCascade(): Spinner {
  const frames = Array.from({ length: 4 }, (_, row) =>
    frame4x4([
      [row, 0],
      [row, 1],
      [row, 2],
      [row, 3],
    ])
  );
  return { frames, interval: 80 };
}

function buildHelix(): Spinner {
  const frames: string[] = [];
  for (let step = 0; step < 8; step++) {
    const dots: [number, number][] = [];
    for (let row = 0; row < 4; row++) {
      const col = (step + row) % 4;
      dots.push([row, col]);
    }
    frames.push(frame4x4(dots));
  }
  return { frames, interval: 80 };
}

function buildSparkle(): Spinner {
  const ALL: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {ALL.push([r, c]);}
  }

  const seed = [7, 2, 13, 0, 11, 5, 15, 8, 3, 14, 6, 1, 10, 4, 9, 12];
  const frames: string[] = [];
  for (let step = 0; step < 8; step++) {
    const dots: [number, number][] = [];
    for (let i = 0; i < 4; i++) {
      dots.push(ALL[seed[(step * 2 + i) % 16]]);
    }
    frames.push(frame4x4(dots));
  }
  return { frames, interval: 90 };
}

const SPINNERS_4X4: Record<SpinnerName, Spinner> = {
  braille: buildOrbit(),
  orbit: buildOrbit(),
  scan: buildScan(),
  breathe: buildBreathe(),
  cascade: buildCascade(),
  helix: buildHelix(),
  sparkle: buildSparkle(),
};

export type SpinnerName =
  | "braille"
  | "orbit"
  | "scan"
  | "breathe"
  | "cascade"
  | "helix"
  | "sparkle";

interface BrailleSpinnerProps {
  name?: SpinnerName;
  label?: string;
  className?: string;
}

export function BrailleSpinner({
  name = "braille",
  label,
  className,
}: BrailleSpinnerProps) {
  const spinner = SPINNERS_4X4[name];
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % spinner.frames.length);
    }, spinner.interval);
    return () => clearInterval(id);
  }, [spinner]);

  return (
    <span
      role="status"
      aria-label={label ?? "Loading"}
      className={cn("inline-flex items-center gap-2 font-mono", className)}
    >
      <span aria-hidden="true">{spinner.frames[frameIndex]}</span>
      {label ? <span>{label}</span> : null}
    </span>
  );
}
