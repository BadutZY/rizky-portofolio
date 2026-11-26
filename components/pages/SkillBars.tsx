"use client";

import { useEffect, useRef } from "react";
import { skillLevels } from "@/lib/data";
import { gsap, ScrollTrigger, reducedMotion } from "@/lib/gsap";

export default function SkillBars() {
  const root = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (reducedMotion() || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".sb-fill").forEach((f, i) => {
        gsap.fromTo(f, { scaleX: 0 }, { scaleX: 1, duration: 1.4, delay: i * 0.05, ease: "expo.out", scrollTrigger: { trigger: f, start: "top 92%", once: true } });
      });
    }, root);
    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <ul ref={root} className="sb">
      {skillLevels.map((s) => (
        <li key={s.name}>
          <div className="sb-top">
            <span>{s.name}</span>
            <b>{s.level}%</b>
          </div>
          <div className="sb-track">
            <span className="sb-fill" style={{ width: `${s.level}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
