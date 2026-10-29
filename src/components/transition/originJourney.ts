/** The homepage's second half as one film: collection → Our Origin →
 * Contact → footer. Distances are viewport heights of scroll.
 *
 * On desktop the scenes overlap instead of sliding in after each other:
 *  - `bridge`: Our Origin pins over the last part of the collection's
 *    settled hold (COLLECTION_HOLD) and the valley grows out of the selected
 *    whisky world. The collection's pin and selection are untouched.
 *  - `chapters`: the existing three chapters, unchanged in length.
 *  - `closing`: still pinned, The Philosophy dissolves into the twilight
 *    landscape, which Contact holds beneath as a sticky backdrop.
 * The 100vh slide-ins this replaces made the page longer than it is now. */
export const ORIGIN_SCROLL = {
  bridge: 40,
  chapters: 300,
  closing: 70,
} as const;

const total = ORIGIN_SCROLL.bridge + ORIGIN_SCROLL.chapters + ORIGIN_SCROLL.closing;
/** Fractions of Origin's single pinned timeline. */
export const SEGMENT = {
  total,
  bridge: ORIGIN_SCROLL.bridge / total,
  chapters: ORIGIN_SCROLL.chapters / total,
  closing: ORIGIN_SCROLL.closing / total,
};

/** Splits Origin's timeline progress into its three normalised segments. */
export function originSegments(t: number) {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return {
    bridge: clamp(t / SEGMENT.bridge),
    chapters: clamp((t - SEGMENT.bridge) / SEGMENT.chapters),
    closing: clamp((t - SEGMENT.bridge - SEGMENT.chapters) / SEGMENT.closing),
  };
}

/** Collection → Foothills (bridge progress). The whisky interface recedes
 * first while its world stays visible, mist rises from the valley floor,
 * then the camera opens out of it into the foothills. */
export const BRIDGE = {
  haze: { input: [0.04, 0.42], output: [0, 0.9] },
  mist: { input: [0.08, 0.5, 0.95], output: [0, 0.95, 0.18] },
  mistY: { input: [0.08, 0.6], output: ["38%", "0%"] },
  sun: { input: [0.35, 0.7, 1], output: [0, 0.5, 0] },
  valley: { input: [0.3, 0.82], output: [0, 1] },
  valleyScale: { input: [0.3, 1], output: [1.14, 1] },
  chrome: { input: [0.78, 1], output: [0, 1] },
};

/** Philosophy → Contact (closing progress), shared by both sections. */
export const CLOSING = {
  copy: { input: [0, 0.28], output: [1, 0] },
  chrome: { input: [0, 0.2], output: [1, 0] },
  craft: { input: [0.12, 0.62], output: [1, 0] },
  craftScale: { input: [0, 1], output: [1, 1.1] },
};
