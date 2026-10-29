"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useScrollLock } from "./useScrollLock";
import { brand, informationPages } from "@/content/site";
import { Logo } from "./Logo";
import { HimalayanCameraDive } from "./transition/HimalayanCameraDive";
import { enterWithSound, prepareSound } from "./sound/SoundToggle";
import styles from "./AgeGate.module.css";

type Status = "pending" | "denied" | "exiting" | "entered";

const GateContext = createContext(false);
/** True once the visitor has passed the age gate — intro animations wait for it. */
export const useEntered = () => useContext(GateContext);

/**
 * Age-gate concept. Content is rendered (for SEO and no-JS) but kept inert and
 * covered until the visitor confirms. Final wording, legal age by market and
 * any geo-restriction logic must be confirmed with the brand's legal team.
 */
export function AgeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const informationPage = informationPages.includes(pathname);
  const [status, setStatus] = useState<Status>("pending");
  const scope = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const yesBtn = useRef<HTMLButtonElement>(null);
  const confirming = useRef(false);

  const locked = status !== "entered" && !informationPage;
  useScrollLock(locked);

  useEffect(() => {
    if (status === "entered" && confirming.current) document.getElementById("main")?.focus({ preventScroll: true });
    if (status === "denied") root.current?.querySelector<HTMLElement>("#gate-title")?.focus({ preventScroll: true });
  }, [status]);

  useEffect(() => {
    if (!locked || status !== "pending" || !panel.current) return;
    yesBtn.current?.focus({ preventScroll: true });
  }, [status, locked]);

  useEffect(() => {
    if (!locked) return;
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !root.current) return;
      const items = Array.from(root.current.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), a[href]"));
      const first = items[0], last = items[items.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !root.current.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !root.current.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [locked]);

  const finishEntry = useCallback(() => setStatus("entered"), []);
  const confirm = () => {
    if (confirming.current) return;
    confirming.current = true;
    enterWithSound(); // inside the click: required to unlock audio

    setStatus("exiting");
  };

  return (
    <div ref={scope}>
    <GateContext.Provider value={status === "entered" || informationPage}>
      <div inert={locked || undefined}>{children}</div>
      {locked && (
        <div ref={root} className={styles.gate} data-exiting={status === "exiting"} role="dialog" aria-modal="true" aria-labelledby="gate-title">
          <HimalayanCameraDive active={status === "exiting"} page={scope} gate={root} panel={panel} onComplete={finishEntry} />
          <div data-dive-veil className={styles.veil} aria-hidden="true" />
            <div ref={panel} className={styles.panel} data-gate-panel>
              <div data-gate-mark className={styles.mark}><Logo className={styles.emblem} /></div>
              {status !== "denied" ? (
                <>
                  <p data-gate-item className="eyebrow">
                    {brand.category}
                  </p>
                  <h1 id="gate-title" data-gate-item className={`display ${styles.title}`}>
                    Are you of legal drinking age in your place of residence?
                  </h1>
                  <div data-gate-item className={styles.actions}>
                    <button ref={yesBtn} className={styles.btn} onPointerDown={prepareSound} onClick={confirm} disabled={status === "exiting"}>
                      Yes, I am
                    </button>
                    <button className={`${styles.btn} ${styles.ghost}`} onClick={() => setStatus("denied")} disabled={status === "exiting"}>
                      No
                    </button>
                  </div>
                  <p data-gate-item className={styles.legal}>
                    By entering you confirm you meet the minimum legal drinking age where you live.
                    Review our <a href="/terms">Terms</a> and <a href="/privacy">Privacy notice</a>. {brand.responsibility}
                  </p>
                </>
              ) : (
                <>
                  <h1 id="gate-title" tabIndex={-1} className={`display ${styles.title}`}>
                    Thank you for your honesty.
                  </h1>
                  <p className={styles.legal}>
                    This site is only for adults of legal drinking age. Please come back when you are able to join us.
                  </p>
                </>
              )}
            </div>
        </div>
      )}
    </GateContext.Provider>
    </div>
  );
}
