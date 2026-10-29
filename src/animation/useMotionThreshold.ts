"use client";

import { useEffect, useState } from "react";
import type { MotionValue } from "motion/react";

/** Motion can emit changes while a motion component reconciles its styles.
 * Publish React state after rendering, coalescing rapid crossings to the latest
 * value. Pending work and the subscription are cancelled on cleanup. */
export function useMotionThreshold(value: MotionValue<number>, threshold: number, once = false) {
  const [passed, setPassed] = useState(() => value.get() >= threshold);
  useEffect(() => {
    let observed = value.get() >= threshold;
    let frame: number | null = null;
    const publish = () => {
      frame = null;
      const next = value.get() >= threshold;
      setPassed(previous => once ? previous || next : next);
    };
    const unsubscribe = value.on("change", next => {
      const crossed = next >= threshold;
      if (crossed === observed) return;
      observed = crossed;
      if (frame === null) frame = requestAnimationFrame(publish);
    });
    frame = requestAnimationFrame(publish);
    return () => {
      unsubscribe();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [value, threshold, once]);
  return passed;
}
