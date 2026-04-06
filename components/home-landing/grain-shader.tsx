"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";

const VERTEX = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uLight;

  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float grain(vec2 uv, float t) {
    return hash(uv * uResolution + t * 1000.0) * 0.12;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.15;

    vec3 darkBase = vec3(0.031, 0.031, 0.039);
    vec3 lightBase = vec3(0.96, 0.96, 0.96);
    vec3 base = mix(darkBase, lightBase, uLight);

    float glow = smoothstep(0.85, 0.0, length((uv - vec2(0.5, 0.28)) * vec2(1.1, 1.4)));
    float darkGlowStr = 0.09;
    float lightGlowStr = 0.38;
    vec3 accent = vec3(0.91, 0.396, 0.039) * glow * mix(darkGlowStr, lightGlowStr, uLight);

    float drift = sin(uv.x * 3.0 + t * 0.8) * 0.003
                + cos(uv.y * 2.5 - t * 0.6) * 0.003;
    accent *= 1.0 + drift * 8.0;

    float grainAmt = grain(uv, uTime) * mix(1.0, 0.45, uLight);
    vec3 color = base + accent + vec3(grainAmt);

    gl_FragColor = vec4(color, 1.0);
  }
`;

type GrainShaderProps = {
  className?: string;
};

function getThemeLight(): number {
  return document.documentElement.getAttribute("data-theme") === "light" ? 1.0 : 0.0;
}

export function GrainShader({ className }: GrainShaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const programRef = useRef<Program | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const dpr = isMobile ? Math.min(window.devicePixelRatio, 1) : Math.min(window.devicePixelRatio, 1.5);

    const light = getThemeLight();

    const renderer = new Renderer({ dpr, alpha: false });
    rendererRef.current = renderer;
    const gl = renderer.gl;
    const clearR = light === 1.0 ? 0.96 : 0.031;
    const clearG = light === 1.0 ? 0.96 : 0.031;
    const clearB = light === 1.0 ? 0.96 : 0.039;
    gl.clearColor(clearR, clearG, clearB, 1);
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [gl.canvas.width, gl.canvas.height] },
        uLight: { value: light },
      },
    });
    programRef.current = program;
    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value = [w * dpr, h * dpr];
      renderer.render({ scene: mesh });
    }

    resize();
    window.addEventListener("resize", resize);

    const observer = new MutationObserver(() => {
      const val = getThemeLight();
      program.uniforms.uLight.value = val;
      const cr = val === 1.0 ? 0.96 : 0.031;
      const cg = val === 1.0 ? 0.96 : 0.031;
      const cb = val === 1.0 ? 0.96 : 0.039;
      gl.clearColor(cr, cg, cb, 1);
      renderer.render({ scene: mesh });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    program.uniforms.uTime.value = 0;
    renderer.render({ scene: mesh });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      if (container.contains(gl.canvas)) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "absolute", inset: 0, zIndex: 0 }}
      aria-hidden
    />
  );
}
