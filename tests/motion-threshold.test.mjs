import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = ts.transpileModule(readFileSync("src/animation/useMotionThreshold.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

function fixture(once = false) {
  let value = 0, state, updates = 0, cleanup, id = 0;
  const frames = new Map(), listeners = new Set();
  const react = {
    useState(initial) { state = initial(); return [state, update => { updates++; state = update(state); }]; },
    useEffect(setup) { cleanup = setup(); },
  };
  const mod = { exports: {} };
  new Function("require", "module", "exports", "requestAnimationFrame", "cancelAnimationFrame", source)(
    () => react, mod, mod.exports,
    callback => { frames.set(++id, callback); return id; }, frame => frames.delete(frame),
  );
  mod.exports.useMotionThreshold({ get: () => value, on: (_, callback) => { listeners.add(callback); return () => listeners.delete(callback); } }, 0.5, once);
  return {
    emit(next) { value = next; listeners.forEach(callback => callback(next)); },
    flush() { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback()); },
    get state() { return state; }, get updates() { return updates; },
    get pending() { return frames.size; }, get subscribers() { return listeners.size; },
    cleanup: () => cleanup(),
  };
}

test("render-time Motion notifications never synchronously update React state", () => {
  const f = fixture();
  f.flush();
  const before = f.updates;
  f.emit(0.8);
  assert.equal(f.updates, before);
  assert.equal(f.state, false);
  assert.equal(f.pending, 1);
  f.flush();
  assert.equal(f.state, true);
  f.cleanup();
});

test("rapid crossings publish only the latest value and ignore same-side updates", () => {
  const f = fixture(); f.flush();
  const before = f.updates;
  f.emit(0.8); f.emit(0.1); f.emit(0.9);
  assert.equal(f.pending, 1);
  f.flush();
  assert.equal(f.state, true);
  assert.equal(f.updates, before + 1);
  f.emit(0.95);
  assert.equal(f.pending, 0);
  f.emit(0.2); f.flush();
  assert.equal(f.state, false);
  f.cleanup();
});

test("cleanup cancels a pending publication and removes the subscription", () => {
  const f = fixture(); f.flush();
  f.emit(0.8); const before = f.updates;
  f.cleanup(); f.flush(); f.emit(0.1);
  assert.equal(f.updates, before);
  assert.equal(f.pending, 0);
  assert.equal(f.subscribers, 0);
});

test("one-way readiness stays mounted when scrolling back", () => {
  const f = fixture(true); f.flush();
  f.emit(0.8); f.flush();
  f.emit(0.1); f.flush();
  assert.equal(f.state, true);
  f.cleanup();
});
