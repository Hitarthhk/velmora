import type { StoryHeading } from "@/content/site";
import styles from "./OurStory.module.css";

/** "I — The Valley", then the chapter's line with its italic turn. */
export function ChapterHeading({ heading, id, className }: { heading: StoryHeading; id: string; className?: string }) {
  return (
    <header className={`${styles.heading} ${className ?? ""}`}>
      <p className={styles.kicker}>
        <span className={styles.numeral}>{heading.numeral}</span>
        <span className={styles.rule} aria-hidden="true" />
        <span>{heading.label}</span>
      </p>
      <h2 id={id} className={`display ${styles.headline}`}>
        {heading.lead} <em>{heading.emphasis}</em>
      </h2>
    </header>
  );
}
