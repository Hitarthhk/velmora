"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "./gsap";
import { useScene } from "./useScene";

/** Pulls its child toward the pointer. Pointer devices with motion enabled only. */
export function Magnetic({ children, strength = 0.35 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useScene(ref, ({ motion, fine }, root) => {
    if (!motion || !fine) return;
    const inner = root.firstElementChild as HTMLElement | null;
    const xTo = gsap.quickTo(root, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
    const yTo = gsap.quickTo(root, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
    const ixTo = inner && gsap.quickTo(inner, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
    const iyTo = inner && gsap.quickTo(inner, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });

    const move = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * strength);
      yTo(dy * strength);
      ixTo?.(dx * strength * 0.35);
      iyTo?.(dy * strength * 0.35);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
      ixTo?.(0);
      iyTo?.(0);
    };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    return () => {
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
    };
  });

  return (
    <span ref={ref} style={{ display: "inline-block" }}>
      {children}
    </span>
  );
}
