import type { AnimationSequence } from "motion/react";
import { MOTION_EASE } from "@/animation/MotionUI";

type Targets = {
  surface: HTMLElement;
  overlay: HTMLElement;
  panel: HTMLElement | null;
  reduce: boolean;
  phone: boolean;
  tablet: boolean;
};

/** Shared by the React component and the isolated browser preview tests. */
export function buildHimalayanDive({ surface, overlay, panel, reduce, phone, tablet }: Targets) {
  const q = (selector: string) => surface.querySelector<HTMLElement>(selector);
  const camera = q("[data-dive-hero-camera]");
  const copy = q("[data-dive-copy]");
  const nav = q("[data-dive-nav]");
  const cue = q("[data-dive-cue]");
  const lines = Array.from(surface.querySelectorAll<HTMLElement>("[data-dive-title]"));
  const supporting = Array.from(surface.querySelectorAll<HTMLElement>("[data-dive-support]"));
  const sequence: AnimationSequence = [];
  const travel = phone ? 0.35 : tablet ? 0.65 : 1;
  const pace = phone ? 5 / 6 : tablet ? 0.94 : 1;

  if (reduce) {
    // A preference change may interrupt a reveal while its children are at
    // opacity zero. Restore their own styles before dissolving the wrappers.
    for (const element of [camera, ...lines, ...supporting]) {
      element?.style.removeProperty("transform");
    }
    for (const element of [...lines, ...supporting]) element.style.opacity = "1";
    // Also replace Motion's cached values. A stopped reveal can have a queued
    // render that would otherwise write its old opacity/translation back.
    for (const element of [...lines, ...supporting]) {
      sequence.push([element, { opacity: 1, y: 0 }, { at: 0, duration: 0 }]);
    }
    if (camera) sequence.push([camera, { scale: 1, rotate: 0, rotateY: 0, x: "0%" }, { at: 0, duration: 0 }]);
    sequence.push([overlay, { opacity: 0 }, { at: 0, duration: 0.15 }]);
    for (const element of [copy, nav, cue]) {
      if (element) sequence.push([element, { opacity: 1 }, { at: 0, duration: 0.12 }]);
    }
  } else {
    if (panel) sequence.push([panel, { opacity: 0, y: -8 }, { at: 0, duration: 0.2 * pace }]);
    // Small movement of distant scenery; independent foreground fog travels
    // several times farther. No fabricated mountain/foliage cutout layers.
    sequence.push(
      ["[data-dive-night]", {
        transformPerspective: [1400, 1400],
        scale: [1, 1 + 0.075 * travel],
        rotateY: [0, -1.6 * travel], rotate: [0, -0.45 * travel],
        x: ["0%", `${-0.8 * travel}%`],
      }, { at: 0, duration: 1.35 * pace, ease: MOTION_EASE.drift }],
      ["[data-dive-fog-far]", {
        x: [`${3 * travel}%`, `${-3 * travel}%`],
        y: ["4%", "-2%"], scale: [1, 1 + 0.06 * travel],
        opacity: [0, 0.14, 0],
      }, { at: 0.12 * pace, duration: 1.5 * pace, ease: MOTION_EASE.drift }],
      ["[data-dive-fog-near]", {
        x: [`${-14 * travel}%`, `${14 * travel}%`],
        y: ["5%", "-10%"], scale: [1, 1 + 0.22 * travel],
        opacity: [0, 0.36, 0.22, 0],
      }, { at: 0.18 * pace, duration: 1.5 * pace, ease: MOTION_EASE.drift }],
      ["[data-dive-night]", { opacity: [1, 0] }, { at: 0.7 * pace, duration: 0.85 * pace, ease: MOTION_EASE.drift }],
      ["[data-dive-sunlight]", {
        opacity: [0, 0.18, 0], scale: [0.92, 1.05],
      }, { at: 0.7 * pace, duration: 1.05 * pace, ease: MOTION_EASE.drift }],
      ["[data-dive-light]", {
        x: ["-14%", "14%"], opacity: [0, 0.14, 0],
      }, { at: 0.75 * pace, duration: 0.9 * pace, ease: MOTION_EASE.drift }],
      [overlay, { opacity: 0 }, { at: 1.3 * pace, duration: 0.5 * pace, ease: MOTION_EASE.drift }],
    );
    if (camera) sequence.push([camera, {
      transformPerspective: [1400, 1400],
      scale: [1 + 0.055 * travel, 1], rotate: [0.4 * travel, 0],
      rotateY: [1.2 * travel, 0], x: [`${0.8 * travel}%`, "0%"],
    }, { at: 0.55 * pace, duration: 1.2 * pace, ease: MOTION_EASE.drift }]);
    const veil = q("[data-dive-veil]");
    if (veil) sequence.push([veil, { opacity: 0 }, { at: 0.3 * pace, duration: 1.1 * pace }]);
    if (copy) sequence.push([copy, { opacity: 1 }, { at: 1.12 * pace, duration: 0.2 * pace }]);
    lines.forEach((line, index) => sequence.push([line, { opacity: [0, 1], y: [14, 0] }, {
      at: (1.18 + index * 0.07) * pace, duration: 0.45 * pace, ease: MOTION_EASE.rise,
    }]));
    supporting.forEach(element => sequence.push([element, { opacity: [0, 1], y: [6, 0] }, {
      at: 1.3 * pace, duration: 0.4 * pace, ease: MOTION_EASE.rise,
    }]));
    if (nav) sequence.push([nav, { opacity: 1 }, { at: 1.25 * pace, duration: 0.4 * pace }]);
    if (cue) sequence.push([cue, { opacity: 1 }, { at: 1.42 * pace, duration: 0.3 * pace }]);
  }

  const clearCamera = () => {
    // Identity transforms must not remain as an extra compositing/containing
    // layer once the existing scroll animation takes over.
    camera?.style.removeProperty("transform");
    lines.forEach(line => line.style.removeProperty("transform"));
    supporting.forEach(element => element.style.removeProperty("transform"));
  };
  const finishVisuals = () => {
    clearCamera();
    for (const element of [camera, copy, nav, cue, ...lines, ...supporting]) {
      if (element) {
        // The matching CSS state outranks any stale Motion render queued by
        // stop(). Only entry-owned wrappers/text receive this marker; GSAP's
        // scroll targets remain free to animate their parent/child layers.
        element.dataset.diveSettled = "true";
        element.style.opacity = "1";
      }
    }
    overlay.dataset.diveDismissed = "true";
    overlay.style.opacity = "0";
  };
  return { sequence, clearCamera, finishVisuals, duration: reduce ? 0.15 : 1.8 * pace };
}
