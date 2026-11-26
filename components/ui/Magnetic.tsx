"use client";

import { useRef, type ReactNode } from "react";
import { m, useMotionValue, useSpring } from "motion/react";

/**
 * Element pulled toward the cursor with real spring physics (Motion), so it follows the pointer and settles
 * with velocity instead of restarting a CSS transition on every pointer event. Fine pointers only.
 */
export default function Magnetic({ children, strength = 0.3 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.5 });

  const enabled = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || !enabled()) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const leave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <m.span ref={ref} className="mag" style={{ x: sx, y: sy, display: "inline-block" }} onPointerMove={move} onPointerLeave={leave}>
      {children}
    </m.span>
  );
}
