"use client";

import { useEffect, useRef } from "react";
import { about } from "@/lib/data";
import { ScrollTrigger, reducedMotion } from "@/lib/gsap";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";
import TransitionLink from "@/components/layout/TransitionLink";

/** Large statement whose words light up one by one as you scroll through it. */
export default function Statement() {
  const root = useRef<HTMLElement>(null);
  const words = about.statement.split(" ");

  // words light up as you scroll through the text. Only a class is toggled when a word flips (the fade is a CSS
  // transition), so scrolling does no per-frame work here (the old version scrubbed 40 tweens every frame).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>(".stmt-w"));
    if (reducedMotion()) {
      items.forEach((w) => w.classList.add("lit"));
      return;
    }
    let lit = -1;
    const apply = (progress: number) => {
      const n = Math.round(progress * items.length);
      if (n === lit) return;
      const from = Math.min(n, Math.max(lit, 0));
      const to = Math.max(n, lit);
      for (let i = from; i < to; i++) items[i]?.classList.toggle("lit", i < n);
      lit = n;
    };
    const st = ScrollTrigger.create({
      trigger: el.querySelector(".stmt-text"),
      start: "top 78%",
      end: "bottom 52%",
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => {
        lit = -1;
        items.forEach((w) => w.classList.remove("lit"));
        apply(self.progress);
      },
    });
    return () => st.kill();
  }, []);

  return (
    <section ref={root} id="intro-statement" className="sec stmt">
      <div className="wrap">
        <Reveal variant="fade">
          <p className="eyebrow">
            <span>01</span> <i className="eyebrow-line" /> <span>Introduction</span>
          </p>
        </Reveal>
        <p className="stmt-text">
          {words.map((w, i) => (
            <span key={i} className="stmt-w">
              {w}{" "}
            </span>
          ))}
        </p>
        <Reveal>
          <TransitionLink href="/about" className="btn" data-cursor="Go">
            More about me <Icon name="arrow-right" size={18} />
          </TransitionLink>
        </Reveal>
      </div>
    </section>
  );
}
