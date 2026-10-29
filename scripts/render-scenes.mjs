// Renders the procedural Himalayan scenes to images (age gate + hero layers).
//   1. npm run dev          (in another terminal)
//   2. node scripts/render-scenes.mjs [http://localhost:3000]
// Uses the locally installed Chrome; outputs WebP to public/media/scenes/{landscape,portrait}.
import { chromium } from "playwright-core";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const base = process.argv[2] ?? "http://localhost:3000";
// Hero layers are 12% wider than the viewport (they parallax sideways).
const SETS = {
  landscape: { w: 2560, h: 1440, hw: 2688, hh: 1350 },
  portrait: { w: 1080, h: 2340, hw: 1210, hh: 2340 },
};

const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-webgl"] });
try {
  for (const [name, s] of Object.entries(SETS)) {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await page.goto(`${base}/dev/scenes?w=${s.w}&h=${s.h}&hw=${s.hw}&hh=${s.hh}`);
    await page.waitForFunction(() => document.getElementById("scene-status")?.textContent !== "rendering", null, { timeout: 600_000 });
    const status = await page.textContent("#scene-status");
    if (status !== "done") throw new Error(`${name}: ${status}`);
    const scenes = await page.evaluate(() => window.__scenes);
    const dir = `public/media/scenes/${name}`;
    await mkdir(dir, { recursive: true });
    for (const [key, url] of Object.entries(scenes)) {
      const png = Buffer.from(url.split(",")[1], "base64");
      const opaque = key.startsWith("gate") || key === "hero-sky";
      await sharp(png).webp(opaque ? { quality: 84 } : { quality: 86, alphaQuality: 90 }).toFile(`${dir}/${key}.webp`);
    }
    console.log(name, Object.keys(scenes).length, "images");
    await page.close();
  }
} finally {
  await browser.close();
}
