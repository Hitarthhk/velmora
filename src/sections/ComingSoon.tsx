"use client";

import { m } from "motion/react";
import { MOTION_EASE, useMotion } from "@/animation";
import { Button } from "@/components/Button";
import { useEntered } from "@/components/AgeGate";
import styles from "./ComingSoon.module.css";

const EMAIL = "work@asynk.in";

/** Placeholder for pages whose brand story is still to be completed. */
export function ComingSoon({ page }: { page: string }) {
  const entered = useEntered();
  const { reduced } = useMotion();
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 22 },
    animate: entered ? { opacity: 1, y: 0 } : { opacity: 0, y: reduced ? 0 : 22 },
    transition: { duration: reduced ? 0.2 : 1.2, ease: MOTION_EASE.rise, delay: reduced ? 0 : delay },
  });

  return (
    <section className={styles.section} data-soundscape="breeze" aria-labelledby="coming-soon-title">
      <div className={styles.backdrop} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/story/closing-twilight.webp" alt="" decoding="async" fetchPriority="high" />
      </div>
      <div className={styles.copy}>
        <m.p className="eyebrow" {...rise(0.15)}>{page}</m.p>
        <m.h1 id="coming-soon-title" className={`display ${styles.title}`} {...rise(0.3)}>
          There is more to discover
        </m.h1>
        <m.span className={styles.rule} aria-hidden="true" {...rise(0.45)} />
        <m.p className={styles.lede} {...rise(0.55)}>
          Contact us at <a href={`mailto:${EMAIL}`}>{EMAIL}</a> for enquiries and further information.
        </m.p>
        <m.div className={styles.ctas} {...rise(0.7)}>
          <Button href="https://asynk.in" variant="solid" cursor="Visit">Visit Website</Button>
          <Button href={`mailto:${EMAIL}`} cursor="Write">Contact Us</Button>
        </m.div>
      </div>
    </section>
  );
}
