"use client";

import { Fragment, useEffect, useLayoutEffect, useRef } from "react";
import { m, useMotionValue, useSpring } from "motion/react";
import { gsap, ScrollTrigger, reducedMotion } from "@/lib/gsap";
import { whenGo } from "@/lib/motion";
import Icon from "@/components/ui/Icon";

// useLayoutEffect on the client (so the hidden start state is set before the first paint), plain useEffect on the server
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Big quote.
 *  - Entrance: words rise out of their mask. This is a plain CSS transition started by an IntersectionObserver,
 *    NOT a ScrollTrigger animation, so a layout refresh (fonts, images, resize) can never rewind it and leave the
 *    quote hidden. The words are only hidden while JavaScript is running, so without JS the quote is simply visible.
 *  - Scroll: words light up with a GSAP scrub (opacity only). A scrub is recalculated from the scroll position on every
 *    refresh, so it can never get stuck either.
 *  - The quote mark drifts with scroll (GSAP) and leans toward the pointer with a spring (Motion) on different elements,
 *    so their transforms never clash.
 */
export default function QuoteBlock({ text }: { text: string }) {
  const fig = useRef<HTMLElement>(null);
  const drift = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 90, damping: 16, mass: 0.8 });
  const sy = useSpring(y, { stiffness: 90, damping: 16, mass: 0.8 });
  const words = text.split(" ");

  // 1) entrance: hide the words (JS only), then reveal them when the quote is on screen and the curtain/intro is gone
  useIsoLayoutEffect(() => {
    const el = fig.current;
    if (!el || reducedMotion()) return;
    el.classList.add("qt-js");

    let io: IntersectionObserver | undefined;
    let failsafe = 0;
    const show = () => {
      io?.disconnect();
      window.clearTimeout(failsafe);
      el.classList.add("qt-in");
    };

    const stop = whenGo(() => {
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) show();
        },
        { rootMargin: "0px 0px -6% 0px", threshold: 0.1 },
      );
      io.observe(el);
    });
    // the quote must never stay hidden: if nothing has revealed it after 9s, show it anyway
    failsafe = window.setTimeout(show, 9000);

    return () => {
      stop();
      io?.disconnect();
      window.clearTimeout(failsafe);
      el.classList.remove("qt-js", "qt-in");
    };
  }, []);

  // 2) scroll-driven light up and the drifting quote mark
  useEffect(() => {
    const el = fig.current;
    if (!el || reducedMotion()) return;
    const ctx = gsap.context(() => {
      const ws = gsap.utils.toArray<HTMLElement>(".qw", el);
      gsap.fromTo(
        ws,
        { opacity: 0.14 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.14,
          scrollTrigger: { trigger: el, start: "top 90%", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true },
        },
      );
      if (drift.current) {
        gsap.fromTo(
          drift.current,
          { yPercent: 22, rotate: -14, scale: 0.85 },
          { yPercent: -22, rotate: 10, scale: 1.05, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1, invalidateOnRefresh: true } },
        );
      }
    }, el);

    // fonts, images and the page curtain all change the height of the page: measure again when they are done
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    const stop = whenGo(() => window.setTimeout(refresh, 400));
    return () => {
      stop();
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, []);

  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = fig.current?.getBoundingClientRect();
    if (!r) return;
    x.set(((e.clientX - r.left) / r.width - 0.5) * 70);
    y.set(((e.clientY - r.top) / r.height - 0.5) * 50);
  };
  const leave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <figure ref={fig} className="qt qt2 spot" onPointerMove={move} onPointerLeave={leave}>
      <div className="qt2-ic" aria-hidden ref={drift}>
        <m.div style={{ x: sx, y: sy }}>
          <Icon name="quote" size={180} stroke={0.9} />
        </m.div>
      </div>
      <blockquote>
        {words.map((w, i) => (
          <Fragment key={i}>
            <span className="qw-mask">
              <span className="qw" style={{ "--i": i } as React.CSSProperties}>
                {w}
              </span>
            </span>
            {i < words.length - 1 ? " " : ""}
          </Fragment>
        ))}
      </blockquote>
    </figure>
  );
}