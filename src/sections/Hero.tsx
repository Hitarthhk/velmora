"use client";

import { useRef } from "react";
import { gsap, useScene, useMotion } from "@/animation";
import { m, useMotionValue, useTransform } from "motion/react";
import { useHeroBottleHandoff } from "@/components/transition/HeroBottleHandoff";
import { HERO_COPY, HERO_DESCRIPTION, HANDOFF_CUE } from "@/components/transition/heroBottleProgress";
import { useEntered } from "@/components/AgeGate";
import { HeroPhoto } from "@/components/landscape/HeroPhoto";
import { hero } from "@/content/site";
import styles from "./Hero.module.css";

/**
 * Opening shot. The camera settles on the range, then scroll dollies it
 * forward: near ridges sweep past the lens, fog thickens, and the frame
 * dissolves into the mist the bottle rises from in the next scene.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const entered = useEntered();
  const handoff = useHeroBottleHandoff();
  const unlinked = useMotionValue(0);
  const { reduced } = useMotion();
  const copyOpacity = useTransform(handoff?.progress ?? unlinked, HERO_COPY.input, HERO_COPY.opacity);
  const copyY = useTransform(handoff?.progress ?? unlinked, HERO_COPY.input, HERO_COPY.y);
  const cueOpacity = useTransform(handoff?.progress ?? unlinked, HANDOFF_CUE.input, HANDOFF_CUE.output);
  const descriptionOpacity = useTransform(handoff?.progress ?? unlinked, HERO_DESCRIPTION.input, HERO_DESCRIPTION.output);

  useScene(
    ref,
    ({ motion, desktop, fine }, root) => {
      const q = gsap.utils.selector(root);
      const layers = q<HTMLElement>("[data-layer]");
      const inners = q<HTMLElement>("[data-layer-inner]");
      const depth = (el: Element) => Number((el as HTMLElement).dataset.depth ?? 0);
      if (!motion) return;

      // ---- Pointer parallax: depth-weighted, pointer devices only ----
      let removePointer = () => {};
      if (fine) {
        const movers = inners.map((el) => ({
          x: gsap.quickTo(el, "x", { duration: 1.6, ease: "power3" }),
          y: gsap.quickTo(el, "y", { duration: 1.6, ease: "power3" }),
          d: depth(el.parentElement!),
        }));
        const move = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          movers.forEach((m) => {
            m.x(-nx * (6 + m.d * 46));
            m.y(-ny * (2 + m.d * 14));
          });
        };
        window.addEventListener("pointermove", move, { passive: true });
        removePointer = () => window.removeEventListener("pointermove", move);
      }

      // ---- Scroll: travel through the landscape ----
      const travel = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: desktop
          ? { trigger: root, start: "top top", end: "+=220%", scrub: 1, pin: q("[data-stage]")[0], pinSpacing: !handoff, anticipatePin: 1 }
          : { trigger: root, start: "top top", end: "bottom top", scrub: 0.6,
            // Unpinned copy must leave before it scrolls behind the fixed nav;
            // the shorter mobile overlap still exposes the bottle immediately.
            onUpdate: self => handoff?.progress.set(self.progress * 0.8) },
      });
      const reach = desktop ? 1 : 0.45; // shorter, gentler move on phones
      layers.forEach((el) => {
        const d = depth(el);
        travel.to(el, { scale: 1 + (0.06 + d * d * 2.4) * reach, yPercent: d * 26 * reach, duration: 1 }, 0);
        if (d === 1) travel.to(el, { autoAlpha: 0, duration: 0.25 }, 0.6);
      });
      travel
        .to(q("[data-fog]"), { yPercent: -40, scale: 1.5, opacity: 0.95, duration: 1, stagger: 0.02 }, 0)
        .to(q("[data-sky]"), { yPercent: 8, duration: 1 }, 0)
        .to(q("[data-sun]"), { scale: 1.4, yPercent: -10, duration: 1 }, 0);
      if (!handoff) {
        travel.to(q("[data-copy]"), { yPercent: -30, autoAlpha: 0, duration: 0.35 }, 0.04)
          .to(q("[data-cue]"), { autoAlpha: 0, duration: 0.1 }, 0)
          .fromTo(q("[data-flood]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.6);
      }

      return () => {
        removePointer();
      };
    },
    [handoff],
  );

  return (
    <section ref={ref} className={styles.hero} data-hero-handoff={!!handoff} data-soundscape="hero" aria-labelledby="hero-title">
      <div data-stage className={styles.stage}>
        <div data-dive-hero-camera className={styles.entryCamera}>
          <HeroPhoto />
        </div>
        <div className={styles.vignette} aria-hidden="true" />
        <m.div data-copy className={styles.copy} style={handoff ? { opacity: reduced ? 1 : copyOpacity, y: reduced ? "0%" : copyY } : undefined}>
          <div data-dive-copy className={styles.entryCopy} style={{ opacity: entered ? 1 : 0 }}>
          <p data-intro data-dive-support className="eyebrow">
            {hero.eyebrow}
          </p>
          <h1 id="hero-title" data-headline className={`display ${styles.title}`}>
            <span data-dive-title className={styles.headlineLine}>{hero.headline[0]}</span> <em data-dive-title>{hero.headline[1]}</em>
          </h1>
          <m.div data-hero-description style={handoff ? { opacity: reduced ? 1 : descriptionOpacity } : undefined}>
          <p data-intro data-dive-support className={`lede ${styles.sub}`}>
            {hero.sub}
          </p>
          </m.div>
          </div>
        </m.div>
        <m.div data-cue data-intro className={styles.cue} style={handoff ? { opacity: reduced ? 1 : cueOpacity } : undefined} aria-hidden="true">
          <div data-dive-cue className={styles.entryCue} style={{ opacity: entered ? 1 : 0 }}>
          <span>Scroll to begin the ascent</span>
          <i />
          </div>
        </m.div>
        {!handoff && <div data-flood className={styles.flood} aria-hidden="true" />}
      </div>
    </section>
  );
}
