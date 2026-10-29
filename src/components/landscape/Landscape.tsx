"use client";

import { Fragment, useMemo, useRef } from "react";
import { gsap, useScene } from "@/animation";
import { ridgePath, VIEW_H, VIEW_W } from "./ridges";
import type { Palette } from "./palettes";
import styles from "./Landscape.module.css";

type Props = { palette: Palette; id: string; className?: string; clouds?: boolean };

/**
 * Layered, procedurally drawn Himalayan landscape. Each ridge is its own
 * compositor layer so scenes can drive depth with transforms only.
 *
 * Hooks for scenes:  [data-layer][data-depth] › [data-layer-inner]
 *                    [data-fog] [data-cloud] [data-sky] [data-sun]
 *
 * To swap in real photography, replace a layer's <svg> with a cut-out
 * plate (an <img> of a masked ridge) — the scene animations still apply.
 */
export function Landscape({ palette, id, className, clouds = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const paths = useMemo(() => palette.layers.map((l) => ridgePath(l)), [palette]);

  // Ambient life — slow enough to never compete with scroll-driven motion.
  useScene(ref, ({ motion }, root) => {
    if (!motion) return;
    root.querySelectorAll<HTMLElement>("[data-cloud]").forEach((el, i) => {
      gsap.fromTo(el, { xPercent: -30 - i * 10 }, { xPercent: 40 + i * 6, duration: 70 + i * 25, ease: "none", repeat: -1, yoyo: true });
    });
    root.querySelectorAll<HTMLElement>("[data-fog-drift]").forEach((el, i) => {
      gsap.to(el, { xPercent: i % 2 ? -8 : 8, duration: 18 + i * 5, ease: "sine.inOut", repeat: -1, yoyo: true });
    });
  });

  const [s0, s1, s2] = palette.sky;

  return (
    <div ref={ref} className={`${styles.landscape} ${className ?? ""}`} aria-hidden="true">
      <div className={styles.sky} data-sky style={{ background: `linear-gradient(180deg, ${s0} 0%, ${s1} 55%, ${s2} 100%)` }} />
      <div className={styles.sun} data-sun style={{ background: `radial-gradient(closest-side, ${palette.sun}, transparent)` }} />
      {clouds && (
        <div className={styles.clouds}>
          <span data-cloud className={styles.cloud} style={{ top: "14%", left: "10%", width: "46vw" }} />
          <span data-cloud className={styles.cloud} style={{ top: "24%", left: "48%", width: "38vw", opacity: 0.5 }} />
          <span data-cloud className={styles.cloud} style={{ top: "6%", left: "30%", width: "60vw", opacity: 0.35 }} />
        </div>
      )}
      {palette.layers.map((l, i) => (
        <Fragment key={i}>
          <div className={styles.layer} data-layer data-depth={l.depth} style={{ zIndex: i * 2 + 2 }}>
            <div data-layer-inner className={styles.inner}>
              <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMax slice" className={styles.svg}>
                <defs>
                  <linearGradient id={`${id}-g${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={l.top} />
                    <stop offset="1" stopColor={l.bottom} />
                  </linearGradient>
                </defs>
                <path d={paths[i]} fill={`url(#${id}-g${i})`} />
                {l.rim && <path d={paths[i]} fill="none" stroke={l.rim} strokeWidth={1.4} />}
              </svg>
            </div>
          </div>
          {l.fogAfter ? (
            <div
              className={styles.fog}
              data-fog
              data-depth={l.depth}
              style={{ zIndex: i * 2 + 3, opacity: l.fogAfter, bottom: `${8 + (1 - l.depth) * 22}%` }}
            >
              <span data-fog-drift className={styles.fogBand} />
              <span data-fog-drift className={styles.fogBand} style={{ left: "30%", top: "30%", opacity: 0.7 }} />
            </div>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
