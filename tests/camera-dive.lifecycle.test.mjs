import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/components/transition/himalayanDivePlayback.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const moduleExports = {};
new Function("exports", compiled)(moduleExports);
const { playHimalayanDive } = moduleExports;

function fixture({ throwing = false, hidden = false } = {}) {
  const viewport = new EventTarget();
  viewport.innerWidth = 390;
  viewport.innerHeight = 844;
  viewport.screen = { orientation: new EventTarget() };
  viewport.performance = { now: () => 0 };
  const timers = new Map();
  let timerId = 0;
  viewport.setTimeout = callback => { timers.set(++timerId, callback); return timerId; };
  viewport.clearTimeout = id => timers.delete(id);
  const visibility = new EventTarget();
  visibility.visibilityState = hidden ? "hidden" : "visible";
  const counts = { starts: 0, stops: 0, visuals: 0, completes: 0 };
  let resolve;
  let reject;
  const controls = {
    stop: () => { counts.stops++; },
    then: (onResolve, onReject) => { resolve = onResolve; reject = onReject; return Promise.resolve(); },
  };
  const dispose = playHimalayanDive({
    viewport, visibility, timeoutMs: 2000,
    start: () => { counts.starts++; if (throwing) throw new Error("Animation unavailable"); return controls; },
    finishVisuals: () => { counts.visuals++; },
    onComplete: () => { counts.completes++; },
  });
  return { viewport, visibility, counts, timers, dispose, resolve: () => resolve?.(), reject: () => reject?.() };
}

function assertFinished(f) {
  assert.equal(f.counts.visuals, 1);
  assert.equal(f.counts.completes, 1);
  assert.equal(f.timers.size, 0);
}

test("normal completion settles once and removes the deadline", () => {
  const f = fixture();
  f.resolve();
  f.resolve();
  f.reject();
  f.viewport.innerWidth = 844;
  f.viewport.dispatchEvent(new Event("resize"));
  assertFinished(f);
  assert.equal(f.counts.stops, 1);
  f.dispose();
  assert.equal(f.counts.stops, 1);
});

test("a synchronous animation failure still reveals and unlocks the page", () => {
  assertFinished(fixture({ throwing: true }));
});

test("a rejected animation still reveals and unlocks the page", () => {
  const f = fixture();
  f.reject();
  assertFinished(f);
});

test("a stalled animation completes through the independent deadline", () => {
  const f = fixture();
  [...f.timers.values()][0]();
  assertFinished(f);
  assert.equal(f.counts.stops, 1);
});

test("height-only browser chrome changes do not interrupt playback", () => {
  const f = fixture();
  f.viewport.innerHeight = 740;
  f.viewport.dispatchEvent(new Event("resize"));
  assert.equal(f.counts.completes, 0);
  assert.equal(f.counts.stops, 0);
  assert.equal(f.timers.size, 1);
  f.viewport.innerWidth = 844;
  f.viewport.dispatchEvent(new Event("resize"));
  assertFinished(f);
});

test("orientation changes settle the camera immediately", () => {
  const f = fixture();
  f.viewport.screen.orientation.dispatchEvent(new Event("change"));
  assertFinished(f);
});

test("hiding the tab settles instead of waiting on throttled animation frames", () => {
  const f = fixture();
  f.visibility.visibilityState = "hidden";
  f.visibility.dispatchEvent(new Event("visibilitychange"));
  assertFinished(f);
  const initiallyHidden = fixture({ hidden: true });
  assertFinished(initiallyHidden);
  assert.equal(initiallyHidden.counts.starts, 0);
});

test("cleanup cancels deadlines and ignores stale completion callbacks", () => {
  const f = fixture();
  const staleTimer = [...f.timers.values()][0];
  f.dispose();
  staleTimer();
  f.resolve();
  f.reject();
  f.viewport.innerWidth = 844;
  f.viewport.dispatchEvent(new Event("resize"));
  f.viewport.screen.orientation.dispatchEvent(new Event("change"));
  f.visibility.visibilityState = "hidden";
  f.visibility.dispatchEvent(new Event("visibilitychange"));
  assert.equal(f.counts.completes, 0);
  assert.equal(f.counts.visuals, 0);
  assert.equal(f.counts.stops, 1);
  assert.equal(f.timers.size, 0);
});
