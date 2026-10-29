"use client";

import { useEffect } from "react";
import { useLenis } from "@/animation/SmoothScroll";

const locks = new Set<symbol>();
let savedOverflow = "";
let savedRootOverflow = "";

/** Multiple overlays can hold a lock without unlocking one another. */
export function useScrollLock(locked: boolean) {
  const lenis = useLenis();
  useEffect(() => {
    if (!locked) return;
    const token = Symbol();
    if (!locks.size) {
      savedOverflow = document.body.style.overflow;
      savedRootOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }
    locks.add(token);
    lenis?.stop();
    return () => {
      locks.delete(token);
      if (!locks.size) {
        document.body.style.overflow = savedOverflow;
        document.documentElement.style.overflow = savedRootOverflow;
        lenis?.start();
      }
    };
  }, [locked, lenis]);
}
