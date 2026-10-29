"use client";

import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { m, useMotionValue, useTransform, type MotionStyle, type MotionValue } from "motion/react";
import { gsap, useScene } from "@/animation";
import type { Photo } from "@/content/site";
import styles from "./OurStory.module.css";

const ScreenContext = createContext<HTMLElement | null>(null);

/**
 * Our Story is one film. A single sticky "screen" sits behind every chapter
 * and each chapter renders its imagery into it, so scenes dissolve into one
 * another instead of meeting at section edges. The text sections scroll (or
 * hold) above it. The track spans the film only, so the screen can never
 * cover the footer.
 */
export function Film({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<HTMLDivElement | null>(null);
  return (
    <div className={styles.film} data-story-film data-soundscape="forest">
      <div className={styles.track} aria-hidden="true">
        <div ref={setScreen} className={styles.screen} />
      </div>
      <ScreenContext.Provider value={screen}>{children}</ScreenContext.Provider>
    </div>
  );
}

export type Chapter = {
  /** 0→1 as the section rises from the bottom of the viewport to 30% from the top. */
  enter: MotionValue<number>;
  /** 0→1 from the section's top meeting the top of the viewport to its bottom meeting the bottom. */
  inside: MotionValue<number>;
  /** 0→1 while the next section rises over this one (mirrors its `enter`). */
  exit: MotionValue<number>;
  /** True once the section is within reach: imagery loads only then. */
  near: boolean;
};

/** Scroll progress for one chapter, published as Motion values. All of it is
 * scrubbed by scroll, so every scene plays backwards exactly. */
export function useChapter(ref: RefObject<HTMLElement | null>, eager = false): Chapter {
  const enter = useMotionValue(eager ? 1 : 0);
  const inside = useMotionValue(0);
  const exit = useMotionValue(0);
  const [near, setNear] = useState(eager);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setNear(true);
      io.disconnect();
    }, { rootMargin: "150% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, near]);

  useScene(ref, ({ motion }, root) => {
    const scrub = motion ? 0.5 : true;
    const follow = (value: MotionValue<number>, start: string, end: string) => gsap.to({}, {
      scrollTrigger: { trigger: root, start, end, scrub, onUpdate: (s) => value.set(s.progress), onRefresh: (s) => value.set(s.progress) },
    });
    const tweens = [
      follow(enter, "top bottom", "top 30%"),
      follow(inside, "top top", "bottom bottom"),
      follow(exit, "bottom bottom", "bottom 30%"),
    ];
    return () => tweens.forEach((t) => t.kill());
  }, [enter, inside, exit]);

  return { enter, inside, exit, near };
}

/** A chapter's layer on the shared screen. It dissolves in over the previous
 * chapter and stops painting once the next chapter fully covers it. */
export function Plates({ chapter, z, children, opacity }: { chapter: Chapter; z: number; children: ReactNode; opacity?: MotionValue<number> }) {
  const screen = useContext(ScreenContext);
  const visibility = useTransform([chapter.enter, chapter.exit], ([e, x]: number[]) => (e <= 0.001 || x >= 0.999 ? "hidden" : "visible"));
  if (!screen) return null;
  return createPortal(
    <m.div className={styles.layer} style={{ zIndex: z, opacity: opacity ?? chapter.enter, visibility }}>{children}</m.div>,
    screen,
  );
}

/** One photograph on the screen: a responsive cut, loaded once its chapter is near. */
export function Still({ photo, near, priority = false, style, className, position }: {
  photo: Photo; near: boolean; priority?: boolean; style?: MotionStyle; className?: string; position?: string;
}) {
  return (
    <m.div className={`${styles.still} ${className ?? ""}`} style={style}>
      {(near || priority) && (
        <picture>
          {photo.mobile && <source media="(max-width: 899px)" srcSet={photo.mobile} />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt="" width={photo.width} height={photo.height} decoding="async" draggable={false}
            fetchPriority={priority ? "high" : "auto"} style={position ? ({ objectPosition: position } as CSSProperties) : undefined} />
        </picture>
      )}
    </m.div>
  );
}

/** A window of chapter progress in which an element is shown, with soft edges.
 * `hold` keeps it visible before/after the window (first/last beats). */
export function useBeat(progress: MotionValue<number>, [a, b]: [number, number], { fade = 0.06, holdStart = false, holdEnd = false } = {}) {
  const opacity = useTransform(progress, (p) => {
    const rise = holdStart ? 1 : Math.min(1, Math.max(0, (p - a) / fade));
    const fall = holdEnd ? 1 : Math.min(1, Math.max(0, (b - p) / fade));
    return Math.min(rise, fall);
  });
  const y = useTransform(progress, (p) => {
    if (!holdStart && p < a + fade) return (1 - Math.max(0, (p - a) / fade)) * 28;
    if (!holdEnd && p > b - fade) return -(1 - Math.max(0, (b - p) / fade)) * 22;
    return 0;
  });
  return { opacity, y };
}
