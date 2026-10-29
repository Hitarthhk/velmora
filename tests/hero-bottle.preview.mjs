// Render the site's production HTML in an isolated preview, without app/age-
// verification scripts. Exercise the actual useScene callbacks extracted from
// Hero/BottleFeature, the installed GSAP engine, and shared Motion mappings.
// This previews original reference photography, never substitutes bottle art.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import ts from "typescript";
import { chromium } from "playwright-core";

const require = createRequire(import.meta.url);
const socket = createServer();
await new Promise(resolve => socket.listen(0, "127.0.0.1", resolve));
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], { windowsHide: true, stdio: "pipe" });
let output = "";
server.stdout.on("data", d => { output += d; });
server.stderr.on("data", d => { output += d; });
let browser;
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
async function sceneFactory(path, name) {
  const source = await readFile(path, "utf8");
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let callback;
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(ast) === "useScene") callback = node.arguments[1].getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(callback, `${path}: no useScene callback`);
  return compile(`window.${name} = function({ gsap, EASE, SplitText, handoff, progress, sceneProgress, gallery, expression, GALLERY_MOVE = window.galleryMappings.GALLERY_MOVE, COLLECTION_HOLD = window.galleryMappings.COLLECTION_HOLD }) { return (${callback}); };`);
}
try {
  let response;
  for (let i = 0; i < 120; i++) {
    try { response = await fetch(origin); if (response.ok) break; } catch {}
    if (server.exitCode !== null) throw new Error(output);
    await delay(250);
  }
  assert.ok(response?.ok, output);
  const html = (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace("<head>", `<head><base href="${origin}/">`);
  assert.match(html, /A Spirit Worth Discovering\./);
  assert.match(html, /Explore the colour, form and character of single malt whisky\./);
  const factories = await sceneFactory("src/sections/Hero.tsx", "heroFactory") + await sceneFactory("src/sections/BottleFeature.tsx", "bottleFactory");
  const galleryMappings = compile(await readFile("src/components/transition/bottleCollectionProgress.ts", "utf8"));
  const mappings = compile(await readFile("src/components/transition/heroBottleProgress.ts", "utf8"));
  const screenshots = await mkdtemp(join(tmpdir(), "gamber-hero-bottle-"));
  browser = await chromium.launch({ channel: "chrome", headless: true });
  for (const profile of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "small-desktop", width: 1024, height: 768 },
    { name: "tablet", width: 834, height: 1112 },
    { name: "mobile", width: 390, height: 844 },
    { name: "reduced", width: 1440, height: 900, reduced: true },
  ]) {
    const page = await browser.newPage({ viewport: profile, reducedMotion: profile.reduced ? "reduce" : "no-preference" });
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(async profile => {
      document.querySelector('[role="dialog"]')?.remove();
      document.querySelector("[inert]")?.removeAttribute("inert");
      for (const element of document.querySelectorAll("[data-dive-copy], [data-dive-nav], [data-dive-cue]")) element.style.opacity = "1";
      document.querySelector('[data-handoff="true"]').dataset.mode = profile.width >= 900 && !profile.reduced ? "cinematic" : "simple";
      await document.fonts.ready;
      const critical = Array.from(document.querySelectorAll('section[aria-labelledby="hero-title"] img, [data-handoff="true"] img'));
      await Promise.all(critical.map(async img => {
        // These frames explicitly preview the first two sections; load their
        // lazy reference photo even when a responsive reflow moves it offscreen.
        img.loading = "eager";
        try { await img.decode(); } catch {
          throw new Error(`Preview image failed to decode: ${img.currentSrc || img.src}`);
        }
      }));
    }, profile);
    for (const path of ["node_modules/gsap/dist/gsap.js", "node_modules/gsap/dist/ScrollTrigger.js", "node_modules/gsap/dist/SplitText.js", "node_modules/gsap/dist/CustomEase.js", "node_modules/motion/dist/motion.js"]) {
      await page.addScriptTag({ path: resolve(path) });
    }
    await page.addScriptTag({ content: factories + `\n(() => {const exports = {}; ${mappings} window.handoffMappings = exports;})();\n(() => {const exports = {}; ${galleryMappings} window.galleryMappings = exports;})();` });
    const setup = await page.evaluate(profile => {
      gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
      CustomEase.create("gv.silk", "0.7,0,0.15,1");
      CustomEase.create("gv.rise", "0.16,1,0.3,1");
      CustomEase.create("gv.drift", "0.45,0,0.55,1");
      const EASE = { silk: "gv.silk", rise: "gv.rise", drift: "gv.drift" };
      gsap.defaults({ ease: EASE.rise, duration: 1.2 });
      const hero = document.querySelector("section[aria-labelledby=hero-title]");
      const bottle = document.querySelector('[data-handoff="true"]');
      const progress = Motion.motionValue(0);
      window.previewProgress = progress;
      const map = definition => Motion.mapValue(progress, definition.input, definition.output);
      const { HERO_COPY, HERO_DESCRIPTION, HANDOFF_CUE, VALLEY } = window.handoffMappings;
      const style = (selector, properties) => Motion.styleEffect(document.querySelector(selector), properties);
      if (!profile.reduced) {
        style("[data-copy]", { opacity: Motion.mapValue(progress, HERO_COPY.input, HERO_COPY.opacity), transform: Motion.mapValue(progress, HERO_COPY.input, HERO_COPY.y.map(y => `translateY(${y})`)) });
        style("[data-hero-description]", { opacity: map(HERO_DESCRIPTION) });
        style("[data-cue]", { opacity: map(HANDOFF_CUE) });
        style("[data-valley-scene]", { opacity: map(VALLEY.reveal) });
        style("[data-valley-shade]", { opacity: map(VALLEY.darkness) });
        style("[data-valley-amber]", { opacity: map(VALLEY.warmth) });
        style("[data-valley-mist]", { opacity: map(VALLEY.fog), transform: Motion.mapValue(progress, VALLEY.fogY.input, VALLEY.fogY.output.map(y => `translateY(${y})`)) });
        style("[data-valley-retreat]", { opacity: Motion.motionValue(0) });
      } else {
        document.querySelector("[data-valley-scene]").style.opacity = "1";
        document.querySelector("[data-valley-shade]").style.opacity = String(VALLEY.darkness.output.at(-1));
        document.querySelector("[data-valley-amber]").style.opacity = "0.08";
      }
      const conditions = { motion: !profile.reduced, desktop: profile.width >= 900, fine: false };
      window.previewRoot = bottle;
      window.previewBottlePhoto = bottle.querySelector("[data-bottle-2d]");
      const photo = bottle.querySelector('[data-bottle-2d] img');
      const deps = { gallery: {slot:{current:document.querySelector('[data-shared-bottle=true]')}}, expression:{image:{width:photo.naturalWidth,height:photo.naturalHeight}}, gsap, EASE, SplitText, handoff: { progress }, progress: { current: 0 }, sceneProgress: progress };
      window.heroFactory(deps)(conditions, hero);
      window.bottleFactory(deps)(conditions, bottle);
      ScrollTrigger.refresh();
      window.bottleTrigger = ScrollTrigger.getAll().find(trigger => trigger.trigger === bottle && trigger.vars.pin);
      return {
        heroTop: hero.getBoundingClientRect().top + scrollY,
        bottleTop: bottle.getBoundingClientRect().top + scrollY,
        pinStart: window.bottleTrigger?.start,
        pinLength: window.bottleTrigger ? window.bottleTrigger.end - window.bottleTrigger.start : 0,
      };
    }, profile);
    const cinematic = profile.width >= 900 && !profile.reduced;
    if (cinematic) {
      assert.ok(Math.abs(setup.pinStart) < 2, `Bottle entrance still waits until ${setup.pinStart}px`);
      // 320vh showcase + COLLECTION_HOLD (60vh: settled collection, then Our Origin's bridge).
      assert.ok(Math.abs(setup.pinLength - profile.height * 3.8) < 2, "Collection hold did not extend the existing pin");
      // A gentle forward scroll, followed below by larger jumps and reversal.
      await page.evaluate(async () => {
        for (let step = 0; step <= 10; step++) {
          window.scrollTo(0, window.bottleTrigger.start + step * 0.01 * ((window.bottleTrigger.end - window.bottleTrigger.start) / window.bottleTrigger.animation.duration()));
          ScrollTrigger.update();
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      });
    }
    const samples = cinematic ? [0, 0.01, 0.04, 0.085, 0.12, 0.28, 0.36, 0.44, 0.7, 0.9, 0.7, 0.28, 0.04, 0]
      : [0, 0.08, 0.2, 0.4, 0.85, 1, 0.4, 0.08, 0];
    let overlap = false;
    const positions = new Map();
    for (const [index, p] of samples.entries()) {
      const result = await page.evaluate(async ({ p, cinematic }) => {
        const target = cinematic ? window.bottleTrigger.start + p * ((window.bottleTrigger.end - window.bottleTrigger.start) / window.bottleTrigger.animation.duration()) : p * innerHeight;
        window.scrollTo(0, target);
        ScrollTrigger.update();
        await new Promise(resolve => setTimeout(resolve, 110));
        const image = window.previewRoot.querySelector("[data-bottle-2d] img");
        const flat = window.previewRoot.querySelector("[data-bottle-2d]");
        const rect = image.getBoundingClientRect();
        const alpha = Number(getComputedStyle(flat).opacity);
        const copy = Number(getComputedStyle(document.querySelector("[data-copy]")).opacity);
        const intro = window.previewRoot.querySelector("[data-bottle-intro]");
        const introBox = intro.getBoundingClientRect();
        return {
          scroll: scrollY, p: window.previewProgress.get(), copy, alpha,
          visible: alpha > 0.01 && rect.top < innerHeight - 1 && rect.bottom > 0,
          top: rect.top, width: rect.width,
          center: rect.left + rect.width / 2,
          introOpacity: Number(getComputedStyle(intro).opacity),
          copyGap: introBox.left - rect.right,
          photoMounted: flat === window.previewBottlePhoto,
          valleySource: document.querySelector("[data-valley-scene] img").getAttribute("src"),
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        };
      }, { p, cinematic });
      assert.equal(result.overflow, false, `${profile.name}: horizontal overflow`);
      assert.equal(result.photoMounted, true, "Reference bottle was remounted during scroll");
      assert.equal(result.valleySource, "/media/photography/bottle-valley-golden-depths.webp", "Showcase reuses the hero panorama");
      if (!profile.reduced && result.copy > 0.05 && result.copy < 0.99 && result.visible) overlap = true;
      if (cinematic && p >= 0.01 && p <= 0.12) assert.equal(result.visible, true, `Empty handoff at p=${p}: ${JSON.stringify(result)}`);
      if (cinematic && p < 0.28) assert.ok(result.introOpacity < 0.01, "Product introduction precedes the settled bottle");
      if (cinematic && p === 0.36) {
        assert.ok(result.introOpacity > 0.99, "Product introduction is missing after the bottle settles");
        assert.ok(result.copyGap >= 12, "Product introduction overlaps the bottle");
      }
      if (cinematic && p === 0.44) assert.ok(result.center < profile.width / 2, "Original label close-up glide changed");
      if (cinematic && p === 0.7) assert.ok(result.center > profile.width / 2, "Original cap close-up glide changed");
      if (positions.has(p)) {
        assert.ok(Math.abs(result.top - positions.get(p).top) < 1, `${profile.name}: reverse scroll changed the bottle pose`);
        assert.ok(Math.abs(result.center - positions.get(p).center) < 1, `${profile.name}: reverse scroll changed the bottle position`);
      } else positions.set(p, result);
      if (cinematic && p === 0.12) {
        const pause = await page.evaluate(async () => {
          const scroll = scrollY;
          const image = window.previewRoot.querySelector("[data-bottle-2d] img");
          const top = image.getBoundingClientRect().top;
          await new Promise(resolve => setTimeout(resolve, 400));
          return { scrollChange: scrollY - scroll, bottleChange: image.getBoundingClientRect().top - top };
        });
        assert.equal(pause.scrollChange, 0, "Handoff introduced automatic scrolling");
        assert.ok(Math.abs(pause.bottleChange) < 1, "Bottle changed pose while scrolling was interrupted");
      }
      if (index === 2 || (cinematic && (p === 0.36 || (p === 0.28 && index < 6))) || (!cinematic && p === 0.85)) {
        await page.screenshot({ path: join(screenshots, `${profile.name}-${index}.png`) });
      }
      if (index === samples.length - 1 && !profile.reduced) assert.ok(result.copy > 0.98, "Hero text failed to restore on reverse scroll");
    }
    if (!profile.reduced) assert.ok(overlap, `${profile.name}: hero exit and bottle entrance did not overlap`);
    if (cinematic) {
      const seam = await page.evaluate(async () => {
        window.scrollTo(0, window.bottleTrigger.end + innerHeight * 0.5);
        ScrollTrigger.update();
        await new Promise(resolve => setTimeout(resolve, 120));
        const next = document.getElementById("collection-title").closest("section").getBoundingClientRect();
        return {
          gap: next.top - window.previewRoot.querySelector("[data-stage]").getBoundingClientRect().top,
          collectionVisible: next.top < innerHeight && next.bottom > 0,
          retreat: Number(getComputedStyle(document.querySelector("[data-valley-retreat]")).opacity),
        };
      });
      assert.ok(Math.abs(seam.gap) < 1, "Gap before collection");
      assert.equal(seam.collectionVisible, true);
      assert.ok(seam.retreat < 0.01, "A flat forest overlay covers the gallery");
    }
    assert.deepEqual(errors, []);
    console.log(`${profile.name}: no blank handoff/overflow, reverse scroll restored, pin length ${setup.pinLength}px`);
    await page.close();
  }
  console.log(`Handoff previews: ${screenshots}`);
} finally {
  await browser?.close();
  server.kill();
}
