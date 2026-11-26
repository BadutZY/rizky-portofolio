"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, reducedMotion } from "@/lib/gsap";

/** Active Lenis instance (null with reduced motion or before mount). */
export const lenisRef: { current: Lenis | null } = { current: null };

/** Smoothed scroll velocity in px per frame, signed. Read from any animation loop, no listeners needed. */
export const scrollState = { velocity: 0, direction: 0 };

export function scrollToTop() {
  if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

export function scrollToTarget(target: string | number | HTMLElement, offset = -70) {
  if (lenisRef.current) lenisRef.current.scrollTo(target as never, { offset, duration: 1.4, easing: easeOutQuart });
  else if (typeof target === "string") document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  else if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
  else target.scrollIntoView({ behavior: "smooth" });
}

// Several things can lock page scrolling at once (intro, menu, project modal). A plain on/off switch lets
// one of them unlock the page while another still needs it locked, so locks are counted instead.
let locks = 0;

export function lockScroll(lock: boolean) {
  locks = Math.max(0, locks + (lock ? 1 : -1));
  const locked = locks > 0;
  if (lenisRef.current) {
    if (locked) lenisRef.current.stop();
    else lenisRef.current.start();
  }
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

/**
 * Lenis smooth scrolling driven by the GSAP ticker, so ScrollTrigger, Lenis and every other animation
 * loop share one requestAnimationFrame and always see the same scroll position in the same frame.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (reducedMotion()) return;
    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false, // touch keeps native momentum, which is smoother and cheaper on phones
      allowNestedScroll: true,
      autoRaf: false,
    });
    lenisRef.current = lenis;
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    lenis.on("scroll", (l: Lenis) => {
      ScrollTrigger.update();
      scrollState.direction = l.direction;
    });

    const tick = (t: number) => {
      lenis.raf(t * 1000);
      // ease the velocity so consumers (ticker, skew) never see a hard jump
      scrollState.velocity += (lenis.velocity - scrollState.velocity) * 0.18;
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // page height changes (accordion, images, fonts) must refresh scroll animations, but only once things settle
    let t = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        lenis.resize();
        ScrollTrigger.refresh();
      }, 200);
    });
    ro.observe(document.body);

    return () => {
      window.clearTimeout(t);
      ro.disconnect();
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);
  return null;
}
