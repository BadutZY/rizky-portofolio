"use client";

import { useEffect, useState } from "react";
import { scrollToTarget } from "@/components/layout/SmoothScroll";
import Reveal from "@/components/ui/Reveal";
import type { Entry } from "@/lib/data";

const yearOf = (period: string) => /\d{4}/.exec(period)?.[0] ?? period;

/**
 * Horizontal "route map" of the chapters, oldest on the left. The line draws itself and the dots light up one by one
 * when it scrolls into view; later it follows the timeline below and any dot glides you to its chapter.
 * `items` are newest first (same order as the timeline); `targetPrefix` matches the ids set on the timeline rows.
 */
export default function YearStrip({ items, targetPrefix }: { items: Entry[]; targetPrefix: string }) {
  const [active, setActive] = useState<number | null>(null);

  // chronological order, but keep the original index so every dot knows which card it belongs to
  const chrono = items.map((e, i) => ({ e, i })).reverse();

  useEffect(() => {
    const els = items.map((_, i) => document.getElementById(`${targetPrefix}-${i}`));
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) setActive(els.indexOf(en.target as HTMLElement));
        }
      },
      { rootMargin: "-40% 0px -50% 0px" },
    );
    els.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [items, targetPrefix]);

  const n = chrono.length;

  return (
    <Reveal variant="fade">
      <nav className="ys" style={{ "--n": n } as React.CSSProperties} aria-label="Jump to a chapter">
        <span className="ys-line" aria-hidden>
          <i className="ys-fill" />
        </span>
        {chrono.map(({ e, i }, k) => {
          const now = /present/i.test(e.period);
          return (
            <button
              key={e.title + e.period}
              type="button"
              className={`ys-i${active === i ? " on" : ""}${now ? " now" : ""}`}
              style={{ "--i": k } as React.CSSProperties}
              onClick={() => scrollToTarget(`#${targetPrefix}-${i}`, -110)}
              aria-label={`Go to ${e.title}`}
            >
              <span className="ys-dot" aria-hidden>
                <b />
              </span>
              <span className="ys-y">{yearOf(e.period)}</span>
              <span className="ys-t">{e.title}</span>
              {now && <span className="ys-now">Now</span>}
            </button>
          );
        })}
      </nav>
    </Reveal>
  );
}
