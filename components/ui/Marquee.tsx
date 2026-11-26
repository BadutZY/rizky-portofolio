"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, reducedMotion } from "@/lib/gsap";
import { scrollState } from "@/components/layout/SmoothScroll";

/**
 * Endless ticker. One list is measured, then cloned just enough times to cover the viewport twice.
 * Speed is real px per second and gently reacts to Lenis scroll velocity (slightly faster while scrolling, never reversing),
 * eased every frame, so there are no tween restarts and no hard jumps. Pauses when offscreen or hidden.
 */
export default function Marquee({
  items,
  direction = 1,
  outline = false,
  size = "md",
  duration = 40,
}: {
  items: string[];
  direction?: 1 | -1;
  outline?: boolean;
  size?: "md" | "xl";
  duration?: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);

  useEffect(() => {
    const el = root.current;
    const tr = track.current;
    if (!el || !tr) return;
    const first = tr.querySelector<HTMLElement>("ul");
    if (!first) return;

    let unit = first.getBoundingClientRect().width;
    const measure = () => {
      unit = first.getBoundingClientRect().width;
      if (unit > 0) setCopies(Math.max(2, Math.ceil((el.getBoundingClientRect().width * 2) / unit)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    if (reducedMotion()) return () => ro.disconnect();

    // Calm by default: the loop is slowed down, and scrolling only nudges the speed a little.
    // The direction never reverses with the scroll, so the text always drifts the same gentle way.
    const SLOWDOWN = 2.2; // 1 = old speed, higher = slower
    const SCROLL_GAIN = 0.12; // how much scroll velocity affects the speed (old: 0.9)
    const MAX_BOOST = 1.5; // cap on the scroll influence
    const EASE = 1.6; // lower = the speed changes more gradually (old: 6)

    let x = direction === 1 ? 0 : unit;
    let boost = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);

    const tick = (_t: number, dtMs: number) => {
      if (!visible || document.hidden || unit <= 0) return;
      const dt = Math.min(dtMs, 50) / 1000;
      const base = unit / (duration * SLOWDOWN); // px per second
      const target = Math.min(MAX_BOOST, Math.abs(scrollState.velocity) * SCROLL_GAIN);
      boost += (target - boost) * Math.min(1, dt * EASE);
      x += direction * base * dt * (1 + boost);
      x = ((x % unit) + unit) % unit; // keep inside one unit
      tr.style.transform = `translate3d(${-x}px,0,0)`;
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      ro.disconnect();
    };
  }, [direction, duration, items]);

  return (
    <div ref={root} className={`mq mq-${size}${outline ? " mq-outline" : ""}`} aria-hidden>
      <div ref={track} className="mq-track">
        {Array.from({ length: copies }, (_, n) => (
          <ul key={n}>
            {items.map((s) => (
              <li key={s}>
                <span>{s}</span>
                <i />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
