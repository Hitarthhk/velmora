import Link from "next/link";
import styles from "./PolicyPage.module.css";

export function PolicyPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className={styles.page}>
      <p className="eyebrow">Website information</p>
      <h1 className="display">{title}</h1>
      <p className={styles.notice}>Concept preview. This notice describes the current prototype. Final operator details and approved policies must be supplied before public launch.</p>
      <div className={styles.content}>{children}</div>
      <nav aria-label="Website information"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/responsible-drinking">Responsible drinking</Link></nav>
    </article>
  );
}
