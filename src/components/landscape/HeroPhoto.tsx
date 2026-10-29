"use client";

import { useRef } from "react";
import { gsap, useScene } from "@/animation";
import styles from "./HeroPhoto.module.css";

export const HERO_PHOTO = "/media/photography/hero-himalaya-sunset.webp";
/** Soft valley-mist textures (scripts/make-mist.mjs). */
export const MIST = ["/media/photography/mist-a.webp", "/media/photography/mist-b.webp"] as const;

/**
 * The hero’s photograph — the range at last light above forested foothills —
 * dressed for the scroll choreography. It exposes the hooks the hero timeline
 * drives ([data-sky], [data-sun], [data-layer][data-depth] › [data-layer-inner],
 * [data-fog], [data-light]): the photo settles in on arrival, the camera pushes
 * into it on scroll while valley mist rises, and a warm glow breathes slowly
 * where the light falls.
 */
export function HeroPhoto({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  // Ambient life: valley mist drifts and the low sunlight breathes.
  useScene(ref, ({ motion, desktop }, root) => {
    if (!motion) return;
    // The legibility scrim leaves with the copy, so the push reveals the whole lit range.
    gsap.to(root.querySelector("[data-scrim]"), {
      opacity: 0,
      ease: "none",
      scrollTrigger: { trigger: root.closest("section"), start: "top top", end: desktop ? "+=85%" : "+=40%", scrub: true },
    });
    root.querySelectorAll<HTMLElement>("[data-fog-drift]").forEach((el, i) => {
      gsap.to(el, { xPercent: i % 2 ? -6 : 6, duration: 30 + i * 8, ease: "sine.inOut", repeat: -1, yoyo: true });
    });
    gsap.to(root.querySelector("[data-light]"), { opacity: 0.55, duration: 12, ease: "sine.inOut", repeat: -1, yoyo: true });
  });

  return (
    <div ref={ref} className={`${styles.landscape} ${className ?? ""}`} aria-hidden="true">
      {/* The photo’s own sky tone, beneath it while it settles and scales. */}
      <div className={styles.sky} data-sky />
      <div className={styles.layer} data-layer data-depth={0.3}>
        <div data-layer-inner className={styles.inner}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_PHOTO} alt="" width={1172} height={660} decoding="sync" fetchPriority="high" className={styles.photo} />
        </div>
      </div>
      {/* Valley mist over the cloud sea, warmed to the evening light. */}
      <div className={`${styles.fog} ${styles.fogHigh}`} data-fog data-depth={0.3}>
        <span data-fog-drift className={styles.fogBand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MIST[0]} alt="" decoding="sync" className={styles.mist} />
        </span>
      </div>
      <div className={`${styles.fog} ${styles.fogLow}`} data-fog data-depth={0.6}>
        <span data-fog-drift className={styles.fogBand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MIST[1]} alt="" decoding="sync" className={styles.mist} />
        </span>
      </div>
      <div className={styles.sun} data-sun />
      <div className={styles.light} data-light />
      {/* Keeps the headline legible over the bright snow without dimming the whole frame. */}
      <div className={styles.scrim} data-scrim />
    </div>
  );
}
