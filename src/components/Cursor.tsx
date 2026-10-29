"use client";

import { useEffect, useRef } from "react";
import { gsap, useMotion } from "@/animation";
import styles from "./Cursor.module.css";

/**
 * Custom cursor for fine pointers. Elements opt into a label with
 * data-cursor="Explore". Interactive elements enlarge the ring.
 */
export function Cursor() {
  const { touch, reduced, ready } = useMotion();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const enabled = ready && !touch;

  useEffect(() => {
    if (!enabled || !dot.current || !ring.current) return;
    const html = document.documentElement;
    html.classList.add("has-cursor");
    const lag = reduced ? 0.01 : 0.55;
    const dx = gsap.quickTo(dot.current, "x", { duration: 0.08, ease: "none" });
    const dy = gsap.quickTo(dot.current, "y", { duration: 0.08, ease: "none" });
    const rx = gsap.quickTo(ring.current, "x", { duration: lag, ease: "power3" });
    const ry = gsap.quickTo(ring.current, "y", { duration: lag, ease: "power3" });
    let shown = false;

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!shown) {
        shown = true;
        gsap.set([dot.current, ring.current], { x: e.clientX, y: e.clientY });
        gsap.to([dot.current, ring.current], { autoAlpha: 1, duration: 0.4 });
      }
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const t = e.target as Element | null;
      const labelled = t?.closest<HTMLElement>("[data-cursor]");
      const interactive = t?.closest("a, button, [role='button'], label");
      const text = labelled?.dataset.cursor ?? "";
      if (label.current) label.current.textContent = text;
      ring.current?.setAttribute("data-state", text ? "label" : interactive ? "hover" : "idle");
    };
    const leave = () => {
      shown = false;
      gsap.to([dot.current, ring.current], { autoAlpha: 0, duration: 0.3 });
    };
    const down = () => ring.current?.setAttribute("data-pressed", "true");
    const up = () => ring.current?.removeAttribute("data-pressed");

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      html.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, [enabled, reduced]);

  if (!enabled) return null;
  return (
    <>
      <div ref={ring} className={styles.ring} data-state="idle" aria-hidden="true">
        <span ref={label} className={styles.label} />
      </div>
      <div ref={dot} className={styles.dot} aria-hidden="true" />
    </>
  );
}
