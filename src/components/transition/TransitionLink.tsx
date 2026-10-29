"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { usePageTransition } from "./TransitionProvider";

/**
 * Drop-in replacement for next/link that plays the pour transition. Modified clicks
 * (new tab, etc.), hash links and external links fall through to the browser.
 */
export function TransitionLink({ href, onClick, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const { navigate } = usePageTransition();

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((rest.target && rest.target !== "_self") || rest.download) return;
    if (!href.startsWith("/") || href.includes("#")) return;
    if (new URL(href, window.location.href).pathname === window.location.pathname) return;
    e.preventDefault();
    // The pour starts where the visitor clicked; keyboard activation pours from the centre.
    navigate(href, e.detail === 0 ? undefined : { x: e.clientX, y: e.clientY });
  };

  return <Link href={href} onClick={handle} {...rest} />;
}
