"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Portrait from "./Portrait";

const Badge3D = dynamic(() => import("@/components/three/Badge3D"), { ssr: false });

function webglOk() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * About page hero object. The 3D engine (three, Rapier) is a separate chunk that only loads when this block
 * is near the screen, runs only while visible, and the static portrait is used instead with reduced motion
 * or when WebGL is missing, so the page is complete either way.
 */
export default function BadgeSection() {
  const box = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"pending" | "3d" | "static">("pending");
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMode(reduce || !webglOk() ? "static" : "3d");
    const el = box.current;
    if (!el) return;
    const a = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "400px" });
    // a small margin keeps the badge running until it is really out of sight, so it does not stop and restart
    // while the card is only partly covered during scrolling
    const b = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "120px" });
    a.observe(el);
    b.observe(el);
    return () => {
      a.disconnect();
      b.disconnect();
    };
  }, []);

  if (mode === "static") return <Portrait />;

  return (
    <div ref={box} className="badge3d" data-lenis-prevent-touch>
      {mode === "3d" && near && <Badge3D active={visible} />}
      <span className="badge3d-hint">Drag the badge</span>
    </div>
  );
}