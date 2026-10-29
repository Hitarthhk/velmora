"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { gsap } from "./gsap";
import { useScene } from "./useScene";

type Props = { children: ReactNode; speed?: number; className?: string; style?: CSSProperties };

/** Scroll-linked depth. speed > 0 moves slower than the page (further away). */
export function Parallax({ children, speed = 0.2, className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useScene(ref, ({ motion }, root) => {
    if (!motion) return;
    gsap.fromTo(
      root,
      { yPercent: -speed * 50 },
      {
        yPercent: speed * 50,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  });

  return (
    <div ref={ref} className={className} style={{ willChange: "transform", ...style }}>
      {children}
    </div>
  );
}
