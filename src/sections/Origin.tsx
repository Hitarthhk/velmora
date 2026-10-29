"use client";

import { useRef } from "react";
import { m, useMotionValue, useTransform } from "motion/react";
import { EASE, gsap, SplitText, useMotion, useScene } from "@/animation";
import { useMotionThreshold } from "@/animation/useMotionThreshold";
import { ClaimText } from "@/components/Pending";
import { OriginEnvironment } from "@/components/landscape/OriginEnvironment";
import { BRIDGE, CLOSING, ORIGIN_SCROLL, originSegments, SEGMENT } from "@/components/transition/originJourney";
import { origin } from "@/content/site";
import styles from "./Origin.module.css";

const ramp = (v: number, [a, b]: readonly number[]) => Math.min(1, Math.max(0, (v - a) / (b - a)));

/** Homepage only. The separate Our Story page retains its original component.
 * The three chapters keep their 300% of pinned scroll and native mobile flow.
 * On desktop the same pin also carries the arrival out of the collection and
 * the closing dissolve into Contact (see originJourney.ts). */
export function Origin() {
  const ref = useRef<HTMLElement>(null);
  const progress = useMotionValue(0);
  const bridge = useMotionValue(0);
  const closing = useMotionValue(0);
  const { ready, reduced, mobile } = useMotion();
  const cinematic = !ready || (!reduced && !mobile);
  const second = useMotionThreshold(progress, 1 / 3);
  const third = useMotionThreshold(progress, 2 / 3);
  const current = third ? 3 : second ? 2 : 1;
  // Label and ticks arrive with the valley and leave before Contact.
  const chrome = useTransform([bridge, closing], ([b, c]: number[]) => Math.min(ramp(b, BRIDGE.chrome.input), 1 - ramp(c, CLOSING.chrome.input)));
  const copy = useTransform(closing, CLOSING.copy.input, CLOSING.copy.output);
  const scenery = useTransform(closing, CLOSING.craft.input, CLOSING.craft.output);
  // Once the valley covers the collection, clicks stay with this section.
  const veiled = useMotionThreshold(bridge, 0.45);
  const released = useMotionThreshold(closing, 0.3);

  useScene(ref, ({ motion, desktop }, root) => {
    const q = gsap.utils.selector(root);
    const chapters = q<HTMLElement>("[data-origin-chapter]");
    const setProgress = (value: number) => progress.set(value);
    if (!(motion && desktop)) {
      // Native scroll, no mobile pin or camera travel. The same normalized
      // chapter source dissolves the scenery through the existing tall chapters.
      bridge.set(1);
      closing.set(0);
      if (motion) gsap.fromTo(q("[data-origin-arrival]"), { opacity: 0.45 }, {
        opacity: 1, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "top top", scrub: true },
      });
      // Without the desktop overlap, soft edges replace the hard section seams:
      // the collection's darkness gives way to the valley, and the craft scene
      // sinks into the same night the twilight landscape rises from.
      gsap.fromTo(q("[data-origin-feather='top']"), { opacity: 1 }, {
        opacity: 0, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "top top", scrub: true },
      });
      gsap.fromTo(q("[data-origin-feather='bottom']"), { opacity: 0 }, {
        opacity: 1, ease: "none", scrollTrigger: { trigger: root, start: "bottom 160%", end: "bottom bottom", scrub: true },
      });
      const driver = gsap.to({}, { scrollTrigger: {
        trigger: root, start: "top 50%", end: "bottom 50%", scrub: true,
        onUpdate: self => setProgress(self.progress), onRefresh: self => setProgress(self.progress),
      } });
      chapters.forEach(chapter => gsap.fromTo(chapter.querySelectorAll("[data-origin-item]"),
        { autoAlpha: 0, y: motion ? 18 : 0 }, {
          autoAlpha: 1, y: 0, duration: motion ? 0.7 : 0.12, stagger: motion ? 0.07 : 0,
          scrollTrigger: { trigger: chapter, start: "top 70%", once: true },
        }));
      return () => { driver.kill(); };
    }

    const titles = chapters.map(chapter => SplitText.create(chapter.querySelector("[data-origin-title]"), { type: "lines,words", mask: "lines" }));
    const driver = { value: 0 };
    const publish = () => {
      const s = originSegments(driver.value);
      bridge.set(s.bridge);
      setProgress(s.chapters);
      closing.set(s.closing);
    };
    // One pin: bridge, then the three chapters, then the closing dissolve.
    const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: {
      trigger: root, start: "top top", end: `+=${SEGMENT.total}%`, scrub: 1, pin: true, anticipatePin: 1,
    } });
    tl.to(driver, { value: 1, duration: 1, onUpdate: publish }, 0);
    // GSAP's pin spacer inherits this section's z-index over the collection;
    // like the section, it must let clicks through to the settled collection.
    const spacer = root.parentElement?.classList.contains("pin-spacer") ? root.parentElement : null;
    if (spacer) spacer.style.pointerEvents = "none";
    // A scrubbed timeline does not render until scrolled; publish its current
    // state now so a rebuild (resize, preference change) never shows stale values.
    driver.value = tl.scrollTrigger?.progress ?? 0;
    publish();
    // Chapter cues keep their original positions within the chapter segment.
    const at = (x: number) => SEGMENT.bridge + x * SEGMENT.chapters;
    const span = (x: number) => x * SEGMENT.chapters;
    const third = 1 / chapters.length;
    chapters.forEach((chapter, index) => {
      const start = index * third + 0.02;
      const out = (index + 1) * third - 0.05;
      tl.fromTo(chapter, { autoAlpha: 0 }, { autoAlpha: 1, duration: span(0.035) }, at(start))
        .from(chapter.querySelector("[data-origin-numeral]"), { autoAlpha: 0, y: 12, duration: span(0.1) }, at(start))
        .from(titles[index].lines, { yPercent: 105, duration: span(0.1), stagger: span(0.008), ease: EASE.rise }, at(start + 0.01))
        .from(chapter.querySelector("[data-origin-body]"), { autoAlpha: 0, y: 14, duration: span(0.11) }, at(start + 0.045));
      if (index < chapters.length - 1) tl.to(chapter, { autoAlpha: 0, yPercent: -4, duration: span(0.06) }, at(out));
    });
    return () => {
      titles.forEach(title => title.revert());
      if (spacer) spacer.style.pointerEvents = "";
    };
    // The layout mode changes the section's offsets: re-measure when it flips.
  }, [progress, bridge, closing, cinematic]);

  return (
    <section
      id="origin"
      ref={ref}
      className={styles.section}
      data-origin
      data-mode={cinematic ? "cinematic" : "simple"}
      data-veiled={veiled}
      // Over the collection it takes the mood only once its valley covers it.
      data-soundscape={cinematic && !veiled ? undefined : "forest"}
      data-released={released}
      style={{ "--origin-bridge": `${ORIGIN_SCROLL.bridge}vh` } as React.CSSProperties}
      aria-labelledby="origin-title"
    >
      <div data-origin-stage className={styles.stage}>
        <div data-origin-arrival className={styles.arrival}>
          <m.div className={styles.arrival} style={{ opacity: scenery }}>
            <OriginEnvironment key={String(reduced)} progress={progress} bridge={bridge} closing={closing} reduced={reduced} />
          </m.div>
        </div>
        {!cinematic && (
          <>
            <div data-origin-feather="top" className={`${styles.feather} ${styles.featherTop}`} aria-hidden="true" />
            <div data-origin-feather="bottom" className={`${styles.feather} ${styles.featherBottom}`} aria-hidden="true" />
          </>
        )}
        <m.h2 id="origin-title" className={`eyebrow ${styles.label}`} style={{ opacity: chrome }}>{origin.intro}</m.h2>
        <m.ol className={styles.ticks} aria-label="Origin chapters" style={{ opacity: chrome }}>
          <li className={styles.progressTrack} aria-hidden="true"><m.span className={styles.progress} style={{ scaleY: progress }} /></li>
          {origin.chapters.map((chapter, index) => (
            <li key={chapter.numeral} data-origin-tick aria-current={current === index + 1 ? "step" : undefined}>
              <span className="visually-hidden">{chapter.title}: </span>{chapter.numeral}
            </li>
          ))}
        </m.ol>
      </div>
      <m.div className={styles.chapters} style={{ opacity: copy }}>
        {origin.chapters.map(chapter => (
          <article key={chapter.numeral} data-origin-chapter className={styles.chapter}>
            <span data-origin-numeral data-origin-item className={`display ${styles.numeral}`} aria-hidden="true">{chapter.numeral}</span>
            <h3 data-origin-title data-origin-item className={`display ${styles.title}`}>{chapter.title}</h3>
            <div data-origin-body data-origin-item><ClaimText claim={chapter.body} className={styles.body} /></div>
          </article>
        ))}
      </m.div>
    </section>
  );
}
