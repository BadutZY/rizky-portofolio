"use client";

import { useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";
import { gsap } from "@/lib/gsap";
import { scrollToTarget } from "./SmoothScroll";

/** Top progress bar plus a floating back-to-top button with a progress ring. No polling: scroll plus ResizeObserver. */
export default function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const C = 2 * Math.PI * 19;
    let max = 1;
    let last = -1;
    let shown = false;
    const measure = () => {
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };
    const tick = () => {
      const y = window.scrollY;
      if (y === last) return;
      last = y;
      const p = Math.min(1, y / max);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      if (ring.current) ring.current.style.strokeDashoffset = String(C * (1 - p));
      const show = y > window.innerHeight * 0.8;
      if (show !== shown) {
        shown = show;
        btn.current?.classList.toggle("show", show);
      }
    };
    measure();
    const ro = new ResizeObserver(() => {
      measure();
      last = -1;
    });
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <>
      <div ref={bar} className="progress" aria-hidden />
      <button ref={btn} className="totop" aria-label="Back to top" onClick={() => scrollToTarget(0, 0)} data-cursor="Top">
        <svg className="totop-ring" width="48" height="48" viewBox="0 0 48 48" aria-hidden>
          <circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="1.5" />
          <circle ref={ring} cx="24" cy="24" r="19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray={2 * Math.PI * 19} strokeDashoffset={2 * Math.PI * 19} transform="rotate(-90 24 24)" />
        </svg>
        <span className="totop-ic">
          <Icon name="arrow-up" size={18} />
        </span>
      </button>
    </>
  );
}
