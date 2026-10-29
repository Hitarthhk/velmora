"use client";

import { useRef } from "react";
import { m, useTransform } from "motion/react";
import { MOTION_EASE, useMotion } from "@/animation";
import { useEntered } from "@/components/AgeGate";
import { MIST } from "@/components/landscape/HeroPhoto";
import { ourStory, storyPhotos } from "@/content/site";
import { Plates, Still, useChapter } from "./film";
import { STORY_CHAPTERS } from "./chapters";
import styles from "./OurStory.module.css";

/** Opening: the hills around Solan in morning haze. The camera eases in, the
 * title lifts away and valley mist rises into Chapter I. */
export function StoryOpening() {
  const ref = useRef<HTMLElement>(null);
  const chapter = useChapter(ref, true);
  const { reduced } = useMotion();
  const entered = useEntered();
  const { opening } = ourStory;

  const scale = useTransform(chapter.inside, [0, 1], [1.04, 1.14]);
  const y = useTransform(chapter.inside, [0, 1], ["0%", "-3%"]);
  const morning = useTransform(chapter.inside, [0, 0.7], [0.6, 0.15]);
  const mist = useTransform(chapter.inside, [0.4, 1], [0, 0.92]);
  const mistY = useTransform(chapter.inside, [0.4, 1], ["40%", "0%"]);
  const copy = useTransform(chapter.inside, [0.22, 0.6], [1, 0]);
  const copyY = useTransform(chapter.inside, [0.22, 0.6], [0, -70]);

  return (
    <section ref={ref} className={`${styles.chapter} ${styles.opening}`} aria-labelledby="story-title">
      <Plates chapter={chapter} z={1}>
        <Still photo={storyPhotos.opening} near priority style={reduced ? undefined : { scale, y }} position="50% 70%" />
        <m.div className={styles.morning} style={{ opacity: morning }} />
        <div className={styles.openingScrim} />
        <m.div className={styles.mistRise} style={{ opacity: mist, y: reduced ? undefined : mistY }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MIST[0]} alt="" decoding="async" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MIST[1]} alt="" decoding="async" />
        </m.div>
      </Plates>

      <div className={styles.stage}>
        <m.div className={styles.openingCopy} style={{ opacity: copy, y: reduced ? 0 : copyY }}>
          <m.div initial={{ opacity: 0, y: 26 }} animate={entered ? { opacity: 1, y: 0 } : { opacity: 0, y: 26 }}
            transition={{ duration: reduced ? 0.2 : 1.5, ease: MOTION_EASE.rise, delay: reduced ? 0 : 0.25 }}>
            <p className="eyebrow">{opening.eyebrow}</p>
            <h1 id="story-title" className={`display ${styles.openingTitle}`}>{opening.title}</h1>
            <p className={styles.openingLede}>{opening.lede}</p>
          </m.div>
        </m.div>
        <m.nav className={styles.index} aria-label="Chapters" style={{ opacity: copy }}
          initial={{ opacity: 0 }} animate={{ opacity: entered ? 1 : 0 }} transition={{ duration: 1.2, delay: reduced ? 0 : 0.9 }}>
          <ol>
            {STORY_CHAPTERS.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`}><span>{c.numeral}</span>{c.label}</a>
              </li>
            ))}
          </ol>
        </m.nav>
        <m.p className={styles.cue} style={{ opacity: copy }} aria-hidden="true">
          <span>Scroll to enter the valley</span><i />
        </m.p>
      </div>
    </section>
  );
}
