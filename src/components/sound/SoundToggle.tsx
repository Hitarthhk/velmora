"use client";

import { useEffect, useRef, useState } from "react";
import { Soundscape, type Scene } from "./soundscape";
import styles from "./SoundToggle.module.css";

const KEY = "gv-sound";
/** One engine for the whole visit: it survives page navigation and re-renders. */
let engine: Soundscape | null = null;
const getEngine = () => (engine ??= new Soundscape());

const stored = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const read = () => stored() === "on";
const write = (on: boolean) => { try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* private mode */ } };

const started = new Set<() => void>();
/**
 * Entering the valley starts its sound: the age gate calls this from its
 * "Yes" click, the gesture browsers require to unlock audio. A visitor who
 * has turned the sound off before keeps that choice.
 */
/** Pressing "Yes" (before the click) builds the silent audio graph early, so
 * its cost never lands on the gate's exit animation. */
export function prepareSound() {
  if (stored() !== "off" && !engine?.playing) getEngine().prepare();
}

export function enterWithSound() {
  if (stored() === "off" || engine?.playing) return;
  getEngine().start();
  write(true);
  started.forEach((notify) => notify());
}

/** Sections declare their atmosphere with data-soundscape; the one crossing
 * the middle of the viewport sets the scene (the last in document order wins,
 * matching the layers that overlap on screen). */
function currentScene(): Scene {
  const mid = window.innerHeight / 2;
  let scene: Scene = "breeze";
  document.querySelectorAll<HTMLElement>("[data-soundscape]").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top <= mid && r.bottom >= mid) scene = el.dataset.soundscape as Scene;
  });
  return scene;
}

/**
 * "The Sound of the Valley" control. Sound only ever begins from an explicit
 * interaction: confirming the age gate, or this toggle. A visitor who left it
 * on finds it resuming at their first tap or key press (browsers forbid
 * audible autoplay).
 */
export function SoundToggle() {
  const [on, setOn] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  /** Applies the scene and mirrors it on the control (no re-render). */
  const follow = () => {
    const scene = currentScene();
    getEngine().setScene(scene);
    if (button.current) button.current.dataset.scene = scene;
  };

  // Restore the preference: resume at the first interaction, not before.
  useEffect(() => {
    if (!read() || engine?.playing) { setOn(!!engine?.playing); return; }
    setOn(true);
    setWaiting(true);
    const begin = () => {
      getEngine().start();
      follow();
      setWaiting(false);
      remove();
    };
    const events = ["click", "touchend", "keydown"] as const;
    const remove = () => events.forEach((e) => window.removeEventListener(e, begin, true));
    events.forEach((e) => window.addEventListener(e, begin, true));
    return remove;
  }, []);

  // Started from the age gate: mirror it on the control.
  useEffect(() => {
    const notify = () => { setOn(true); setWaiting(false); };
    started.add(notify);
    return () => { started.delete(notify); };
  }, []);

  // Follow the page while sound plays: scroll, layout changes and new routes.
  useEffect(() => {
    if (!on || waiting) return;
    let frame = 0;
    const update = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(follow); };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const observer = new MutationObserver(update);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-soundscape"] });
    const visibility = () => getEngine().setHidden(document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [on, waiting]);

  const toggle = () => {
    const next = !on;
    if (next) {
      getEngine().start(); // inside the click: required to unlock audio
      follow();
    } else {
      engine?.stop();
    }
    setWaiting(false);
    setOn(next);
    write(next);
  };

  return (
    <button ref={button} type="button" className={styles.toggle} aria-pressed={on} onClick={toggle} data-on={on} data-cursor={on ? "Silence" : "Listen"}>
      <span className="visually-hidden">{on ? "Turn the sound of the valley off" : "Turn the sound of the valley on"}</span>
      <svg viewBox="0 0 28 14" aria-hidden="true" className={styles.glyph}>
        {/* Still air when muted; a breath of wind when listening. */}
        <path className={styles.still} d="M2 7h24" />
        <path className={styles.wave} d="M2 7c2.5-4.5 5-4.5 7.5 0s5 4.5 7.5 0 5-4.5 7.5 0" />
      </svg>
      <span className={styles.label} aria-hidden="true">{on ? "Sound on" : "Sound off"}</span>
    </button>
  );
}
