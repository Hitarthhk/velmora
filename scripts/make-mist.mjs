// Generates soft, horizontally drifting valley-mist textures (transparent WebP).
//   node scripts/make-mist.mjs
// Pure value noise with domain warping, stretched sideways like low cloud.
import sharp from "sharp";

const W = 1600, H = 420;

function makeNoise(seed) {
  const hash = (x, y) => {
    let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const noise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = smooth(xf), v = smooth(yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  return (x, y) => {
    let sum = 0, amp = 0.5, f = 1;
    for (let o = 0; o < 6; o++) { sum += amp * noise(x * f, y * f); f *= 2.03; amp *= 0.5; }
    return sum;
  };
}

async function mist(seed, file, density) {
  const fbm = makeNoise(seed);
  const px = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    const v = y / (H - 1);
    const profile = Math.pow(Math.sin(Math.PI * v), 1.4); // feathered top and bottom
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const nx = u * 7, ny = v * 1.8;
      const warp = fbm(nx * 0.6 + 11, ny * 0.6);
      const n = fbm(nx + warp * 1.6, ny * 2.2 + warp * 0.4);
      const t = Math.min(1, Math.max(0, (n - (0.62 - density)) / 0.32));
      const a = t * t * (3 - 2 * t) * profile;
      const edge = Math.min(1, u / 0.06, (1 - u) / 0.06); // feathered sides
      const i = (y * W + x) * 4;
      px[i] = 246; px[i + 1] = 240; px[i + 2] = 230;
      px[i + 3] = Math.round(255 * a * edge * 0.9);
    }
  }
  await sharp(px, { raw: { width: W, height: H, channels: 4 } }).blur(1.2).webp({ quality: 82, alphaQuality: 85 }).toFile(file);
}

await mist(7, "public/media/photography/mist-a.webp", 0.14);
await mist(19, "public/media/photography/mist-b.webp", 0.1);
console.log("mist textures written");
