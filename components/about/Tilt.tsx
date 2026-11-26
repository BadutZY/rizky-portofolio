"use client";

import { useRef, type ReactNode } from "react";
import { m, useMotionValue, useSpring, useTransform } from "motion/react";

/** Card that tilts toward the pointer with spring physics (Motion). Mouse only, so touch scrolling is never blocked. */
export default function Tilt({ children, className = "", max = 9, scale = 1.025 }: { children: ReactNode; className?: string; max?: number; scale?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spx = useSpring(px, { stiffness: 220, damping: 20, mass: 0.6 });
  const spy = useSpring(py, { stiffness: 220, damping: 20, mass: 0.6 });
  const rx = useTransform(spy, [-0.5, 0.5], [max, -max]);
  const ry = useTransform(spx, [-0.5, 0.5], [-max, max]);

  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const leave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <m.div
      ref={ref}
      className={className}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 800 }}
      whileHover={{ scale }}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      {children}
    </m.div>
  );
}
