"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { MONO, SCRAMBLE, clamp, hash, type Ripple } from "@/lib/ascii";

/** Brightness ramp: light to dense. The letter body is drawn with these, so edges soften and the middle stays solid. */
const RAMP = " .:-=+*#%@";

/**
 * A giant word drawn with text symbols instead of pixels.
 * The word is rendered to a hidden mask, sampled into a grid of cells, and every cell becomes one character
 * (dense symbols inside the letters, lighter ones on the edges).
 * Interaction: the pointer (mouse, pen or finger) pushes the characters away and makes them flicker through code
 * symbols, leaving a fading trail. A click or tap sends a ring through the letters. Characters also reveal themselves
 * with a left to right sweep the first time the footer scrolls into view.
 * Cheap on purpose: one canvas, one fillStyle, throttled to ~30fps when nothing is happening, paused offscreen.
 */
export default function AsciiName({ text, className = "" }: { text: string; className?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!box || !c || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, cw = 8, ch = 14, cols = 0, rows = 0, dpr = 1, fs = 12;
    let cov = new Float32Array(0);
    let heat = new Float32Array(0);
    let color = "255,255,255";
    let visible = false;
    let seen = false;
    let revealAt = 0; // performance.now() when the sweep started (0 = not yet)
    let lastDraw = 0;
    let lastActive = 0;
    let prevDraw = 0;
    let alive = true;
    const m = { x: -9999, y: -9999, tx: -9999, ty: -9999, on: false };
    let ripples: Ripple[] = [];
    const REVEAL_MS = 1900;

    const readColor = () => {
      color = getComputedStyle(document.documentElement).getPropertyValue("--fg-rgb").trim() || "255,255,255";
    };

    /** Build the grid: render the word big into a hidden canvas, then average it down to one coverage value per cell. */
    const build = () => {
      W = Math.floor(box.clientWidth);
      if (W < 40) return false;
      const target = W < 520 ? 6.5 : W < 900 ? 8 : W < 1400 ? 9.5 : 11;
      cols = Math.max(20, Math.round(W / target));
      cw = W / cols;
      fs = cw / 0.6; // a monospace glyph is ~0.6em wide
      ch = Math.round(fs * 1.12);

      const family = getComputedStyle(document.body).fontFamily || "sans-serif";
      const probe = document.createElement("canvas").getContext("2d")!;
      const spec = (px: number) => `800 ${px}px ${family}`;
      probe.font = spec(100);
      try {
        (probe as unknown as { letterSpacing: string }).letterSpacing = "-3px";
      } catch {}
      const tw = probe.measureText(text).width || 300;
      const F = (W * 0.94 * 100) / tw;
      probe.font = spec(F);
      try {
        (probe as unknown as { letterSpacing: string }).letterSpacing = `${(-0.03 * F).toFixed(2)}px`;
      } catch {}
      const mt = probe.measureText(text);
      const asc = mt.actualBoundingBoxAscent || F * 0.72;
      const desc = mt.actualBoundingBoxDescent || 0;
      const glyphH = asc + desc;
      rows = Math.max(6, Math.ceil((glyphH + ch * 2) / ch));
      H = rows * ch;

      // mask
      const mask = document.createElement("canvas");
      mask.width = Math.round(W);
      mask.height = Math.round(H);
      const mx = mask.getContext("2d", { willReadFrequently: true })!;
      mx.fillStyle = "#000";
      mx.font = spec(F);
      try {
        (mx as unknown as { letterSpacing: string }).letterSpacing = `${(-0.03 * F).toFixed(2)}px`;
      } catch {}
      mx.textAlign = "center";
      mx.textBaseline = "alphabetic";
      mx.fillText(text, W / 2, (H + glyphH) / 2 - desc);
      const data = mx.getImageData(0, 0, mask.width, mask.height).data;
      const mw = mask.width;

      cov = new Float32Array(cols * rows);
      heat = new Float32Array(cols * rows);
      const S = 3; // samples per axis per cell
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          let sum = 0;
          for (let sy = 0; sy < S; sy++) {
            for (let sx = 0; sx < S; sx++) {
              const px = Math.min(mw - 1, Math.floor(i * cw + ((sx + 0.5) / S) * cw));
              const py = Math.min(mask.height - 1, Math.floor(j * ch + ((sy + 0.5) / S) * ch));
              sum += data[(py * mw + px) * 4 + 3];
            }
          }
          cov[j * cols + i] = sum / (S * S * 255);
        }
      }

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      c.style.width = `${W}px`;
      c.style.height = `${H}px`;
      box.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    };

    const draw = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - prevDraw) / 1000));
      prevDraw = now;
      m.x += (m.tx - m.x) * 0.22;
      m.y += (m.ty - m.y) * 0.22;

      ctx.clearRect(0, 0, W, H);
      ctx.font = `700 ${fs.toFixed(2)}px ${MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `rgb(${color})`;

      const R = Math.max(90, Math.min(190, W * 0.11));
      const R2 = R * R;
      const decay = Math.exp(-dt * 2.4);
      const t = reduce ? 0 : now;
      const step = Math.floor(t / 80);

      // reveal sweep (left to right) with a flickering leading edge
      let sweepX = W + 400;
      if (!reduce) {
        if (revealAt) sweepX = -120 + ((now - revealAt) / REVEAL_MS) * (W + 360);
        else sweepX = -120;
      }
      ripples = ripples.filter((r) => now - r.t0 < 1500);

      let any = !!revealAt && now - revealAt < REVEAL_MS + 200;
      for (let j = 0; j < rows; j++) {
        const y0 = j * ch + ch / 2;
        for (let i = 0; i < cols; i++) {
          const idx = j * cols + i;
          const x0 = i * cw + cw / 2;
          let hv = heat[idx];
          const base = cov[idx];

          // pointer
          let f = 0, ox = 0, oy = 0;
          if (m.on) {
            const dx = x0 - m.x, dy = y0 - m.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < R2) {
              const d = Math.sqrt(d2) || 1;
              f = 1 - d / R;
              const push = f * f * cw * 1.9;
              ox = (dx / d) * push;
              oy = (dy / d) * push * 0.8;
              if (f > hv) hv = f;
            }
          }
          // ripples
          let k = 0;
          for (let r = 0; r < ripples.length; r++) {
            const rp = ripples[r];
            const age = now - rp.t0;
            const rad = age * 0.85;
            const dx = x0 - rp.x, dy = y0 - rp.y;
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            const dd = Math.abs(d - rad);
            if (dd < 70) {
              const kk = (1 - dd / 70) * (1 - age / 1500);
              if (kk > k) k = kk;
              ox += (dx / d) * kk * cw * 2.2;
              oy += (dy / d) * kk * cw * 1.8;
            }
          }
          // sweep edge
          let edge = 0;
          const ds = x0 - sweepX;
          if (ds > 0) {
            if (!reduce) continue; // not revealed yet
          } else if (ds > -90) edge = 1 + ds / 90;

          const e = Math.max(hv * hv * 1.1, k, edge * 0.8);
          if (hv > 0.01) heat[idx] = hv * decay; else heat[idx] = 0;
          if (hv > 0.02 || k > 0) any = true;

          const inside = base > 0.06;
          if (!inside && e < 0.12) continue;

          let ch0: string;
          let alpha: number;
          if (inside) {
            const shimmer = reduce ? 0 : Math.sin(i * 0.3 - t * 0.0016 + j * 0.12) * 0.07;
            const L = clamp(base + shimmer + (hash(idx) - 0.5) * 0.1);
            const gi = Math.round(L * (RAMP.length - 1));
            ch0 = RAMP[gi];
            alpha = 0.18 + 0.72 * L;
            if (e > 0.12 && hash(idx * 31 + step) < e * 1.15) ch0 = SCRAMBLE[Math.floor(hash(idx * 17 + step * 5) * SCRAMBLE.length)];
            alpha = alpha + (1 - alpha) * e;
          } else {
            // outside the letters: only the symbols the pointer, a ripple or the sweep wakes up
            ch0 = hash(idx * 31 + step) < 0.5 ? "." : SCRAMBLE[Math.floor(hash(idx * 17 + step * 5) * SCRAMBLE.length)];
            alpha = e * 0.5;
          }
          if (ch0 === " ") continue;
          ctx.globalAlpha = clamp(alpha, 0.04, 1);
          ctx.fillText(ch0, x0 + ox, y0 + oy);
        }
      }
      ctx.globalAlpha = 1;
      return any || m.on || ripples.length > 0;
    };

    const tick = () => {
      if (!alive || !visible || document.hidden) return;
      const now = performance.now();
      if (!revealAt && seen) revealAt = now;
      const busy = m.on || ripples.length > 0 || now - lastActive < 900 || (revealAt && now - revealAt < REVEAL_MS + 300);
      if (!busy && now - lastDraw < 45) return; // idle shimmer at ~22fps
      lastDraw = now;
      if (draw(now)) lastActive = now;
    };

    const local = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      if (!m.on) {
        m.x = p.x;
        m.y = p.y;
      }
      m.tx = p.x;
      m.ty = p.y;
      m.on = true;
      lastActive = performance.now();
    };
    const onDown = (e: PointerEvent) => {
      onMove(e);
      const p = local(e);
      ripples.push({ x: p.x, y: p.y, t0: performance.now() });
      if (ripples.length > 5) ripples.shift();
    };
    const onLeave = () => {
      m.on = false;
      m.tx = m.ty = -9999;
    };

    readColor();
    const ready = () => {
      if (!alive) return;
      if (!build()) return;
      if (reduce) {
        revealAt = 1;
        draw(0);
      }
    };
    ready();
    // the word is measured with the site font, so rebuild once it has loaded
    document.fonts?.load(`800 100px ${getComputedStyle(document.body).fontFamily}`).then(ready).catch(() => {});
    document.fonts?.ready.then(ready);

    const mo = new MutationObserver(() => {
      readColor();
      if (reduce) draw(0);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const io = new IntersectionObserver(
      ([en]) => {
        visible = en.isIntersecting;
        if (visible) seen = true;
      },
      { threshold: 0.2 }
    );
    io.observe(box);
    let lastW = box.clientWidth;
    const ro = new ResizeObserver(() => {
      const w = Math.floor(box.clientWidth);
      if (w === lastW) return;
      lastW = w;
      ready();
    });
    ro.observe(box);

    c.addEventListener("pointermove", onMove, { passive: true });
    c.addEventListener("pointerdown", onDown, { passive: true });
    c.addEventListener("pointerleave", onLeave);
    c.addEventListener("pointercancel", onLeave);
    c.addEventListener("pointerup", (e) => {
      if (e.pointerType !== "mouse") onLeave();
    });
    if (!reduce) gsap.ticker.add(tick);

    return () => {
      alive = false;
      gsap.ticker.remove(tick);
      mo.disconnect();
      io.disconnect();
      ro.disconnect();
      c.removeEventListener("pointermove", onMove);
      c.removeEventListener("pointerdown", onDown);
      c.removeEventListener("pointerleave", onLeave);
      c.removeEventListener("pointercancel", onLeave);
    };
  }, [text]);

  return (
    <div ref={boxRef} className={`ascii-name ${className}`}>
      <canvas ref={ref} role="img" aria-label={text} />
    </div>
  );
}
