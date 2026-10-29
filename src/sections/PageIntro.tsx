"use client";

import { useRef } from "react";
import { gsap, SplitReveal, useScene } from "@/animation";
import { useEntered } from "@/components/AgeGate";
import { Landscape } from "@/components/landscape/Landscape";
import type { Palette } from "@/components/landscape/palettes";
import styles from "./PageIntro.module.css";

/** Opening frame for inner pages — reuses the landscape and the type system. */
export function PageIntro({ eyebrow, title, palette, id }: { eyebrow: string; title: string; palette: Palette; id: string }) {
  const ref = useRef<HTMLElement>(null);
  const entered = useEntered();

  useScene(ref, ({ motion }, root) => {
    if (!motion) return;
    const q = gsap.utils.selector(root);
    q<HTMLElement>("[data-layer]").forEach((el) => {
      const d = Number(el.dataset.depth);
      gsap.to(el, { yPercent: d * 22, scale: 1 + d * 0.3, ease: "none", scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true } });
    });
    gsap.to(q("[data-intro-copy]"), { yPercent: -40, autoAlpha: 0, ease: "none", scrollTrigger: { trigger: root, start: "top top", end: "60% top", scrub: true } });
  });

  return (
    <section ref={ref} className={styles.intro}>
      <Landscape palette={palette} id={id} />
      <div className={styles.shade} aria-hidden="true" />
      <div data-intro-copy className={styles.copy}>
        <p className="eyebrow">{eyebrow}</p>
        <SplitReveal as="h1" type="chars" trigger="manual" play={entered} delay={0.3} className={`display ${styles.title}`}>
          {title}
        </SplitReveal>
      </div>
    </section>
  );
}
