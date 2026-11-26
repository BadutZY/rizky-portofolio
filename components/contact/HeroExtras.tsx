"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { scrambleTo } from "@/lib/scramble";
import { scrollToTarget } from "@/components/layout/SmoothScroll";
import { whenGo } from "@/lib/motion";
import { prefersReduced } from "./fx";

const WORDS = ["website", "web app", "game", "Minecraft mod", "crazy idea"];
const RING = "SAY HELLO • LET'S COLLABORATE • ";

/** Live state of the site owner, derived from a timezone (no network). */
function useAvailability(tz: string) {
  const [state, setState] = useState<{ label: string; on: boolean }>({ label: "Checking...", on: false });
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: tz });
    const tick = () => {
      const h = Number(fmt.format(new Date())) % 24;
      if (h >= 8 && h < 22) setState({ label: "Likely online, replies fast", on: true });
      else setState({ label: "Probably offline, I'll reply later", on: false });
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [tz]);
  return state;
}

/**
 * Strip under the page title: a sentence whose last word decodes into the next one every few seconds,
 * a live availability pill, and a rotating badge that jumps to the form or the social cards.
 */
export default function HeroExtras({ timezone, targetId }: { timezone: string; targetId: string }) {
  const word = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGSVGElement>(null);
  const av = useAvailability(timezone);

  // word cycler, paused offscreen and while the tab is hidden
  useEffect(() => {
    const el = word.current;
    const host = root.current;
    if (!el || !host || prefersReduced()) return;
    let i = 0;
    let cancel = () => {};
    let visible = true;
    let timer = 0;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(host);
    const stop = whenGo(() => {
      timer = window.setInterval(() => {
        if (!visible || document.hidden) return;
        i = (i + 1) % WORDS.length;
        cancel();
        cancel = scrambleTo(el, WORDS[i], 650);
      }, 2600);
    });
    return () => {
      stop();
      clearInterval(timer);
      cancel();
      io.disconnect();
    };
  }, []);

  // the badge speeds up on hover and eases back (rotation is driven by one rAF, not by restarting CSS)
  useEffect(() => {
    const svg = ring.current;
    if (!svg || prefersReduced()) return;
    let angle = 0;
    let speed = 0.12;
    let target = 0.12;
    let raf = 0;
    let last = performance.now();
    const parent = svg.parentElement as HTMLElement;
    const over = () => (target = 1.4);
    const out = () => (target = 0.12);
    parent.addEventListener("pointerenter", over);
    parent.addEventListener("pointerleave", out);
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(now - last, 50);
      last = now;
      if (document.hidden) return;
      speed += (target - speed) * 0.06;
      angle = (angle + speed * dt * 0.06) % 360;
      svg.style.transform = `rotate(${angle}deg)`;
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      parent.removeEventListener("pointerenter", over);
      parent.removeEventListener("pointerleave", out);
    };
  }, []);

  return (
    <div ref={root} className="wrap ct-strip">
      <div className="ct-strip-l fade" style={{ "--d": "0.7s" } as React.CSSProperties}>
        <p className="ct-sentence">
          <span>Let&apos;s make a</span>
          <b className="ct-word" aria-live="off">
            <span ref={word}>{WORDS[0]}</span>
            <i className="ct-caret" />
          </b>
          <span>together.</span>
        </p>
        <p className={`ct-avail${av.on ? " on" : ""}`}>
          <i />
          {av.label}
        </p>
      </div>

      <button
        type="button"
        className="ct-badge fade"
        style={{ "--d": "0.85s" } as React.CSSProperties}
        onClick={() => scrollToTarget(`#${targetId}`)}
        aria-label="Scroll to the contact options"
        data-cursor="Start"
      >
        <svg ref={ring} className="ct-badge-ring" viewBox="0 0 200 200" aria-hidden>
          <defs>
            <path id="ct-ring-path" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
          </defs>
          <text fill="currentColor" fontSize="15" fontWeight="600">
            <textPath href="#ct-ring-path" textLength="486" lengthAdjust="spacing">{RING}</textPath>
          </text>
        </svg>
        <span className="ct-badge-core">
          <Icon name="arrow-down" size={26} />
        </span>
      </button>
    </div>
  );
}
