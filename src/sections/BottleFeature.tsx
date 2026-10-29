"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { preload } from "react-dom";
import { EASE, gsap, Reveal, SplitText, useMotion, useScene } from "@/animation";
import { useMotionThreshold } from "@/animation/useMotionThreshold";
import { ProductImage } from "@/components/ProductImage";
import { WebGLBoundary } from "@/components/WebGLBoundary";
import { ClaimText } from "@/components/Pending";
import { bottleIntroduction, expressionById, type Expression } from "@/content/site";
import { useQuality } from "@/three/useQuality";
import styles from "./BottleFeature.module.css";
import { m, useMotionValue, useTransform } from "motion/react";
import { useHeroBottleHandoff } from "@/components/transition/HeroBottleHandoff";
import { BottleValley, VALLEY_BACKDROP } from "@/components/landscape/BottleValley";
import { GALLERY, GALLERY_MOVE, COLLECTION_HOLD } from "@/components/transition/bottleCollectionProgress";

const BottleStage = dynamic(() => import("@/three/BottleStage"), { ssr: false });

/**
 * Individual bottle showcase. The 3D bottle rises out of the mist and is
 * choreographed by scroll: rise → turn → glide left (label close-up) → glide
 * right (cap close-up) → ascend out. Phones and reduced motion get a settled,
 * drag-to-turn 3D bottle beside stacked copy. Without WebGL the reference
 * photograph takes the same 2D choreography.
 */
export function BottleFeature({ expression = expressionById("private-edition-i"), children }: { expression?: Expression; children?: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const handoff = useHeroBottleHandoff();
  const gallery = children ? handoff?.gallery : undefined;
  const localProgress = useMotionValue(0);
  const sceneProgress = handoff?.progress ?? localProgress;
  // Sharing the hero's stage, the showcase sets the mood once the bottle starts to rise.
  const rising = useMotionThreshold(sceneProgress, 0.06);
  const valleyOpacity = useTransform(sceneProgress, GALLERY.environment.input, [1, 0.65, 0]);
  const pointer = useTransform(sceneProgress, value => value >= 0.91 ? "none" : "auto");
  const { ready, reduced, mobile, webgl } = useMotion();
  const [gpuFailed, setGpuFailed] = useState(false);
  const failGPU = useCallback(() => setGpuFailed(true), []);
  const [canvasReady, setCanvasReady] = useState(false);
  const markCanvasReady = useCallback(() => setCanvasReady(true), []);
  const cinematic = !ready || (!reduced && !mobile);
  const use3D = ready && webgl && !gpuFailed;
  const showGPU = use3D && canvasReady;
  const mode = ready && !reduced && !mobile ? "scroll" : "static";
  const quality = useQuality();
  if (handoff) preload(expression.image.src, { as: "image", fetchPriority: "high" });

  useScene(
    ref,
    ({ motion, desktop }, root) => {
      const q = gsap.utils.selector(root);
      if (!(motion && desktop)) {
        // Phones / reduced motion: the bottle rises once as it enters, highlight sweeps on scroll.
        // (The 3D bottle settles into its own pose; this drives the photo fallback.)
        if (motion && q("[data-bottle-2d]").length) {
          gsap.fromTo(q("[data-bottle-2d]"), { yPercent: 30, autoAlpha: 0 }, {
            yPercent: 0,
            autoAlpha: 1,
            duration: handoff ? 1 : 1.8,
            ease: EASE.rise,
            scrollTrigger: handoff
              ? { trigger: root, start: "top bottom", end: "top 55%", scrub: true }
              : { trigger: root, start: "top 75%", once: true },
          });
          gsap.fromTo(q("[data-highlight]"), { x: 0 }, { x: 120, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true } });
        }
        return;
      }

      const steps = q<HTMLElement>("[data-step]");
      const splits = steps.map((s) => SplitText.create(s.querySelector("[data-step-title]"), { type: "lines,words", mask: "lines" }));

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: gallery ? `+=${320 + COLLECTION_HOLD.scrollPercent}%` : "+=320%",
          scrub: true,
          pin: q("[data-stage]")[0],
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = Math.min(1, self.progress * (gallery ? COLLECTION_HOLD.timelineEnd : 1));
            progress.current = p;
            sceneProgress.set(p);
          },
        },
      });
      // The existing cues still occupy exactly 320vh. Only the settled
      // collection occupies the extra tail, before the shared pin releases.
      tl.set({}, {}, gallery ? COLLECTION_HOLD.timelineEnd : 1);

      // Fog the bottle rises out of, and the halo of light behind it.
      tl.to(q("[data-mist]"), { yPercent: 60, autoAlpha: 0, duration: 0.3 }, 0)
        .fromTo(q("[data-halo]"), { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3 }, 0.02)
        .to(q("[data-halo]"), { xPercent: -36, duration: 0.18 }, 0.32)
        .to(q("[data-halo]"), { xPercent: 36, duration: 0.18 }, 0.58)
        .to(q("[data-halo]"), { xPercent: 0, yPercent: -60, autoAlpha: 0, duration: 0.16 }, 0.84);

      // Copy beats, timed to the bottle's moves in Bottle.tsx.
      const beat = (i: number, at: number, out: number) => {
        const s = steps[i];
        // Eased fades a few times longer than a wheel notch, so copy breathes in rather than pops.
        tl.fromTo(s, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05, ease: "sine.inOut" }, at)
          .from(splits[i].lines, { yPercent: 110, stagger: 0.015, duration: 0.08, ease: EASE.rise }, at)
          .from(s.querySelectorAll("[data-step-fade]"), { autoAlpha: 0, y: 30, stagger: 0.02, duration: 0.08 }, at + 0.03)
          .to(s, { autoAlpha: 0, y: -40, duration: 0.06, ease: "sine.inOut" }, out);
      };
      if (handoff) {
        // The original rise finishes at 0.28. Join that settled pose with the
        // introduction, then clear the space before The Nose at .44.
        const intro = steps[0];
        tl.fromTo(intro, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.045, ease: "sine.inOut" }, 0.28)
          .from(splits[0].lines, { yPercent: 110, stagger: 0.006, duration: 0.05, ease: EASE.rise }, 0.285)
          .from(intro.querySelectorAll("[data-step-fade]"), { autoAlpha: 0, y: 12, stagger: 0.012, duration: 0.045 }, 0.3)
          .to(intro, { autoAlpha: 0, y: -20, duration: 0.045, ease: "sine.inOut" }, 0.39);
      } else {
        beat(0, 0.1, 0.3);
      }
      beat(1, 0.44, 0.6);
      beat(2, 0.7, 0.86);

      // 2D bottle shares the same choreography when WebGL is unavailable.
      const flat = q("[data-bottle-2d]");
      if (flat.length) {
        if (handoff) {
          // Match the existing Three.js cubic rise, beginning below the frame.
          // Opacity settles early; visibility must not lag behind position.
          tl.fromTo(flat, { yPercent: 125 }, { yPercent: 0, duration: 0.28, ease: "power2.out" }, 0)
            .fromTo(flat, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.045 }, 0);
        } else {
          tl.fromTo(flat, { yPercent: 70, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.28 }, 0);
        }
        tl.to(flat, { x: () => -innerWidth * 0.22, duration: 0.18 }, 0.32) // glide by viewport, not bottle width
          .to(flat, { x: () => innerWidth * 0.22, duration: 0.18 }, 0.58)
          .fromTo(q("[data-highlight]"), { x: 0 }, { x: 120, duration: 1 }, 0);
      }

      if (gallery) {
        const target = () => {
          const photo = q<HTMLElement>("[data-bottle-2d]")[0];
          const frame = photo?.parentElement?.getBoundingClientRect();
          const slot = gallery.slot.current?.getBoundingClientRect();
          if (!frame || !slot) return { x: innerWidth * 0.22, y: 0, scale: 1 };
          const ratio = expression.image.width / expression.image.height;
          const baseHeight = Math.min(frame.height * 0.72, innerWidth * 0.42 / ratio);
          const baseWidth = baseHeight * ratio;
          return {
            x: slot.left + slot.width / 2 - frame.left - frame.width / 2,
            y: slot.top + slot.height / 2 - frame.top - frame.height / 2,
            scale: Math.min(slot.height * 0.84 / baseHeight, slot.width * 0.86 / baseWidth),
          };
        };
        // The same timeline owns the photo throughout: no competing setters
        // when scrubbing backward across the handoff boundary.
        tl.to(flat, { x: () => target().x, y: () => target().y, scale: () => target().scale,
          duration: GALLERY_MOVE.end - GALLERY_MOVE.start, ease: (t: number) => t * t * (3 - 2 * t) }, GALLERY_MOVE.start);
      } else {
        tl.to(flat, { x: 0, yPercent: -120, autoAlpha: 0, duration: 0.16 }, 0.84);
      }
      return () => splits.forEach((s) => s.revert());
    },
    // Keep the linked fallback and pin alive while the canvas initializes.
    // GPU readiness changes only the outer visual layers, never this timeline.
    [handoff ? null : use3D, sceneProgress, gallery],
  );

  const [s0, s1, s2] = expression.showcase;
  const intro = handoff ? bottleIntroduction : s0;
  const stackedCopy = handoff ? [bottleIntroduction, s1, s2] : expression.showcase;

  return (
    <section
      ref={ref}
      className={styles.section}
      data-mode={cinematic ? "cinematic" : "simple"}
      data-handoff={!!handoff}
      data-gallery-linked={!!gallery}
      data-soundscape={!handoff || rising ? "showcase" : undefined}
      aria-label={expression.name}
      style={{ "--stage-from": expression.stage[0], "--stage-to": expression.stage[1] } as React.CSSProperties}
    >
      <div data-stage className={styles.stage}>
        <m.div className={styles.showcase} style={{ "--bottle-pointer": pointer } as import("motion/react").MotionStyle}>
        {handoff && <m.div className={styles.visualLayer} style={{ opacity: gallery && cinematic ? valleyOpacity : 1 }}><BottleValley progress={sceneProgress} linked reduced={reduced} gallery={!!gallery} /></m.div>}
        <div data-mist className={styles.mist} aria-hidden="true" />
        <div data-halo className={styles.halo} aria-hidden="true" />

        <div data-step data-bottle-intro className={`${styles.step} ${handoff ? styles.intro : styles.center}`}>
          <p data-step-fade className="eyebrow">{intro.kicker}</p>
          <h2 data-step-title className={`display ${handoff ? styles.introTitle : styles.giant}`}>{intro.title}</h2>
          {handoff && <p data-step-fade className={styles.introBody}>{bottleIntroduction.body.text}</p>}
        </div>

        <div className={styles.object}>
          {handoff ? (
            <>
              <m.div data-bottle-photo className={styles.visualLayer} initial={false}
                animate={{ opacity: showGPU ? 0 : 1 }} transition={{ duration: showGPU ? (reduced ? 0.12 : 0.24) : 0 }}>
                <div data-bottle-2d className={styles.flat}>
                  <ProductImage expression={expression} className={styles.svg} />
                </div>
              </m.div>
              {use3D && (
                <m.div data-bottle-gpu className={styles.visualLayer} initial={false}
                  animate={{ opacity: showGPU ? 1 : 0 }} transition={{ duration: reduced ? 0.12 : 0.24 }}
                  style={{ pointerEvents: showGPU ? "auto" : "none" }}>
                  <WebGLBoundary onError={failGPU} fallback={null}>
                    <BottleStage expression={expression} backdrop={VALLEY_BACKDROP} progress={progress} quality={quality} mode={mode} idle={!reduced} className={styles.canvas} gallery={gallery} onReady={markCanvasReady} onUnavailable={failGPU} />
                  </WebGLBoundary>
                </m.div>
              )}
            </>
          ) : use3D ? (
            <WebGLBoundary onError={() => setGpuFailed(true)} fallback={<div className={styles.flat}><ProductImage expression={expression} className={styles.svg} /></div>}>
              <BottleStage expression={expression} backdrop={handoff ? VALLEY_BACKDROP : expression.stage[0]} progress={progress} quality={quality} mode={mode} idle={!reduced} className={styles.canvas} />
            </WebGLBoundary>
          ) : (
            <div data-bottle-2d className={styles.flat}>
              <ProductImage expression={expression} className={styles.svg} />
            </div>
          )}
        </div>

        <div data-step className={`${styles.step} ${styles.right}`}>
          <p data-step-fade className="eyebrow">{s1.kicker}</p>
          <h2 data-step-title className={`display ${styles.title}`}>{s1.title}</h2>
          <div data-step-fade>
            <ClaimText claim={s1.body} className={styles.body} />
          </div>
        </div>

        <div data-step className={`${styles.step} ${styles.left}`}>
          <p data-step-fade className="eyebrow">{s2.kicker}</p>
          <h2 data-step-title className={`display ${styles.title}`}>{s2.title}</h2>
          <div data-step-fade>
            <ClaimText claim={s2.body} className={styles.body} />
          </div>
        </div>
        </m.div>

      {/* Stacked copy for phones and reduced motion */}
      <Reveal className={styles.stack} stagger={0.12}>
        {stackedCopy.map((s) => (
          <div key={s.kicker} data-reveal className={styles.stackItem}>
            <p className="eyebrow">{s.kicker}</p>
            <h2 className={`display ${styles.title}`}>{s.title}</h2>
            <ClaimText claim={s.body} className={styles.body} />
          </div>
        ))}
      </Reveal>
        {children && <div data-gallery className={styles.gallery}>{children}</div>}
      </div>
    </section>
  );
}
