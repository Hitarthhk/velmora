"use client";

import { LazyMotion, MotionConfig, type Transition } from "motion/react";
import type { ReactNode } from "react";
import { useMotion } from "./MotionProvider";

/**
 * Motion for React, for interface state only: enter/exit, layout changes,
 * hover and tap feedback. Scroll choreography stays with GSAP/ScrollTrigger
 * and the 3D scenes with Three.js — never animate an element with Motion that
 * a GSAP timeline already targets (anything selected by a [data-*] hook).
 *
 * Use the lightweight `m` components (not `motion.*`): LazyMotion is strict
 * and loads its animation features on demand.
 */

const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

/** The site's signature curves, shared with GSAP (see EASE in ./gsap). */
export const MOTION_EASE = {
  silk: [0.7, 0, 0.15, 1],
  rise: [0.16, 1, 0.3, 1],
  drift: [0.45, 0, 0.55, 1],
} as const;

const defaultTransition: Transition = { duration: 0.6, ease: MOTION_EASE.rise };

export function MotionUIProvider({ children }: { children: ReactNode }) {
  // Same preference the rest of the site follows; Motion also reads the OS
  // setting itself ("user"), so it is respected even before ours resolves.
  const { reduced } = useMotion();
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion={reduced ? "always" : "user"} transition={defaultTransition}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

export { m, AnimatePresence, useReducedMotion } from "motion/react";
