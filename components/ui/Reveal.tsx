"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { whenGo } from "@/lib/motion";

/** Fades and slides in when scrolled into view (and only after the intro or page curtain is gone). */
export default function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "up",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "up" | "fade" | "left" | "scale" | "line";
  as?: "div" | "li" | "section" | "article";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let io: IntersectionObserver | undefined;
    const stop = whenGo(() => {
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            el.classList.add("in");
            io?.disconnect();
            window.setTimeout(() => { el.style.transitionDelay = ""; }, delay + 1300);
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
      );
      io.observe(el);
    });
    return () => {
      stop();
      io?.disconnect();
    };
  }, []);

  const T = Tag as "div";
  return (
    <T
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`rv rv-${variant} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </T>
  );
}
