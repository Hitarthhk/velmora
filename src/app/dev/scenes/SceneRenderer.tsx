"use client";

import { useEffect, useState } from "react";

type Output = Record<string, string>;

/**
 * Bakes the gate and hero scenes at the size given in the query string
 * (?w=&h=&hw=&hh=) and exposes them as PNG data URLs on window.__scenes.
 */
export function SceneRenderer() {
  const [status, setStatus] = useState("rendering");

  useEffect(() => {
    // Strict Mode runs effects twice in development; bake only once.
    const w = window as unknown as { __baking?: boolean };
    if (w.__baking) return;
    w.__baking = true;
    const q = new URLSearchParams(location.search);
    const n = (k: string) => Number(q.get(k));
    (async () => {
      const { bakeGate } = await import("@/three/himalaya/gate");
      const { bakeHimalaya } = await import("@/three/himalaya/bake");
      const out: Output = {};
      const png = (c: HTMLCanvasElement) => c.toDataURL("image/png");
      const gate = await bakeGate(n("w"), n("h"));
      out["gate-night"] = png(gate.night);
      out["gate-dawn"] = png(gate.dawn);
      const hero = await bakeHimalaya(n("hw"), n("hh"), "high");
      out["hero-sky"] = png(hero.sky);
      hero.layers.forEach((c, i) => (out[`hero-layer-${i}`] = png(c)));
      hero.fog.forEach((c, i) => (out[`hero-fog-${i}`] = png(c)));
      hero.clouds.forEach((c, i) => (out[`hero-cloud-${i}`] = png(c)));
      (window as unknown as { __scenes: Output }).__scenes = out;
      setStatus("done");
    })().catch((e) => setStatus(`error: ${e}`));
  }, []);

  return <p id="scene-status" style={{ padding: 120 }}>{status}</p>;
}
