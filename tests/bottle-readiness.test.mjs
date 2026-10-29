// Exercise the real Bottle component's frame callback with Three.js objects.
// Texture/Suspense completion and the renderer's next frame are controlled so
// we can reproduce a late model without requiring a real GPU in unit tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import * as React from "react";
import { Group, PointLight, PerspectiveCamera } from "three";
import ts from "typescript";

const require = createRequire(import.meta.url);

test("the shared bottle preserves tasting poses, settles in its slot, and reverses after a fast seek", () => {
  const shared = fixture({ gallery: true });
  const legacy = fixture();
  shared.progress.current = legacy.progress.current = 0.76;
  shared.tick(360); legacy.tick(360);
  assert.ok(shared.model.position.distanceTo(legacy.model.position) < 0.00001);
  assert.ok(Math.abs(shared.model.rotation.y - legacy.model.rotation.y) < 0.00001);
  const before = shared.model.position.clone();
  shared.progress.current = 0.965;
  shared.tick(); // The slot must be reached before pin release, even after a fast seek.
  const visH = 2 * 7.4 * Math.tan(30 / 2 * Math.PI / 180);
  const visW = visH * 1440 / 900;
  const targetX = (910 / 1440 - 0.5) * visW;
  assert.ok(Math.abs(shared.model.position.x - targetX) < 0.00001);
  assert.ok(Math.abs(shared.model.position.y) < 0.00001, "Bottle ascended instead of staying in the collection");
  assert.ok(Math.abs(shared.model.rotation.y - Math.PI * 4) < 0.00001, "Bottle did not finish facing front");
  assert.ok(shared.model.scale.x > 0 && shared.model.scale.x < legacy.model.scale.x, "Bottle did not fit down into the card");
  shared.progress.current = 0.76;
  shared.tick(360);
  assert.ok(shared.model.position.distanceTo(before) < 0.00001, "Reverse seek failed to restore the tasting pose");
  shared.dispose(); legacy.dispose();
});

function fixture({ readyCallback = true, gallery = false } = {}) {
  const frames = new Map();
  const cleanups = [];
  let frameId = 0;
  let update;
  let readyCount = 0;
  const cache = new Map();
  const hooks = {
    ...React,
    useRef: current => ({ current }),
    useEffect: setup => { const cleanup = setup(); if (cleanup) cleanups.push(cleanup); },
  };
  const fakeRAF = callback => { frames.set(++frameId, callback); return frameId; };
  function load(path) {
    if (cache.has(path)) return cache.get(path).exports;
    const compiled = ts.transpileModule(readFileSync(path, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop:true },
    }).outputText;
    const mod = { exports: {} };
    cache.set(path, mod);
    const localRequire = id => {
      if (id === "react") return hooks;
      if (id === "@react-three/fiber") return { useFrame: callback => { update = callback; } };
      if (id === "@/animation/useScene") return { range: (p, start, end) => Math.min(1, Math.max(0, (p - start) / (end - start))) };
      if (id === "./useDragRotate") return { stepDrag: () => 0 };
      if (id === "./bottles/PremiumBottle") return { PremiumBottle: () => null };
      if (id === "./Precompile") return { Precompile: () => null };
      if (id.endsWith('.json')) return require(resolve(dirname(path), id));
      if (id.startsWith(".")) {
        const candidate = resolve(dirname(path), `${id}.ts`);
        if (existsSync(candidate)) return load(candidate);
      }
      return require(id);
    };
    new Function("require", "module", "exports", "requestAnimationFrame", "cancelAnimationFrame", compiled)(
      localRequire, mod, mod.exports, fakeRAF, id => frames.delete(id),
    );
    return mod.exports;
  }
  const { Bottle, CAMERA } = load(resolve("src/three/Bottle.tsx"));
  const progress = { current: 0.28 };
  const tree = Bottle({
    expression: { id: "private-edition-i" }, progress, quality: "low",
    mode: "scroll", idle: false, drag: { current: {} },
    onReady: readyCallback ? () => { readyCount++; } : undefined,
    gallery: gallery ? {
      slot: { current: { getBoundingClientRect: () => ({ left: 760, top: 180, width: 300, height: 540 }) } },
      drag: { current: null }, active: { current: true },
    } : undefined,
  });
  function find(node, predicate) {
    if (!node || typeof node !== "object") return undefined;
    if (predicate(node)) return node;
    const children = Array.isArray(node.props?.children) ? node.props.children : [node.props?.children];
    for (const child of children) { const result = find(child, predicate); if (result) return result; }
  }
  const outer = find(tree, node => node.type === "group" && node.props.ref);
  outer.props.ref.current = new Group();
  outer.props.ref.current.position.set(0, -6, 0);
  find(tree, node => node.type === "pointLight").props.ref.current = new PointLight();
  const loaded = find(tree, node => node.type?.name === "ModelLoaded");
  const camera = new PerspectiveCamera(CAMERA.fov, 1440 / 900, 0.1, 100);
  camera.position.z = CAMERA.z;
  const state = { camera, size: { width: 1440, height: 900 }, pointer: { x: 0, y: 0 }, clock: { elapsedTime: 0 }, gl: { domElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1440, height: 900 }) } } };
  return {
    frames, progress, model: outer.props.ref.current,
    tick(count = 1) { for (let n = 0; n < count; n++) { state.clock.elapsedTime += 1 / 60; update(state, 1 / 60); } },
    loadModel() { assert.ok(loaded); loaded.type(loaded.props); },
    flushFrame() { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback()); },
    get readyCount() { return readyCount; },
    dispose() { cleanups.reverse().forEach(cleanup => cleanup()); },
  };
}

test("late textures cannot replace the photo with an empty model", () => {
  const f = fixture();
  f.tick(240);
  assert.equal(f.frames.size, 0);
  assert.equal(f.readyCount, 0);
  f.loadModel();
  f.tick();
  assert.equal(f.frames.size, 1);
  assert.equal(f.readyCount, 0, "Readiness must wait until the model frame has drawn");
  f.flushFrame();
  assert.equal(f.readyCount, 1);
  f.progress.current = 0.44;
  f.tick(240);
  f.flushFrame();
  assert.equal(f.readyCount, 1, "Readiness must not toggle on later scroll poses");
  f.dispose();
});

test("a loaded bottle must catch up to the scroll pose before replacing the photo", () => {
  const f = fixture();
  f.loadModel();
  f.tick();
  assert.equal(f.frames.size, 0, "An offscreen warm-up pose was reported as ready");
  f.tick(240);
  assert.equal(f.frames.size, 1);
  f.dispose();
  f.flushFrame();
  assert.equal(f.readyCount, 0, "Unmount must cancel the pending readiness callback");
});

test("standalone showcases retain their existing frame behaviour without readiness callbacks", () => {
  const f = fixture({ readyCallback: false });
  f.tick(240);
  assert.equal(f.frames.size, 0);
  assert.equal(f.readyCount, 0);
  f.dispose();
});
