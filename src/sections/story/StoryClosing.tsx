"use client";

import { useRef } from "react";
import { m, useTransform } from "motion/react";
import { useMotion } from "@/animation";
import { Button } from "@/components/Button";
import { ourStory, storyPhotos, type Photo } from "@/content/site";
import { Plates, Still, useChapter } from "./film";
import styles from "./OurStory.module.css";

const credited = (Object.values(storyPhotos) as Photo[]).filter((p) => !!p.author);

/** Closing: the gold of the emblem becomes the last light through the deodars;
 * the camera settles, the line is drawn along the horizon, and night falls
 * into the footer. */
export function StoryClosing() {
  const ref = useRef<HTMLElement>(null);
  const chapter = useChapter(ref);
  const { reduced } = useMotion();
  const { closing } = ourStory;

  const settle = useTransform(chapter.enter, [0, 1], [1.16, 1.03]);
  const ember = useTransform(chapter.enter, [0, 0.7], [0.7, 0]);
  const horizon = useTransform(chapter.enter, [0.55, 1], [0, 1]);
  const copy = useTransform(chapter.enter, [0.6, 1], [0, 1]);
  const copyY = useTransform(chapter.enter, [0.6, 1], [26, 0]);
  const night = useTransform(chapter.inside, [0.35, 1], [0, 0.82]);

  return (
    <section ref={ref} className={`${styles.chapter} ${styles.closing}`} data-story-closing aria-labelledby="closing-title">
      <Plates chapter={chapter} z={8}>
        <Still photo={storyPhotos.twilight} near={chapter.near} position="50% 60%" style={reduced ? undefined : { scale: settle }} />
        <m.div className={styles.ember} style={{ opacity: ember }} />
        <div className={styles.closingScrim} />
        <m.div className={styles.night} style={{ opacity: night }} />
        <div className={styles.floor} />
      </Plates>

      <div className={styles.stage}>
        <m.div className={styles.closingCopy} style={{ opacity: copy, y: reduced ? 0 : copyY }}>
          <p className="eyebrow">{closing.eyebrow}</p>
          <h2 id="closing-title" className={`display ${styles.closingTitle}`}>{closing.title}</h2>
          <m.span className={styles.horizonLine} style={{ scaleX: horizon }} aria-hidden="true" />
          <div className={styles.closingCtas}>
            <Button href="/whisky" variant="solid" cursor="Explore">Discover Our Whisky</Button>
            <Button href="/craft">Explore Our Craft</Button>
          </div>
          <details className={styles.credits}>
            <summary>Photography</summary>
            <ul>
              {credited.map((p) => (
                <li key={p.src}>
                  {p.subject} — <a href={p.source} target="_blank" rel="noreferrer">{p.author}</a>, {p.licenseUrl ? <a href={p.licenseUrl} target="_blank" rel="noreferrer">{p.license}</a> : p.license}
                </li>
              ))}
              <li>Stone and oak interiors are illustrative. Still and cask images are conceptual and do not show a specific distillery.</li>
            </ul>
          </details>
        </m.div>
      </div>
    </section>
  );
}
