"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { EASE, gsap, useMotion, useScene } from "@/animation";
import { Button } from "@/components/Button";
import { ProductImage } from "@/components/ProductImage";
import { WebGLBoundary } from "@/components/WebGLBoundary";
import { collection, type Expression, type ExpressionId } from "@/content/site";
import { useDragRotate, type DragState } from "@/three/useDragRotate";
import { useQuality } from "@/three/useQuality";
import { cancelIdle, whenIdle } from "@/three/Precompile";
import { m, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { useHeroBottleHandoff } from "@/components/transition/HeroBottleHandoff";
import { useMotionThreshold } from "@/animation/useMotionThreshold";
import { useWhiskyWorld } from "@/components/transition/useWhiskyWorld";
import { CollectionEnvironment } from "@/components/landscape/CollectionEnvironment";
import { GALLERY } from "@/components/transition/bottleCollectionProgress";
import styles from "./Collection.module.css";

const CollectionStage = dynamic(() => import("@/three/CollectionStage"), { ssr: false });
type Slots = RefObject<Partial<Record<ExpressionId, HTMLElement | null>>>;
type Drags = RefObject<Partial<Record<ExpressionId, DragState>>>;

/**
 * Two-bottle presentation. The pair of 3D bottles stands behind their cards
 * next to a details panel; selecting one re-tints the room, brings it forward
 * into the light and re-sets the details in type. Drag a card to turn its
 * bottle. With two expressions there is no horizontal overflow, so the
 * section scrolls naturally instead of pinning a track. Without WebGL the
 * reference photographs stand in the cards.
 */
export function Collection({ headingLevel = 2, showCta = true }: { headingLevel?: 1 | 2; showCta?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const details = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [shift, setShift] = useState(0);
  const [prepared, setPrepared] = useState(false);
  const markPrepared = useCallback(() => setPrepared(true), []);
  const { ready, reduced, mobile, webgl } = useMotion();
  const world = useWhiskyWorld(active, reduced, prepared);
  const cinematic = !ready || (!reduced && !mobile);
  const [gpuFailed, setGpuFailed] = useState(false);
  const failGPU = useCallback(() => setGpuFailed(true), []);
  const use3D = ready && webgl && !gpuFailed;
  const handoff = useHeroBottleHandoff();
  const linked = !!handoff && cinematic;
  const local = useMotionValue(1);
  const p = handoff?.progress ?? local;
  const presentation = useMotionValue(linked ? p.get() : 1);
  const environment = useTransform(presentation, GALLERY.environment.input, GALLERY.environment.output);
  const arrival = useTransform(presentation, GALLERY.details.input, GALLERY.details.output);
  const copy = useTransform(presentation, GALLERY.description.input, GALLERY.description.output);
  const controls = useTransform(presentation, GALLERY.controls.input, GALLERY.controls.output);
  const second = useTransform(presentation, GALLERY.second.input, GALLERY.second.output);
  const secondY = useTransform(presentation, GALLERY.second.input, [18, 0]);
  const detailY = useTransform(presentation, GALLERY.details.input, [14, 0]);
  const meta = useTransform(presentation, GALLERY.meta.input, GALLERY.meta.output);
  useEffect(() => {
    // Wait for the derived values and m wrappers to subscribe before publishing
    // the responsive final state (initial HTML uses the desktop presentation).
    const sync = () => presentation.set(linked ? p.get() : 1);
    const frame = requestAnimationFrame(sync);
    const unsubscribe = linked ? p.on("change", value => presentation.set(value)) : undefined;
    return () => { cancelAnimationFrame(frame); unsubscribe?.(); };
  }, [linked, p, presentation]);
  const settled = useMotionThreshold(p, 0.995);
  const galleryNear = useMotionThreshold(p, 0.82, true);
  // Create the canvas in idle time (usually while the age gate is open), so
  // its shaders compile in the background instead of mid-scroll.
  const [warm, setWarm] = useState(false);
  useEffect(() => {
    if (!linked) return;
    const id = whenIdle(() => setWarm(true), 6000);
    return () => cancelIdle(id);
  }, [linked]);
  const galleryVisible = useMotionThreshold(p, 0.9);
  const [modelReady, setModelReady] = useState(false);
  const onModelReady = useCallback(() => setModelReady(true), []);
  useEffect(() => { setModelReady(false); }, [linked]);
  const quality = useQuality();
  const slots: Slots = useRef({});
  const drags: Drags = useRef({});
  const exp = collection.expressions[active];
  const Heading = headingLevel === 1 ? "h1" : "h2";

  useMotionValueEvent(world, "change", value => { if (handoff) handoff.gallery.world.current = value; });
  const select = (index: number) => {
    if (index === active) return;
    setActive(index);
    setShift(value => value + 1);
  };

  // Arrival: the pair rises into place, then drifts gently with scroll for depth.
  useScene(ref, ({ motion }, root) => {
    if (!motion || linked) return;
    const q = gsap.utils.selector(root);
    const stage = q("[data-collection-stage]")[0];
    gsap.fromTo(q("[data-card-item]"), { yPercent: 14, autoAlpha: 0 }, {
      yPercent: 0,
      autoAlpha: 1,
      stagger: 0.14,
      duration: 1.4,
      ease: EASE.rise,
      scrollTrigger: { trigger: stage, start: "top 70%", once: true },
    });
    q<HTMLElement>("[data-card-bottle]").forEach((el, i) =>
      gsap.fromTo(el, { yPercent: 5 + i * 3 }, { yPercent: -5, ease: "none", scrollTrigger: { trigger: stage, start: "top bottom", end: "bottom top", scrub: true } }),
    );
  }, [linked]);

  useEffect(() => {
    if (!handoff) return;
    handoff.gallery.active.current = active === 0;
    handoff.gallery.environment.current = exp.id;
  }, [active, handoff, exp.id]);

  return (
    <section ref={ref} className={styles.section} data-mode={cinematic ? "cinematic" : "simple"} data-embedded={linked} data-linked={!!handoff} inert={linked && !settled}
      // Embedded in the showcase's stage: it sets the mood only once visible.
      data-soundscape={!linked || galleryVisible ? "collection" : undefined} aria-labelledby="collection-title">
      <CollectionEnvironment active={exp.id} opacity={environment} reduced={reduced} world={world} shift={shift} onPrepared={markPrepared} />
      <div data-collection-stage className={styles.stage}>
        <m.div ref={details} data-collection-details className={styles.details} style={{ opacity: arrival, y: detailY }}>
          <p className="eyebrow">{collection.intro}</p>
          <Heading id="collection-title" className="visually-hidden">
            {collection.heading}
          </Heading>
          <m.div key={exp.id} className={styles.selection} data-product-selection
            initial={{ opacity: 0.65, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.65, ease: [0.16, 1, 0.3, 1] }}>
          <h3 data-name className={`display ${styles.name}`}>
            {exp.name}
          </h3>
          <m.div className={styles.copy} style={{ opacity: copy }}>
          <m.p data-detail className={styles.descriptor} initial={{ opacity: 0.7, y: reduced ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0.12 : 0.65, delay: reduced ? 0 : 0.05 }}>
            {exp.descriptor}
          </m.p>
          <dl data-detail className={styles.notes}>
            {(["nose", "palate", "finish"] as const).map((k) => (
              <m.div key={k} initial={{ opacity: 0.7, y: reduced ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0.12 : 0.65, delay: reduced ? 0 : 0.09 + ["nose", "palate", "finish"].indexOf(k) * 0.05 }}>
                <dt>{k}</dt>
                <dd>{exp.notes[k]}</dd>
              </m.div>
            ))}
          </dl>
          </m.div>
          {showCta && (
            <m.div data-collection-controls style={{ opacity: controls }}>
              <m.div data-detail className={styles.ctas} initial={{ opacity: 0.75 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0.12 : 0.65, delay: reduced ? 0 : 0.22 }}>
              <Button href="/whisky" variant="solid">Discover</Button>
              <Button href="/contact">Enquire</Button>
              </m.div>
            </m.div>
          )}
          </m.div>
          <p className="visually-hidden" aria-live="polite">
            {exp.name} selected
          </p>
        </m.div>

        <div className={styles.pair}>
          {use3D && (!linked || galleryNear || warm) && (
            <m.div className={styles.models} style={{ opacity: second }}>
            <WebGLBoundary onError={failGPU} fallback={null}>
              <CollectionStage key={String(linked)} omitFirst={linked} rendering={!linked || galleryVisible} world={world} onReady={onModelReady} onUnavailable={failGPU} expressions={collection.expressions} active={active} slots={slots} drags={drags} quality={quality} idle={!reduced} className={`${styles.models} ${modelReady ? styles.modelsReady : ""}`} />
            </WebGLBoundary>
            </m.div>
          )}
          <ul data-track className={styles.track} aria-label="Expressions">
            {collection.expressions.map((e, i) => (
              <li key={e.id} data-card-item className={styles.cardItem}>
                <m.div style={{ opacity: i === 1 ? second : meta, y: i === 1 ? secondY : 0 }}>
                <Card expression={e} active={i === active} onSelect={() => select(i)} use3D={use3D && modelReady} drag3D={use3D} shared={linked && i === 0 ? handoff!.gallery : undefined} metaOpacity={meta} reduced={reduced} slots={slots} drags={drags} />
                </m.div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Card({ expression, active, onSelect, use3D, drag3D, shared, metaOpacity, reduced: reduceWorld, slots, drags }: { expression: Expression; active: boolean; onSelect: () => void; use3D: boolean; drag3D: boolean; shared?: NonNullable<ReturnType<typeof useHeroBottleHandoff>>["gallery"]; metaOpacity?: import("motion/react").MotionValue<number>; reduced: boolean; slots: Slots; drags: Drags }) {
  const button = useRef<HTMLButtonElement>(null);
  const tilt = useRef<HTMLSpanElement>(null);
  const { touch, reduced } = useMotion();
  const drag = useDragRotate(button, drag3D);

  useEffect(() => {
    const d = drags.current;
    d[expression.id] = drag.current;
    if (shared) shared.drag.current = drag.current;
    return () => { delete d[expression.id]; if (shared) shared.drag.current = null; };
  }, [drag, drags, expression.id, shared]);

  // Photo fallback only: pointer-driven tilt and sheen.
  const onMove = (e: React.PointerEvent) => {
    if (drag3D || touch || reduced || !tilt.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    gsap.to(tilt.current, { rotateY: nx * 28, rotateX: 4, duration: 0.8, ease: "power3" });
    gsap.to(tilt.current.querySelector("[data-highlight]"), { x: 60 + nx * 90, duration: 0.8, ease: "power3" });
  };
  const onLeave = () => tilt.current && gsap.to(tilt.current, { rotateY: 0, rotateX: 0, duration: 1.2, ease: "elastic.out(1,0.5)" });

  return (
    <button
      ref={button}
      className={styles.card}
      data-active={active}
      aria-pressed={active}
      onClick={event => (event.detail === 0 || !drag.current.moved) && onSelect()}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      data-cursor={use3D ? "Drag" : active ? "Selected" : "Select"}
    >
      <span className={styles.cardStage} data-card-bottle data-shared-bottle={!!shared} ref={(el) => { slots.current[expression.id] = el; if (shared) shared.slot.current = el; }}>
        {!shared && (
          <span ref={tilt} className={styles.tilt} style={{ opacity: use3D ? 0 : 1, transitionDuration: use3D ? "0.25s" : "0s" }}>
            <m.span className={styles.photoPose} initial={false} animate={{ scale: reduceWorld ? 1 : active ? 1 : 0.95, y: reduceWorld ? 0 : active ? 0 : 4 }} transition={{ duration: reduceWorld ? 0.12 : 1.05, ease: [0.45, 0, 0.25, 1] }}><ProductImage expression={expression} className={styles.cardBottle} /></m.span>
          </span>
        )}
      </span>
      <m.span className={styles.cardMeta} style={{ opacity: metaOpacity ?? 1 }}>
        <m.span className={styles.selectionMark} initial={false} animate={{ opacity: active ? 1 : 0, scaleX: active ? 1 : 0.2 }} transition={{ duration: reduceWorld ? 0.12 : 0.65 }} aria-hidden="true" />
        <span className={`display ${styles.cardName}`}>{expression.name}</span>
        <span className={styles.cardSub}>{expression.descriptor}</span>
      </m.span>
    </button>
  );
}
