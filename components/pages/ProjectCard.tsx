"use client";

import { useRef } from "react";
import { m, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import type { Project } from "@/lib/data";
import CoverImage from "@/components/ui/CoverImage";
import Icon from "@/components/ui/Icon";

const TAGS = 4;

/**
 * Project card. Everything here is driven by Motion springs / scroll progress, transform and opacity only:
 * - the card tilts toward the pointer (mouse only, so touch scrolling is never blocked)
 * - the cover drifts the opposite way (pointer parallax) and slides slowly while the card crosses the screen (scroll parallax)
 * - a soft light follows the pointer, and a shine sweeps across on hover
 * - the stack tags lift one after another on hover
 */
export default function ProjectCard({ p, i, onOpen }: { p: Project; i: number; onOpen: (slug: string) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spx = useSpring(px, { stiffness: 200, damping: 22 });
  const spy = useSpring(py, { stiffness: 200, damping: 22 });
  const rx = useTransform(spy, [-0.5, 0.5], [4, -4]);
  const ry = useTransform(spx, [-0.5, 0.5], [-5, 5]);
  const ix = useTransform(spx, [-0.5, 0.5], [12, -12]);
  const iy = useTransform(spy, [-0.5, 0.5], [9, -9]);

  const { scrollYProgress } = useScroll({ target: mediaRef, offset: ["start end", "end start"] });
  const sy = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  const move = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    const r = el?.getBoundingClientRect();
    if (!el || !r) return;
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    px.set(x - 0.5);
    py.set(y - 0.5);
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
  };
  const leave = () => {
    px.set(0);
    py.set(0);
  };

  const tags = p.stack.slice(0, TAGS);
  const more = p.stack.length - tags.length;

  return (
    <m.button
      ref={ref}
      type="button"
      className="pcard"
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      whileTap={{ scale: 0.985 }}
      data-cursor="View"
      onClick={() => onOpen(p.slug)}
      onPointerMove={move}
      onPointerLeave={leave}
      aria-haspopup="dialog"
    >
      <div className="pcard-media" ref={mediaRef}>
        <m.div className="pcard-img" style={{ y: sy }}>
          <m.div className="pcard-img-in" style={{ x: ix, y: iy }}>
            <div className="pcard-zoom">
              <CoverImage p={p} />
            </div>
          </m.div>
        </m.div>
        <span className="pcard-glow" aria-hidden />
        <span className="pcard-shine" aria-hidden />
        {p.featured && (
          <span className="pcard-feat">
            <Icon name="star" size={13} /> Featured
          </span>
        )}
        <span className="pcard-view" aria-hidden>
          View project
        </span>
        <span className="pcard-go">
          <Icon name="arrow-up-right" size={22} />
        </span>
      </div>
      <div className="pcard-info">
        <span className="pcard-idx">{String(i + 1).padStart(2, "0")}</span>
        <h3>
          <span className="pcard-title">{p.title}</span>
        </h3>
        <span className="pcard-kind">
          {p.kind} / {p.year}
        </span>
      </div>
      <p className="pcard-desc">{p.desc}</p>
      <ul className="pcard-tags" aria-label="Tech stack">
        {tags.map((t, k) => (
          <li key={t} style={{ "--t": `${k * 45}ms` } as React.CSSProperties}>
            {t}
          </li>
        ))}
        {more > 0 && (
          <li className="more" style={{ "--t": `${tags.length * 45}ms` } as React.CSSProperties}>
            +{more}
          </li>
        )}
      </ul>
    </m.button>
  );
}
