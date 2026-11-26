"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { whenGo } from "@/lib/motion";
import { MONO, SCRAMBLE, hash, type Ripple } from "@/lib/ascii";

/** Light to dense. Index 0 is empty so the field stays airy. */
const RAMP = " ·.:-+=*#%@";

/** Every symbol the field can draw. Each one is rendered ONCE per alpha level into a small sprite sheet (the atlas). */
const GLYPHS = Array.from(new Set((RAMP.slice(1) + SCRAMBLE).split("")));
const GLYPH_INDEX = new Map(GLYPHS.map((g, i) => [g, i]));
const RAMP_GI = Array.from(RAMP).map((g) => GLYPH_INDEX.get(g) ?? -1);
const SCRAMBLE_GI = Array.from(SCRAMBLE).map((g) => GLYPH_INDEX.get(g) ?? 0);

/** Opacity steps baked into the atlas (dense at the faint end, where the ambient texture lives). */
const LEVELS = [0.04, 0.07, 0.1, 0.13, 0.17, 0.22, 0.3, 0.4, 0.52, 0.65, 0.8, 0.95];
const LUT_N = 64;
const ALPHA_LUT = new Uint8Array(LUT_N + 1).map((_, k) => {
  const a = k / LUT_N;
  let best = 0;
  for (let l = 1; l < LEVELS.length; l++) if (Math.abs(LEVELS[l] - a) < Math.abs(LEVELS[best] - a)) best = l;
  return best;
});

/** Sharpness vs cost: the canvas is capped at this pixel ratio (large screens are capped at 1, see resize()). */
const MAX_DPR = 1.5;

/** Frame gaps (ms): pointer moving = every frame, pointer resting / fading out, and the idle drift. */
const GAP_ACTIVE = 0;
const GAP_REST = 40;
const GAP_IDLE = 70;

/**
 * Hero background: a calm, evenly spaced grid of text symbols that drifts like slow waves (no shape, no picture).
 * Interaction: near the pointer the symbols grow denser and brighter, flicker through code characters and lean away,
 * leaving a fading trail. Clicking or tapping sends a ring across the field.
 *
 * Built to be cheap (the old version drew ~6000 fillText calls per frame, at 60fps whenever the pointer was over it):
 *  - symbols are pre-rendered into an atlas, a frame is only drawImage() calls (no text shaping, no alpha changes)
 *  - the edge fade is baked into the cell opacity, so no CSS mask has to be re-composited on every frame
 *  - the wave maths is split per column / row / cell, so a cell costs a few multiplications and no Math.sin
 *  - fewer, slightly larger cells, a lower pixel ratio on big screens
 *  - the pointer only stores its position (no layout reads while moving), the canvas is measured once per frame
 *  - slow frame rate when idle or resting, full rate only while the pointer actually moves
 *  - starts only after the intro, stops offscreen, in a hidden tab, and with reduced motion draws a single frame
 * The "dotfield" class is kept so the hero parallax still targets it.
 */
export default function AsciiField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, dpr = 1, cols = 0, rows = 0, cw = 16, ch = 26, fs = 13;
    let heat = new Float32Array(0);
    let vig = new Float32Array(0); // edge fade per cell (what the CSS mask used to do)
    let radS = new Float32Array(0); // sin / cos of the radial wave phase per cell (fixed per layout)
    let radC = new Float32Array(0);
    let colA = new Float32Array(0), colSx = new Float32Array(0), colCx = new Float32Array(0);
    let rowB = new Float32Array(0), rowSy = new Float32Array(0), rowCy = new Float32Array(0);
    let color = "255,255,255";
    let visible = true;
    let started = false;
    let lastDraw = 0, lastActive = 0, lastMove = 0, prevDraw = 0;
    let ripples: Ripple[] = [];
    // pointer: raw client position (written by the event, no layout read) and the smoothed local position
    const ptr = { cx: 0, cy: 0, in: false };
    const m = { x: -9999, y: -9999, tx: -9999, ty: -9999, on: false };

    // atlas
    let atlas: HTMLCanvasElement | null = null;
    let sw = 0, sh = 0; // sprite size in CSS px
    let swp = 0, shp = 0; // sprite size in atlas px

    const buildAtlas = () => {
      sw = Math.ceil(fs * 0.8 + 4);
      sh = Math.ceil(fs * 1.3 + 2);
      swp = Math.ceil(sw * dpr);
      shp = Math.ceil(sh * dpr);
      const a = document.createElement("canvas");
      a.width = swp * LEVELS.length;
      a.height = shp * GLYPHS.length;
      const g = a.getContext("2d");
      if (!g) return;
      g.font = `500 ${(fs * dpr).toFixed(2)}px ${MONO}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      for (let l = 0; l < LEVELS.length; l++) {
        g.fillStyle = `rgba(${color},${LEVELS[l]})`;
        for (let k = 0; k < GLYPHS.length; k++) g.fillText(GLYPHS[k], l * swp + swp / 2, k * shp + shp / 2);
      }
      atlas = a;
    };

    const readColor = () => {
      color = getComputedStyle(document.documentElement).getPropertyValue("--fg-rgb").trim() || "255,255,255";
    };

    const resize = () => {
      const r = c.getBoundingClientRect();
      w = r.width;
      h = r.height;
      // big canvases are the expensive ones, so they render at 1x; small ones can afford a sharper picture
      dpr = Math.min(window.devicePixelRatio || 1, w * h > 1.2e6 ? 1 : MAX_DPR);
      const small = w < 640;
      cw = small ? 13 : 16;
      ch = small ? 21 : 26;
      fs = small ? 11 : 13;
      cols = Math.ceil(w / cw) + 1;
      rows = Math.ceil(h / ch) + 1;
      heat = new Float32Array(cols * rows);
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // everything that only depends on the layout is computed once here
      vig = new Float32Array(cols * rows);
      radS = new Float32Array(cols * rows);
      radC = new Float32Array(cols * rows);
      colA = new Float32Array(cols);
      colSx = new Float32Array(cols);
      colCx = new Float32Array(cols);
      rowB = new Float32Array(rows);
      rowSy = new Float32Array(rows);
      rowCy = new Float32Array(rows);
      const ccx = cols * 0.5, ccy = rows * 0.4;
      for (let j = 0; j < rows; j++) {
        rowSy[j] = Math.sin(j * 0.099);
        rowCy[j] = Math.cos(j * 0.099);
        const y0 = j * ch + ch / 2;
        for (let i = 0; i < cols; i++) {
          const idx = j * cols + i;
          const ph = Math.hypot(i - ccx, (j - ccy) * 1.6) * 0.16;
          radS[idx] = Math.sin(ph);
          radC[idx] = Math.cos(ph);
          // same shape as the old CSS mask: radial-gradient(ellipse 85% 75% at 50% 38%, #000 25%, transparent 85%)
          const x0 = i * cw + cw / 2;
          const t = Math.hypot((x0 - w * 0.5) / (w * 0.85), (y0 - h * 0.38) / (h * 0.75));
          vig[idx] = t <= 0.25 ? 1 : t >= 0.85 ? 0 : (0.85 - t) / 0.6;
        }
      }
      buildAtlas();
    };

    const draw = (now: number) => {
      if (!atlas) return false;
      const dt = Math.min(0.05, Math.max(0.001, (now - prevDraw) / 1000));
      prevDraw = now;

      // pointer: one layout read per frame, then local coordinates
      if (ptr.in) {
        const r = c.getBoundingClientRect();
        const x = ptr.cx - r.left, y = ptr.cy - r.top;
        if (x < 0 || y < 0 || x > r.width || y > r.height) {
          m.on = false;
        } else {
          if (!m.on) {
            m.x = x;
            m.y = y;
          }
          m.tx = x;
          m.ty = y;
          m.on = true;
        }
      } else {
        m.on = false;
      }
      m.x += (m.tx - m.x) * 0.2;
      m.y += (m.ty - m.y) * 0.2;

      ctx.clearRect(0, 0, w, h);

      const t = reduce ? 0 : now;
      const step = Math.floor(t / 90);
      const R = 210, R2 = R * R;
      const decay = Math.exp(-dt * 2);
      ripples = ripples.filter((r) => now - r.t0 < 1600);
      const hasRipples = ripples.length > 0;
      let any = false;

      // per frame, per column / row (the old code did all of this per cell)
      const tx = t * 0.0003;
      for (let i = 0; i < cols; i++) {
        colA[i] = Math.sin(i * 0.17 + t * 0.00055);
        const x = i * 0.066 + tx;
        colSx[i] = Math.sin(x);
        colCx[i] = Math.cos(x);
      }
      for (let j = 0; j < rows; j++) rowB[j] = Math.sin(j * 0.23 - t * 0.00042);
      const tr = t * 0.0007;
      const sTr = Math.sin(tr), cTr = Math.cos(tr);

      const spw = swp / dpr, sph = shp / dpr;
      const half = spw / 2, halfH = sph / 2;

      for (let j = 0; j < rows; j++) {
        const y0 = j * ch + ch / 2;
        const b = rowB[j], sy = rowSy[j], cy = rowCy[j];
        for (let i = 0; i < cols; i++) {
          const idx = j * cols + i;
          const vg = vig[idx];
          const hv0 = heat[idx];
          if (vg < 0.03) continue; // faded out by the edge mask: nothing visible, nothing to compute
          const x0 = i * cw + cw / 2;

          // ambient: four slow sine waves, quantised to a few levels so the grid reads as neat, quiet texture
          const d = colSx[i] * cy + colCx[i] * sy; // sin(x + y) without a Math.sin per cell
          const r = radS[idx] * cTr - radC[idx] * sTr; // sin(phase - t) likewise
          let v = ((colA[i] + b + d + r) * 0.125 + 0.28) / 0.56;
          v = v < 0 ? 0 : v > 1 ? 1 : v;

          // pointer + ripples
          let hv = hv0, ox = 0, oy = 0;
          if (m.on) {
            const dx = x0 - m.x, dy = y0 - m.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < R2) {
              const dist = Math.sqrt(d2) || 1;
              const f = 1 - dist / R;
              const push = f * f * 14;
              ox = (dx / dist) * push;
              oy = (dy / dist) * push;
              if (f > hv) hv = f;
            }
          }
          let k = 0;
          if (hasRipples) {
            for (let q = 0; q < ripples.length; q++) {
              const rp = ripples[q];
              const age = now - rp.t0;
              const dx = x0 - rp.x, dy = y0 - rp.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const dd = Math.abs(dist - age * 0.9);
              if (dd < 90) {
                const kk = (1 - dd / 90) * (1 - age / 1600);
                if (kk > k) k = kk;
                ox += (dx / dist) * kk * 12;
                oy += (dy / dist) * kk * 12;
              }
            }
          }
          heat[idx] = hv > 0.01 ? hv * decay : 0;
          const e = Math.max(hv * hv, k);
          if (e > 0.02) any = true;

          const level = Math.round(v * 7 + e * 3);
          let gi = RAMP_GI[level > 10 ? 10 : level];
          if (e > 0.12 && hash(idx * 31 + step) < e * 0.75) gi = SCRAMBLE_GI[Math.floor(hash(idx * 17 + step * 7) * SCRAMBLE_GI.length)];
          if (gi < 0) continue;

          let a = (0.05 + v * 0.15 + e * 0.8) * vg;
          if (a < 0.03) continue;
          if (a > 0.95) a = 0.95;
          const lv = ALPHA_LUT[(a * LUT_N) | 0];

          ctx.drawImage(
            atlas,
            lv * swp,
            gi * shp,
            swp,
            shp,
            Math.round((x0 + ox - half) * dpr) / dpr,
            Math.round((y0 + oy - halfH) * dpr) / dpr,
            spw,
            sph,
          );
        }
      }
      return any || m.on || hasRipples;
    };

    const tick = () => {
      if (!visible || document.hidden) return;
      const now = performance.now();
      const moving = now - lastMove < 120;
      const resting = m.on || now - lastActive < 1200;
      const gap = moving || ripples.length > 0 ? GAP_ACTIVE : resting ? GAP_REST : GAP_IDLE;
      if (now - lastDraw < gap) return;
      lastDraw = now;
      if (draw(now)) lastActive = now;
    };

    const onMove = (e: PointerEvent) => {
      ptr.cx = e.clientX;
      ptr.cy = e.clientY;
      ptr.in = true;
      lastMove = lastActive = performance.now();
    };
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (el?.closest("a, button, input, textarea, select, [role=button]")) return;
      const r = c.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) return;
      onMove(e);
      ripples.push({ x, y, t0: performance.now() });
      if (ripples.length > 4) ripples.shift();
    };
    const onLeave = () => {
      ptr.in = false;
      m.on = false;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") onLeave();
    };

    readColor();
    resize();
    const mo = new MutationObserver(() => {
      readColor();
      buildAtlas(); // the symbols are baked in the current text colour
      if (reduce) draw(0);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(c);
    let lastW = c.clientWidth;
    const ro = new ResizeObserver(() => {
      const nw = c.clientWidth;
      if (nw === lastW && h) return;
      lastW = nw;
      resize();
      if (reduce) draw(0);
    });
    ro.observe(c);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerup", onUp);

    // do not render behind the intro / page curtain: the CPU is busy with that animation, and nobody can see the field yet
    let stopGo = () => {};
    if (reduce) draw(0);
    else
      stopGo = whenGo(() => {
        if (started) return;
        started = true;
        gsap.ticker.add(tick);
      });

    return () => {
      stopGo();
      if (started) gsap.ticker.remove(tick);
      mo.disconnect();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return <canvas ref={ref} className={`dotfield ${className}`} aria-hidden />;
}