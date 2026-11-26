"use client";

import { useEffect, useRef } from "react";
import { site } from "@/lib/data";

/** Tiny analog clock for the site owner's timezone. Hands move with a spring-like tick, updated once a second. */
export default function AnalogClock() {
  const h = useRef<SVGLineElement>(null);
  const m = useRef<SVGLineElement>(null);
  const s = useRef<SVGLineElement>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "numeric", second: "numeric", hour12: false, timeZone: site.timezone });
    const tick = () => {
      const p = Object.fromEntries(fmt.formatToParts(new Date()).filter((x) => x.type !== "literal").map((x) => [x.type, Number(x.value)]));
      const sec = p.second || 0;
      const min = (p.minute || 0) + sec / 60;
      const hr = ((p.hour || 0) % 12) + min / 60;
      h.current?.setAttribute("transform", `rotate(${hr * 30} 50 50)`);
      m.current?.setAttribute("transform", `rotate(${min * 6} 50 50)`);
      s.current?.setAttribute("transform", `rotate(${sec * 6} 50 50)`);
    };
    tick();
    const id = setInterval(() => !document.hidden && tick(), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <svg className="ct-clock" viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="2" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1="50" y1="7" x2="50" y2={i % 3 === 0 ? 15 : 11} stroke="currentColor" strokeOpacity={i % 3 === 0 ? 0.9 : 0.4} strokeWidth={i % 3 === 0 ? 3 : 2} strokeLinecap="round" transform={`rotate(${i * 30} 50 50)`} />
      ))}
      <line ref={h} x1="50" y1="50" x2="50" y2="28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line ref={m} x1="50" y1="50" x2="50" y2="17" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line ref={s} x1="50" y1="58" x2="50" y2="14" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round" className="ct-sec" />
      <circle cx="50" cy="50" r="3.2" fill="currentColor" />
    </svg>
  );
}
