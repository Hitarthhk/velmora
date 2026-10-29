"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Pour } from "@/three/pour";

/** Shader space: 0–1 across the viewport, y running up from the bottom. */
export type PourOrigin = { x: number; y: number };
/** "gl": the shader; "css": the same shapes as clip-paths; "fade": reduced motion. */
export type PourMode = "gl" | "css" | "fade";
export type PourState = { cover: number; drain: number; origin: PourOrigin; mode: PourMode };

type Step = { key: "cover" | "drain"; t: number; duration: number; delay: number; done: () => void };
const inOut = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);

/** Viewport pixels (e.g. a click) → shader space. */
export const pourOrigin = (x: number, y: number): PourOrigin => ({ x: x / innerWidth, y: 1 - y / innerHeight });

/**
 * The whisky-pour engine shared by the route transition and the menu. It
 * owns one canvas (the shader, created during idle time) and a CSS liquid
 * fallback, and runs a frame loop only while something is pouring. The loop
 * keeps its own clock with capped steps: the shared GSAP ticker runs without
 * lag smoothing (to stay in step with Lenis), so a heavy render would
 * otherwise make the liquid jump.
 */
export function usePour({ warm, onFrame }: { warm: boolean; onFrame?: (state: PourState) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const liquid = useRef<HTMLDivElement>(null);
  const pour = useRef<Pour | null>(null);
  const loading = useRef<Promise<void> | null>(null);
  const state = useRef<PourState>({ cover: 0, drain: 0, origin: { x: 0.5, y: 0.5 }, mode: "css" });
  const step = useRef<Step | null>(null);
  const clock = useRef({ last: 0, time: 0 });
  const frame = useRef<number | null>(null);
  const frameHook = useRef(onFrame);
  frameHook.current = onFrame;

  useEffect(() => {
    if (!warm || loading.current) return;
    const load = () => {
      loading.current ??= import("@/three/pour").then(({ createPour }) => {
        if (canvas.current && !pour.current) pour.current = createPour(canvas.current);
      }).catch(() => { pour.current = null; });
    };
    const idle = window.requestIdleCallback ? window.requestIdleCallback(load, { timeout: 4000 }) : window.setTimeout(load, 1500);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(idle) : window.clearTimeout(idle));
  }, [warm]);

  const paint = useCallback(() => {
    const s = state.current;
    const now = performance.now();
    const dt = clock.current.last ? Math.min(0.1, (now - clock.current.last) / 1000) : 0;
    clock.current.last = now;
    clock.current.time += dt;
    const current = step.current;
    if (current) {
      current.t += dt;
      const k = Math.min(1, Math.max(0, (current.t - current.delay) / current.duration));
      s[current.key] = inOut(k);
      if (k >= 1) { step.current = null; current.done(); }
    }
    frameHook.current?.(s);
    if (s.mode === "gl" && pour.current) {
      pour.current.render(s.cover, s.drain, s.origin, clock.current.time);
    } else if (s.mode === "css" && liquid.current) {
      const r = s.cover * Math.hypot(Math.max(s.origin.x, 1 - s.origin.x) * innerWidth, Math.max(s.origin.y, 1 - s.origin.y) * innerHeight) * 1.08;
      liquid.current.style.clipPath = s.drain > 0
        ? `inset(${(s.drain * 100).toFixed(2)}% 0 0 0)`
        : `circle(${r.toFixed(1)}px at ${(s.origin.x * 100).toFixed(2)}% ${((1 - s.origin.y) * 100).toFixed(2)}%)`;
    }
    if (frame.current !== null) frame.current = requestAnimationFrame(paint);
  }, []);

  /** Begin a pour from `origin`; returns the mode used this time. */
  const start = useCallback((origin: PourOrigin, reduced: boolean): PourMode => {
    const s = state.current;
    s.cover = 0; s.drain = 0; s.origin = origin;
    s.mode = reduced ? "fade" : pour.current ? "gl" : "css";
    step.current = null;
    if (liquid.current) liquid.current.style.clipPath = s.mode === "css" ? "circle(0px at 50% 50%)" : "";
    pour.current?.resize();
    if (frame.current === null) { clock.current.last = 0; frame.current = requestAnimationFrame(paint); }
    return s.mode;
  }, [paint]);

  /** Ease `cover` or `drain` to 1 on the pour's own clock. */
  const animate = useCallback((key: "cover" | "drain", duration: number, delay: number, done: () => void) => {
    step.current = { key, t: 0, duration, delay, done };
  }, []);

  /** Stop the loop and reset; the layer itself is hidden by its owner. */
  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    step.current = null;
    clock.current.last = 0;
    state.current.cover = 0;
    state.current.drain = 0;
  }, []);

  useEffect(() => {
    const resize = () => pour.current?.resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      stop();
      pour.current?.dispose();
      pour.current = null;
    };
  }, [stop]);

  return { canvas, liquid, state, start, animate, stop };
}
