"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, reducedMotion } from "@/lib/gsap";
import type { Entry } from "@/lib/data";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";

/** Vertical timeline whose line draws itself while scrolling. */
export default function Timeline({ items, icon = "briefcase" }: { items: Entry[]; icon?: string }) {
  const root = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const line = root.current?.querySelector<HTMLElement>(".tl2-fill");
    if (!line || reducedMotion()) return;
    const t = gsap.fromTo(
      line,
      { scaleY: 0 },
      { scaleY: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top 70%", end: "bottom 60%", scrub: 0.6 } },
    );
    return () => {
      t.scrollTrigger?.kill();
      t.kill();
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <ol ref={root} className="tl2">
      <span className="tl2-line" aria-hidden>
        <span className="tl2-fill" />
      </span>
      {items.map((e, i) => (
        <Reveal as="li" key={e.title + e.period} delay={i * 40}>
          <span className="tl2-node" aria-hidden>
            <Icon name={icon} size={16} />
          </span>
          <div className="tl2-card spot">
            <p className="tl2-period">{e.period}</p>
            <h3>{e.title}</h3>
            <p className="tl2-org">
              {e.org}
              {e.place ? <span> / {e.place}</span> : null}
            </p>
            <p className="tl2-desc">{e.desc}</p>
            {e.points && (
              <ul className="tl2-points">
                {e.points.map((p) => (
                  <li key={p}>
                    <Icon name="check" size={14} /> {p}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>
      ))}
    </ol>
  );
}
