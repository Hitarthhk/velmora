"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { gsap, useMotion } from "@/animation";
import { nav } from "@/content/site";
import { Logo } from "../Logo";
import { pourOrigin, usePour, type PourState } from "./usePour";
import styles from "./Transition.module.css";

/** Viewport coordinates of the click that started a navigation. */
export type Origin = { x: number; y: number };
type Ctx = { navigate: (href: string, origin?: Origin) => void };
const TransitionContext = createContext<Ctx>({ navigate: () => {} });
export const usePageTransition = () => useContext(TransitionContext);

const LABELS: Record<string, string> = {
  ...Object.fromEntries(nav.map((n) => [n.href, n.label])),
  "/terms": "Terms",
  "/privacy": "Privacy",
  "/responsible-drinking": "Responsible Drinking",
};

/**
 * The pour between routes. Whisky-amber liquid swells out from the click,
 * the emblem and the destination surface in it, the route changes beneath,
 * then the level drains away to reveal the new page (engine: usePour).
 * Back/forward navigation is never intercepted: it stays instant and native.
 */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { reduced, ready, webgl } = useMotion();
  const veil = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const pending = useRef<string | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [label, setLabel] = useState("");

  // The emblem surfaces as the pour fills and sinks only as the level falls.
  const surface = useCallback((s: PourState) => {
    if (!mark.current) return;
    const rise = s.mode === "fade" ? 1 : Math.min(1, Math.max(0, (s.cover - 0.45) / 0.4));
    const sink = Math.min(1, Math.max(0, s.drain / 0.35));
    mark.current.style.opacity = String(rise * (1 - sink));
    mark.current.style.transform = s.mode === "fade" ? "" : `translateY(${((1 - rise) * 16 + sink * 22).toFixed(1)}px) scale(${(0.94 + rise * 0.06).toFixed(3)})`;
  }, []);
  const pour = usePour({ warm: ready && webgl && !reduced, onFrame: surface });
  const { start, animate, stop } = pour;

  const finish = useCallback((focus: boolean) => {
    if (watchdog.current) clearTimeout(watchdog.current);
    stop();
    if (veil.current) gsap.set(veil.current, { display: "none", opacity: 1 });
    pending.current = null;
    busy.current = false;
    if (focus) document.getElementById("main")?.focus({ preventScroll: true });
  }, [stop]);

  const navigate = useCallback((href: string, origin?: Origin) => {
    if (busy.current || href === pathname) return;
    const el = veil.current;
    if (!el) return router.push(href);
    busy.current = true;
    pending.current = href;
    setLabel(LABELS[new URL(href, location.href).pathname] ?? "Whisky");
    const mode = start(origin ? pourOrigin(origin.x, origin.y) : { x: 0.5, y: 0.5 }, reduced);
    el.dataset.mode = mode;
    gsap.set(el, { display: "block", opacity: mode === "fade" ? 0 : 1 });
    if (mode === "fade") gsap.to(el, { opacity: 1, duration: 0.25, ease: "power1.out", onComplete: () => router.push(href) });
    else animate("cover", 1.05, 0, () => router.push(href));
    // Recover if the route never changes (failed or abandoned navigation).
    watchdog.current = setTimeout(() => finish(false), 8000);
  }, [pathname, reduced, router, start, animate, finish]);

  // The new route has rendered beneath the liquid: drain it away.
  useEffect(() => {
    const el = veil.current;
    if (!el || !pending.current) return;
    if (watchdog.current) clearTimeout(watchdog.current);
    pending.current = null;
    window.scrollTo(0, 0);
    if (el.dataset.mode === "fade") gsap.to(el, { opacity: 0, duration: 0.3, delay: 0.1, onComplete: () => finish(true) });
    else animate("drain", 1.05, 0.08, () => finish(true));
  // Completion depends on the route, not on a preference changing mid-pour.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <TransitionContext.Provider value={{ navigate }}>
      {children}
      <div ref={veil} className={styles.veil} data-mode="css" aria-hidden="true">
        <canvas ref={pour.canvas} className={styles.canvas} />
        <div ref={pour.liquid} className={styles.liquid} />
        <div ref={mark} className={styles.mark}>
          <Logo className={styles.emblem} symbol />
          <span className={styles.label}>{label}</span>
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
