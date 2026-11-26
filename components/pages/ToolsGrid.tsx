"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { tools } from "@/lib/data";
import SkillIcon from "@/components/ui/SkillIcon";
import { reducedMotion } from "@/lib/gsap";
import { bindTilt } from "@/lib/tilt";

/** Daily tools. Tiles pop in with an Anime.js grid stagger that ripples from the center, then tilt in 3D toward the pointer. */
export default function ToolsGrid() {
  const root = useRef<HTMLUListElement>(null);

  // pointer tilt + glare on every tile (one delegated listener)
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    return bindTilt(el, ".tool", 10);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || reducedMotion()) return;
    const items = Array.from(el.children) as HTMLElement[];
    items.forEach((i) => (i.style.opacity = "0"));
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const cols = getComputedStyle(el).gridTemplateColumns.split(" ").length || 3;
        const rows = Math.ceil(items.length / cols);
        animate(items, {
          opacity: [0, 1],
          scale: [0.86, 1],
          translateY: [24, 0],
          duration: 900,
          ease: "outExpo",
          delay: stagger(55, { grid: [cols, rows], from: "center" }),
          onComplete: () => items.forEach((i) => i.style.removeProperty("transform")),
        });
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <ul ref={root} className="tools tools-grid">
      {tools.map((t) => (
        <li key={t.name}>
          <div className="tool tilt">
            <SkillIcon skill={t} size={30} />
            <span>{t.name}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}