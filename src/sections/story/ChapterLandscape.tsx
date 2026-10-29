"use client";

import { useRef } from "react";
import { m, useTransform, type MotionValue } from "motion/react";
import { useMotion } from "@/animation";
import { ourStory, storyPhotos, type Photo } from "@/content/site";
import { Plates, Still, useBeat, useChapter, type Chapter } from "./film";
import styles from "./OurStory.module.css";

/** Each word of the heading has its own scene; the climate statements are
 * set over the scenes that carry them, with the light graded warm for summer
 * and cold for winter nights. */
const SCENES: { word: string; photo: Photo; at: [number, number]; position?: string }[] = [
  { word: "Ridge,", photo: storyPhotos.ridge, at: [0, 0.25], position: "50% 70%" },
  { word: "cloud,", photo: storyPhotos.cloud, at: [0.25, 0.5] },
  { word: "forest,", photo: storyPhotos.forest, at: [0.5, 0.75] },
  { word: "snow.", photo: storyPhotos.snow, at: [0.75, 1], position: "50% 40%" },
];

function Scene({ chapter, scene, index, reduced }: { chapter: Chapter; scene: (typeof SCENES)[number]; index: number; reduced: boolean }) {
  const [a, b] = scene.at;
  const opacity = useTransform(chapter.inside, [a - 0.05, a + 0.04], index === 0 ? [1, 1] : [0, 1]);
  const scale = useTransform(chapter.inside, [Math.max(0, a - 0.05), Math.min(1, b + 0.05)], [1.1, 1.02]);
  const x = useTransform(chapter.inside, [Math.max(0, a - 0.05), Math.min(1, b + 0.05)], index % 2 ? ["-1.5%", "1.5%"] : ["1.5%", "-1.5%"]);
  return <Still photo={scene.photo} near={chapter.near} position={scene.position} style={{ opacity, ...(reduced ? {} : { scale, x }) }} />;
}

function Word({ progress, at, children }: { progress: MotionValue<number>; at: [number, number]; children: string }) {
  const opacity = useTransform(progress, (p) => (p >= at[0] - 0.02 && p < at[1] - 0.02 ? 1 : 0.32));
  return <m.span className={styles.word} style={{ opacity }}>{children}</m.span>;
}

/** III · The Landscape. Ridge, cloud, forest and snow follow one another as
 * the region's climate and ingredients are set in large type. */
export function ChapterLandscape() {
  const ref = useRef<HTMLElement>(null);
  const chapter = useChapter(ref);
  const { reduced } = useMotion();
  const { landscape } = ourStory;
  const { heading, statements } = landscape;

  const summer = useTransform(chapter.inside, [0.24, 0.32, 0.46, 0.52], [0, 0.32, 0.32, 0]);
  const winter = useTransform(chapter.inside, [0.49, 0.56, 0.72, 0.78], [0, 0.5, 0.5, 0]);
  const text = useTransform([chapter.enter, chapter.exit], ([e, x]: number[]) => Math.min(1, Math.max(0, (e - 0.5) / 0.5)) * (1 - Math.min(1, x / 0.5)));
  const beats = [
    useBeat(chapter.inside, [0.25, 0.5]),
    useBeat(chapter.inside, [0.5, 0.75]),
    useBeat(chapter.inside, [0.75, 1], { holdEnd: true }),
  ];

  return (
    <section ref={ref} id="story-landscape" data-story-chapter="III" className={`${styles.chapter} ${styles.landscape}`} aria-labelledby="landscape-title">
      <Plates chapter={chapter} z={4}>
        {SCENES.map((scene, i) => <Scene key={scene.word} chapter={chapter} scene={scene} index={i} reduced={reduced} />)}
        <m.div className={styles.summer} style={{ opacity: summer }} />
        <m.div className={styles.winter} style={{ opacity: winter }} />
        <div className={styles.landscapeScrim} />
      </Plates>

      <m.div className={`${styles.stage} ${styles.landscapeStage}`} style={{ opacity: text }}>
        <header className={`${styles.heading} ${styles.landscapeHeading}`}>
          <p className={styles.kicker}>
            <span className={styles.numeral}>{heading.numeral}</span>
            <span className={styles.rule} aria-hidden="true" />
            <span>{heading.label}</span>
          </p>
          {/* The supplied line, each word lit while its scene is on screen. */}
          <h2 id="landscape-title" className={`display ${styles.headline}`}>
            <Word progress={chapter.inside} at={SCENES[0].at}>{SCENES[0].word}</Word>{" "}
            <Word progress={chapter.inside} at={SCENES[1].at}>{SCENES[1].word}</Word>{" "}
            <em>
              <Word progress={chapter.inside} at={SCENES[2].at}>{SCENES[2].word}</Word>{" "}
              <Word progress={chapter.inside} at={SCENES[3].at}>{SCENES[3].word}</Word>
            </em>
          </h2>
        </header>
        <div className={styles.statements}>
          {statements.map((s, i) => (
            <m.div key={s.caption} className={styles.statement2} style={{ opacity: beats[i].opacity, y: reduced ? 0 : beats[i].y }}>
              <p className={`display ${styles.figure}`} aria-hidden="true">{s.figure}</p>
              <p className={styles.figureCaption} aria-hidden="true">{s.caption}</p>
              <p className={styles.body}>{s.text}</p>
            </m.div>
          ))}
        </div>
        <p className={styles.credit}>Ridge, cloud, forest and snow of Himachal Pradesh</p>
      </m.div>
    </section>
  );
}
