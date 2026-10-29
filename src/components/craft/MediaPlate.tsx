"use client";

import type { CraftScene } from "@/content/site";
import { useMotion } from "@/animation";
import { CopperArt, GrainArt, OakArt } from "./CraftArt";
import styles from "./Craft.module.css";

const ART = { copper: CopperArt, grain: GrainArt, oak: OakArt };

/**
 * Full-bleed media for a craft scene. Supplied photography or video wins;
 * otherwise an art-directed placeholder is shown with a visible label.
 */
export function MediaPlate({ scene }: { scene: CraftScene }) {
  const { reduced } = useMotion();
  const Art = ART[scene.id];
  const src = scene.media;

  return (
    <div className={styles.plate}>
      <div data-plate className={styles.plateInner}>
        {src ? (
          src.endsWith(".mp4") || src.endsWith(".webm") ? (
            <video src={src} muted loop playsInline autoPlay={!reduced} preload="metadata" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" loading="lazy" decoding="async" />
          )
        ) : (
          <Art />
        )}
      </div>
      {!src && <span className={styles.plateNote}>{scene.mediaNote}</span>}
    </div>
  );
}
