"use client";

import { Fragment, useRef } from "react";
import { gsap, useScene } from "@/animation";
import { ScenePicture } from "./ScenePicture";
import styles from "./Himalaya.module.css";

/** Far → near. Depths drive the hero’s scroll parallax; fog sits behind the next layer. */
const LAYERS = [
  { depth: 0, fog: 0.5, fogBottom: 34 },
  { depth: 0.25, fog: 0.38, fogBottom: 24 },
  { depth: 0.5, fog: 0.3, fogBottom: 14 },
  { depth: 0.75 },
  { depth: 1 },
];

/**
 * Himalayan valley for the hero, in independent layers: sky, distant snow
 * peaks, middle ridges, forested ridges, foothills with their treeline,
 * foreground pines, fog bands, clouds and a sunlight overlay.
 *
 * The layers are rendered ahead of time from the procedural range
 * (scripts/render-scenes.mjs), so nothing is computed in the browser: they
 * load as images and move with transforms only. The hooks match
 * <Landscape> ([data-sky], [data-sun], [data-cloud], [data-layer][data-depth]
 * › [data-layer-inner], [data-fog]) so the hero’s scroll choreography drives
 * them unchanged.
 */
export function HimalayaLandscape({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  // Ambient life: clouds and fog drift on their own, and the sunlight breathes.
  useScene(ref, ({ motion }, root) => {
    if (!motion) return;
    root.querySelectorAll<HTMLElement>("[data-cloud]").forEach((el, i) => {
      gsap.fromTo(el, { xPercent: -6 - i * 6 }, { xPercent: -26 + i * 4, duration: 110 + i * 40, ease: "none", repeat: -1, yoyo: true });
    });
    root.querySelectorAll<HTMLElement>("[data-fog-drift]").forEach((el, i) => {
      gsap.to(el, { xPercent: i % 2 ? -5 : 5, duration: 26 + i * 6, ease: "sine.inOut", repeat: -1, yoyo: true });
    });
    gsap.to(root.querySelector("[data-light]"), { opacity: 0.55, xPercent: 3, duration: 14, ease: "sine.inOut", repeat: -1, yoyo: true });
  });

  return (
    <div ref={ref} className={`${styles.landscape} ${className ?? ""}`} aria-hidden="true">
      <div className={styles.sky} data-sky>
        <ScenePicture name="hero-sky" priority />
      </div>
      <div className={styles.sun} data-sun />
      <div className={styles.clouds}>
        {[0, 1].map((i) => (
          <span key={i} data-cloud className={styles.cloud} data-index={i}>
            <ScenePicture name={`hero-cloud-${i}`} />
          </span>
        ))}
      </div>
      {LAYERS.map((l, i) => (
        <Fragment key={i}>
          <div className={styles.layer} data-layer data-depth={l.depth} style={{ zIndex: i * 2 + 2 }}>
            <div data-layer-inner className={styles.inner}>
              <ScenePicture name={`hero-layer-${i}`} priority={i < 2} />
            </div>
          </div>
          {l.fog !== undefined && (
            <div className={styles.fog} data-fog data-depth={l.depth} style={{ zIndex: i * 2 + 3, opacity: l.fog, bottom: `${l.fogBottom}%` }}>
              <span data-fog-drift className={styles.fogBand}>
                <ScenePicture name={`hero-fog-${i}`} />
              </span>
            </div>
          )}
        </Fragment>
      ))}
      <div className={styles.light} data-light />
    </div>
  );
}
