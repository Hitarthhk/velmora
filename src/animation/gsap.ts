"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

let registered = false;

if (typeof window !== "undefined" && !registered) {
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP);
  // Signature eases — every motion on the site draws from this small vocabulary.
  CustomEase.create("gv.silk", "0.7,0,0.15,1");
  CustomEase.create("gv.rise", "0.16,1,0.3,1");
  CustomEase.create("gv.drift", "0.45,0,0.55,1");
  gsap.defaults({ ease: "gv.rise", duration: 1.2 });
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (process.env.NODE_ENV !== "production") Object.assign(window, { __gsap: gsap, __ST: ScrollTrigger });
  registered = true;
}

export const EASE = {
  silk: "gv.silk",
  rise: "gv.rise",
  drift: "gv.drift",
} as const;

/** Media conditions shared by every scene through gsap.matchMedia(). */
export const MQ = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  desktop: "(min-width: 900px)",
  mobile: "(max-width: 899px)",
  fine: "(pointer: fine)",
} as const;

export type SceneConditions = {
  motion: boolean;
  reduce: boolean;
  desktop: boolean;
  mobile: boolean;
  fine: boolean;
};

export { gsap, ScrollTrigger, SplitText, useGSAP };
