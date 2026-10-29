"use client";

import { useRef, useState } from "react";
import { AnimatePresence, m, useTransform } from "motion/react";
import { MOTION_EASE, useMotion } from "@/animation";
import { ClaimText } from "@/components/Pending";
import { ourStory, storyPhotos, type EmblemPartId, type Photo } from "@/content/site";
import { ChapterHeading } from "./ChapterHeading";
import { Plates, Still, useBeat, useChapter } from "./film";
import styles from "./OurStory.module.css";

/** Regional photography shown by the existing interactive explorer. */
const REFERENCE: Partial<Record<EmblemPartId, Photo>> = {
  flower: storyPhotos.rhododendron,
  monals: storyPhotos.crest,
  tails: storyPhotos.forest,
  wordmark: storyPhotos.ridge,
};


/** IV · The Natural World: the original chapter timing and explorer controls. */
export function ChapterEmblem() {
  return (
    <>
      <EmblemProgression />
      <EmblemExplorer />
    </>
  );
}

function EmblemProgression() {
  const ref = useRef<HTMLElement>(null);
  const chapter = useChapter(ref);
  const { reduced } = useMotion();
  const { emblem } = ourStory;

  const push = useTransform(chapter.inside, [0, 0.55], [1.02, 1.12]);
  const flower = useTransform(chapter.inside, [0.42, 0.56], [0, 1]);
  const flowerScale = useTransform(chapter.inside, [0.42, 1], [1.3, 1.22]);
  const shade = useTransform(chapter.inside, [0.78, 1], [0, 0.75]);
  const text = useTransform(chapter.enter, [0.5, 1], [0, 1]);
  const intro = useBeat(chapter.inside, [0, 0.82], { holdStart: true });
  const birdCaption = useBeat(chapter.inside, [0.05, 0.44]);
  const flowerCaption = useBeat(chapter.inside, [0.5, 0.86]);

  return (
    <section ref={ref} id="story-emblem" data-story-chapter="IV" className={`${styles.chapter} ${styles.emblemIntro}`} aria-labelledby="emblem-title">
      <Plates chapter={chapter} z={5}>
        <Still photo={storyPhotos.monal} near={chapter.near} position="55% 50%" className={styles.monalStill} style={reduced ? undefined : { scale: push }} />
        {/* Set to the right, clear of the chapter copy. */}
        <Still photo={storyPhotos.rhododendron} near={chapter.near} position="60% 40%" style={{ opacity: flower, x: "16%", scale: reduced ? 1.22 : flowerScale }} />
        <div className={styles.forestScrim} />
        <m.div className={styles.black} style={{ opacity: shade }} />
      </Plates>

      <m.div className={styles.stage} style={{ opacity: text }}>
        <m.div className={styles.emblemCopy} style={{ opacity: intro.opacity, y: reduced ? 0 : intro.y }}>
          <ChapterHeading heading={emblem.heading} id="emblem-title" />
          <p className={styles.body}>{emblem.body}</p>
        </m.div>
        <m.p className={styles.plateCaption} style={{ opacity: birdCaption.opacity }}>
          <em>Lophophorus impejanus</em> · the Himalayan monal
        </m.p>
        <m.p className={styles.plateCaption} style={{ opacity: flowerCaption.opacity }}>
          <em>Rhododendron arboreum</em> · Seraj, Himachal Pradesh
        </m.p>
      </m.div>
    </section>
  );
}

function EmblemExplorer() {
  const ref = useRef<HTMLElement>(null);
  const chapter = useChapter(ref);
  const { reduced, touch } = useMotion();
  const { parts } = ourStory.emblem;
  const [selected, setSelected] = useState<EmblemPartId>("flower");
  const [preview, setPreview] = useState<EmblemPartId | null>(null);
  const shown = preview ?? selected;
  const part = parts.find((p) => p.id === shown)!;
  const reference = REFERENCE[shown];
  const glow = useTransform(chapter.inside, [0, 1], [0.6, 1]);
  const duration = reduced ? 0.12 : 0.6;

  // Pointer previews on hover; touch and keyboard select directly.
  const hover = (id: EmblemPartId | null) => () => { if (!touch) setPreview(id); };

  return (
    <section ref={ref} className={`${styles.chapter} ${styles.explorer}`} aria-labelledby="explorer-title">
      <Plates chapter={chapter} z={6}>
        <Still photo={storyPhotos.monal} near={chapter.near} className={styles.forestTexture} />
        <m.div className={styles.emblemGlow} style={{ opacity: glow }} />
      </Plates>

      <div className={styles.explorerGrid}>
        <div className={styles.explorerCopy}>
          <h3 id="explorer-title" className="eyebrow">Explore the natural world</h3>
          <ul className={styles.partList} role="list">
            {parts.map((p) => (
              <li key={p.id}>
                <button type="button" className={styles.partButton} aria-pressed={selected === p.id} data-shown={shown === p.id}
                  aria-controls="emblem-part-detail" onClick={() => setSelected(p.id)}
                  onPointerEnter={hover(p.id)} onPointerLeave={hover(null)} onFocus={() => setPreview(null)}>
                  <span className={styles.partIndex}>{p.index}</span>
                  <span className={`display ${styles.partTitle}`}>{p.title}</span>
                </button>
              </li>
            ))}
          </ul>
          <div id="emblem-part-detail" className={styles.partDetail} aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <m.div key={shown} className={styles.partDetailInner}
                initial={{ opacity: 0, y: reduced ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -8 }}
                transition={{ duration: duration * 0.8, ease: MOTION_EASE.rise }}>
                {reference ? (
                  <figure className={styles.reference}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={reference.mobile ?? reference.src} alt={reference.subject} loading="lazy" decoding="async" />
                    <figcaption>{reference.subject}</figcaption>
                  </figure>
                ) : (
                  <div className={styles.referenceMark} aria-hidden="true" />
                )}
                <div>
                  <p className={styles.partDetailTitle}>{part.index} · {part.title}</p>
                  <ClaimText claim={part.body} className={styles.body} />
                </div>
              </m.div>
            </AnimatePresence>
          </div>
        </div>

        <div className={styles.emblemStage}>
          <div className={styles.emblemArt}>
            {/* Keep the existing explorer controls and crossfade natural photographs. */}
            {parts.map((p) => (
              <m.span key={p.id} className={styles.emblemLit} aria-hidden="true"
                initial={false} animate={{ opacity: shown === p.id ? 1 : 0 }} transition={{ duration, ease: MOTION_EASE.drift }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={REFERENCE[p.id]!.src} alt="" loading="lazy" style={{ objectFit: "cover", borderRadius: "2px", filter: "none" }} />
              </m.span>
            ))}
            {/* Pointer shortcuts on the artwork; the list above is the accessible control. */}
            {parts.flatMap((p) => p.regions.map((r, i) => (
              <button key={`${p.id}-${i}`} type="button" className={styles.hotspot} data-shown={shown === p.id}
                style={{ left: `${(r.cx - r.rx * 0.7) * 100}%`, top: `${(r.cy - r.ry * 0.7) * 100}%`, width: `${r.rx * 140}%`, height: `${r.ry * 140}%` }}
                onClick={() => setSelected(p.id)} onPointerEnter={hover(p.id)} onPointerLeave={hover(null)}
                aria-hidden="true" tabIndex={-1} />
            )))}
          </div>
        </div>
      </div>
    </section>
  );
}
