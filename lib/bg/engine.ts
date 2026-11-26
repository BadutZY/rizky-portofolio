import { SCRAMBLE, hash } from "@/lib/ascii";

/**
 * Shared engine for the page backdrops (About, Projects, Experience, Skills).
 *
 * One canvas per page, and each page brings its own "scene" (lib/bg/*.ts). The engine does the boring, heavy parts once:
 *  - sizes the canvas (device pixel ratio capped at 1.5) and keeps it sized
 *  - tracks the pointer (smoothed) and clicks/taps (rings)
 *  - runs ONE requestAnimationFrame loop that only exists while the canvas is on screen
 *  - drops to ~25fps while nothing is happening and goes back to full speed when the pointer or a ring is active
 *  - follows the theme colour, and draws a single still frame when the visitor prefers reduced motion
 */

export type Ripple = { x: number; y: number; t0: number };

export type Api = {
  w: number;
  h: number;
  dpr: number;
  /** narrow screens get fewer and smaller things */
  small: boolean;
  reduce: boolean;
  /** "r,g,b" of the current text colour, and of the accent (cyan, same family as the title glitch) */
  rgb: string;
  accent: string;
  /** smoothed pointer in canvas pixels; `on` is false when the pointer is outside the canvas,
   *  `speed` is how fast it moves (0..1, smoothed) and `down` is true while it is pressed on an empty spot */
  m: { x: number; y: number; on: boolean; speed: number; down: boolean };
  ripples: Ripple[];
};

export type Scene = {
  resize?: (a: Api) => void;
  /** draw one frame; return true while something is animating because of the visitor (keeps full frame rate) */
  draw: (ctx: CanvasRenderingContext2D, now: number, dt: number, a: Api) => boolean;
};

export type SceneFactory = (a: Api) => Scene;

export const RIPPLE_MS = 1800;

/** Result of `ringPush`: strength of the strongest ring at a point (0..1) and the push it gives (pixels). */
export const ring = { k: 0, ox: 0, oy: 0 };

/**
 * How much the click rings touch the point (x, y). Fills the shared `ring` object (so no allocations per call):
 * `k` strength 0..1, `ox`/`oy` a push away from the ring's centre, scaled by `force`. `width` is the thickness of the ring.
 */
export function ringPush(a: Api, now: number, x: number, y: number, width = 80, force = 12): typeof ring {
  ring.k = 0;
  ring.ox = 0;
  ring.oy = 0;
  for (let q = 0; q < a.ripples.length; q++) {
    const r = a.ripples[q];
    const age = now - r.t0;
    const dx = x - r.x, dy = y - r.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const dd = Math.abs(d - age * 0.9);
    if (dd >= width) continue;
    const k = (1 - dd / width) * (1 - age / RIPPLE_MS);
    if (k > ring.k) ring.k = k;
    ring.ox += (dx / d) * k * force;
    ring.oy += (dy / d) * k * force;
  }
  return ring;
}

/** Replaces some letters with code symbols. `h` is how much (0..1); `step` changes a few times a second. */
export function garble(text: string, h: number, seed: number, step: number): string {
  if (h < 0.1) return text;
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    out += c !== " " && hash(i * 13 + seed + step * 31) < h * 0.8 ? SCRAMBLE[Math.floor(hash(i * 7 + seed * 3 + step) * SCRAMBLE.length)] : c;
  }
  return out;
}

export function mountBackdrop(canvas: HTMLCanvasElement, factory: SceneFactory, opts: { maxDpr?: number } = {}): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const api: Api = {
    w: 1,
    h: 1,
    dpr: 1,
    small: false,
    reduce: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    rgb: "255,255,255",
    accent: "0,212,255",
    m: { x: -9999, y: -9999, on: false, speed: 0, down: false },
    ripples: [],
  };
  const ptr = { cx: 0, cy: 0, tx: -9999, ty: -9999, has: false };
  let visible = false;
  let raf = 0;
  let lastDraw = 0;
  let lastActive = 0;
  let scene: Scene | null = null;

  const readTheme = () => {
    const root = document.documentElement;
    api.rgb = getComputedStyle(root).getPropertyValue("--fg-rgb").trim() || "255,255,255";
    api.accent = root.dataset.theme === "light" ? "0,120,200" : "0,212,255";
  };

  const size = () => {
    api.dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr ?? 1.5);
    api.w = Math.max(1, canvas.clientWidth);
    api.h = Math.max(1, canvas.clientHeight);
    api.small = api.w < 640;
    canvas.width = Math.round(api.w * api.dpr);
    canvas.height = Math.round(api.h * api.dpr);
  };

  const paint = (now: number, dt: number) => {
    if (!scene) return false;
    ctx.setTransform(api.dpr, 0, 0, api.dpr, 0, 0);
    ctx.clearRect(0, 0, api.w, api.h);
    ctx.globalAlpha = 1;
    const act = scene.draw(ctx, now, dt, api);
    ctx.globalAlpha = 1;
    return act;
  };

  /** Turn the last known pointer position into canvas coordinates (also keeps working while the page scrolls). */
  const locate = () => {
    if (!ptr.has) return;
    const r = canvas.getBoundingClientRect();
    const sx = r.width / (canvas.clientWidth || 1) || 1;
    const sy = r.height / (canvas.clientHeight || 1) || 1;
    const x = (ptr.cx - r.left) / sx;
    const y = (ptr.cy - r.top) / sy;
    const inside = x >= 0 && y >= 0 && x <= api.w && y <= api.h;
    if (inside && !api.m.on) {
      api.m.x = x;
      api.m.y = y;
    }
    api.m.on = inside;
    ptr.tx = x;
    ptr.ty = y;
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    locate();
    const busy = api.m.on || api.ripples.length > 0 || now - lastActive < 1200;
    if (!busy && now - lastDraw < 40) return; // idle drift at ~25fps
    const dt = Math.min(0.05, Math.max(0.001, (now - lastDraw) / 1000));
    lastDraw = now;
    const k = 1 - Math.pow(0.8, dt * 60);
    const px = api.m.x, py = api.m.y;
    api.m.x += (ptr.tx - api.m.x) * k;
    api.m.y += (ptr.ty - api.m.y) * k;
    const v = api.m.on ? Math.min(1, Math.hypot(api.m.x - px, api.m.y - py) / dt / 1400) : 0;
    api.m.speed += (v - api.m.speed) * (1 - Math.exp(-dt * 6));
    api.ripples = api.ripples.filter((r) => now - r.t0 < RIPPLE_MS);
    if (paint(now, dt)) lastActive = now;
  };

  const start = () => {
    if (!raf && !api.reduce) raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const onMove = (e: PointerEvent) => {
    ptr.cx = e.clientX;
    ptr.cy = e.clientY;
    ptr.has = true;
    lastActive = performance.now();
  };
  const onDown = (e: PointerEvent) => {
    const el = e.target as Element | null;
    if (el?.closest("a, button, input, textarea, select, [role=button]")) return;
    onMove(e);
    locate();
    if (api.m.on) {
      api.m.down = true;
      api.m.x = ptr.tx;
      api.m.y = ptr.ty;
      api.ripples.push({ x: ptr.tx, y: ptr.ty, t0: performance.now() });
      if (api.ripples.length > 4) api.ripples.shift();
    }
  };
  const onLeave = () => {
    ptr.has = false;
    api.m.on = false;
    api.m.down = false;
  };
  const onUp = (e: PointerEvent) => {
    api.m.down = false;
    if (e.pointerType !== "mouse") onLeave();
  };

  readTheme();
  size();
  scene = factory(api);
  scene.resize?.(api);
  if (api.reduce) paint(0, 0.016);

  const mo = new MutationObserver(() => {
    readTheme();
    if (api.reduce) paint(0, 0.016);
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  let lastW = canvas.clientWidth;
  let lastH = canvas.clientHeight;
  const ro = new ResizeObserver(() => {
    if (canvas.clientWidth === lastW && canvas.clientHeight === lastH) return;
    lastW = canvas.clientWidth;
    lastH = canvas.clientHeight;
    size();
    scene?.resize?.(api);
    if (api.reduce) paint(0, 0.016);
  });
  ro.observe(canvas);

  // the loop only exists while the canvas is on screen
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) start();
    else stop();
  });
  io.observe(canvas);

  if (!api.reduce) {
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);
  }

  return () => {
    stop();
    io.disconnect();
    ro.disconnect();
    mo.disconnect();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    document.removeEventListener("pointerleave", onLeave);
  };
}
