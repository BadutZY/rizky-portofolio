"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, reducedMotion } from "@/lib/gsap";
import Reveal from "@/components/ui/Reveal";

type Step = { year: string; title: string; text: string };

/**
 * Timeline with a line that draws itself while you scroll. Each step turns on when the line reaches its dot
 * (year fills in, card lights up) and the step under the reading line is the "current" one.
 */
export default function JourneyTimeline({ items }: { items: Step[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const rows = Array.from(el.querySelectorAll<HTMLElement>(".jt-item"));
    const line = el.querySelector<HTMLElement>(".jt-line");
    const track = el.querySelector<HTMLElement>(".jt-track");
    if (!rows.length || !line || !track) return;

    // vertical center of a step's dot, measured from the top of the list
    const dotY = (row: HTMLElement) => {
      const d = row.querySelector<HTMLElement>(".jt-dot")!;
      return row.offsetTop + d.offsetTop + d.offsetHeight / 2;
    };
    const place = () => {
      const a = dotY(rows[0]);
      const b = dotY(rows[rows.length - 1]);
      for (const n of [line, track]) {
        n.style.top = `${a}px`;
        n.style.height = `${b - a}px`;
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

    el.classList.add("jt-ready");
    ScrollTrigger.addEventListener("refreshInit", place);

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
          onEnter: () => row.classList.add("on"),
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
      });
    }, el);

    // fonts and the map above/below change heights after first paint
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      ScrollTrigger.removeEventListener("refreshInit", place);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={root} className="jt">
      <span className="jt-track" aria-hidden />
      <span className="jt-line" aria-hidden />
      <ol className="jt-list">
        {items.map((j, i) => (
          <Reveal as="li" key={j.year + j.title} delay={i * 40} className="jt-item">
            <span className="jt-dot" aria-hidden />
            <span className="journey-y jt-y">{j.year}</span>
            <div className="jt-body">
              <h3>{j.title}</h3>
              <p>{j.text}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
