"use client";

import type { RefObject } from "react";
import { gsap, MQ, ScrollTrigger, useGSAP, type SceneConditions } from "./gsap";

let frame = 0;
const FOLLOWING = 4; // Node.DOCUMENT_POSITION_FOLLOWING

/**
 * Scenes can mount (or rebuild) in any order, but pinned sections must be
 * measured top-to-bottom so each pin's spacer offsets the ones below it.
 * Batch every change into one sort-by-DOM-order + refresh per frame.
 */
function queueRefresh() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    ScrollTrigger.sort((a: ScrollTrigger, b: ScrollTrigger) => {
      const ta = a.trigger as Element | undefined;
      const tb = b.trigger as Element | undefined;
      if (!ta || !tb) return ta ? -1 : tb ? 1 : 0;
      if (ta === tb) return 0;
      return ta.compareDocumentPosition(tb) & FOLLOWING ? -1 : 1;
    });
    ScrollTrigger.refresh();
  });
}

/**
 * The single entry point for authoring a scroll scene.
 * Wraps useGSAP + gsap.matchMedia so every scene automatically:
 *  - is scoped to its root element (selector text resolves inside it)
 *  - reverts cleanly on unmount / route change
 *  - re-runs when breakpoints or the reduced-motion preference change
 */
export function useScene<T extends HTMLElement>(
  scope: RefObject<T | null>,
  setup: (c: SceneConditions, root: T) => void | (() => void),
  dependencies: unknown[] = [],
) {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add({ ...MQ }, (ctx) => setup(ctx.conditions as SceneConditions, root));
      queueRefresh();
      return () => {
        mm.revert();
        queueRefresh();
      };
    },
    { scope, dependencies, revertOnUpdate: true },
  );
}

/** Normalised sub-range of a 0→1 progress value. */
export const range = (p: number, start: number, end: number) =>
  Math.min(1, Math.max(0, (p - start) / (end - start)));
