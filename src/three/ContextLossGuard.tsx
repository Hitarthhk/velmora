"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

/** Restore the already-mounted reference image if the browser loses WebGL. */
export function ContextLossGuard({ onUnavailable }: { onUnavailable?: () => void }) {
  const gl = useThree(state => state.gl);
  useEffect(() => {
    if (!onUnavailable) return;
    const lost = (event: Event) => { event.preventDefault(); onUnavailable(); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onUnavailable]);
  return null;
}
