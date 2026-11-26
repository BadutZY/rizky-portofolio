"use client";

import { Fragment, useEffect, useRef } from "react";
import { whenGo } from "@/lib/motion";
import { attachTitleGlitch } from "@/lib/title-glitch";
import { attachAsciiLens } from "@/lib/ascii-lens";

/** Overlay copies of every word, stacked on the real letters. See lib/title-glitch.ts for what each one does. */
const LAYERS = ["r", "c", "s1", "s2", "x"] as const;

/**
 * Big page title with two effects on top of the usual letter reveal:
 *  - idle glitch: one word at a time, at random moments (lib/title-glitch.ts)
 *  - ASCII lens: the area under the pointer turns into ASCII art (lib/ascii-lens.ts)
 *
 * The reveal is the same one SplitText uses (.st / .st-mask / .st-c), so it starts after the intro or page curtain.
 * The real letters stay in the DOM, the heading carries the aria-label, and everything else is aria-hidden.
 */
export default function GlitchTitle({
  text,
  delay = 150,
  stagger = 30,
}: {
  text: string;
  delay?: number;
  stagger?: number;
}) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // letters rise in once the curtain is open and the title is on screen
  useEffect(() => {
    const el = innerRef.current;
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

  // idle glitch + hover lens
  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !inner || !canvas) return;
    const stopGlitch = attachTitleGlitch(inner);
    const stopLens = attachAsciiLens(wrap, inner, canvas);
    return () => {
      stopGlitch();
      stopLens();
    };
  }, [text]);

  const words = text.split(" ");
  let n = 0;

  return (
    <span ref={wrapRef} className="gt-wrap">
      <span
        ref={innerRef}
        className="st gt"
        aria-hidden
        style={{ "--base": `${delay}ms`, "--gap": `${stagger}ms` } as React.CSSProperties}
      >
        {words.map((w, wi) => (
          <Fragment key={wi}>
            <span className="st-word gt-word" data-gword>
              {Array.from(w).map((c, ci) => (
                <span key={ci} className="st-mask">
                  <span className="st-c" style={{ "--i": n++ } as React.CSSProperties}>
                    {c}
                  </span>
                </span>
              ))}
              {LAYERS.map((k) => (
                <span key={k} className="gt-ov" data-k={k}>
                  {Array.from(w).map((c, ci) => (
                    <span key={ci} className="st-mask">
                      {c}
                    </span>
                  ))}
                </span>
              ))}
            </span>
            {wi < words.length - 1 ? " " : ""}
          </Fragment>
        ))}
      </span>
      <canvas ref={canvasRef} className="gt-canvas" aria-hidden />
    </span>
  );
}
