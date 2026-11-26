"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { reducedMotion } from "@/lib/gsap";

/** Counts up (Anime.js) when scrolled into view. The final value is already in the DOM, so nothing shifts. */
export default function Counter({ value, suffix = "", className }: { value: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    el.textContent = "0" + suffix;
    const obj = { v: 0 };
    let anim: ReturnType<typeof animate> | undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        anim = animate(obj, {
          v: value,
          duration: 1800,
          ease: "outExpo",
          onUpdate: () => {
            el.textContent = Math.round(obj.v).toLocaleString("en-US") + suffix;
          },
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      anim?.cancel();
    };
  }, [value, suffix]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}
