"use client";

import { useEffect, useId, useRef, useState } from "react";
import { gsap, ScrollTrigger, reducedMotion, finePointer } from "@/lib/gsap";
import { scrambleTo } from "@/lib/scramble";
import type { Entry } from "@/lib/data";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import Tilt from "@/components/about/Tilt";

const COLLAPSE_AT = 3;
const split = (period: string) => {
  const year = /\d{4}/.exec(period)?.[0] ?? period;
  return { year, rest: period.replace(year, "").trim() };
};

function Point({ text, i }: { text: string; i: number }) {
  return (
    <li style={{ "--i": i } as React.CSSProperties}>
      <span className="xt-ck" aria-hidden>
        <Icon name="check" size={12} />
      </span>
      <span>{text}</span>
    </li>
  );
}

/** First few points are always visible, the rest open with a smooth height animation. */
function Points({ points }: { points: string[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const head = points.slice(0, COLLAPSE_AT);
  const tail = points.slice(COLLAPSE_AT);

  const toggle = () => {
    setOpen((o) => !o);
    // heights change, so scroll-linked positions below must be measured again once the motion is done
    window.setTimeout(() => ScrollTrigger.refresh(), 720);
  };

  return (
    <>
      <ul className="xt-pts">
        {head.map((p, i) => (
          <Point key={p} text={p} i={i} />
        ))}
      </ul>
      {tail.length > 0 && (
        <>
          <div id={id} className={`xt-more${open ? " open" : ""}`} inert={!open}>
            <div>
              <ul className="xt-pts xt-pts-more">
                {tail.map((p, i) => (
                  <Point key={p} text={p} i={i + COLLAPSE_AT} />
                ))}
              </ul>
            </div>
          </div>
          <button type="button" className="xt-toggle" aria-expanded={open} aria-controls={id} onClick={toggle} data-cursor-snap>
            <span className="xt-toggle-ic" aria-hidden>
              <Icon name="plus" size={14} />
            </span>
            <span>{open ? "Show less" : `Show ${tail.length} more`}</span>
          </button>
        </>
      )}
    </>
  );
}

/**
 * Scroll-driven timeline.
 * - the line draws itself and each dot lights up (with one ping) when the line reaches it, reversing on the way back up
 * - the chapter under the reading line is "current": its card lifts and its year fills in
 * - the big year is sticky next to long cards and scrambles into place; hovering a card scrambles it again
 * - the ghost number inside each card drifts with the scroll, cards tilt toward the pointer (mouse only)
 */
export default function ExperienceTimeline({
  items,
  icon = "briefcase",
  idPrefix,
}: {
  items: Entry[];
  icon?: string;
  idPrefix: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const rows = Array.from(el.querySelectorAll<HTMLElement>(".xt-item"));
    const line = el.querySelector<HTMLElement>(".xt-line");
    const track = el.querySelector<HTMLElement>(".xt-track");
    if (!rows.length || !line || !track) return;

    // vertical center of a dot, measured from the top of the list
    const dotY = (row: HTMLElement) => {
      const d = row.querySelector<HTMLElement>(".xt-dot")!;
      return row.offsetTop + d.offsetTop + d.offsetHeight / 2;
    };
    const place = () => {
      const a = dotY(rows[0]);
      const b = dotY(rows[rows.length - 1]);
      for (const n of [line, track]) {
        n.style.top = `${a}px`;
        n.style.height = `${Math.max(0, b - a)}px`;
      }
    };
    place();

    if (reducedMotion()) {
      rows.forEach((r) => r.classList.add("on"));
      line.style.transform = "scaleY(1)";
      const ro = new ResizeObserver(place);
      ro.observe(el);
      return () => ro.disconnect();
    }

    el.classList.add("xt-ready");
    ScrollTrigger.addEventListener("refreshInit", place);

    // year text: scrambles into place the first time its chapter turns on, and again on hover
    const cancels = new Map<HTMLElement, () => void>();
    const finals = new Map<HTMLElement, string>();
    const scramble = (row: HTMLElement) => {
      const yr = row.querySelector<HTMLElement>(".xt-yr");
      if (!yr) return;
      const text = finals.get(yr) ?? yr.textContent ?? "";
      finals.set(yr, text);
      cancels.get(yr)?.();
      cancels.set(yr, scrambleTo(yr, text, 700));
    };

    const hoverOff: Array<() => void> = [];
    if (finePointer()) {
      rows.forEach((row) => {
        const body = row.querySelector<HTMLElement>(".xt-body");
        if (!body) return;
        const h = () => scramble(row);
        body.addEventListener("pointerenter", h);
        hoverOff.push(() => body.removeEventListener("pointerenter", h));
      });
    }

    const ctx = gsap.context(() => {
      const READ = "62%"; // the reading line: 62% down the viewport
      gsap.fromTo(
        line,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          transformOrigin: "50% 0%",
          scrollTrigger: {
            trigger: el,
            start: () => `top+=${dotY(rows[0])} ${READ}`,
            end: () => `top+=${dotY(rows[rows.length - 1])} ${READ}`,
            scrub: 0.4,
            invalidateOnRefresh: true,
          },
        },
      );

      rows.forEach((row) => {
        const off = () => dotY(row) - row.offsetTop;
        ScrollTrigger.create({
          trigger: row,
          start: () => `top+=${off()} ${READ}`,
          onEnter: () => {
            const first = !row.classList.contains("seen");
            row.classList.add("on", "seen");
            if (first) scramble(row);
          },
          onLeaveBack: () => row.classList.remove("on"),
          invalidateOnRefresh: true,
        });
        ScrollTrigger.create({
          trigger: row,
          start: () => `top+=${off()} ${READ}`,
          end: () => `bottom+=${off()} ${READ}`,
          toggleClass: { targets: row, className: "cur" },
          invalidateOnRefresh: true,
        });

        const ghost = row.querySelector<HTMLElement>(".xt-ghost");
        if (ghost) {
          gsap.fromTo(
            ghost,
            { yPercent: 22 },
            { yPercent: -22, ease: "none", scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: 0.6 } },
          );
        }
      });
    }, el);

    // fonts and the content above change heights after first paint
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      ScrollTrigger.removeEventListener("refreshInit", place);
      hoverOff.forEach((f) => f());
      cancels.forEach((c, yr) => {
        c();
        const t = finals.get(yr);
        if (t) yr.textContent = t;
      });
      ctx.revert();
    };
  }, []);

  return (
    <div ref={root} className="xt">
      <span className="xt-track" aria-hidden />
      <span className="xt-line" aria-hidden />
      <ol className="xt-list">
        {items.map((e, i) => {
          const { year, rest } = split(e.period);
          const now = /present/i.test(e.period);
          return (
            <Reveal as="li" key={e.title + e.period} delay={i * 40} className="xt-item">
              <span className="xt-dot" aria-hidden>
                <Icon name={icon} size={15} />
              </span>
              <div className="xt-side">
                <span className="xt-yr">{year}</span>
                {rest && <span className="xt-rest">{rest}</span>}
                {now && (
                  <span className="xt-now">
                    <i aria-hidden /> Now
                  </span>
                )}
              </div>
              <div id={`${idPrefix}-${i}`} className="xt-body">
                <Tilt className="xt-card spot" max={3} scale={1.012}>
                  <span className="xt-ghost" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="xt-card-in">
                    <h3>{e.title}</h3>
                    <p className="tl2-org">
                      {e.org}
                      {e.place ? <span> / {e.place}</span> : null}
                    </p>
                    <p className="tl2-desc">{e.desc}</p>
                    {e.points && <Points points={e.points} />}
                  </div>
                </Tilt>
              </div>
            </Reveal>
          );
        })}
      </ol>
    </div>
  );
}
