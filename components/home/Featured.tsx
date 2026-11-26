"use client";

import { useEffect, useRef, useState } from "react";
import { projects } from "@/lib/data";
import { gsap, reducedMotion } from "@/lib/gsap";
import CoverImage from "@/components/ui/CoverImage";
import Icon from "@/components/ui/Icon";
import StackTag from "@/components/ui/StackTag";
import SectionHead from "@/components/pages/SectionHead";
import ProjectModal from "@/components/pages/ProjectModal";

/** Sticky stacking project cards: each card slides over the previous one, which scales back. */
export default function Featured() {
  const root = useRef<HTMLElement>(null);
  const list = projects.filter((p) => p.featured);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (reducedMotion() || !root.current) return;
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".fcard");
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (next) {
          gsap.to(card.querySelector(".fcard-in"), {
            scale: 0.92,
            opacity: 0.5,
            ease: "none",
            scrollTrigger: { trigger: next, start: "top 85%", end: "top 12%", scrub: true },
          });
        }
        gsap.fromTo(
          card.querySelector(".art, img"),
          { yPercent: -6, scale: 1.12 },
          { yPercent: 6, scale: 1.04, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true } },
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="sec featured">
      <div className="wrap">
        <SectionHead index="03" title="Selected work" sub="Projects I'm proud of" href="/projects" cta="All projects" />
        <div className="fstack">
          {list.map((p, i) => (
            <article key={p.slug} className="fcard" style={{ "--n": i } as React.CSSProperties}>
              <button type="button" className="fcard-in" data-cursor="View" onClick={() => setActive(p.slug)} aria-haspopup="dialog">
                <div className="fcard-media"><CoverImage p={p} /></div>
                <div className="fcard-info">
                  <span className="fcard-n">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                  <ul className="tags">
                    {p.stack.slice(0, 3).map((s) => (
                      <StackTag key={s} name={s} />
                    ))}
                  </ul>
                  <span className="fcard-go">
                    View details <Icon name="arrow-up-right" size={18} />
                  </span>
                </div>
              </button>
            </article>
          ))}
        </div>
      </div>
      <ProjectModal slug={active} onChange={setActive} />
    </section>
  );
}
