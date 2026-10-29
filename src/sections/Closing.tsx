"use client";

import { useRef } from "react";
import { gsap, SplitReveal, useScene } from "@/animation";
import { Button } from "@/components/Button";
import { Landscape } from "@/components/landscape/Landscape";
import { dawn } from "@/components/landscape/palettes";
import styles from "./Closing.module.css";

/** Quiet final frame — the range at first light, one invitation. */
export function Closing() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, ({ motion }, root) => {
    if (!motion) return;
    const q = gsap.utils.selector(root);
    q<HTMLElement>("[data-layer]").forEach((el) => {
      const d = Number(el.dataset.depth);
      gsap.fromTo(el, { yPercent: d * 18 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "bottom bottom", scrub: true } });
    });
  });

  return (
    <section ref={ref} className={styles.section} aria-labelledby="closing-title">
      <Landscape palette={dawn} id="closing" clouds={false} />
      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.copy}>
        <p className="eyebrow">The Ascent Continues</p>
        <SplitReveal id="closing-title" as="h2" type="words" className={`display ${styles.title}`}>
          Some places cannot be hurried.
        </SplitReveal>
        <div className={styles.ctas}>
          <Button href="/whisky" variant="solid" cursor="Explore">
            Discover Our Whisky
          </Button>
          <Button href="/story">Read Our Story</Button>
        </div>
      </div>
    </section>
  );
}
