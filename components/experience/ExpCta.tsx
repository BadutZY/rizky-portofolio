"use client";

import { useEffect, useRef } from "react";
import { gsap, reducedMotion } from "@/lib/gsap";
import { site } from "@/lib/data";
import Icon from "@/components/ui/Icon";
import Magnetic from "@/components/ui/Magnetic";
import Reveal from "@/components/ui/Reveal";
import SplitText from "@/components/ui/SplitText";
import TransitionLink from "@/components/layout/TransitionLink";

/**
 * Closing card. The title rises word by word, a big arrow turns and drifts while the card scrolls past,
 * and the border and background glow where the pointer is (the .spot / --mx --my system used on all cards).
 */
export default function ExpCta() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const arrow = el?.querySelector<HTMLElement>(".cvx-arrow");
    if (!el || !arrow || reducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        arrow,
        { rotate: -35, yPercent: 30, xPercent: -10 },
        { rotate: 0, yPercent: -20, xPercent: 10, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.7 } },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="wrap">
      <Reveal variant="scale">
        <div className="cv cvx spot">
          <span className="cvx-arrow" aria-hidden>
            <Icon name="arrow-up-right" size={160} />
          </span>
          <h2 className="cv-t">
            <SplitText text="Want to build something together?" as="span" stagger={50} />
          </h2>
          <Reveal delay={350} variant="fade">
            <p className="lead lead-mut">I'm open to collaborating and happy to build a website for you. Tell me about your idea.</p>
          </Reveal>
          <Reveal delay={500}>
            <div className="btn-row">
              <Magnetic>
                <TransitionLink className="btn btn-solid btn-lg" href="/contact" data-cursor="Go">
                  Get in touch <Icon name="arrow-up-right" size={18} />
                </TransitionLink>
              </Magnetic>
              {site.cv && (
                <Magnetic>
                  <a className="btn btn-lg" href={site.cv} data-cursor="CV">
                    <Icon name="download" size={18} /> Download CV
                  </a>
                </Magnetic>
              )}
            </div>
          </Reveal>
        </div>
      </Reveal>
    </div>
  );
}
