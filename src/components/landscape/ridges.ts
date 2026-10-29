/** Deterministic procedural ridgelines (midpoint displacement + massif envelope). */

export const VIEW_W = 1600;
export const VIEW_H = 900;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type RidgeSpec = {
  seed: number;
  base: number; // average ridge height (y, px in 1600×900 space)
  amp: number; // displacement amplitude
  rough?: number; // 0.4 smooth → 0.7 jagged
  peaks?: { x: number; height: number; width: number }[];
  trees?: { density: number; height: number };
};

export function ridgePath({ seed, base, amp, rough = 0.52, peaks = [], trees }: RidgeSpec) {
  const rand = mulberry32(seed);
  let pts = [base + (rand() - 0.5) * amp, base + (rand() - 0.5) * amp];
  let disp = amp;
  for (let i = 0; i < 8; i++) {
    const next: number[] = [];
    for (let j = 0; j < pts.length - 1; j++) {
      next.push(pts[j], (pts[j] + pts[j + 1]) / 2 + (rand() - 0.5) * disp);
    }
    next.push(pts[pts.length - 1]);
    disp *= rough;
    pts = next;
  }
  const step = VIEW_W / (pts.length - 1);
  pts = pts.map((y, i) => {
    const x = i * step;
    let lift = 0;
    for (const p of peaks) lift += p.height * Math.exp(-(((x - p.x) / p.width) ** 2));
    return y - lift;
  });

  const f = (n: number) => n.toFixed(1);
  let d = `M0 ${VIEW_H} L` + pts.map((y, i) => `${f(i * step)} ${f(y)}`).join(" L") + ` L${VIEW_W} ${VIEW_H}Z`;

  if (trees) {
    // Conifer silhouettes along the ridge — reads as Himalayan deodar forest at distance.
    for (let x = 0; x < VIEW_W; x += VIEW_W / trees.density) {
      const cx = x + (rand() - 0.5) * 6;
      const y = pts[Math.min(pts.length - 1, Math.max(0, Math.round(cx / step)))] + 4;
      const h = trees.height * (0.55 + rand() * 0.75);
      const w = h * (0.28 + rand() * 0.1);
      const tier = y - h * 0.55;
      d +=
        `M${f(cx - w / 2)} ${f(y)}L${f(cx - w * 0.18)} ${f(tier)}L${f(cx - w * 0.32)} ${f(tier)}` +
        `L${f(cx)} ${f(y - h)}L${f(cx + w * 0.32)} ${f(tier)}L${f(cx + w * 0.18)} ${f(tier)}L${f(cx + w / 2)} ${f(y)}Z`;
    }
  }
  return d;
}
