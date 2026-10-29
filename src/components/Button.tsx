"use client";

import type { ReactNode } from "react";
import { Magnetic } from "@/animation";
import { TransitionLink } from "./transition/TransitionLink";
import styles from "./Button.module.css";

type Props = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "solid" | "outline";
  cursor?: string;
};

/** Magnetic CTA. Renders a transition link when given an href, else a button. */
export function Button({ children, href, onClick, variant = "outline", cursor }: Props) {
  const inner = (
    <span className={styles.inner}>
      <span className={styles.label} data-text={typeof children === "string" ? children : undefined}>
        {children}
      </span>
      <svg className={styles.arrow} viewBox="0 0 24 10" aria-hidden="true">
        <path d="M0 5h22M18 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
    </span>
  );
  const cls = `${styles.btn} ${styles[variant]}`;
  // Other sites open in a new tab; mailto: and the like hand off to the system.
  const external = href !== undefined && !href.startsWith("/");
  return (
    <Magnetic>
      {external ? (
        <a href={href} className={cls} data-cursor={cursor}
          {...(/^https?:/.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {inner}
        </a>
      ) : href ? (
        <TransitionLink href={href} className={cls} data-cursor={cursor}>
          {inner}
        </TransitionLink>
      ) : (
        <button type="button" className={cls} onClick={onClick} data-cursor={cursor}>
          {inner}
        </button>
      )}
    </Magnetic>
  );
}
