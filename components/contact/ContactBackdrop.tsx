"use client";

import { useEffect, useRef } from "react";
import { hasFinePointer, prefersReduced } from "./fx";

/**
 * Ambient layer behind the whole Contact page:
 *  - a soft light that follows the pointer with easing (one element, transform only)
 *  - a faint grid that fades out toward the bottom
 *  - slowly floating outline shapes with a light pointer parallax
 * Everything pauses when the tab is hidden, and the pointer parts only run with a mouse.
 */
export default function ContactBackdrop() {
  const root = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const shapes = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = root.current;
    const g = glow.current;
    const s = shapes.current;
    if (!host || !g || !s || prefersReduced() || !hasFinePointer()) return;

    let tx = window.innerWidth * 0.6;
    let ty = window.innerHeight * 0.3;
    let x = tx;
    let y = ty;
    let nx = 0;
    let ny = 0;
    let px = 0;
    let py = 0;
    let raf = 0;
    let on = true;

    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      nx = e.clientX / window.innerWidth - 0.5;
      ny = e.clientY / window.innerHeight - 0.5;
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!on || document.hidden) return;
      x += (tx - x) * 0.085;
      y += (ty - y) * 0.085;
      px += (nx - px) * 0.05;
      py += (ny - py) * 0.05;
      g.style.transform = `translate3d(${x - 280}px, ${y - 280}px, 0)`;
      s.style.transform = `translate3d(${px * -34}px, ${py * -34}px, 0)`;
    };
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting), { rootMargin: "200px" });
    io.observe(host);
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <div ref={root} className="ct-bg" aria-hidden>
      <div className="ct-grid" />
      <div ref={glow} className="ct-glow" />
      <div ref={shapes} className="ct-shapes">
        <i className="ct-shape ct-s1" />
        <i className="ct-shape ct-s2" />
        <i className="ct-shape ct-s3" />
        <i className="ct-shape ct-s4" />
      </div>
    </div>
  );
}
