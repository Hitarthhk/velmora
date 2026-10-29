"use client";

import { useEffect, type RefObject } from "react";
import { useAnimate } from "motion/react";
import { preload } from "react-dom";
import { buildHimalayanDive } from "./himalayanDiveTimeline";
import { playHimalayanDive } from "./himalayanDivePlayback";
import { useMotion } from "@/animation/MotionProvider";
import { HERO_PHOTO, MIST } from "../landscape/HeroPhoto";
import styles from "./HimalayanCameraDive.module.css";

export const AGE_GATE_BACKGROUND = "/media/photography/age-gate-himalaya.webp";

type Props = {
  active: boolean;
  page: RefObject<HTMLDivElement | null>;
  gate: RefObject<HTMLDivElement | null>;
  panel: RefObject<HTMLDivElement | null>;
  onComplete: () => void;
};

/** One timeline owns the temporary camera, atmosphere and entry wrappers.
 * The photographs remain flat: real, separate fog textures supply foreground
 * depth. The destination is the actual hero, not a mismatched duplicate.
 * GSAP's scroll targets are descendants of these wrappers, never the wrappers.
 */
export function HimalayanCameraDive({ active, page, gate, panel, onComplete }: Props) {
  const [scene, animate] = useAnimate<HTMLDivElement>();
  // The installed Motion hook snapshots the preference at mount. Our existing
  // provider subscribes to matchMedia changes, including during playback.
  const { reduced: reduce } = useMotion();

  for (const src of [AGE_GATE_BACKGROUND, HERO_PHOTO, ...MIST]) {
    preload(src, { as: "image", fetchPriority: src === MIST[0] || src === MIST[1] ? "auto" : "high" });
  }

  useEffect(() => {
    if (!active || !scene.current || !gate.current || !page.current) return;
    const { sequence, clearCamera, finishVisuals, duration } = buildHimalayanDive({
      surface: page.current, overlay: gate.current, panel: panel.current,
      reduce: !!reduce,
      phone: window.matchMedia("(max-width: 599px)").matches,
      tablet: window.matchMedia("(max-width: 1199px)").matches,
    });
    const dispose = playHimalayanDive({
      start: () => animate(sequence), finishVisuals, onComplete,
      // Normal timing is unchanged; a stalled/failed playback gets a bounded
      // fallback rather than keeping content inert indefinitely.
      timeoutMs: Math.ceil(duration * 1000) + 200,
    });
    return () => {
      dispose();
      clearCamera();
    };
  }, [active, reduce, animate, scene, page, gate, panel, onComplete]);

  return (
    <div ref={scene} className={styles.scene} data-active={active} aria-hidden="true">
      <div data-dive-night className={styles.night}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={AGE_GATE_BACKGROUND} alt="" decoding="sync" fetchPriority="high" />
      </div>
      <div data-dive-fog-far className={`${styles.fog} ${styles.far}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MIST[0]} alt="" decoding="sync" />
      </div>
      <div data-dive-fog-near className={`${styles.fog} ${styles.near}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MIST[1]} alt="" decoding="sync" />
      </div>
      <div data-dive-sunlight className={styles.sunlight} />
      <div data-dive-light className={styles.light} />
    </div>
  );
}
