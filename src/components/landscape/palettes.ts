import type { RidgeSpec } from "./ridges";

export type LayerSpec = RidgeSpec & {
  depth: number; // 0 = horizon, 1 = foreground
  top: string;
  bottom: string;
  rim?: string;
  fogAfter?: number; // opacity of a fog band placed in front of this layer
};

export type Palette = {
  sky: [string, string, string];
  sun: string;
  layers: LayerSpec[];
};

/** Pre-dawn → first light. Used by the homepage hero. */
export const dawn: Palette = {
  sky: ["#0a1510", "#1f3328", "#a77d46"],
  sun: "rgba(236, 196, 128, 0.55)",
  layers: [
    {
      depth: 0, seed: 11, base: 520, amp: 200, rough: 0.5, top: "#d8d3c4", bottom: "#4f5f55",
      peaks: [{ x: 1180, height: 230, width: 200 }, { x: 420, height: 150, width: 160 }], fogAfter: 0.55,
    },
    {
      depth: 0.22, seed: 23, base: 560, amp: 190, rough: 0.52, top: "#53675a", bottom: "#2a3a30", rim: "rgba(226,196,134,0.55)",
      peaks: [{ x: 300, height: 120, width: 220 }, { x: 1350, height: 150, width: 260 }], fogAfter: 0.45,
    },
    {
      depth: 0.45, seed: 37, base: 650, amp: 150, rough: 0.56, top: "#24382d", bottom: "#17261e",
      peaks: [{ x: 1100, height: 80, width: 300 }], trees: { density: 260, height: 16 }, fogAfter: 0.35,
    },
    {
      depth: 0.72, seed: 41, base: 740, amp: 120, rough: 0.6, top: "#13221a", bottom: "#0d1813",
      trees: { density: 150, height: 34 }, fogAfter: 0.22,
    },
    {
      depth: 1, seed: 53, base: 840, amp: 90, rough: 0.62, top: "#09110d", bottom: "#050907",
      peaks: [{ x: 120, height: 110, width: 260 }, { x: 1500, height: 140, width: 240 }], trees: { density: 70, height: 70 },
    },
  ],
};

/** Blue hour over the valley. Used by the story chapters. */
export const dusk: Palette = {
  sky: ["#0c1413", "#22302e", "#5d5442"],
  sun: "rgba(210, 170, 110, 0.35)",
  layers: [
    {
      depth: 0, seed: 71, base: 450, amp: 240, rough: 0.5, top: "#a7a89c", bottom: "#46524c",
      peaks: [{ x: 420, height: 210, width: 230 }, { x: 1260, height: 160, width: 180 }], fogAfter: 0.5,
    },
    { depth: 0.3, seed: 83, base: 560, amp: 200, rough: 0.54, top: "#3f4f49", bottom: "#222e2a", rim: "rgba(214,182,120,0.4)", fogAfter: 0.4 },
    {
      depth: 0.6, seed: 97, base: 680, amp: 140, rough: 0.58, top: "#18241f", bottom: "#101915",
      trees: { density: 200, height: 22 }, fogAfter: 0.25,
    },
    { depth: 1, seed: 103, base: 820, amp: 100, rough: 0.62, top: "#0a100e", bottom: "#060a08", trees: { density: 80, height: 60 } },
  ],
};
