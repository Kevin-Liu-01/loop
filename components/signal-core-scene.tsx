"use client";

import { useEffect, useRef } from "react";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type SignalCoreSceneProps = {
  skillCount: number;
  automationCount: number;
  indexCount: number;
};

export function SignalCoreScene({ skillCount, automationCount, indexCount }: SignalCoreSceneProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const modelRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let frameId = 0;
    let width = 0;
    let height = 0;
    const devicePixelRatio = window.devicePixelRatio || 1;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * devicePixelRatio);
      canvas.height = Math.floor(height * devicePixelRatio);
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    const render = (time: number) => {
      const t = time * 0.00035;
      context.clearRect(0, 0, width, height);

      const gradient = context.createRadialGradient(
        width * (0.3 + Math.sin(t) * 0.08),
        height * (0.32 + Math.cos(t * 1.6) * 0.08),
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      gradient.addColorStop(0, "rgba(60, 222, 255, 0.34)");
      gradient.addColorStop(0.48, "rgba(74, 123, 255, 0.18)");
      gradient.addColorStop(1, "rgba(6, 13, 30, 0)");

      context.fillStyle = "rgba(5, 12, 25, 0.94)";
      context.fillRect(0, 0, width, height);
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      context.strokeStyle = "rgba(120, 150, 255, 0.08)";
      context.lineWidth = 1;
      const grid = 28;
      for (let x = 0; x <= width; x += grid) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = 0; y <= height; y += grid) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      for (let i = 0; i < 18; i += 1) {
        const phase = t * (0.6 + i * 0.04);
        const x = width * 0.12 + ((i * 41) % Math.max(width, 1));
        const y = height * 0.5 + Math.sin(phase + i) * height * 0.24;

        context.fillStyle = `rgba(102, 245, 255, ${0.08 + (i % 4) * 0.03})`;
        context.beginPath();
        context.arc(x % width, y, 1.4 + (i % 3), 0, Math.PI * 2);
        context.fill();
      }

      frameId = window.requestAnimationFrame(render);
    };

    resize();
    frameId = window.requestAnimationFrame(render);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    const model = modelRef.current;
    const root = rootRef.current;
    if (!model || !root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(model, {
        rotateY: 360,
        duration: 24,
        ease: "none",
        repeat: -1
      });

      gsap.to(model, {
        rotateX: -18,
        yPercent: -8,
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: 1.1
        }
      });

      gsap.to("[data-scene-node]", {
        yPercent: -18,
        stagger: 0.08,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: 1.4
        }
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div className="signal-scene" ref={rootRef}>
      <canvas aria-hidden="true" className="signal-scene__canvas" ref={canvasRef} />
      <div className="signal-scene__glow signal-scene__glow--one" />
      <div className="signal-scene__glow signal-scene__glow--two" />

      <div className="signal-scene__frame">
        <div className="signal-scene__model" ref={modelRef}>
          <div className="signal-scene__ring" />
          <div className="signal-scene__core">
            <span />
            <span />
            <span />
          </div>

          <article className="signal-scene__node signal-scene__node--top" data-scene-node="top">
            <strong>{skillCount}</strong>
            <span>skills indexed</span>
          </article>
          <article className="signal-scene__node signal-scene__node--left" data-scene-node="left">
            <strong>{automationCount}</strong>
            <span>automations linked</span>
          </article>
          <article className="signal-scene__node signal-scene__node--right" data-scene-node="right">
            <strong>{indexCount}</strong>
            <span>search documents</span>
          </article>
        </div>
      </div>
    </div>
  );
}
