"use client";

import { useEffect, useRef } from "react";
import { m, useTransform, type MotionValue } from "motion/react";
import { BRIDGE, CLOSING } from "@/components/transition/originJourney";
import { MIST } from "./HeroPhoto";
import styles from "./OriginEnvironment.module.css";

export const ORIGIN_FOREGROUND = "/media/photography/origin-foreground.webp";

/** Chapter progress: I ≈ 0–⅓, II ≈ ⅓–⅔, III ≈ ⅔–1. Each plate takes over
 * under cover of its own transition rather than a bare crossfade. */
export const ORIGIN_SCENES = [
  { id: "foothills", src: "/media/photography/origin-foothills.webp", mobile: "/media/photography/origin-foothills-mobile.webp", range: [0, 1] },
  // Revealed while a near pine bough passes the lens (≈ .26–.42).
  { id: "emblem", src: "/media/photography/origin-emblem-forest.webp", mobile: "/media/photography/origin-emblem-forest-mobile.webp", range: [0.29, 0.37] },
  // Revealed out of warm darkness once the forest has dimmed around the emblem.
  { id: "philosophy", src: "/media/photography/origin-philosophy.webp", mobile: "/media/photography/origin-philosophy-mobile.webp", range: [0.63, 0.73] },
] as const;

type Props = {
  progress: MotionValue<number>;
  /** Collection → Foothills (0→1). Settled at 1 when there is no bridge. */
  bridge: MotionValue<number>;
  /** Philosophy → Contact (0→1). */
  closing: MotionValue<number>;
  reduced: boolean;
};

/** Photography, mist and foreground foliage have independent depth. All are
 * driven by the section's scroll segments; no canvas or ambient loop is added. */
export function OriginEnvironment({ progress, bridge, closing, reduced }: Props) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    // Prepare the full journey shortly before it enters, without competing
    // with the above-the-fold hero or age-gate requests.
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      element.querySelectorAll<HTMLImageElement>("img").forEach(image => { image.loading = "eager"; void image.decode().catch(() => {}); });
      observer.disconnect();
    }, { rootMargin: "120% 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const still = <T,>(value: T) => (reduced ? undefined : value);

  // ── Collection → Foothills: the camera leaves the whisky world ──
  const haze = useTransform(bridge, BRIDGE.haze.input, BRIDGE.haze.output);
  const bridgeMist = useTransform(bridge, BRIDGE.mist.input, BRIDGE.mist.output);
  const bridgeMistY = useTransform(bridge, BRIDGE.mistY.input, BRIDGE.mistY.output);
  const sun = useTransform(bridge, BRIDGE.sun.input, BRIDGE.sun.output);
  const valley = useTransform(bridge, BRIDGE.valley.input, BRIDGE.valley.output);
  const valleyScale = useTransform(bridge, BRIDGE.valleyScale.input, BRIDGE.valleyScale.output);

  // ── I · The Foothills: mist and near foliage travel against the far range ──
  const farMistOpacity = useTransform(progress, [0, 0.2, 0.36], [0.14, 0.2, 0]);
  const farMistX = useTransform(progress, [0, 0.36], ["2%", "-3%"]);
  const mistOpacity = useTransform(progress, [0, 0.28, 0.45, 0.65, 0.78, 1], [0.1, 0.16, 0.08, 0.06, 0.01, 0]);
  const mistX = useTransform(progress, [0, 1], ["-4%", "5%"]);
  const foliageOpacity = useTransform(progress, [0, 0.24, 0.3, 0.36], [0.7, 0.85, 0.6, 0]);
  const foliageX = useTransform(progress, [0, 0.34], ["1%", "-7%"]);
  const foliageY = useTransform(progress, [0, 0.34], ["2%", "-3%"]);
  const foliageScale = useTransform(progress, [0, 0.34], [1, 1.08]);

  // ── I → II: a near bough passes the lens and hides the change of plate ──
  const canopyOpacity = useTransform(progress, [0.24, 0.28, 0.38, 0.42], [0, 1, 1, 0]);
  const canopyX = useTransform(progress, [0.24, 0.42], ["38%", "-128%"]);
  const canopyY = useTransform(progress, [0.24, 0.42], ["6%", "-4%"]);

  // ── II · The Emblem: settles after the bough, lit by a warm key ──
  const emblemOpacity = useTransform(progress, [0.38, 0.46, 0.62, 0.69], [0, 1, 1, 0]);
  const emblemScale = useTransform(progress, [0.38, 0.5, 0.6, 0.69], [0.94, 1, 1, 1.05]);
  const emblemY = useTransform(progress, [0.38, 0.5], ["2.5%", "0%"]);
  const emblemLight = useTransform(progress, [0.4, 0.5, 0.58, 0.65, 0.72], [0, 0.12, 0.1, 0.3, 0]);

  // ── II → III: the forest dims around the emblem, light warms, copper wakes ──
  const forestShade = useTransform(progress, [0.57, 0.65], [0, 0.6]);
  const warmth = useTransform(progress, [0.6, 0.67, 0.76], [0, 0.32, 0]);
  const craftDark = useTransform(progress, [0.63, 0.84], [0.72, 0]);
  const copperGlint = useTransform(progress, [0.74, 0.88, 1], [0, 0.2, 0.13]);

  // ── III → Contact: the craft scene recedes past the camera ──
  const craftPush = useTransform(closing, CLOSING.craftScale.input, CLOSING.craftScale.output);

  return (
    <div ref={host} className={styles.environment} aria-hidden="true">
      <m.div className={styles.haze} style={{ opacity: haze }} />
      <m.div data-origin-valley className={styles.valley} style={{ opacity: valley, scale: still(valleyScale) }}>
        {ORIGIN_SCENES.map((scene, index) => (
          <Scene key={scene.id} scene={scene} index={index} progress={progress} push={scene.id === "philosophy" ? craftPush : undefined} reduced={reduced}>
            {scene.id === "emblem" && <m.div className={styles.forestShade} style={{ opacity: forestShade }} />}
            {scene.id === "philosophy" && (
              <>
                <m.div className={styles.craftDark} style={{ opacity: craftDark }} />
                <m.div className={styles.copperGlint} style={{ opacity: copperGlint }} />
              </>
            )}
          </Scene>
        ))}
        <m.div className={styles.farMist} style={{ opacity: farMistOpacity, x: still(farMistX) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MIST[0]} alt="" loading="lazy" decoding="sync" />
        </m.div>
        <m.div className={styles.mist} style={{ opacity: mistOpacity, x: still(mistX) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MIST[1]} alt="" loading="lazy" decoding="sync" />
        </m.div>
        <m.div className={styles.foliage} style={{ opacity: foliageOpacity, x: still(foliageX), y: still(foliageY), scale: still(foliageScale) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ORIGIN_FOREGROUND} alt="" loading="lazy" decoding="sync" draggable={false} />
        </m.div>
        <div className={styles.scrim} />
        <m.div className={styles.warmth} style={{ opacity: warmth }} />
        <m.div className={styles.emblemLight} style={{ opacity: emblemLight }} />
        <m.div data-origin-emblem className={styles.emblem} style={{ opacity: emblemOpacity, scale: still(emblemScale), y: still(emblemY) }}>
          {/* Forest light continues without an identity overlay. */}
        </m.div>
        {/* With reduced motion the plates simply crossfade; nothing passes the lens. */}
        {!reduced && (
          <m.div className={styles.canopy} style={{ opacity: canopyOpacity, x: canopyX, y: canopyY }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ORIGIN_FOREGROUND} alt="" loading="lazy" decoding="sync" draggable={false} />
          </m.div>
        )}
      </m.div>
      <m.div className={styles.bridgeSun} style={{ opacity: sun }} />
      <m.div className={styles.bridgeMist} style={{ opacity: bridgeMist, y: still(bridgeMistY) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MIST[0]} alt="" loading="lazy" decoding="sync" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MIST[1]} alt="" loading="lazy" decoding="sync" />
      </m.div>
    </div>
  );
}

type SceneProps = {
  scene: typeof ORIGIN_SCENES[number];
  index: number;
  progress: MotionValue<number>;
  push?: MotionValue<number>;
  reduced: boolean;
  children?: React.ReactNode;
};

/** Each plate drifts slowly through its own chapter: a restrained forward
 * move in the valley, a settling in the forest, a slow pan across the copper. */
type Camera = { at: number[]; scale: number[]; y: string[]; x: string[] };
const CAMERA: Record<typeof ORIGIN_SCENES[number]["id"], Camera> = {
  foothills: { at: [0, 0.36], scale: [1.03, 1.075], y: ["0.6%", "-1.2%"], x: ["0%", "0%"] },
  emblem: { at: [0.3, 0.68], scale: [1.06, 1.025], y: ["0.4%", "-0.6%"], x: ["0%", "0%"] },
  philosophy: { at: [0.63, 1], scale: [1.04, 1.075], y: ["0%", "-0.6%"], x: ["0.8%", "-1.2%"] },
};

function Scene({ scene, index, progress, push, reduced, children }: SceneProps) {
  const opacity = useTransform(progress, [...scene.range], index === 0 ? [1, 1] : [0, 1]);
  const camera = CAMERA[scene.id];
  const y = useTransform(progress, camera.at, camera.y);
  const x = useTransform(progress, camera.at, camera.x);
  const base = useTransform(progress, camera.at, camera.scale);
  const unpushed = useTransform(progress, () => 1);
  const scale = useTransform([base, push ?? unpushed], ([b, p]: number[]) => b * p);
  return (
    <m.div data-origin-scene={scene.id} className={styles.scene} style={{ opacity }}>
      <m.div className={styles.photoDepth} style={reduced ? undefined : { x, y, scale }}>
        <picture>
          <source media="(max-width: 899px)" srcSet={scene.mobile} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={scene.src} alt="" width={1672} height={941} loading="lazy" decoding="sync" draggable={false} className={styles.photo} />
        </picture>
      </m.div>
      {children}
    </m.div>
  );
}
