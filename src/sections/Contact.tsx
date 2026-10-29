"use client";

import { useRef } from "react";
import { m, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { gsap, SplitReveal, useMotion, useScene } from "@/animation";
import { Button } from "@/components/Button";
import { Landscape } from "@/components/landscape/Landscape";
import { dawn } from "@/components/landscape/palettes";
import { ORIGIN_SCROLL } from "@/components/transition/originJourney";
import { brand, contact } from "@/content/site";
import styles from "./Contact.module.css";

/** Twilight plate for the homepage's closing scene.
 * INTERIM: the age-gate's twilight photograph, mirrored and recomposed so it
 * does not repeat the gate or hero framing. It should be replaced by a
 * dedicated Himalayan twilight valley plate (docs/assets/contact-twilight.md);
 * swapping `src`/`mobile` and setting `mirrored: false` is all that changes. */
export const TWILIGHT = {
  src: "/media/photography/age-gate-himalaya.webp",
  mobile: "/media/photography/age-gate-himalaya.webp",
  width: 1182,
  height: 663,
  mirrored: true,
};

type Props = { title?: string; children?: React.ReactNode; scene?: "range" | "twilight" };

/**
 * Contact. On the homepage it is the last scene of the film ("twilight"): the
 * craft scene dissolves into the valley at last light, the invitation rises,
 * and the light fades into the footer. Elsewhere it is framed by the closing
 * range at first light, compact or hosting the enquiry form.
 */
export function Contact({ title = contact.heading, children, scene = "range" }: Props) {
  const { reduced } = useMotion();
  // Remount when the motion preference resolves or changes: scroll-linked
  // styles and static styles must never be swapped on a live element.
  if (scene === "twilight") return <TwilightContact key={String(reduced)} title={title} />;
  return <RangeContact title={title}>{children}</RangeContact>;
}

function RangeContact({ title, children }: { title: string; children?: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const full = Boolean(children);

  // Ridges settle as the visitor arrives — the same move as the closing frame.
  useScene(ref, ({ motion }, root) => {
    if (!motion) return;
    const q = gsap.utils.selector(root);
    q<HTMLElement>("[data-layer]").forEach((el) => {
      const d = Number(el.dataset.depth);
      gsap.fromTo(el, { yPercent: d * 18 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "bottom bottom", scrub: true } });
    });
  });

  return (
    <section ref={ref} className={styles.section} data-variant={full ? "full" : "compact"} aria-labelledby="contact-title">
      <Landscape palette={dawn} id="contact" clouds={false} />
      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className="eyebrow">{contact.intro}</p>
          <SplitReveal id="contact-title" as="h2" type="words" className={`display ${styles.title}`}>
            {title}
          </SplitReveal>
          <p className={styles.lede}>{contact.lede}</p>
          <Facts />
          <p className={styles.pending}>{contact.pendingDetails}</p>
          {!full && <Ctas />}
        </div>
        {children}
      </div>
    </section>
  );
}

const Facts = ({ className }: { className?: string }) => (
  <dl className={`${styles.facts} ${className ?? ""}`}>
    <div>
      <dt>Explore</dt>
      <dd>{brand.category}</dd>
    </div>
    <div>
      <dt>Inspired by</dt>
      <dd>{brand.origin}</dd>
    </div>
  </dl>
);

const Ctas = () => (
  <div className={styles.ctas}>
    <Button href="/contact" variant="solid" cursor="Write">
      Make an Enquiry
    </Button>
    <Button href="/whisky">Our Whisky</Button>
  </div>
);

const ramp = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));

/** One element of the invitation: rises in with the last light, recedes at dusk. */
function Beat({ arrive, dusk, at, reduced, className, children }: {
  arrive: MotionValue<number>; dusk: MotionValue<number>; at: number; reduced: boolean; className?: string; children: React.ReactNode;
}) {
  const opacity = useTransform([arrive, dusk], ([a, d]: number[]) => ramp(a, at, at + 0.22) * (1 - ramp(d, 0.15, 0.85)));
  const y = useTransform([arrive, dusk], ([a, d]: number[]) => (1 - ramp(a, at, at + 0.3)) * 22 - ramp(d, 0, 1) * 40);
  return <m.div className={className} style={{ opacity, y: reduced ? 0 : y }}>{children}</m.div>;
}

function TwilightContact({ title }: { title: string }) {
  const ref = useRef<HTMLElement>(null);
  const { ready, reduced, mobile } = useMotion();
  const cinematic = !ready || (!reduced && !mobile);
  const arrive = useMotionValue(0);
  const dusk = useMotionValue(0);

  // The craft scene's copper light becomes the last sun; the camera pulls back.
  const plateScale = useTransform(arrive, [0, 1], [1.16, 1.02]);
  const plateY = useTransform(arrive, [0, 1], ["-2.5%", "0%"]);
  const copper = useTransform(arrive, [0, 0.45, 0.9], [0.85, 0.6, 0]);
  const horizon = useTransform([arrive, dusk], ([a, d]: number[]) => (ramp(a, 0.35, 0.85) * 0.65 - ramp(a, 0.85, 1) * 0.2) * (1 - d));
  const mist = useTransform([arrive, dusk], ([a, d]: number[]) => (ramp(a, 0.2, 0.6) * 0.5 - ramp(a, 0.6, 1) * 0.2) * (1 - d * 0.6));
  const darkness = useTransform(dusk, [0, 1], [0, 0.72]);
  // Native-scroll layouts: rises out of the night The Philosophy sank into.
  const feather = useTransform(arrive, [0, 0.55], [1, 0]);

  useScene(ref, ({ motion, desktop }, root) => {
    const q = gsap.utils.selector(root);
    const linked = motion && desktop;
    // Desktop: the section reaches the top exactly as Origin's closing
    // segment begins, and arrives over the same distance and smoothing.
    const a = gsap.to({}, { scrollTrigger: linked
      ? { trigger: root, start: "top top", end: `+=${ORIGIN_SCROLL.closing}%`, scrub: 1, onUpdate: s => arrive.set(s.progress), onRefresh: s => arrive.set(s.progress) }
      : { trigger: root, start: "top bottom", end: "top 35%", scrub: motion ? 0.6 : true, onUpdate: s => arrive.set(s.progress), onRefresh: s => arrive.set(s.progress) } });
    const d = gsap.to({}, { scrollTrigger: {
      trigger: q("[data-contact-dusk]")[0], start: "top 85%", end: "bottom 20%", scrub: motion ? 0.6 : true,
      onUpdate: s => dusk.set(s.progress), onRefresh: s => dusk.set(s.progress),
    } });
    return () => { a.kill(); d.kill(); };
  }, [arrive, dusk, cinematic]);

  return (
    <section
      ref={ref}
      className={`${styles.section} ${styles.twilight}`}
      data-scene="twilight"
      data-soundscape="breeze"
      data-mode={cinematic ? "cinematic" : "simple"}
      style={{ "--closing": `${ORIGIN_SCROLL.closing}vh` } as React.CSSProperties}
      aria-labelledby="contact-title"
    >
      <div className={styles.track} aria-hidden="true">
      <div className={styles.backdrop}>
        <m.div className={styles.plate} style={reduced ? undefined : { scale: plateScale, y: plateY }}>
          <picture>
            <source media="(max-width: 899px)" srcSet={TWILIGHT.mobile} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={TWILIGHT.src} alt="" width={TWILIGHT.width} height={TWILIGHT.height} loading="lazy" decoding="sync" draggable={false}
              className={styles.plateImage} data-mirrored={TWILIGHT.mirrored} />
          </picture>
        </m.div>
        <m.div className={styles.horizon} style={{ opacity: horizon }}><span /></m.div>
        <m.div className={styles.mistBand} style={{ opacity: mist }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/photography/mist-a.webp" alt="" loading="lazy" decoding="sync" />
        </m.div>
        <div className={styles.scrimTwilight} />
        <m.div className={styles.copper} style={{ opacity: copper }} />
        <m.div className={styles.dusk} style={{ opacity: darkness }} />
        <div className={styles.floor} />
        {!cinematic && <m.div className={styles.feather} style={{ opacity: feather }} />}
      </div>
      </div>

      <div className={styles.lead} />
      <div className={styles.stageCopy}>
        <div className={styles.invite}>
          <Beat arrive={arrive} dusk={dusk} at={0.6} reduced={reduced}><p className="eyebrow">{contact.intro}</p></Beat>
          <Beat arrive={arrive} dusk={dusk} at={0.64} reduced={reduced}>
            <h2 id="contact-title" className={`display ${styles.twilightTitle}`}>{title}</h2>
          </Beat>
          <Beat arrive={arrive} dusk={dusk} at={0.69} reduced={reduced}><p className={styles.lede}>{contact.lede}</p></Beat>
          <Beat arrive={arrive} dusk={dusk} at={0.73} reduced={reduced} className={styles.twilightCtas}><Ctas /></Beat>
          <Beat arrive={arrive} dusk={dusk} at={0.77} reduced={reduced} className={styles.signature}>
            <Facts className={styles.factsRow} />
            <p className={styles.pending}>{contact.pendingDetails}</p>
          </Beat>
        </div>
      </div>
      <div data-contact-dusk className={styles.duskSpace} />
    </section>
  );
}
