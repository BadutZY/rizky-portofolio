"use client";

import { LazyMotion, MotionConfig } from "motion/react";

const features = () => import("@/lib/motion-features").then((m) => m.default);

/** Motion (motion.dev) setup: lazy engine, and reduced-motion handled for every component in one place. */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 380, damping: 34, mass: 0.7 }}>
      <LazyMotion features={features} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
