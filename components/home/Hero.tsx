"use client";

import { Fragment, useEffect, useRef } from "react";
import { site, skillNames } from "@/lib/data";
import { scrambleTo } from "@/lib/scramble";
import { attachTitleGlitch } from "@/lib/title-glitch";
import { attachAsciiLens } from "@/lib/ascii-lens";
import { whenGo } from "@/lib/motion";
import Magnetic from "@/components/ui/Magnetic";
import Icon from "@/components/ui/Icon";
import Marquee from "@/components/ui/Marquee";
import PageBackdrop from "@/components/ui/PageBackdrop";
import Clock from "@/components/ui/Clock";
import TransitionLink from "@/components/layout/TransitionLink";
import { scrollToTarget } from "@/components/layout/SmoothScroll";
import "./hero-name.css";

function RoleCycle() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let i = 0;
    let cancel = () => {};
    const id = setInterval(() => {
      if (document.hidden || !ref.current) return;
      i = (i + 1) % site.roles.length;
      cancel();
      cancel = scrambleTo(ref.current, site.roles[i], 600);
    }, 3500);
    return () => {
      clearInterval(id);
      cancel();
    };
  }, []);
  return (
    <span ref={ref} aria-label={site.roles[0]}>
      {site.roles[0]}
    </span>
  );
}

/** Overlay copies of every word for the glitch. The hero uses only three of the five layers the page titles have (no torn slices). */
const LAYERS = ["r", "c", "x"] as const;

/** One word of the name, split into letters. Same markup as components/ui/GlitchTitle.tsx, so both effects work on it. */
function NameWord({ w }: { w: string }) {
  return (
    <span className="st-word gt-word" data-gword>
      {Array.from(w).map((c, i) => (
        <span key={i} className="st-mask">
          <span className="st-c">{c}</span>
        </span>
      ))}
      {LAYERS.map((k) => (
        <span key={k} className="gt-ov" data-k={k}>
          {Array.from(w).map((c, i) => (
            <span key={i} className="st-mask">
              {c}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

export default function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [first, ...rest] = site.name.split(" ");
  const marquee = skillNames;

  // fit the name to the container: measure the real rendered text and size the font so every line fits
  // (width scales linearly with font-size, so one measurement is exact). Re-runs on resize and when fonts load.
  useEffect(() => {
    const title = titleRef.current;
    if (!title) return;
    const MAX = 13 * 16; // 13rem
    const MIN = 28;
    let raf = 0;
    const fit = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const avail = title.clientWidth;
        if (!avail) return;
        const size = parseFloat(getComputedStyle(title).fontSize) || 100;
        // each line is a max-content box, so offsetWidth is the real text width (and ignores any glitch transform)
        let widest = 0;
        title.querySelectorAll<HTMLElement>(".hl > span").forEach((el) => {
          widest = Math.max(widest, el.offsetWidth);
        });
        if (!widest) return;
        const next = Math.max(MIN, Math.min(MAX, (size * avail * 0.97) / widest));
        if (Math.abs(next - size) > 0.5) title.style.fontSize = `${next.toFixed(2)}px`;
      });
    };
    fit();
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(title);
    window.addEventListener("resize", fit);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  // name: idle glitch (one word at a time) + ASCII lens under the pointer, the light versions (see `lite` in lib/)
  useEffect(() => {
    const title = titleRef.current;
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    const canvas = canvasRef.current;
    if (!title || !wrap || !inner || !canvas) return;
    const stopGlitch = attachTitleGlitch(inner, { lite: true });
    const stopLens = attachAsciiLens(wrap, inner, canvas, { lite: true });
    // once the name has finished rising in: let glitch slices overflow the line boxes and enable the hover lens
    let t = 0;
    const stopGo = whenGo(() => {
      t = window.setTimeout(() => title.classList.add("is-revealed"), 1500);
    });
    return () => {
      stopGlitch();
      stopLens();
      stopGo();
      clearTimeout(t);
    };
  }, []);

  const d = (s: string) => ({ "--d": s }) as React.CSSProperties;

  return (
    <section id="top" className="hero">
      <PageBackdrop variant="home" />
      <div className="hero-dots" aria-hidden />
      <div className="hero-glow" aria-hidden />

      <div className="wrap hero-inner hero-fg">
        <div className="hero-meta fade" style={d("0.1s")}>
          {site.available && (
            <span className="status">
              <i /> {site.status}
            </span>
          )}
          <span className="hero-loc">
            <Icon name="map-pin" size={14} /> {site.location} <b>/</b> <Clock />
          </span>
        </div>

        <h1 ref={titleRef} className="hero-title" aria-label={site.name}>
          <span ref={wrapRef} className="gt-wrap hero-name">
            <span ref={innerRef} className="gt" aria-hidden>
              <span className="hl">
                <span>
                  <NameWord w={first} />
                </span>
              </span>
              <span className="hl">
                <span>
                  {rest.map((w, i) => (
                    <Fragment key={w + i}>
                      {i > 0 ? " " : null}
                      <NameWord w={w} />
                    </Fragment>
                  ))}
                </span>
              </span>
            </span>
            <canvas ref={canvasRef} className="gt-canvas" aria-hidden />
          </span>
        </h1>

        <div className="hero-bottom">
          <p className="hero-role fade" style={d("0.5s")}>
            <RoleCycle />
          </p>
          <p className="hero-intro fade" style={d("0.6s")}>
            {site.intro}
          </p>
          <div className="hero-cta fade" style={d("0.7s")}>
            <Magnetic>
              <TransitionLink className="btn btn-solid" href="/projects" data-cursor="Go">
                View projects <Icon name="arrow-up-right" size={18} />
              </TransitionLink>
            </Magnetic>
            <Magnetic>
              <TransitionLink className="btn" href="/contact">
                Contact me
              </TransitionLink>
            </Magnetic>
          </div>
        </div>

        <div className="hero-badge fade" style={d("0.9s")} aria-hidden>
          <svg viewBox="0 0 160 160" className="hero-badge-ring">
            <defs>
              <path id="badgepath" d="M80 80 m-62 0 a62 62 0 1 1 124 0 a62 62 0 1 1 -124 0" />
            </defs>
            <text fontSize="11" fill="currentColor">
              <textPath href="#badgepath" textLength="388" lengthAdjust="spacing">{site.badge}</textPath>
            </text>
          </svg>
          <Icon name="arrow-down" size={26} className="hero-badge-ic" />
        </div>

        <button className="scroll-hint fade" style={d("1s")} onClick={() => scrollToTarget("#intro-statement", -40)} aria-label="Scroll down">
          <span className="scroll-line" />
          Scroll
        </button>
      </div>

      <div className="hero-marquee fade" style={d("0.8s")}>
        <Marquee items={marquee} />
      </div>
    </section>
  );
}