"use client";

import { useEffect, useState } from "react";
import { STORY_CHAPTERS } from "./chapters";
import styles from "./OurStory.module.css";

/** Desktop chapter rail: shows where you are in the five chapters and jumps
 * between them. Hidden over the opening and closing scenes. */
export function ChapterRail() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = STORY_CHAPTERS.map((c) => document.getElementById(c.id)).filter((el): el is HTMLElement => !!el);
    // The explorer belongs to chapter IV as well.
    const explorer = document.getElementById("story-emblem")?.nextElementSibling as HTMLElement | null;
    const visible = new Map<Element, boolean>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => visible.set(e.target, e.isIntersecting));
      const current = [...sections, ...(explorer ? [explorer] : [])].find((el) => visible.get(el));
      setActive(current ? (current === explorer ? "story-emblem" : current.id) : null);
    }, { rootMargin: "-50% 0px -50% 0px" });
    [...sections, ...(explorer ? [explorer] : [])].forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav className={styles.rail} data-visible={!!active} aria-label="Our Story chapters">
      <ol>
        {STORY_CHAPTERS.map((c) => (
          <li key={c.id}>
            <a href={`#${c.id}`} aria-current={active === c.id ? "step" : undefined}>
              <span className={styles.railNumeral}>{c.numeral}</span>
              <span className={styles.railLabel}>{c.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
