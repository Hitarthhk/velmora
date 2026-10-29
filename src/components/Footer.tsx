import { brand, nav, soundCredits } from "@/content/site";
import { Logo } from "./Logo";
import { TransitionLink } from "./transition/TransitionLink";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer} data-soundscape="breeze">
      <div className={styles.top}>
        <div className={styles.brand}>
          <Logo className={styles.mark} />
          <p className="eyebrow">{brand.category}</p>
        </div>
        <nav aria-label="Footer" className={styles.links}>
          {nav.map((n) => (
            <TransitionLink key={n.href} href={n.href}>
              {n.label}
            </TransitionLink>
          ))}
        </nav>
      </div>
      <div className={styles.responsible}>
        <p>{brand.responsibility}</p>
        <p>Do not share this content with anyone under the legal drinking age. Never drink and drive.</p>
      </div>
      <div className={styles.legal}>
        <span>
          Whisky concept preview — bottle designs and tasting profiles are illustrative. Himalayan imagery provides a setting and does not imply product provenance.
        </span>
        <span className={styles.legalLinks}>
          <TransitionLink href="/terms">Terms</TransitionLink>
          <TransitionLink href="/privacy">Privacy</TransitionLink>
          <TransitionLink href="/responsible-drinking">Responsible Drinking</TransitionLink>
        </span>
      </div>
      <details className={styles.credits}>
        <summary>Sound credits</summary>
        <ul>
          {soundCredits.map((c) => (
            <li key={c.source}>
              {c.subject} — <a href={c.source} target="_blank" rel="noreferrer">{c.author}</a>, <a href={c.licenseUrl} target="_blank" rel="noreferrer">{c.license}</a>
            </li>
          ))}
          <li>Tonal and air textures are synthesized in the browser. Recordings are edited (looped, layered and mixed).</li>
        </ul>
      </details>
    </footer>
  );
}
