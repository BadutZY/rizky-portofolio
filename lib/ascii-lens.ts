import { MONO, SCRAMBLE, clamp, hash, type Ripple } from "@/lib/ascii";

/**
 * ASCII lens for the big page titles.
 *
 * While the pointer is over the title, a round area around it turns the letters into ASCII art:
 * the real letters fade out inside the circle (a CSS mask on `inner`) and a canvas on top draws the same
 * letters again, built from text symbols (light symbols on the edges of a letter, dense ones in the middle).
 * Symbols flicker more towards the rim of the circle, a few stray symbols drift around it, and a click
 * sends a ring through the letters. On touch screens a tap opens the lens for a moment.
 *
 * The canvas is a sibling of `inner` (not a child), otherwise the mask would hide it as well.
 * The grid is only built on the first hover and again after a resize, so it costs nothing until it is used.
 * The animation loop stops by itself as soon as the lens has closed.
 *
 * Expected markup (see components/ui/GlitchTitle.tsx):
 *   wrap > inner[.st]  > [data-gword] > .st-mask > .st-c   (the real letters)
 *        > canvas
 */

const RAMP = " .:-=+*#%@";

const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * `lite` is for the big home hero title: 30fps instead of 60, a smaller canvas pixel ratio, a slightly smaller lens,
 * and each frame only clears the part of the canvas the lens touched (not the whole title).
 */
export function attachAsciiLens(wrap: HTMLElement, inner: HTMLElement, canvas: HTMLCanvasElement, opts: { lite?: boolean } = {}): () => void {
  const lite = !!opts.lite;
  if (typeof window === "undefined") return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let dirty = true;
  let CW = 0, CH = 0, pad = 0, dpr = 1;
  let cw = 8, ch = 14, fs = 12, cols = 0, rows = 0, R = 140;
  let cov = new Float32Array(0);
  let color = "255,255,255";
  let ripples: Ripple[] = [];
  let raf = 0;
  let last = 0;
  let touchTimer = 0;
  let alive = true;
  let prevX = 0, prevY = 0, prevR = 0; // lite: where the lens was drawn last frame

  const L = { x: 0, y: 0, tx: 0, ty: 0, r: 0, tr: 0 };

  /** Render the real letters into a hidden canvas and average it down to one coverage value per ASCII cell. */
  const build = (): boolean => {
    const W = inner.offsetWidth;
    const H = inner.offsetHeight;
    if (W < 20 || H < 10) return false;

    const cs = getComputedStyle(inner);
    const size = parseFloat(cs.fontSize) || 100;
    const lh = parseFloat(cs.lineHeight) || size * 0.95;

    pad = Math.round(size * 0.2);
    CW = W + pad * 2;
    CH = H + pad * 2;
    dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 2);
    canvas.width = Math.round(CW * dpr);
    canvas.height = Math.round(CH * dpr);
    canvas.style.width = CW + "px";
    canvas.style.height = CH + "px";
    canvas.style.left = -pad + "px";
    canvas.style.top = -pad + "px";

    cw = clamp(Math.round(size / 16), 5, 11);
    fs = cw / 0.6; // a monospace glyph is about 0.6em wide
    ch = Math.round(fs * 1.12);
    cols = Math.ceil(CW / cw);
    rows = Math.ceil(CH / ch);
    R = lite ? clamp(size * 0.85, 80, 170) : clamp(size * 1.05, 80, 210);

    const mask = document.createElement("canvas");
    mask.width = CW;
    mask.height = CH;
    const g = mask.getContext("2d", { willReadFrequently: true });
    if (!g) return false;
    g.fillStyle = "#fff";
    g.textBaseline = "alphabetic";
    g.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    const m = g.measureText("Hg");
    const asc = m.fontBoundingBoxAscent ?? size * 0.9;
    const desc = m.fontBoundingBoxDescent ?? size * 0.25;

    // layout px per screen px (the page may be scaled by an ancestor while it animates)
    const box = inner.getBoundingClientRect();
    const sc = box.width / W || 1;

    inner.querySelectorAll<HTMLElement>("[data-gword] > .st-mask").forEach((mk) => {
      const ch0 = mk.textContent || "";
      if (!ch0.trim()) return;
      const b = mk.getBoundingClientRect();
      // letters sit inside the mask with 0.04em padding on top and 0.02em on the left (see .st-mask in globals.css)
      const x = (b.left - box.left) / sc + 0.02 * size + pad;
      const y = (b.top - box.top) / sc + 0.04 * size + (lh - (asc + desc)) / 2 + asc + pad;
      g.fillText(ch0, x, y);
    });

    const data = g.getImageData(0, 0, CW, CH).data;
    cov = new Float32Array(cols * rows);
    const count = new Float32Array(cols * rows);
    for (let py = 0; py < CH; py++) {
      const rr = Math.min(rows - 1, (py / ch) | 0);
      for (let px = 0; px < CW; px++) {
        const i = rr * cols + Math.min(cols - 1, (px / cw) | 0);
        cov[i] += data[(py * CW + px) * 4 + 3];
        count[i]++;
      }
    }
    for (let i = 0; i < cov.length; i++) cov[i] = count[i] ? clamp((cov[i] / count[i] / 255) * 1.2) : 0;
    return true;
  };

  const place = (e: PointerEvent) => {
    const b = inner.getBoundingClientRect();
    const sc = b.width / (inner.offsetWidth || 1) || 1;
    L.tx = (e.clientX - b.left) / sc;
    L.ty = (e.clientY - b.top) / sc;
  };

  const open = () => {
    if (dirty) dirty = !build();
    if (dirty) return false;
    color = getComputedStyle(document.documentElement).getPropertyValue("--fg-rgb").trim() || "255,255,255";
    if (L.r < 1) {
      L.x = L.tx;
      L.y = L.ty;
    }
    L.tr = R;
    start();
    return true;
  };

  const close = () => {
    L.tr = 0;
    start();
  };

  const start = () => {
    if (raf || !alive) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const finish = () => {
    prevR = 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    inner.removeAttribute("data-lens");
    inner.style.removeProperty("--lr");
  };

  const frame = (now: number) => {
    raf = 0;
    if (!alive) return;
    if (lite && now - last < 30) {
      raf = requestAnimationFrame(frame);
      return;
    }
    const dt = Math.min(64, now - last);
    last = now;
    const k = (a: number) => 1 - Math.pow(1 - a, dt / 16.7);

    L.x += (L.tx - L.x) * k(0.24);
    L.y += (L.ty - L.y) * k(0.24);
    L.r += (L.tr - L.r) * k(0.17);
    if (Math.abs(L.tr - L.r) < 0.6) L.r = L.tr;
    ripples = ripples.filter((p) => now - p.t0 < 1000);

    if (L.r <= 0 && L.tr <= 0 && !ripples.length) return finish();

    // the real letters fade out inside the circle, mirroring the smoothstep used for the symbols below
    if (L.r > 0.5) {
      inner.setAttribute("data-lens", "1");
      inner.style.setProperty("--lx", L.x.toFixed(1) + "px");
      inner.style.setProperty("--ly", L.y.toFixed(1) + "px");
      inner.style.setProperty("--lr", L.r.toFixed(1) + "px");
    } else {
      inner.removeAttribute("data-lens");
    }

    draw(now);
    raf = requestAnimationFrame(frame);
  };

  const draw = (now: number) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (lite) {
      // clear only the box around the previous and the current lens position
      const nx = L.x + pad, ny = L.y + pad;
      if (prevR === 0) {
        prevX = nx;
        prevY = ny;
      }
      const m = Math.max(L.r, prevR) + cw * 2;
      const x0 = Math.min(nx, prevX) - m, y0 = Math.min(ny, prevY) - m;
      ctx.clearRect(x0, y0, Math.max(nx, prevX) + m - x0, Math.max(ny, prevY) + m - y0);
      prevX = nx;
      prevY = ny;
      prevR = L.r;
    } else ctx.clearRect(0, 0, CW, CH);
    if (L.r < 1) return;

    ctx.font = `700 ${fs.toFixed(2)}px ${MONO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const cx = L.x + pad;
    const cy = L.y + pad;
    const rr = L.r;
    const c0 = Math.max(0, Math.floor((cx - rr) / cw));
    const c1 = Math.min(cols - 1, Math.ceil((cx + rr) / cw));
    const r0 = Math.max(0, Math.floor((cy - rr) / ch));
    const r1 = Math.min(rows - 1, Math.ceil((cy + rr) / ch));
    const tick = Math.floor(now / 85);
    const slow = Math.floor(now / 260);
    const fg = `rgb(${color})`;
    let cur = "";
    const paint = (style: string) => {
      if (style !== cur) {
        ctx.fillStyle = style;
        cur = style;
      }
    };

    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const i = r * cols + c;
        const px = (c + 0.5) * cw;
        const py = (r + 0.5) * ch;
        const dx = px - cx;
        const dy = py - cy;
        const d = Math.sqrt(dx * dx + dy * dy) / rr;
        if (d >= 1) continue;
        const s = 1 - smooth(0.5, 1, d); // 1 in the middle, 0 on the rim
        const v = cov[i];
        const edge = clamp((d - 0.3) / 0.7);

        if (v > 0.05) {
          // symbol picked by density, with a slow shimmer so the body of the letters stays alive
          let idx = Math.min(RAMP.length - 1, Math.floor(Math.pow(v, 0.75) * RAMP.length));
          const h = hash(i * 31 + slow * 17);
          if (h < 0.18) idx = clamp(idx + (h < 0.09 ? -1 : 1), 1, RAMP.length - 1);
          let glyph = RAMP[idx];
          let accent = 0;

          // flicker into code symbols, more and more towards the rim
          const f = hash(i * 7 + tick * 7919);
          if (f < 0.03 + edge * edge * 0.34) {
            glyph = SCRAMBLE[Math.floor(hash(i + tick * 131) * SCRAMBLE.length)];
            accent = hash(i * 3 + tick) < 0.65 ? 1 : 2;
          }

          // a click sends a ring through the letters
          for (const p of ripples) {
            const age = (now - p.t0) / 1000;
            const ring = age * Math.max(CW, 420) * 0.9;
            const dist = Math.hypot(px - (p.x + pad), py - (p.y + pad));
            if (Math.abs(dist - ring) < cw * 2.2) {
              glyph = SCRAMBLE[Math.floor(hash(i + tick * 17) * SCRAMBLE.length)];
              accent = 1;
              break;
            }
          }

          if (glyph === " ") continue;
          ctx.globalAlpha = clamp(s * (0.45 + 0.55 * v) * (accent ? 1 : 0.95));
          paint(accent === 1 ? "rgb(0,212,255)" : accent === 2 ? "rgb(255,45,85)" : fg);
          ctx.fillText(glyph, px, py + ch * 0.04);
        } else if (d > 0.5 && d < 0.96 && hash(i * 13 + tick * 601) < 0.011) {
          // a few stray symbols around the rim, outside the letters
          ctx.globalAlpha = 0.4 * s;
          paint(fg);
          ctx.fillText(SCRAMBLE[Math.floor(hash(i + tick) * SCRAMBLE.length)], px, py);
        }
      }
    }
    ctx.globalAlpha = 1;
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    place(e);
    if (L.tr === 0) open();
  };
  const onEnter = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    place(e);
    open();
  };
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    close();
  };
  const onDown = (e: PointerEvent) => {
    place(e);
    if (!open()) return;
    ripples.push({ x: L.tx, y: L.ty, t0: performance.now() });
    if (e.pointerType === "touch") {
      window.clearTimeout(touchTimer);
      touchTimer = window.setTimeout(close, 1500);
    }
  };

  wrap.addEventListener("pointerenter", onEnter);
  wrap.addEventListener("pointermove", onMove);
  wrap.addEventListener("pointerleave", onLeave);
  wrap.addEventListener("pointerdown", onDown);

  // the grid depends on size and font: rebuild lazily on the next hover
  const ro = new ResizeObserver(() => (dirty = true));
  ro.observe(wrap);
  document.fonts?.ready.then(() => (dirty = true));

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    window.clearTimeout(touchTimer);
    ro.disconnect();
    wrap.removeEventListener("pointerenter", onEnter);
    wrap.removeEventListener("pointermove", onMove);
    wrap.removeEventListener("pointerleave", onLeave);
    wrap.removeEventListener("pointerdown", onDown);
    finish();
  };
}
