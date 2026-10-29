"use client";

import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { m, useTransform, type MotionValue } from "motion/react";
import { useMotionThreshold } from "@/animation/useMotionThreshold";
import type { ExpressionId } from "@/content/site";
import { COLLECTION_ENVIRONMENTS } from "./collectionEnvironments";
import styles from "./CollectionEnvironment.module.css";

const ids = Object.keys(COLLECTION_ENVIRONMENTS) as ExpressionId[];

/** Two persistent, decoded plates. Scroll opacity and product selection have
 * separate wrappers, so neither controller can overwrite the other's blend. */
export function CollectionEnvironment({ active, opacity, reduced, world, shift, onPrepared }: {
  active: ExpressionId; opacity: MotionValue<number>; reduced: boolean; world: MotionValue<number>; shift: number; onPrepared: () => void;
}) {
  const [ready, setReady] = useState<Partial<Record<ExpressionId, boolean>>>({});
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const outgoingDepth = useTransform(world, [0, 1], [1.012, 1]);
  const incomingDepth = useTransform(world, [0, 1], [1.025, 1.012]);
  const revealed = useMotionThreshold(opacity, 0.01);
  for (const id of ids) {
    const src = COLLECTION_ENVIRONMENTS[id].src;
    preload(src, { as: "image", fetchPriority: id === ids[0] ? "auto" : "low", media: "(min-width: 900px)" });
    preload(src.replace(".webp", "-mobile.webp"), { as: "image", fetchPriority: id === ids[0] ? "auto" : "low", media: "(max-width: 899px)" });
  }
  useEffect(() => { if (ids.every(id => ready[id])) onPrepared(); }, [ready, onPrepared]);
  useEffect(() => {
    // Server-rendered/preloaded images can finish before hydration attaches
    // React's onLoad handler. Observe future loads AND inspect the current
    // decoded images, so cached reloads cannot leave the world blend locked.
    let disposed = false;
    const cleanups = ids.map(id => {
      const image = host.current?.querySelector<HTMLImageElement>(`[data-collection-environment="${id}"] img`);
      if (!image) return () => {};
      const check = async () => {
        if (!image.complete || !image.naturalWidth) return;
        const source = image.currentSrc;
        try { await image.decode(); } catch { return; }
        if (disposed || image.currentSrc !== source) return;
        setReady(previous => previous[id] ? previous : { ...previous, [id]: true });
      };
      image.addEventListener("load", check);
      void check();
      return () => image.removeEventListener("load", check);
    });
    return () => { disposed = true; cleanups.forEach(cleanup => cleanup()); };
  }, []);
  useEffect(() => {
    if (!host.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  return (
    <m.div ref={host} data-alpine-gallery className={styles.environment} aria-hidden="true" style={{ opacity }}>
      {ids.map(id => (
        <m.div key={id} data-collection-environment={id} className={styles.plate}
          style={{ opacity: id === ids[0] ? 1 : world, scale: id === ids[0] ? outgoingDepth : incomingDepth }}>
          {/* Generated scenery only; original product artwork is separate. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <picture>
          <source media="(max-width: 899px)" srcSet={COLLECTION_ENVIRONMENTS[id].src.replace(".webp", "-mobile.webp")} />
          <img src={COLLECTION_ENVIRONMENTS[id].src} alt="" width={1672} height={941}
            loading="eager" decoding="sync" />
          </picture>
        </m.div>
      ))}
      <div className={styles.scrim} />
      <m.div className={styles.reflections} initial={false}
        animate={visible && revealed && !reduced ? { opacity: [0.025, 0.065, 0.025], x: ["-1%", "1%", "-1%"] } : { opacity: 0, x: "0%" }}
        transition={visible && revealed && !reduced ? { duration: 14, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }} />
      {shift > 0 && !reduced && <m.div key={shift} data-world-sweep className={styles.sweep}
        initial={{ x: active === ids[1] ? "-100%" : "360%", opacity: 0 }}
        animate={{ x: active === ids[1] ? "360%" : "-100%", opacity: [0, 0.12, 0.08, 0] }}
        transition={{ duration: 1.05, ease: [0.45, 0, 0.25, 1] }} />}

    </m.div>
  );
}
