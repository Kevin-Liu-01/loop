"use client";

import { useEffect } from "react";
import { useMotionValue, useSpring, type MotionValue } from "motion/react";

type MouseParallax = {
  x: MotionValue<number>;
  y: MotionValue<number>;
};

const SPRING_CONFIG = { stiffness: 40, damping: 25, mass: 1 };

export function useMouseParallax(strength: number = 1): MouseParallax {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING_CONFIG);
  const y = useSpring(rawY, SPRING_CONFIG);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const hasPointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    if (prefersReduced || !hasPointer) return;

    function onMove(e: MouseEvent) {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2 * strength);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2 * strength);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [strength, rawX, rawY]);

  return { x, y };
}
