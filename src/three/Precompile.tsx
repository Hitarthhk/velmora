"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { BackSide, DoubleSide, HalfFloatType, WebGLRenderTarget, type Material, type Mesh } from "three";

const noop = () => {};
// Safari has no requestIdleCallback.
export const whenIdle = (callback: () => void, timeout = 4000) =>
  window.requestIdleCallback ? window.requestIdleCallback(callback, { timeout }) : window.setTimeout(callback, 1500);
export const cancelIdle = (id: number) =>
  window.cancelIdleCallback ? window.cancelIdleCallback(id) : window.clearTimeout(id);

/**
 * Compiles the canvas's shaders in the background as soon as a model has
 * loaded, before the canvas is first shown. Left to the first visible frame,
 * linking the glass and liquid programs blocked the main thread for seconds
 * mid-scroll on integrated GPUs. Mount it inside the model's Suspense
 * boundary, so the meshes are in the scene when it runs.
 */
export function Precompile() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const advance = useThree((state) => state.advance);
  const get = useThree((state) => state.get);
  useEffect(() => {
    let cancelled = false;
    // KHR_parallel_shader_compile lets the GPU process link off the main thread.
    const screen = gl.compileAsync(scene, camera);

    // The glass's transmission pass draws into a linear render target, with
    // double-sided transmissive materials turned to their back faces: those
    // are separate programs. compileAsync reads both states synchronously.
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
    const flipped: Material[] = [];
    scene.traverse((object) => {
      const materials = (object as Mesh).material;
      for (const material of Array.isArray(materials) ? materials : materials ? [materials] : []) {
        if ((material as Material & { transmission?: number }).transmission && material.side === DoubleSide) {
          material.side = BackSide;
          material.needsUpdate = true;
          flipped.push(material);
        }
      }
    });
    const previous = gl.getRenderTarget();
    gl.setRenderTarget(target);
    const transmission = gl.compileAsync(scene, camera);
    gl.setRenderTarget(previous);
    for (const material of flipped) {
      material.side = DoubleSide;
      material.needsUpdate = true;
    }
    transmission.catch(noop).finally(() => target.dispose());

    // Then draw one frame while the canvas is still hidden, when the browser
    // is idle: it renders the studio environment and uploads the label
    // textures, the remaining first-frame work.
    let idle: number | undefined;
    Promise.all([screen, transmission]).then(() => {
      if (cancelled) return;
      idle = whenIdle(() => {
        if (!cancelled && get().frameloop === "never") advance(performance.now());
      });
    }, noop);
    return () => {
      cancelled = true;
      if (idle !== undefined) cancelIdle(idle);
    };
  }, [gl, scene, camera, advance, get]);
  return null;
}
