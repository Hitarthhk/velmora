"use client";

import { createContext, useContext, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { useMotionValue, type MotionValue } from "motion/react";
import type { ExpressionId } from "@/content/site";
import type { DragState } from "@/three/useDragRotate";

export type GalleryTarget = {
  slot: RefObject<HTMLElement | null>;
  drag: RefObject<DragState | null>;
  active: RefObject<boolean>;
  environment: RefObject<ExpressionId>;
  world: RefObject<number>;
};
type Handoff = { progress: MotionValue<number>; gallery: GalleryTarget };
const HandoffContext = createContext<Handoff | null>(null);

/** Share the existing bottle ScrollTrigger's progress with independent scenery,
 * the hero copy and the collection. No extra observer or per-scroll React state is needed. */
export function HeroBottleHandoff({ children }: { children: ReactNode }) {
  const progress = useMotionValue(0);
  const slot = useRef<HTMLElement | null>(null);
  const drag = useRef<DragState | null>(null);
  const active = useRef(true);
  const environment = useRef<ExpressionId>("private-edition-i");
  const world = useRef(0);
  const value = useMemo(() => ({ progress, gallery: { slot, drag, active, environment, world } }), [progress]);
  return <HandoffContext.Provider value={value}>{children}</HandoffContext.Provider>;
}

export const useHeroBottleHandoff = () => useContext(HandoffContext);
