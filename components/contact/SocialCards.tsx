"use client";

import { useRef } from "react";
import { socials } from "@/lib/data";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import Magnetic from "@/components/ui/Magnetic";
import { scrambleTo } from "@/lib/scramble";
import { ripple } from "./fx";

/** One big row per platform. The fill sweeps in from the side the pointer entered, the handle decodes, the arrow flies out. */
function Row({ s, i }: { s: (typeof socials)[number]; i: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const handle = useRef<HTMLElement>(null);
  const cancel = useRef<() => void>(() => {});

  const enter = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (el) {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--ox", e.clientY < r.top + r.height / 2 ? "0%" : "100%");
    }
    if (handle.current) {
      cancel.current();
      cancel.current = scrambleTo(handle.current, s.handle, 520);
    }
  };
  const leave = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--ox", e.clientY < r.top + r.height / 2 ? "0%" : "100%");
  };

  return (
    <Reveal as="li" delay={i * 110} variant="up">
      <Magnetic strength={0.05}>
        <a
          ref={ref}
          className="ct-row ct-rip spot"
          href={s.href}
          target="_blank"
          rel="noreferrer"
          data-cursor={s.label}
          onPointerEnter={enter}
          onPointerLeave={leave}
          onPointerDown={ripple}
        >
          <span className="ct-row-n">0{i + 1}</span>
          <span className="cinfo-ic ct-row-ic">
            <Icon name={s.icon} size={22} />
          </span>
          <span className="ct-row-txt">
            <b>{s.label}</b>
            <em ref={handle}>{s.handle}</em>
          </span>
          <span className="ct-row-go" aria-hidden>
            <Icon name="arrow-up-right" size={22} className="ct-go-a" />
            <Icon name="arrow-up-right" size={22} className="ct-go-b" />
          </span>
        </a>
      </Magnetic>
    </Reveal>
  );
}

/** Shown while there is no public email: big links to the social accounts, where a direct message works best. */
export default function SocialCards() {
  return (
    <div className="form-card ct-card" id="ct-start">
      <p className="ct-kicker">
        <i /> Direct message
      </p>
      <h2 className="sc-t ct-title">Let&apos;s talk</h2>
      <p className="lead lead-mut">The easiest way to reach me is a direct message. Pick whichever platform you like best.</p>
      <ul className="ct-rows">
        {socials.map((s, i) => (
          <Row key={s.label} s={s} i={i} />
        ))}
      </ul>
    </div>
  );
}
