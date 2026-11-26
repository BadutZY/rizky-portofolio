"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import Reveal from "@/components/ui/Reveal";
import Magnetic from "@/components/ui/Magnetic";
import Tilt from "@/components/about/Tilt";
import { reducedMotion } from "@/lib/gsap";
import { scrambleTo } from "@/lib/scramble";

type Fun = { k: string; v: string };

function FunCard({ f, i }: { f: Fun; i: number }) {
  const val = useRef<HTMLElement>(null);
  const cancel = useRef<() => void>(() => {});
  useEffect(() => () => cancel.current(), []);
  const run = () => {
    if (!val.current) return;
    cancel.current();
    cancel.current = scrambleTo(val.current, f.v, 560);
  };
  return (
    <Tilt className="fun-card spot">
      <div className="fun-in" onPointerEnter={run}>
        <div className="fun-top">
          <span className="fun-k">{f.k}</span>
          <span className="fun-n">{String(i + 1).padStart(2, "0")}</span>
        </div>
        <b className="fun-v" ref={val}>
          {f.v}
        </b>
      </div>
    </Tilt>
  );
}

/** Interests pop in with an Anime.js stagger and are pulled toward the pointer; fun facts are tilting spring cards. */
export default function BeyondCode({ interests, funFacts }: { interests: string[]; funFacts: Fun[] }) {
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = list.current;
    if (!el || reducedMotion()) return;
    const items = Array.from(el.children) as HTMLElement[];
    items.forEach((i) => (i.style.opacity = "0"));
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        animate(items, {
          opacity: [0, 1],
          scale: [0.7, 1],
          translateY: [30, 0],
          rotate: [() => (Math.random() * 16 - 8) | 0, 0],
          duration: 1000,
          ease: "outElastic(1, .7)",
          delay: stagger(110),
          onComplete: () => items.forEach((i) => i.style.removeProperty("transform")),
        });
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="beyond">
      <div>
        <ul ref={list} className="intr-list">
          {interests.map((t) => (
            <li key={t}>
              <Magnetic strength={0.4}>
                <span className="intr" data-cursor-snap>
                  <i aria-hidden />
                  {t}
                </span>
              </Magnetic>
            </li>
          ))}
        </ul>
        <Reveal variant="fade" delay={200}>
          <p className="note">Hover them, they follow your cursor.</p>
        </Reveal>
      </div>
      <ul className="fun2">
        {funFacts.map((f, i) => (
          <Reveal as="li" key={f.k} delay={i * 80} variant="scale">
            <FunCard f={f} i={i} />
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
