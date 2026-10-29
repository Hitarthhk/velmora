"use client";

import { useEffect, useRef } from "react";
import type { Hotspot as HotspotData } from "@/content/site";
import { ClaimText } from "../Pending";
import styles from "./Craft.module.css";

type Props = { spot: HotspotData; open: boolean; onToggle: (id: string | null) => void };

/** Keyboard-accessible information hotspot (disclosure pattern). */
export function Hotspot({ spot, open, onToggle }: Props) {
  const btn = useRef<HTMLButtonElement>(null);
  const panelId = `hotspot-${spot.id}`;

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      onToggle(null);
      btn.current?.focus();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onToggle]);

  return (
    <>
    <div className={styles.hotspot} style={{ left: `${spot.x}%`, top: `${spot.y}%` }} data-open={open}>
      <button
        ref={btn}
        className={styles.hotspotBtn}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onToggle(open ? null : spot.id)}
        data-cursor={open ? "Close" : "Discover"}
      >
        <span className="visually-hidden">{spot.title}</span>
        <i aria-hidden="true" />
      </button>
    </div>
      <div id={panelId} className={styles.hotspotPanel} style={{ "--spot-x": `${spot.x}%`, "--spot-y": `${spot.y}%` } as React.CSSProperties} role="region" aria-label={spot.title} hidden={!open}>
        <p className="eyebrow">{spot.title}</p>
        <ClaimText claim={spot.body} />
      </div>
    </>
  );
}
