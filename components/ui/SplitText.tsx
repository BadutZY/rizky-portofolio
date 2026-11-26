"use client";

import { Fragment, useEffect, useRef } from "react";
import { whenGo } from "@/lib/motion";

/**
 * Splits text into words or characters that rise out of a mask.
 * Starts on scroll into view once the intro or page curtain is gone.
 */
export default function SplitText({
  text,
  as: Tag = "span",
  mode = "words",
  className = "",
  delay = 0,
  stagger = 24,
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  mode?: "words" | "chars";
  className?: string;
  delay?: number;
  stagger?: number;
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
          }
        },
        { rootMargin: "0px 0px -5% 0px", threshold: 0.1 },
      );
      io.observe(el);
    });
    return () => {
      stop();
      io?.disconnect();
    };
  }, []);

  const words = text.split(" ");
  let n = 0;
  const T = Tag as "span";

  return (
    <T
      ref={ref as React.RefObject<HTMLSpanElement>}
      className={`st ${className}`}
      aria-label={text}
      style={{ "--base": `${delay}ms`, "--gap": `${stagger}ms` } as React.CSSProperties}
    >
      {words.map((w, wi) => (
        <Fragment key={wi}>
        <span className="st-word" aria-hidden>
          {mode === "chars" ? (
            Array.from(w).map((c, ci) => (
              <span key={ci} className="st-mask">
                <span className="st-c" style={{ "--i": n++ } as React.CSSProperties}>
                  {c}
                </span>
              </span>
            ))
          ) : (
            <span className="st-mask">
              <span className="st-c" style={{ "--i": n++ } as React.CSSProperties}>
                {w}
              </span>
            </span>
          )}
        </span>
        {wi < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </T>
  );
}
