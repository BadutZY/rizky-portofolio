"use client";

import { useEffect, useState } from "react";
import { scrollToTarget } from "@/components/layout/SmoothScroll";

type Sec = { id: string; label: string };

/** Side navigation for the About page: dots for each section, the active one follows the scroll, click to glide there. */
export default function AboutRail({ sections }: { sections: Sec[] }) {
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(els.indexOf(e.target as HTMLElement));
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => el && io.observe(el));

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setShown(window.scrollY > 420));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [sections]);

  const pct = sections.length > 1 ? (active / (sections.length - 1)) * 100 : 0;

  return (
    <nav className={`rail${shown ? " show" : ""}`} aria-label="Sections on this page">
      <span className="rail-track" aria-hidden>
        <i style={{ height: `${pct}%` }} />
      </span>
      <ul>
        {sections.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              className={i === active ? "on" : i < active ? "past" : ""}
              onClick={() => scrollToTarget(`#${s.id}`, -40)}
              aria-current={i === active ? "true" : undefined}
              aria-label={s.label}
            >
              <span className="rail-l">{s.label}</span>
              <span className="rail-d" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
