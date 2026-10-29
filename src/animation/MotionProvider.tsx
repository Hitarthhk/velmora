"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Motion = {
  reduced: boolean;
  touch: boolean;
  mobile: boolean;
  webgl: boolean;
  ready: boolean;
};

const initial: Motion = { reduced: false, touch: false, mobile: false, webgl: true, ready: false };
const MotionContext = createContext<Motion>(initial);

function detectWebGL() {
  try {
    const c = document.createElement("canvas");
    const context = c.getContext("webgl2");
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!context;
  } catch {
    return false;
  }
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Motion>(initial);

  useEffect(() => {
    const qReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const qTouch = window.matchMedia("(pointer: coarse)");
    const qMobile = window.matchMedia("(max-width: 899px)");
    const webgl = detectWebGL();
    const update = () =>
      setState({
        reduced: qReduce.matches,
        touch: qTouch.matches,
        mobile: qMobile.matches,
        webgl,
        ready: true,
      });
    update();
    [qReduce, qTouch, qMobile].forEach((q) => q.addEventListener("change", update));
    return () => [qReduce, qTouch, qMobile].forEach((q) => q.removeEventListener("change", update));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = state.reduced ? "reduced" : "full";
  }, [state.reduced]);

  return <MotionContext.Provider value={state}>{children}</MotionContext.Provider>;
}

export const useMotion = () => useContext(MotionContext);
