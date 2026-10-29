/** Domains use the existing bottle timeline's normalized progress, not time.
 * Keeping these mappings shared also lets browser previews exercise the real
 * Motion interpolation alongside the actual GSAP scene callbacks. */
export const HERO_COPY = {
  input: [0.004, 0.075, 0.165], opacity: [1, 0.48, 0], y: ["0%", "-6%", "-14%"],
};
export const HERO_DESCRIPTION = { input: [0, 0.065], output: [1, 0] };
export const HANDOFF_CUE = { input: [0, 0.015], output: [1, 0] };
export const VALLEY = {
  reveal: { input: [0, 0.06, 0.28], output: [0, 0.22, 1] },
  darkness: { input: [0, 0.1, 0.3], output: [0.05, 0.23, 0.34] },
  warmth: { input: [0, 0.14, 0.32], output: [0.01, 0.035, 0.1] },
  fog: { input: [0, 0.1, 0.3], output: [0.02, 0.12, 0.07] },
  fogY: { input: [0, 0.3], output: ["8%", "-6%"] },
  retreat: { input: [0.84, 1], output: [0, 1] },
};
