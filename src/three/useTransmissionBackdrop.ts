"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Color, type ColorRepresentation } from "three";

/**
 * On a transparent canvas, three.js clears the glass-refraction buffer to
 * half-transparent white (WebGLRenderer, three r180: `setClearColor(0xffffff,
 * 0.5)` in the transmission pass), so clear glass with nothing behind it reads
 * as milky white. This substitutes a backdrop tone matching the section behind
 * the canvas, so clear glass refracts darkness as it would against the page.
 * The canvas itself stays transparent.
 */
export function useTransmissionBackdrop(color: ColorRepresentation) {
  const gl = useThree((s) => s.gl);
  const backdrop = useRef(new Color(color));

  useEffect(() => {
    backdrop.current.set(color);
  }, [color]);

  useEffect(() => {
    const original = gl.setClearColor.bind(gl);
    gl.setClearColor = (c: ColorRepresentation, alpha?: number) =>
      c === 0xffffff && alpha === 0.5 ? original(backdrop.current, 1) : original(c, alpha);
    return () => {
      gl.setClearColor = original;
    };
  }, [gl]);
}

/** Renders nothing; installs the backdrop inside a <Canvas>. */
export function TransmissionBackdrop({ color }: { color: ColorRepresentation }) {
  useTransmissionBackdrop(color);
  return null;
}
