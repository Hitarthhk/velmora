"use client";

import { useEffect, useRef, type RefObject } from "react";

export type DragState = {
  /** Accumulated user rotation (radians). */
  yaw: number;
  /** Inertia carried after release, radians per frame at 60 fps. */
  velocity: number;
  dragging: boolean;
  /** True once the current gesture moved far enough to count as a drag. */
  moved: boolean;
  /** Mouse position across the element, −0.5…0.5, for hover parallax. */
  hover: number;
  lastInteraction: number;
};

/**
 * Horizontal drag-to-rotate on a DOM element (mouse, pen and touch). Vertical
 * swipes keep scrolling the page: the element should use `touch-action: pan-y`.
 * The 3D scene reads the returned state every frame and applies inertia.
 */
export function useDragRotate(target: RefObject<HTMLElement | null>, enabled = true) {
  const state = useRef<DragState>({ yaw: 0, velocity: 0, dragging: false, moved: false, hover: 0, lastInteraction: -Infinity });

  useEffect(() => {
    const el = target.current;
    if (!el || !enabled) return;
    const s = state.current;
    let pointer: number | null = null, startX = 0, lastX = 0, lastT = 0;

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pointer = e.pointerId;
      startX = lastX = e.clientX;
      lastT = performance.now();
      s.dragging = true;
      s.moved = false;
      s.velocity = 0;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        const r = el.getBoundingClientRect();
        s.hover = (e.clientX - r.left) / r.width - 0.5;
      }
      if (e.pointerId !== pointer) return;
      if (!s.moved && Math.abs(e.clientX - startX) > 6) {
        s.moved = true;
        el.setPointerCapture?.(pointer);
      }
      if (!s.moved) return;
      const now = performance.now();
      const delta = (e.clientX - lastX) * 0.011;
      s.yaw += delta;
      s.velocity = (delta / Math.max(8, now - lastT)) * 16.7;
      lastX = e.clientX;
      lastT = now;
      s.lastInteraction = now;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      pointer = null;
      s.dragging = false;
      s.lastInteraction = performance.now();
    };
    const leave = () => { s.hover = 0; };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("pointerleave", leave);
    };
  }, [target, enabled]);

  return state;
}

/** Advance inertia once per frame; returns the current user yaw. */
export function stepDrag(s: DragState, dt: number) {
  if (!s.dragging && Math.abs(s.velocity) > 1e-4) {
    s.yaw += s.velocity * dt * 60;
    s.velocity *= Math.pow(0.9, dt * 60);
  }
  return s.yaw;
}
