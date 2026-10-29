// Isolated visual/animation preview: uses the production HTML with app scripts
// removed. It never presses YES or submits age confirmation. The real shared
// timeline runs against that markup using the installed Motion browser build.
// Run after npm run build: node tests/camera-dive.preview.mjs
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright-core";
import ts from "typescript";

const require = createRequire(import.meta.url);
const socket = createServer();
await new Promise(resolve => socket.listen(0, "127.0.0.1", resolve));
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], { windowsHide: true, stdio: "pipe" });
let serverOutput = "";
server.stdout.on("data", data => { serverOutput += data; });
server.stderr.on("data", data => { serverOutput += data; });
let browser;
try {
  let response;
  for (let attempt = 0; attempt < 120; attempt++) {
    try { response = await fetch(origin); if (response.ok) break; } catch {}
    if (server.exitCode !== null) throw new Error(serverOutput);
    await delay(250);
  }
  assert.ok(response?.ok, serverOutput);
  const html = (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace("<head>", `<head><base href="${origin}/">`);
  const source = await readFile("src/components/transition/himalayanDiveTimeline.ts", "utf8");
  const easeSource = (await readFile("src/animation/MotionUI.tsx", "utf8"))
    .match(/export const MOTION_EASE = \{[\s\S]*?\} as const;/)?.[0];
  assert.ok(easeSource);
  const compile = text => ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const helper = `(() => { const exports = {}; ${compile(easeSource)}
    const ease = exports.MOTION_EASE;
    const require = () => ({ MOTION_EASE: ease });
    ${compile(source)} window.previewDive = exports.buildHimalayanDive; })();`;
  const screenshots = await mkdtemp(join(tmpdir(), "gamber-camera-dive-"));
  browser = await chromium.launch({ channel: "chrome", headless: true });
  for (const profile of [
    { name: "desktop", width: 1440, height: 900, duration: 1.8 },
    { name: "tablet", width: 834, height: 1112, duration: 1.692 },
    { name: "mobile", width: 390, height: 844, duration: 1.5 },
    { name: "reduced", width: 1440, height: 900, duration: 0.15, reduce: true },
    { name: "reduced-switch", width: 1440, height: 900, duration: 1.8, switchToReduced: true },
    { name: "forced-finish", width: 1440, height: 900, duration: 1.8, forceFinish: true },
  ]) {
    if (process.env.TRANSITION_PREVIEW_PROFILE && process.env.TRANSITION_PREVIEW_PROFILE !== profile.name) continue;
    const page = await browser.newPage({ viewport: profile, reducedMotion: profile.reduce ? "reduce" : "no-preference" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(async () => {
      document.body.style.overflow = "hidden";
      // App scripts are deliberately absent in this fixture. Match the linked
      // showcase's real GSAP initialization at scroll zero, below the viewport.
      const bottle = document.querySelector('[data-handoff="true"]');
      if (bottle) bottle.dataset.mode = innerWidth < 900 || matchMedia("(prefers-reduced-motion: reduce)").matches ? "simple" : "cinematic";
      const collection = document.querySelector('[aria-labelledby="collection-title"]');
      if (collection) {
        collection.dataset.mode = bottle?.dataset.mode || "cinematic";
        collection.dataset.embedded = String(collection.dataset.mode === "cinematic");
      }
      for (const element of bottle?.querySelectorAll("[data-bottle-2d], [data-halo]") ?? []) element.style.opacity = "0";
      // Changing the layout reveals stacked copy and can request new font
      // faces. Let that responsive reflow finish before recording geometry.
      bottle?.getBoundingClientRect();
      await document.fonts.ready;
      await Promise.all(Array.from(document.images).map(img => { img.loading = "eager"; return img.decode(); }));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await page.addScriptTag({ path: resolve("node_modules/motion/dist/motion.js") });
    await page.addScriptTag({ content: helper });
    const duration = await page.evaluate(profile => {
      const overlay = document.querySelector('[role="dialog"]');
      const camera = document.querySelector("[data-dive-hero-camera]");
      const image = camera.querySelector("img");
      const rect = image.getBoundingClientRect();
      window.previewLayout = () => Array.from(document.querySelectorAll("main > section")).map(element => ({
        name: element.getAttribute("aria-label") || element.getAttribute("aria-labelledby"),
        top: element.getBoundingClientRect().top,
        height: element.getBoundingClientRect().height,
        margin: getComputedStyle(element).marginTop,
      }));
      window.beforeSections = window.previewLayout();
      window.beforeDive = { x: rect.x, y: rect.y, width: rect.width, height: rect.height, heightOfPage: document.documentElement.scrollHeight };
      overlay.dataset.exiting = "true";
      overlay.querySelector("[data-active]").dataset.active = "true";
      const { sequence, clearCamera, finishVisuals } = window.previewDive({
        surface: document.body, overlay,
        panel: document.querySelector("[data-gate-panel]"),
        reduce: !!profile.reduce, phone: profile.width <= 599, tablet: profile.width <= 1199,
      });
      window.previewControls = Motion.animate(sequence);
      window.previewCleanup = clearCamera;
      window.previewFinishVisuals = finishVisuals;
      window.previewControls.pause();
      return window.previewControls.duration;
    }, profile);
    assert.ok(Math.abs(duration - profile.duration) < 0.01, `${profile.name}: unexpected duration ${duration}`);
    if (!profile.reduce) {
      await page.evaluate(async time => {
        window.previewControls.time = time;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }, duration * 0.52);
      await page.screenshot({ path: join(screenshots, `${profile.name}-mid.png`) });
    }
    // Exercise real-time completion as well as timeline seeking.
    const final = await page.evaluate(async profile => {
      let interruptedOpacity;
      if (profile.switchToReduced) {
        window.previewControls.time = 0.9;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        window.previewControls.stop();
        window.previewCleanup();
        interruptedOpacity = Array.from(document.querySelectorAll("[data-dive-title], [data-dive-support]"))
          .map(element => getComputedStyle(element).opacity);
        const { sequence, clearCamera } = window.previewDive({
          surface: document.body, overlay: document.querySelector('[role="dialog"]'),
          panel: document.querySelector("[data-gate-panel]"),
          reduce: true, phone: false, tablet: false,
        });
        window.previewControls = Motion.animate(sequence);
        window.previewCleanup = clearCamera;
      } else {
        window.previewControls.time = 0;
      }
      const start = performance.now();
      if (profile.forceFinish) {
        window.previewControls.time = 0.9;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        window.previewControls.stop();
        window.previewFinishVisuals();
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      } else {
        window.previewControls.play();
        await window.previewControls;
      }
      window.previewCleanup();
      const elapsed = performance.now() - start;
      const overlay = document.querySelector('[role="dialog"]');
      const overlayOpacity = getComputedStyle(overlay).opacity;
      overlay.remove();
      document.querySelector("[inert]")?.removeAttribute("inert");
      const image = document.querySelector("[data-dive-hero-camera] img");
      const rect = image.getBoundingClientRect();
      return {
        elapsed, overlayOpacity, interruptedOpacity,
        entryOpacity: ["copy", "nav", "cue"].map(name => getComputedStyle(document.querySelector(`[data-dive-${name}]`)).opacity),
        textOpacity: Array.from(document.querySelectorAll("[data-dive-title], [data-dive-support]"))
          .map(element => getComputedStyle(element).opacity),
        identity: document.querySelector("[data-dive-hero-camera]").style.transform,
        before: window.beforeDive,
        layout: { before: window.beforeSections, after: window.previewLayout() },
        after: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, heightOfPage: document.documentElement.scrollHeight },
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
      };
    }, profile);
    assert.equal(final.overlayOpacity, "0");
    assert.deepEqual(final.entryOpacity, ["1", "1", "1"]);
    assert.ok(final.textOpacity.every(opacity => opacity === "1"), `${profile.name}: hidden heading or supporting text`);
    if (profile.switchToReduced) {
      assert.ok(final.interruptedOpacity.some(opacity => Number(opacity) < 1), "The preference-change test must interrupt unfinished text");
    }
    assert.equal(final.identity, "");
    assert.deepEqual(final.after, final.before, `${profile.name}: final composition or layout changed: ${JSON.stringify(final.layout)}`);
    assert.equal(final.overflow, false, `${profile.name}: horizontal overflow`);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: join(screenshots, `${profile.name}-hero.png`) });
    console.log(`${profile.name}: ${duration.toFixed(3)}s timeline, ${Math.round(final.elapsed)}ms playback; exact final composition, content visible, no overflow or runtime errors`);
    await page.close();
  }
  console.log(`Preview screenshots: ${screenshots}`);
} finally {
  await browser?.close();
  server.kill();
}
