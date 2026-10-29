"use client";

import { useRef } from "react";
import { m, useTransform } from "motion/react";
import { useMotion } from "@/animation";
import { ourStory, storyPhotos } from "@/content/site";
import { ChapterHeading } from "./ChapterHeading";
import { Plates, Still, useBeat, useChapter } from "./film";
import styles from "./OurStory.module.css";

/** II · The Beginning. Out of the valley's dusk, a band of gold light opens
 * on a dark interior of stone; the two founding statements are set in it like
 * title cards, the second as the room warms to oak and bronze. */
export function ChapterBeginning() {
  const ref = useRef<HTMLElement>(null);
  const chapter = useChapter(ref);
  const { reduced } = useMotion();
  const { beginning } = ourStory;

  // The layer arrives as darkness first, then opens from a horizontal seam.
  const presence = useTransform(chapter.enter, [0, 0.12], [0, 1]);
  const open = useTransform(chapter.enter, [0.12, 0.75], [0, 1]);
  const clip = useTransform(open, (t) => `inset(${(50 - 50 * t).toFixed(2)}% 0 ${(50 - 50 * t).toFixed(2)}% 0)`);
  const seam = useTransform(open, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  const seamTop = useTransform(open, (t) => `${50 - 50 * t}%`);
  const seamBottom = useTransform(open, (t) => `${50 + 50 * t}%`);
  const pan = useTransform(chapter.inside, [0, 1], ["1.5%", "-2%"]);
  const oak = useTransform(chapter.inside, [0.58, 0.72], [0, 1]);
  const sweep = useTransform(chapter.inside, [0, 1], ["-30%", "40%"]);
  const text = useTransform(chapter.exit, [0, 0.5], [1, 0]);

  const intro = useBeat(chapter.inside, [0, 0.34], { holdStart: true });
  const first = useBeat(chapter.inside, [0.34, 0.66]);
  const second = useBeat(chapter.inside, [0.66, 1], { holdEnd: true });
  const lift = (beat: ReturnType<typeof useBeat>) => ({ opacity: beat.opacity, y: reduced ? 0 : beat.y });

  return (
    <section ref={ref} id="story-beginning" data-story-chapter="II" className={`${styles.chapter} ${styles.beginning}`} aria-labelledby="beginning-title">
      <Plates chapter={chapter} z={3} opacity={presence}>
        <div className={styles.black} />
        <m.div className={styles.aperture} style={{ clipPath: reduced ? undefined : clip }}>
          <Still photo={storyPhotos.stone} near={chapter.near} style={reduced ? undefined : { x: pan, scale: 1.08 }} />
          <Still photo={storyPhotos.oak} near={chapter.near} style={{ opacity: oak, ...(reduced ? {} : { x: pan, scale: 1.08 }) }} />
          <m.div className={styles.goldSweep} style={{ x: reduced ? undefined : sweep }} />
          <div className={styles.interiorScrim} />
        </m.div>
        {!reduced && (
          <>
            <m.span className={styles.seam} style={{ top: seamTop, opacity: seam }} />
            <m.span className={styles.seam} style={{ top: seamBottom, opacity: seam }} />
          </>
        )}
      </Plates>

      <m.div className={styles.stage} style={{ opacity: text }}>
        <m.div className={styles.beginningIntro} style={lift(intro)}>
          <ChapterHeading heading={beginning.heading} id="beginning-title" />
          <div className={styles.columns}>
            {beginning.body.map((p) => <p key={p.slice(0, 20)} className={styles.body}>{p}</p>)}
          </div>
        </m.div>
        {beginning.quotes.map((quote, i) => (
          <m.figure key={quote.name} className={styles.statement} style={lift(i === 0 ? first : second)}>
            <blockquote className={`display ${styles.quote}`}>
              {quote.text}
            </blockquote>
            <figcaption className={styles.attribution}>
              <span className={styles.attrName}>{quote.name}</span>
              <span className={styles.attrRole}>{quote.role}</span>
            </figcaption>
          </m.figure>
        ))}
      </m.div>
    </section>
  );
}
