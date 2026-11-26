"use client";

import { useEffect, useRef } from "react";
import { gsap, reducedMotion } from "@/lib/gsap";

/** Paragraph whose words light up one by one while you scroll through it (GSAP scrub, same idea as the Home statement). */
export default function ScrollWords({
  text,
  className = "lead",
  start = "top 90%",
  end = "bottom 62%",
}: {
  text: string;
  className?: string;
  start?: string;
  end?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll(".sw"),
        { opacity: 0.16 },
        { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: el, start, end, scrub: 0.5 } },
      );
    }, el);
    return () => ctx.revert();
  }, [start, end]);

  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <span key={i} className="sw">
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
