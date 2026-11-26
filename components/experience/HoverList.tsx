"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { scrambleTo } from "@/lib/scramble";

type Row = { title: string; org: string; year: string };

function HoverRow({ r, i, icon }: { r: Row; i: number; icon: string }) {
  const yr = useRef<HTMLSpanElement>(null);
  const cancel = useRef<() => void>(() => {});
  const timer = useRef(0);
  const [hot, setHot] = useState(false);

  useEffect(
    () => () => {
      cancel.current();
      window.clearTimeout(timer.current);
    },
    [],
  );

  const on = (touch: boolean) => {
    setHot(true);
    if (yr.current) {
      cancel.current();
      cancel.current = scrambleTo(yr.current, r.year, 480);
    }
    // touch has no hover, so the highlight plays once on tap and fades again
    if (touch) {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setHot(false), 900);
    }
  };

  return (
    <div
      className={`hv-row${hot ? " hot" : ""}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && on(false)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHot(false)}
      onPointerDown={(e) => e.pointerType !== "mouse" && on(true)}
    >
      <span className="hv-n" aria-hidden>
        {String(i + 1).padStart(2, "0")}
      </span>
      <span className="hv-ic" aria-hidden>
        <Icon name={icon} size={18} />
      </span>
      <span className="hv-tx">
        <b>{r.title}</b>
        <em>{r.org}</em>
      </span>
      <span className="hv-y" ref={yr}>
        {r.year}
      </span>
      <span className="hv-go" aria-hidden>
        <Icon name="arrow-up-right" size={18} />
      </span>
    </div>
  );
}

/** List whose rows draw their top line when scrolled into view, then fill, scramble the year and show an arrow on hover or tap. */
export default function HoverList({ rows, icon }: { rows: Row[]; icon: string }) {
  return (
    <ul className="hv">
      {rows.map((r, i) => (
        <Reveal as="li" key={r.title} delay={i * 80} className="hv-li">
          <HoverRow r={r} i={i} icon={icon} />
        </Reveal>
      ))}
    </ul>
  );
}
