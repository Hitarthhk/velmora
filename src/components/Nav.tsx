"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { gsap, ScrollTrigger, useMotion } from "@/animation";
import { useScrollLock } from "./useScrollLock";
import { brand, nav } from "@/content/site";
import { Logo } from "./Logo";
import { TransitionLink } from "./transition/TransitionLink";
import { pourOrigin, usePour, type PourState } from "./transition/usePour";
import styles from "./Nav.module.css";
import { useEntered } from "./AgeGate";

function Bars({ crossed }: { crossed: boolean }) {
  return (
    <span className={styles.bars} data-open={crossed} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

export function Nav() {
  const entered = useEntered();
  const [open, setOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [crossed, setCrossed] = useState(false);
  const header = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  /** Set when a menu link starts a page transition: the menu then stays
   * poured while the page pours beneath it, and closes under cover. */
  const leaving = useRef(false);
  const pathname = usePathname();
  const { reduced, ready, webgl } = useMotion();
  // The links ride the liquid's own level, so a stalled frame can never let
  // them appear before it: they rise as it fills, and fade as it drains.
  const flow = useCallback((s: PourState) => {
    const el = menu.current;
    if (!el || s.mode === "fade") return;
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    el.querySelectorAll<HTMLElement>("[data-menu-rise]").forEach((link, i) => {
      // Starts once the liquid has reached the far corner; the last lands as it fills.
      const k = 1 - (1 - clamp((s.cover - 0.55 - i * 0.05) / 0.25)) ** 3;
      link.style.transform = `translateY(${((1 - k) * 115).toFixed(1)}%)`;
    });
    const meta = el.querySelector<HTMLElement>("[data-menu-meta]");
    if (meta) meta.style.opacity = String(clamp((s.cover - 0.8) / 0.2));
    const content = el.querySelector<HTMLElement>("[data-menu-content]");
    if (content && s.drain > 0) content.style.opacity = String(1 - clamp(s.drain / 0.2));
  }, []);
  const pour = usePour({ warm: ready && webgl && !reduced, onFrame: flow });
  const { start, animate, stop } = pour;
  useScrollLock(open || menuVisible);

  // Hide on scroll down, reveal on scroll up.
  useEffect(() => {
    const el = header.current;
    if (!el) return;
    if (open) el.dataset.hidden = "false";
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate(self) {
        const hide = self.direction === 1 && self.scroll() > 200;
        el.dataset.hidden = String(hide && !open);
        el.dataset.solid = String(self.scroll() > 40);
      },
    });
    return () => st.kill();
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  // The menu pours out of its button, and drains away when closed.
  useEffect(() => {
    const el = menu.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    const content = q("[data-menu-content]");
    if (open) {
      setMenuVisible(true);
      if (!el.open) el.showModal();
      gsap.set(el, { display: "block", opacity: 1 });
      const box = toggle.current?.getBoundingClientRect();
      const mode = start(box ? pourOrigin(box.left + box.width / 2, box.top + box.height / 2) : { x: 0.95, y: 0.95 }, reduced);
      el.dataset.mode = mode;
      const cross = requestAnimationFrame(() => setCrossed(true));
      gsap.set(content, { autoAlpha: 1 });
      // Until the first frame paints, the links wait below their lines.
      q<HTMLElement>("[data-menu-rise]").forEach((rise) => { rise.style.transform = mode === "fade" ? "" : "translateY(115%)"; });
      const meta = q<HTMLElement>("[data-menu-meta]")[0];
      if (meta) meta.style.opacity = mode === "fade" ? "1" : "0";
      if (mode === "fade") gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      else animate("cover", 0.95, 0, () => {});
      (el.querySelector("[data-menu-link]") as HTMLElement | null)?.focus({ preventScroll: true });
      return () => cancelAnimationFrame(cross);
    }
    setCrossed(false);
    if (!el.open) return;
    const close = (focusToggle: boolean) => {
      stop();
      gsap.set(el, { display: "none" });
      setMenuVisible(false);
      if (el.open) el.close();
      if (focusToggle) toggle.current?.focus({ preventScroll: true });
    };
    if (leaving.current) {
      // The page transition has covered the screen beneath the menu.
      leaving.current = false;
      close(false);
      return;
    }
    if (el.dataset.mode === "fade") {
      const fade = gsap.to(el, { opacity: 0, duration: 0.2, onComplete: () => close(true) });
      return () => { fade.kill(); };
    }
    // The links fade as the level starts to fall, then it drains away.
    animate("drain", 0.95, 0, () => close(true));
  }, [open, reduced, start, animate, stop]);

  const choose = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    // Modified clicks open elsewhere; the menu simply stays open.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (new URL(href, location.href).pathname === pathname) { setOpen(false); return; }
    leaving.current = true;
    gsap.to(menu.current?.querySelector("[data-menu-content]") ?? [], { autoAlpha: 0, duration: 0.35 });
    // If the navigation never completes, close the menu normally.
    window.setTimeout(() => { if (leaving.current) { leaving.current = false; setOpen(false); } }, 9000);
  };

  return (
    <>
      <header ref={header} className={styles.header} data-hidden="false" data-solid="false">
        <div data-dive-nav className={styles.entry} style={{ opacity: entered ? 1 : 0 }}>
        <TransitionLink href="/" className={styles.logo} aria-label="Velmora — home">
          <Logo className={styles.mark} />
        </TransitionLink>
        <button
          ref={toggle}
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="visually-hidden">{open ? "Close menu" : "Open menu"}</span>
          <Bars crossed={false} />
        </button>
        </div>
      </header>

      <dialog ref={menu} id="site-menu" className={styles.menu} data-mode="css" aria-label="Site menu" onCancel={(e) => { e.preventDefault(); setOpen(false); }}>
        <canvas ref={pour.canvas} className={styles.menuCanvas} aria-hidden="true" />
        <div ref={pour.liquid} className={styles.menuLiquid} aria-hidden="true" />
        <div data-menu-content className={styles.menuContent}>
          <div className={styles.menuBar}>
            <TransitionLink href="/" className={styles.logo} aria-label="Velmora — home" onClick={choose("/")}>
              <Logo className={styles.mark} />
            </TransitionLink>
          </div>
          <nav aria-label="Menu">
            <ul className={styles.menuList}>
              {nav.map((item, i) => (
                <li key={item.href} className={styles.menuItem}>
                  {/* The rise belongs to this wrapper; the link keeps its own hover motion. */}
                  <span data-menu-rise className={styles.menuRise}>
                    <TransitionLink href={item.href} data-menu-link className={styles.menuLink} aria-current={pathname === item.href ? "page" : undefined} onClick={choose(item.href)}>
                      <span className={styles.menuIndex}>0{i + 1}</span>
                      {item.label}
                    </TransitionLink>
                  </span>
                </li>
              ))}
            </ul>
          </nav>
          <div data-menu-meta className={styles.menuMeta}>
            <p className="eyebrow">{brand.category}</p>
            <p>{brand.responsibility}</p>
          </div>
        </div>
        {/* Sits exactly over the header's menu button: its three lines fold into a cross. */}
        <button className={styles.menuClose} onClick={() => setOpen(false)} aria-label="Close menu">
          <Bars crossed={crossed} />
        </button>
      </dialog>
    </>
  );
}
