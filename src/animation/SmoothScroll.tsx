"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { useMotion } from "./MotionProvider";

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

/**
 * Lenis smooths wheel input only. It keeps the document's native scroll
 * position, so keyboard paging, scrollbars, find-in-page, anchors and the
 * browser's back/forward scroll restoration keep working. Touch devices and
 * reduced-motion visitors get fully native scrolling.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const { reduced, touch, ready } = useMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!ready || reduced || touch) return;
    const instance = new Lenis({ lerp: 0.075, wheelMultiplier: 0.9, syncTouch: false });
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(instance);
    if (process.env.NODE_ENV !== "production") (window as unknown as { __lenis: Lenis }).__lenis = instance;
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, [ready, reduced, touch]);

  // After a client-side route change, re-measure every trigger on the new page.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    lenis?.resize();
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname, lenis]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
