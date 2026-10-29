"use client";

import { preload } from "react-dom";
import { m, useTransform, type MotionValue } from "motion/react";
import { MIST } from "./HeroPhoto";
import styles from "./BottleValley.module.css";
import { VALLEY } from "../transition/heroBottleProgress";

export const VALLEY_BACKDROP = "#14212b";
export const VALLEY_PHOTO = "/media/photography/bottle-valley-golden-depths.webp";

/** A distinct Himalayan valley plate, separate from the sunrise hero.
 * Scenery/atmosphere have their own Motion wrappers; the bottle, copy beats,
 * studio lights and glass geometry retain their existing GSAP/Three owners. */
export function BottleValley({ progress, linked, reduced, gallery = false }: {
  progress: MotionValue<number>;
  linked: boolean;
  reduced: boolean;
  gallery?: boolean;
}) {
  preload(VALLEY_PHOTO, { as: "image", fetchPriority: "high" });
  const reveal = useTransform(progress, VALLEY.reveal.input, VALLEY.reveal.output);
  const darkness = useTransform(progress, VALLEY.darkness.input, VALLEY.darkness.output);
  const warmth = useTransform(progress, VALLEY.warmth.input, VALLEY.warmth.output);
  const fog = useTransform(progress, VALLEY.fog.input, VALLEY.fog.output);
  const fogY = useTransform(progress, VALLEY.fogY.input, VALLEY.fogY.output);
  const retreat = useTransform(progress, VALLEY.retreat.input, VALLEY.retreat.output);

  return (
    <div className={styles.environment} aria-hidden="true">
      <m.div data-valley-scene className={styles.landscape} style={{ opacity: linked && !reduced ? reveal : 1 }}>
        {/* Environment only; the original bottle remains a separate asset. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={VALLEY_PHOTO} alt="" width={1672} height={941} decoding="sync" className={styles.photo} />
        <div className={styles.framing} />
        <m.div data-valley-shade className={styles.shade} style={{ opacity: reduced ? 0.34 : darkness }} />
        <m.div data-valley-amber className={styles.amber} style={{ opacity: reduced ? 0.08 : warmth }} />
        <m.div data-valley-mist className={styles.mist} style={{ opacity: reduced ? 0.08 : fog, y: reduced ? "0%" : fogY }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MIST[1]} alt="" decoding="sync" />
        </m.div>
      </m.div>
      <m.div data-valley-retreat className={styles.retreat} style={{ opacity: reduced || gallery ? 0 : retreat }} />
    </div>
  );
}
