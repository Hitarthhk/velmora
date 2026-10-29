"use client";

import { useCallback, useRef, useState } from "react";
import { EASE, gsap, liquidClip, SplitReveal, SplitText, useMotion, useScene } from "@/animation";
import { Hotspot } from "@/components/craft/Hotspot";
import { MediaPlate } from "@/components/craft/MediaPlate";
import { craft } from "@/content/site";
import styles from "@/components/craft/Craft.module.css";

/**
 * Three cinematic close-ups. Each new scene floods in over the last with a
 * liquid edge while the camera pushes slowly into the plate.
 */
export function Craft({ headingLevel = 2 }: { headingLevel?: 1 | 2 }) {
  const ref = useRef<HTMLElement>(null);
  const { ready, reduced, mobile } = useMotion();
  const cinematic = !ready || (!reduced && !mobile);
  const [openSpot, setOpenSpot] = useState<string | null>(null);
  const toggle = useCallback((id: string | null) => setOpenSpot(id), []);

  useScene(ref, ({ motion, desktop }, root) => {
    const q = gsap.utils.selector(root);
    const scenes = q<HTMLElement>("[data-scene]");
    const clips = scenes.map((scene) => scene.style.clipPath);
    const restoreClips = () => scenes.forEach((scene, i) => { scene.style.clipPath = clips[i]; });

    if (!motion) return;

    if (!desktop) {
      // Phones: each scene pours in as it enters the viewport.
      scenes.forEach((scene, i) => {
        const proxy = { v: 0 };
        scene.style.clipPath = liquidClip(0, { phase: i });
        gsap.to(proxy, {
          v: 1,
          ease: "none",
          onUpdate: () => {
            scene.style.clipPath = liquidClip(proxy.v, { phase: i, amplitude: 8 });
          },
          scrollTrigger: { trigger: scene, start: "top bottom", end: "top 25%", scrub: 0.4 },
        });
        gsap.fromTo(scene.querySelector("[data-plate]"), { scale: 1.2 }, {
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: scene, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
      return restoreClips;
    }

    const titles = scenes.map((s) => SplitText.create(s.querySelector("[data-scene-title]"), { type: "chars,words", mask: "chars" }));
    const n = scenes.length;
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: q("[data-stage]")[0],
        start: "top top",
        end: `+=${n * 100}%`,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        onUpdate: () => setOpenSpot(null),
      },
    });
    tl.set({}, {}, n);

    scenes.forEach((scene, i) => {
      const plate = scene.querySelector("[data-plate]");
      // Slow camera push + lateral drift across this scene's window.
      tl.fromTo(plate, { scale: 1.18, xPercent: i % 2 ? 3 : -3 }, { scale: 1.02, xPercent: i % 2 ? -3 : 3, duration: i === 0 ? n * 0.4 + 0.6 : 1.6 }, Math.max(0, i - 0.6));

      if (i > 0) {
        const proxy = { v: 0 };
        scene.style.clipPath = liquidClip(0, { phase: i * 1.7 });
        tl.to(proxy, { v: 1, duration: 0.6, onUpdate: () => void (scene.style.clipPath = liquidClip(proxy.v, { phase: i * 1.7, amplitude: 7 })) }, i - 0.6);
      }
      const fades = scene.querySelectorAll("[data-scene-fade]");
      const spots = scene.querySelectorAll("[data-hotspot-wrap] > *");
      if (i === 0) {
        // The first scene is already on screen when the pin starts — reveal it on arrival instead.
        gsap
          .timeline({ scrollTrigger: { trigger: scene, start: "top 55%", once: true } })
          .from(titles[0].chars, { yPercent: 120, stagger: 0.03, duration: 1.4 })
          .from(fades, { autoAlpha: 0, y: 24, stagger: 0.1, duration: 1.2 }, 0.3)
          .from(spots, { autoAlpha: 0, scale: 0.4, stagger: 0.15, duration: 0.8, ease: "back.out(2)" }, 0.6);
        return;
      }
      tl.from(titles[i].chars, { yPercent: 120, stagger: 0.012, duration: 0.3, ease: EASE.rise }, i - 0.25)
        .from(fades, { autoAlpha: 0, y: 24, stagger: 0.05, duration: 0.25 }, i - 0.15)
        .from(spots, { autoAlpha: 0, scale: 0.4, stagger: 0.08, duration: 0.2, ease: "back.out(2)" }, i - 0.05);
    });

    return () => {
      restoreClips();
      titles.forEach((t) => t.revert());
    };
  });

  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <section ref={ref} className={styles.section} data-mode={cinematic ? "cinematic" : "simple"} aria-labelledby="craft-title">
      <header className={styles.header}>
        <p className="eyebrow">{craft.intro}</p>
        <Heading id="craft-title" className={`display ${styles.heading}`}>
          <SplitReveal as="span" type="words">{craft.heading}</SplitReveal>
        </Heading>
        <SplitReveal className="lede" delay={0.2}>
          {craft.lede}
        </SplitReveal>
      </header>

      <div data-stage className={styles.stage}>
        {craft.scenes.map((scene, i) => (
          <article key={scene.id} data-scene className={styles.scene} style={{ zIndex: i + 1 }} aria-labelledby={`scene-${scene.id}`}>
            <MediaPlate scene={scene} />
            <div className={styles.sceneShade} aria-hidden="true" />
            <div data-hotspot-wrap className={styles.hotspots}>
              {scene.hotspots.map((h) => (
                <Hotspot key={h.id} spot={h} open={openSpot === h.id} onToggle={toggle} />
              ))}
            </div>
            <div className={styles.sceneCopy}>
              <span data-scene-fade className={styles.index}>
                {scene.index} / 0{craft.scenes.length}
              </span>
              <h3 id={`scene-${scene.id}`} data-scene-title className={`display ${styles.sceneTitle}`}>
                {scene.title}
              </h3>
              <p data-scene-fade className="lede">
                {scene.lede}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
