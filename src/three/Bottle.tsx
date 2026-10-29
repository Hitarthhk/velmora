"use client";

import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef, type RefObject } from "react";
import { Group, MathUtils, PerspectiveCamera, PointLight } from "three";
import { range } from "@/animation/useScene";
import type { Expression } from "@/content/site";
import { Precompile } from "./Precompile";
import { designs } from "./bottles/designs";
import { PremiumBottle, type Quality } from "./bottles/PremiumBottle";
import { curve } from "./bottles/loft";
import { stepDrag, type DragState } from "./useDragRotate";
import type { GalleryTarget } from "@/components/transition/HeroBottleHandoff";
import { galleryMix } from "../components/transition/bottleCollectionProgress";

export type { Quality };
export const CAMERA = { z: 7.4, fov: 30 };

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** 0 → 1 → 0 across [a, b, c, d]. */
const bump = (p: number, a: number, b: number, c: number, d: number) => easeInOut(range(p, a, b)) * (1 - easeInOut(range(p, c, d)));

// Rotation keyframes across the scroll: a full turn while rising, the label
// held to camera for its close-up, a quarter turn for the cap, then a turn out.
const TAU = Math.PI * 2;
const spin = curve([[0, -1.3], [0.28, TAU - 0.35], [0.36, TAU - 0.1], [0.52, TAU + 0.06], [0.6, TAU + 0.5], [0.76, TAU + 0.75], [1, 2 * TAU + 0.6]]);

/** Fits a bottle into the frame (visible size at the default camera distance). */
export function fitScale(id: Expression["id"], visW: number, visH: number, heightShare = 0.66, widthShare = 0.7) {
  const d = designs[id];
  return Math.min(d.display, (visH * heightShare) / d.height, (visW * widthShare) / d.width);
}

type Props = {
  expression: Expression;
  progress: RefObject<number>;
  quality: Quality;
  /** "scroll": the showcase choreography. "static": a settled, turnable pose. */
  mode: "scroll" | "static";
  /** Gentle idle turn in the static pose (off for reduced motion). */
  idle: boolean;
  drag: RefObject<DragState>;
  onReady?: () => void;
  gallery?: GalleryTarget;
};

/** Sharing the model's Suspense boundary prevents announcing an empty frame. */
function ModelLoaded({ loaded }: { loaded: RefObject<boolean> }) {
  useEffect(() => {
    loaded.current = true;
    return () => { loaded.current = false; };
  }, [loaded]);
  return null;
}

/**
 * A premium whisky bottle choreographed by `progress` (0→1), which the owning
 * section writes from its ScrollTrigger: rise out of the fog → turn → glide
 * left (label close-up) → glide right (cap close-up) → ascend out.
 */
export function Bottle({ expression, progress, quality, mode, idle, drag, onReady, gallery }: Props) {
  const outer = useRef<Group>(null);
  const sweep = useRef<PointLight>(null);
  const design = designs[expression.id];
  const modelLoaded = useRef(false);
  const reported = useRef(false);
  const readyFrame = useRef<number | null>(null);
  useEffect(() => {
    reported.current = false;
    return () => {
      if (readyFrame.current !== null) cancelAnimationFrame(readyFrame.current);
      readyFrame.current = null;
    };
  }, [onReady]);

  useFrame((state, dt) => {
    const g = outer.current;
    if (!g) return;
    const camera = state.camera as PerspectiveCamera;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const visH = 2 * CAMERA.z * Math.tan(MathUtils.degToRad(CAMERA.fov / 2));
    const visW = visH * aspect;
    const scale = fitScale(expression.id, visW, visH, mode === "scroll" ? 0.7 : 0.78, aspect > 1 ? 0.42 : 0.8);
    const mix = gallery && mode === "scroll" ? galleryMix(progress.current) : 0;
    const collectionDrag = gallery?.drag.current;
    const user = stepDrag(mix > 0.99 && collectionDrag ? collectionDrag : drag.current, dt);
    const pointer = state.pointer;

    let x = 0, y = 0, rotY: number, s = scale, camZ = CAMERA.z, camY = 0;
    if (mode === "scroll") {
      const p = progress.current ?? 0;
      const side = aspect > 1 ? visW * 0.2 : 0;
      // 1 · rise out of the fog   2 · glide left   3 · glide right   4 · ascend out
      const rise = ease(range(p, 0, 0.28));
      const left = easeInOut(range(p, 0.32, 0.5));
      const right = easeInOut(range(p, 0.58, 0.76));
      const exit = gallery ? 0 : easeInOut(range(p, 0.84, 1));
      x = -side * left + 2 * side * right - side * exit;
      y = MathUtils.lerp(-visH * 0.86, 0, rise) + exit * visH * 0.9 + pointer.y * 0.05;
      rotY = spin(p) + pointer.x * 0.25;
      s = scale * MathUtils.lerp(0.86, 1, rise) * (1 - exit * 0.15);
      // Close-ups: dolly toward the label, then up to the neck and cap.
      const label = bump(p, 0.33, 0.4, 0.5, 0.57);
      const cap = bump(p, 0.59, 0.66, 0.74, 0.8);
      camZ = CAMERA.z - label * 2.1 - cap * 2.6;
      camY = (design.focus.label - design.height / 2) * s * label + (design.focus.cap - design.height / 2) * s * cap;
      x *= camZ / CAMERA.z + (1 - camZ / CAMERA.z) * 0.35; // keep the bottle clear of the copy while closer
      const slot = gallery?.slot.current;
      if (slot && mix > 0) {
        const frame = state.gl.domElement.getBoundingClientRect();
        const r = slot.getBoundingClientRect();
        const targetX = ((r.left + r.width / 2 - frame.left) / frame.width - 0.5) * visW;
        const targetY = (0.5 - (r.top + r.height / 2 - frame.top) / frame.height) * visH;
        const fit = Math.min(r.height / frame.height * visH * 0.84 / design.height, r.width / frame.width * visW * 0.86 / design.width);
        x = MathUtils.lerp(x, targetX, mix);
        y = MathUtils.lerp(y, targetY, mix);
        const emphasis = 1 - (gallery!.world?.current ?? (gallery!.active.current ? 0 : 1));
        s = MathUtils.lerp(s, fit * MathUtils.lerp(0.94, 1, emphasis), mix);
        rotY = MathUtils.lerp(spin(Math.min(p, 0.86)), TAU * 2 + (1 - emphasis) * 0.12 + (collectionDrag?.hover ?? 0) * 0.25, mix);
      }
    } else {
      const since = (performance.now() - drag.current.lastInteraction) / 1000;
      const resume = Math.min(1, Math.max(0, since - 1.5));
      rotY = -0.35 + (idle ? state.clock.elapsedTime * 0.35 * resume : 0);
    }

    // Lose temporal lag progressively during the spatial handoff. Once fitted,
    // the bottle and DOM slot move as one when the existing pin releases.
    const follow = (current: number, target: number, damping: number) =>
      MathUtils.lerp(MathUtils.damp(current, target, damping, dt), target, mix);
    g.position.x = follow(g.position.x, x, 4);
    g.position.y = follow(g.position.y, y, 4);
    g.rotation.y = follow(g.rotation.y, rotY + user, drag.current.dragging ? 14 : 3.5);
    g.rotation.z = follow(g.rotation.z, (x - g.position.x) * -0.12 * (1 - mix), 3);
    g.rotation.x = follow(g.rotation.x, pointer.y * -0.05 * (1 - mix), 3);
    g.scale.setScalar(follow(g.scale.x, s, 4));
    camera.position.z = follow(camera.position.z, camZ, 3.2);
    camera.position.y = follow(camera.position.y, camY, 3.2);

    // Read readiness without changing any existing position, scale or spin
    // curve. A late-loading model must catch up before the photo fades away.
    if (onReady && modelLoaded.current && !reported.current
      && Math.abs(g.position.y - y) < visH * 0.03
      && Math.abs(g.position.x - x) < visW * 0.03
      && Math.abs(g.scale.x - s) < s * 0.05) {
      reported.current = true;
      readyFrame.current = requestAnimationFrame(() => {
        readyFrame.current = null;
        onReady();
      });
    }

    // A warm highlight travels across the glass as the bottle turns.
    if (sweep.current) {
      const p = mode === "scroll" ? progress.current ?? 0 : (state.clock.elapsedTime * 0.08) % 1;
      sweep.current.position.x = Math.sin(p * Math.PI * 3) * 2.6 + g.position.x;
      sweep.current.position.y = g.position.y + 0.6;
      sweep.current.intensity = 6 + Math.sin(p * Math.PI * 6) * 3;
    }
  });

  return (
    <>
      <pointLight ref={sweep} position={[0, 0.6, 2.4]} color={design.light.key} intensity={6} distance={7} decay={1.6} />
      <group ref={outer} position={[0, -6, 0]}>
        <group position={[0, -design.height / 2, 0]}>
          <Suspense fallback={null}>
            <PremiumBottle expression={expression} quality={quality} />
            <Precompile />
            {onReady && <ModelLoaded loaded={modelLoaded} />}
          </Suspense>
        </group>
      </group>
    </>
  );
}
