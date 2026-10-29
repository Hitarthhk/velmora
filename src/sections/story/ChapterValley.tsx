"use client";

import { useRef } from "react";
import { m, useTransform } from "motion/react";
import { useMotion } from "@/animation";
import { MIST } from "@/components/landscape/HeroPhoto";
import { ourStory, storyPhotos } from "@/content/site";
import { ChapterHeading } from "./ChapterHeading";
import { Plates, Still, useBeat, useChapter } from "./film";
import styles from "./OurStory.module.css";

/** I · The Valley. The opening's mist lifts and the camera draws back until
 * the Shivaliks are seen climbing toward the snow. The light then sinks, as
 * if a door were closing, toward the dark interior of The Beginning. */
export function ChapterValley() {
  const ref = useRef<HTMLElement>(null);
  const chapter = useChapter(ref);
  const { reduced } = useMotion();
  const { valley } = ourStory;

  const scale = useTransform(chapter.inside, [0, 1], [1.16, 1.03]);
  const y = useTransform(chapter.inside, [0, 1], ["3%", "-2%"]);
  const haze = useTransform([chapter.enter, chapter.inside], ([e, p]: number[]) => (1 - p / 0.35) * 0.85 * Math.min(1, e * 1.4));
  const dusk = useTransform(chapter.exit, [0.2, 0.75], [0, 0.7]);
  const text = useTransform([chapter.enter, chapter.exit], ([e, x]: number[]) => Math.min(1, Math.max(0, (e - 0.55) / 0.45)) * (1 - Math.min(1, x / 0.35)));
  const first = useBeat(chapter.inside, [0, 0.52], { holdStart: true });
  const second = useBeat(chapter.inside, [0.48, 1], { holdEnd: true });

  return (
    <section ref={ref} id="story-valley" data-story-chapter="I" className={`${styles.chapter} ${styles.valley}`} aria-labelledby="valley-title">
      <Plates chapter={chapter} z={2}>
        <Still photo={storyPhotos.valley} near={chapter.near} style={reduced ? undefined : { scale, y }} position="50% 45%" />
        <div className={styles.valleyScrim} />
        <m.div className={styles.haze} style={{ opacity: haze }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MIST[1]} alt="" decoding="async" />
        </m.div>
        <m.div className={styles.dusk} style={{ opacity: dusk }} />
      </Plates>

      <div className={styles.stage}>
        <m.div className={styles.valleyCopy} style={{ opacity: text }}>
          <ChapterHeading heading={valley.heading} id="valley-title" />
          <div className={styles.beats}>
            <m.p className={styles.body} style={{ opacity: first.opacity, y: reduced ? 0 : first.y }}>{valley.body[0]}</m.p>
            <m.p className={styles.body} style={{ opacity: second.opacity, y: reduced ? 0 : second.y }}>{valley.body[1]}</m.p>
          </div>
        </m.div>
        <p className={styles.credit}>{storyPhotos.valley.subject}</p>
      </div>
    </section>
  );
}
