"use client";

import { useEffect } from "react";
import { animate, useMotionValue } from "motion/react";

export const WORLD_SHIFT = { duration: 1.05, ease: [0.45, 0, 0.25, 1] as const };

/** One interruptible blend for scenery, studio lighting and bottle emphasis.
 * Cleanup stops an obsolete selection at its current pose before retargeting. */
export function useWhiskyWorld(active: number, reduced: boolean, prepared: boolean) {
  const world = useMotionValue(active);
  useEffect(() => {
    if (!prepared) return;
    const playback = animate(world, active, { ...WORLD_SHIFT, duration: reduced ? 0.12 : WORLD_SHIFT.duration });
    return () => playback.stop();
  }, [active, reduced, prepared, world]);
  return world;
}
