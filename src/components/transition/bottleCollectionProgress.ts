/** The last tasting note ends at .92. Reuse the existing pin's remaining
 * scroll distance, without changing any earlier showcase cue. */
export const GALLERY = {
  environment: { input: [0.85, 0.91, 0.98], output: [0, 0.35, 1] },
  details: { input: [0.915, 0.965], output: [0, 1] },
  description: { input: [0.93, 0.975], output: [0, 1] },
  controls: { input: [0.955, 0.995], output: [0, 1] },
  second: { input: [0.935, 0.99], output: [0, 1] },
  meta: { input: [0.955, 0.995], output: [0, 1] },
};
// Finish before the existing pin releases. The remaining scroll is a settled
// collection view, rather than a moving target for a damped Three.js bottle.
export const GALLERY_MOVE = { start: 0.86, end: 0.965 };
/** Keep the completed collection on screen before releasing to Our Origin.
 * Extend the same timeline by 60vh while preserving the original 320vh
 * choreography's absolute scroll positions: a short pause on the settled,
 * interactive collection, then Our Origin's 40vh bridge over its last part. */
export const COLLECTION_HOLD = { scrollPercent: 60, timelineEnd: 1 + 60 / 320 };
export const galleryMix = (p: number) => {
  const t = Math.min(1, Math.max(0, (p - GALLERY_MOVE.start) / (GALLERY_MOVE.end - GALLERY_MOVE.start)));
  return t * t * (3 - 2 * t);
};
