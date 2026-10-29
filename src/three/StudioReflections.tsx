"use client";

import { Lightformer } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { DataTexture, LinearFilter } from "three";

/** Soft studio cards expose the planes of crystal and brushed metal.
 * Captured once by the existing environment; no additional per-frame pass. */
export function StudioReflections() {
  const map = useMemo(() => {
    const size = 64, pixels = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = (x / (size - 1) - .5) / .40;
      const v = (y / (size - 1) - .5) / .46;
      const light = Math.round(255 * Math.exp(-Math.pow(u, 4) - Math.pow(v, 4)));
      pixels.set([light, light, light, 255], (y * size + x) * 4);
    }
    const texture = new DataTexture(pixels, size, size);
    texture.magFilter = texture.minFilter = LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }, []);
  useEffect(() => () => map.dispose(), [map]);
  return <>
    <Lightformer map={map} intensity={.85} color="#fff7e8" position={[-1.1, 1.5, 5]} scale={[3.6, 6, 1]} target={[0, 0, 0]} />
    <Lightformer map={map} intensity={3.5} color="#f4f6f4" position={[-4, .4, 0]} scale={[1.6, 6, 1]} target={[0, 0, 0]} />
    <Lightformer map={map} intensity={2.7} color="#fff0d5" position={[4, .7, -.5]} scale={[1.4, 6, 1]} target={[0, 0, 0]} />
    <Lightformer map={map} intensity={2} color="#fff3dc" position={[0, 4, 0]} rotation-x={-Math.PI / 2} scale={[4, 3, 1]} />
  </>;
}
