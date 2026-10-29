"use client";

import { useRef, type RefObject } from "react";
import { EASE, gsap, SplitText } from "./gsap";
import { useScene } from "./useScene";

type Props = {
  id?: string;
  children: string;
  as?: "p" | "h1" | "h2" | "h3" | "span" | "div";
  className?: string;
  /** chars: display headlines · words: titles · lines: editorial copy */
  type?: "chars" | "words" | "lines";
  /** "scroll" reveals on entering the viewport; "manual" waits for `play`. */
  trigger?: "scroll" | "manual";
  play?: boolean;
  delay?: number;
  stagger?: number;
  duration?: number;
};

/**
 * Masked editorial text reveal. Text stays real, selectable and readable by
 * assistive tech (SplitText keeps an aria-label on the parent).
 */
export function SplitReveal({
  id,
  children,
  as = "p",
  className,
  type = "lines",
  trigger = "scroll",
  play = true,
  delay = 0,
  stagger,
  duration = 1.4,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as "div";

  useScene(
    ref,
    ({ reduce }, root) => {
      if (trigger === "manual" && !play) {
        gsap.set(root, { autoAlpha: 0 });
        return;
      }
      if (reduce) {
        gsap.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, delay });
        return;
      }
      gsap.set(root, { autoAlpha: 1 });
      const split = SplitText.create(root, {
        type: type === "chars" ? "words,chars" : type,
        mask: type === "chars" ? "chars" : type,
        autoSplit: true,
        aria: "auto",
        onSplit(self) {
          const targets = self[type];
          return gsap.from(targets, {
            yPercent: 115,
            rotate: type === "chars" ? 4 : 0,
            duration,
            ease: EASE.rise,
            delay,
            stagger: stagger ?? (type === "chars" ? 0.035 : type === "words" ? 0.06 : 0.11),
            scrollTrigger:
              trigger === "scroll" ? { trigger: root, start: "top 88%", once: true } : undefined,
          });
        },
      });
      return () => split.revert();
    },
    [play, children],
  );

  return (
    <Tag id={id} ref={ref as RefObject<HTMLDivElement>} className={className} style={{ visibility: "hidden" }}>
      {children}
    </Tag>
  );
}
