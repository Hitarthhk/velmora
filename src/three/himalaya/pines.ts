/**
 * Conifer silhouettes drawn on a 2D canvas: a trunk and jagged, drooping
 * branch tiers narrowing to a spire — the outline of Himalayan pine and
 * deodar seen against mist. Deterministic for a given seed.
 */

function rng(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pine(ctx: CanvasRenderingContext2D, x: number, base: number, height: number, rand: () => number) {
  const width = height * (0.24 + rand() * 0.12);
  const tiers = 10 + Math.floor(rand() * 7);
  const lean = (rand() - 0.5) * 0.05 * height;
  ctx.beginPath();
  // Trunk.
  ctx.rect(x - height * 0.011, base - height * 0.22, height * 0.022, height * 0.22);
  // Tiers from the bottom up: drooping fans of needles, uneven on each side,
  // with ragged tufted edges and the odd gap where a bough is missing.
  for (let i = 0; i < tiers; i++) {
    if (i > 1 && i < tiers - 2 && rand() < 0.1) continue;
    const f = i / tiers;
    const y = base - height * (0.12 + f * 0.84);
    const taper = (1 - f) ** 0.85;
    const left = width * taper * (0.6 + rand() * 0.55);
    const right = width * taper * (0.6 + rand() * 0.55);
    const drop = height * (0.06 + (1 - f) * 0.06) * (0.8 + rand() * 0.4);
    const cx = x + lean * f;
    const edge = (side: 1 | -1, reach: number) => {
      const pts: [number, number][] = [];
      const steps = 11;
      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const tuft = s % 2 ? drop * (0.18 + rand() * 0.22) : 0;
        pts.push([cx + side * reach * u, y - drop * 0.9 + drop * u ** 1.5 + tuft + (rand() - 0.5) * drop * 0.2]);
      }
      return pts;
    };
    ctx.moveTo(cx, y - drop * 0.95);
    edge(1, right).forEach(([px, py]) => ctx.lineTo(px, py));
    ctx.lineTo(cx, y + drop * 0.3);
    edge(-1, left).reverse().forEach(([px, py]) => ctx.lineTo(px, py));
    ctx.closePath();
  }
  // Spire.
  const tipX = x + lean;
  ctx.moveTo(tipX - width * 0.05, base - height * 0.9);
  ctx.lineTo(tipX + (rand() - 0.5) * width * 0.03, base - height * (1.0 + rand() * 0.04));
  ctx.lineTo(tipX + width * 0.05, base - height * 0.9);
  ctx.closePath();
  ctx.fill();
}

type Treeline = {
  /** Ground height (px from top) at each x, or a constant. */
  ground: (x: number) => number;
  /** Tree height in px as a function of x (0 = no tree). */
  size: (x: number) => number;
  spacing: number;
  colour: CanvasGradient | string;
  seed: number;
  /** Soft focus for distance, in px. */
  blur?: number;
};

export function drawTreeline(ctx: CanvasRenderingContext2D, width: number, { ground, size, spacing, colour, seed, blur = 0 }: Treeline) {
  const rand = rng(seed);
  ctx.save();
  ctx.fillStyle = colour;
  if (blur) ctx.filter = `blur(${blur}px)`;
  for (let x = -spacing; x < width + spacing; x += spacing * (0.55 + rand() * 0.9)) {
    const h = size(x) * (0.7 + rand() * 0.55);
    if (h < 2) continue;
    pine(ctx, x, ground(x) + h * 0.06, h, rand);
  }
  ctx.restore();
}

/** Reads a baked layer’s silhouette: the first opaque row in each column. */
export function crestLine(canvas: HTMLCanvasElement, sample = 4) {
  const ctx = canvas.getContext("2d")!;
  const { width: w, height: h } = canvas;
  const data = ctx.getImageData(0, 0, w, h).data;
  const cols: number[] = [];
  for (let x = 0; x < w; x += sample) {
    let y = 0;
    while (y < h && data[(y * w + x) * 4 + 3] < 128) y++;
    cols.push(y);
  }
  return (x: number) => {
    const i = Math.max(0, Math.min(cols.length - 1, x / sample));
    const i0 = Math.floor(i), i1 = Math.min(cols.length - 1, i0 + 1);
    return cols[i0] + (cols[i1] - cols[i0]) * (i - i0);
  };
}
