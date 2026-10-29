"use client";

import { useEffect, useState } from "react";
import type { Quality } from "./bottles/PremiumBottle";

/**
 * Rendering tier for the 3D bottles. "low" swaps the transmissive glass for a
 * cheap transparent one and lowers geometry density on modest devices.
 */
export function useQuality() {
  const [quality, setQuality] = useState<Quality>("high");
  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 8;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    setQuality(cores <= 4 || memory <= 4 || window.devicePixelRatio > 2.5 ? "low" : "high");
  }, []);
  return quality;
}
