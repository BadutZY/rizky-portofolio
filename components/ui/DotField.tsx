"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Interactive monochrome dot grid. Dots swell and drift away from the cursor, plus a slow ambient wave.
 * Cheap on purpose: dots are batched into a few paths by (radius, alpha) bucket instead of one fill per dot,
 * the loop runs on the shared GSAP ticker, drops to 30fps when the pointer is idle and stops offscreen.
 */
export default function DotField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gap = 30;
    let w = 0, h = 0, dpr = 1, visible = true, lastDraw = 0, idleSince = 0;
    let color = "255,255,255";
    const m = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

    const readColor = () => {
      color = getComputedStyle(document.documentElement).getPropertyValue("--fg-rgb").trim() || "255,255,255";
    };
    const resize = () => {
      const r = c.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = r.width;
      h = r.height;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t: number) => {
      m.x += (m.tx - m.x) * 0.14;
      m.y += (m.ty - m.y) * 0.14;
      ctx.clearRect(0, 0, w, h);
      const cols = Math.ceil(w / gap) + 1;
      const rows = Math.ceil(h / gap) + 1;
      const buckets = new Map<number, Path2D>();
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          let x = i * gap;
          let y = j * gap;
          const dx = x - m.x;
          const dy = y - m.y;
          const d2 = dx * dx + dy * dy;
          const wave = reduce ? 0.5 : Math.sin(i * 0.32 + j * 0.24 + t * 0.0012) * 0.5 + 0.5;
          let f = 0;
          if (d2 < 190 * 190) {
            const d = Math.sqrt(d2);
            f = 1 - d / 190;
            if (d > 0) {
              x += (dx / d) * f * f * 16;
              y += (dy / d) * f * f * 16;
            }
          }
          const r = Math.round((0.7 + wave * 0.8 + f * 2.6) * 4) / 4;
          const a = Math.round((0.1 + wave * 0.12 + f * 0.65) * 16);
          const key = a * 1000 + Math.round(r * 4);
          let p = buckets.get(key);
          if (!p) buckets.set(key, (p = new Path2D()));
          p.moveTo(x + r, y);
          p.arc(x, y, r, 0, 6.2832);
        }
      }
      buckets.forEach((p, key) => {
        ctx.fillStyle = `rgba(${color},${(Math.floor(key / 1000) / 16).toFixed(3)})`;
        ctx.fill(p);
      });
    };

    const tick = (time: number) => {
      if (!visible || document.hidden) return;
      const now = performance.now();
      const moving = Math.abs(m.tx - m.x) + Math.abs(m.ty - m.y) > 0.5 && m.tx > -999;
      if (moving) idleSince = now;
      const idle = now - idleSince > 1200;
      if (idle && now - lastDraw < 33) return;
      lastDraw = now;
      draw(time * 1000);
    };
    const onMove = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      m.tx = e.clientX - r.left;
      m.ty = e.clientY - r.top;
      if (m.x < -999) {
        m.x = m.tx;
        m.y = m.ty;
      }
      idleSince = performance.now();
    };
    const onLeave = () => {
      m.tx = -9999;
      m.ty = -9999;
    };

    readColor();
    resize();
    const mo = new MutationObserver(() => {
      readColor();
      if (reduce) draw(0);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(c);
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw(0);
    });
    ro.observe(c);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    if (reduce) draw(0);
    else gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      mo.disconnect();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className={`dotfield ${className}`} aria-hidden />;
}
