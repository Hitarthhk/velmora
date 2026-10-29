"use client";

import { useRef } from "react";
import { m, useTransform, type MotionValue } from "motion/react";
import { useMotion } from "@/animation";
import { ourStory, storyPhotos } from "@/content/site";
import { ChapterHeading } from "./ChapterHeading";
import { Plates, Still, useBeat, useChapter } from "./film";
import styles from "./OurStory.module.css";

/** Where each principle sits in the chapter, and how its words are set. */
const BEATS: { at: [number, number]; layout: "left" | "right" | "centre" | "mark" }[] = [
  { at: [0.18, 0.4], layout: "left" },
  { at: [0.4, 0.6], layout: "right" },
  { at: [0.6, 0.8], layout: "centre" },
  { at: [0.8, 1], layout: "mark" },
];

function ProgressWord({ progress, at, children }: { progress: MotionValue<number>; at: [number, number]; children: string }) {
  const opacity = useTransform(progress, (p) => (p >= at[0] && p < at[1] + (at[1] === 1 ? 1 : 0) ? 1 : 0.35));
  const scaleX = useTransform(progress, (p) => Math.min(1, Math.max(0, (p - at[0]) / (at[1] - at[0]))));
  return (
    <m.li style={{ opacity }}>
      {children}
      <m.i style={{ scaleX }} aria-hidden="true" />
    </m.li>
  );
}

/** V · The Philosophy. Four principles, each in its own light: the land at
 * last sun, copper, casks at rest, and forest twilight. */
export function ChapterPhilosophy() {
  const ref = useRef<HTMLElement>(null);
  const chapter = useChapter(ref);
  const { reduced } = useMotion();
  const { heading, principles } = ourStory.philosophy;

  const camera = useTransform(chapter.inside, [0, 1], [1.12, 1.02]);
  const craft = useTransform(chapter.inside, [0.36, 0.44], [0, 1]);
  const craftX = useTransform(chapter.inside, [0.36, 0.62], ["2%", "-2%"]);
  const patience = useTransform(chapter.inside, [0.56, 0.64], [0, 1]);
  const patienceScale = useTransform(chapter.inside, [0.56, 0.82], [1.12, 1.04]);
  const identity = useTransform(chapter.inside, [0.76, 0.86], [0, 1]);
  const markScale = useTransform(chapter.inside, [0.76, 1], [0.92, 1]);
  const text = useTransform([chapter.enter, chapter.exit], ([e, x]: number[]) => Math.min(1, Math.max(0, (e - 0.5) / 0.5)) * (1 - Math.min(1, x / 0.5)));
  const title = useBeat(chapter.inside, [0, 0.2], { holdStart: true });
  const beats = [useBeat(chapter.inside, BEATS[0].at), useBeat(chapter.inside, BEATS[1].at), useBeat(chapter.inside, BEATS[2].at), useBeat(chapter.inside, BEATS[3].at, { holdEnd: true })];

  return (
    <section ref={ref} id="story-philosophy" data-story-chapter="V" className={`${styles.chapter} ${styles.philosophy}`} aria-labelledby="philosophy-title">
      <Plates chapter={chapter} z={7}>
        <Still photo={storyPhotos.place} near={chapter.near} position="50% 60%" style={reduced ? undefined : { scale: camera }} />
        <Still photo={storyPhotos.craft} near={chapter.near} position="40% 50%" style={{ opacity: craft, ...(reduced ? {} : { x: craftX, scale: 1.06 }) }} />
        <Still photo={storyPhotos.patience} near={chapter.near} className={styles.ambered} style={{ opacity: patience, ...(reduced ? {} : { scale: patienceScale }) }} />
        <m.div className={styles.identity} style={{ opacity: identity }}>
          <Still photo={storyPhotos.twilight} near={chapter.near} style={reduced ? undefined : { scale: markScale }} />
        </m.div>
        <div className={styles.philosophyScrim} />
      </Plates>

      <m.div className={styles.stage} style={{ opacity: text }}>
        <m.div className={styles.philosophyTitle} style={{ opacity: title.opacity, y: reduced ? 0 : title.y }}>
          <ChapterHeading heading={heading} id="philosophy-title" />
        </m.div>
        {principles.map((p, i) => (
          <m.article key={p.title} className={styles.principle} data-layout={BEATS[i].layout} style={{ opacity: beats[i].opacity, y: reduced ? 0 : beats[i].y }}>
            <span className={`display ${styles.principleIndex}`} aria-hidden="true">{p.index}</span>
            <h3 className={`display ${styles.principleTitle}`}>{p.title}</h3>
            <p className={styles.principleBody}>{p.body}</p>
          </m.article>
        ))}
        <ol className={styles.principleRow} aria-hidden="true">
          {principles.map((p, i) => <ProgressWord key={p.title} progress={chapter.inside} at={BEATS[i].at}>{p.title}</ProgressWord>)}
        </ol>
      </m.div>
    </section>
  );
}
