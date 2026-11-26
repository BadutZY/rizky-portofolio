import { MONO, SCRAMBLE, clamp, hash } from "@/lib/ascii";
import { garble, ringPush, ring, type SceneFactory } from "./engine";

/**
 * Home hero: "Lattice". A sparse, evenly spaced lattice of small symbols (about 300 to 480 of them, where the old canvas
 * drew around 5000 cells) that breathes like slow waves. Same language as the other page backdrops:
 * the pointer is a camera and a lens (symbols near it swell, glow cyan or red (the two colours of the name glitch), flicker through code symbols while it moves and
 * settle again when it rests, a few soft threads tie it to the hottest ones), it leaves a short ink trail, and a click or
 * tap sends a ring plus a burst of sparks. One pass, one sine per symbol, no per-pixel work. The edge fade is baked into
 * the symbol opacity (nothing to mask), and symbols faded out by it are never drawn.
 */
const IDLE = "·+·:·-·+·";
const SPARK = "+*·:×";

type Node = { c: 0 | 1; tint: boolean; x: number; y: number; ph: number; g: string; seed: number; vg: number; ox: number; oy: number; heat: number; px: number; py: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; g: string; c: 0 | 1 };
type Dot = { x: number; y: number; life: number };

const scene: SceneFactory = (a) => {
  let nodes: Node[] = [];
  let sparks: Spark[] = [];
  let trail: Dot[] = [];
  let lastRip = 0;
  const cam = { x: 0, y: 0 };
  const hot: Node[] = [];

  const seed = () => {
    // spacing grows with the canvas, so the symbol count stays small on big screens
    const sp = Math.max(a.small ? 40 : 60, Math.sqrt((a.w * a.h) / (a.small ? 220 : 480)));
    const cols = Math.ceil(a.w / sp) + 1;
    const rows = Math.ceil(a.h / sp) + 1;
    nodes = [];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = (i + (j % 2 ? 0.5 : 0)) * sp;
        const y = j * sp;
        // edge fade, same shape the old CSS mask had: ellipse 85% x 75% around (50%, 38%)
        const t = Math.hypot((x - a.w * 0.5) / (a.w * 0.85), (y - a.h * 0.38) / (a.h * 0.75));
        const vg = t <= 0.25 ? 1 : t >= 0.85 ? 0 : (0.85 - t) / 0.6;
        if (vg < 0.04) continue;
        const s = i * 131 + j * 17;
        nodes.push({ c: hash(s + 9) < 0.62 ? 0 : 1, tint: hash(s + 21) < 0.1, x, y, ph: hash(s) * 6.28, g: IDLE[(hash(s + 3) * IDLE.length) | 0], seed: s, vg, ox: 0, oy: 0, heat: 0, px: x, py: y });
      }
    }
  };

  return {
    resize() {
      seed();
    },
    draw(ctx, now, dt, api) {
      if (!nodes.length) seed();
      const t = api.reduce ? 0 : now / 1000;
      const step = Math.floor(now / 90);
      const R = api.small ? 120 : 200;
      const fg = `rgb(${api.rgb})`;
      const ac = `rgb(${api.accent})`;
      // second accent: the red of the name glitch, so the background and the title belong together
      const rd = `rgb(${api.accent.startsWith("0,120") ? "220,30,70" : "255,45,85"})`;
      let active = false;

      // camera follows the pointer a little
      const ck = 1 - Math.exp(-dt * 3);
      cam.x += ((api.m.on ? api.m.x - api.w / 2 : 0) - cam.x) * ck;
      cam.y += ((api.m.on ? api.m.y - api.h / 2 : 0) - cam.y) * ck;
      if (Math.abs(cam.x) + Math.abs(cam.y) > 0.6) active = true;

      // a click sends sparks out from where it landed
      const newest = api.ripples.length ? api.ripples[api.ripples.length - 1] : null;
      if (newest && newest.t0 !== lastRip) {
        for (let i = 0; i < 14; i++) {
          const ang = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
          const sp = 60 + Math.random() * 140;
          sparks.push({ x: newest.x, y: newest.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, g: SPARK[(Math.random() * SPARK.length) | 0], c: i % 3 === 0 ? 1 : 0 });
        }
        if (sparks.length > 50) sparks.splice(0, sparks.length - 50);
      }
      lastRip = newest ? newest.t0 : 0;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      hot.length = 0;
      let curFont = "";
      let curFill = "";

      for (const n of nodes) {
        const bx = n.x + Math.sin(t * 0.35 + n.ph) * 5 - cam.x * 0.025;
        const by = n.y + Math.cos(t * 0.3 + n.ph) * 5 - cam.y * 0.025;
        let f = 0, tox = 0, toy = 0;

        if (api.m.on) {
          const dx = bx - api.m.x, dy = by - api.m.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1;
            f = 1 - d / R;
            const push = f * f * 30;
            tox = (dx / d) * push;
            toy = (dy / d) * push;
          }
        }
        if (api.ripples.length) {
          ringPush(api, now, bx, by, 80, 18);
          if (ring.k > f) f = ring.k;
          tox += ring.ox;
          toy += ring.oy;
        }

        n.ox += (tox - n.ox) * 0.14;
        n.oy += (toy - n.oy) * 0.14;
        n.heat += (f - n.heat) * 0.16;
        const h = n.heat;
        if (h > 0.02) active = true;
        n.px = bx + n.ox;
        n.py = by + n.oy;
        if (h > 0.35) hot.push(n);

        const wave = 0.5 + 0.5 * Math.sin(t * 0.55 + n.ph + n.x * 0.004);
        const alpha = clamp((0.07 + wave * 0.13 + (n.tint ? 0.06 : 0) + h * 0.8) * n.vg);
        if (alpha < 0.03) continue;

        // only three font sizes, so the font is set rarely
        const font = h < 0.15 ? `500 13px ${MONO}` : h < 0.5 ? `600 18px ${MONO}` : `700 23px ${MONO}`;
        if (font !== curFont) {
          ctx.font = font;
          curFont = font;
        }
        // hot symbols glow cyan or red; a few idle ones carry a faint cyan tint so the lattice is not plain white
        const fill = h > 0.45 ? (n.c ? rd : ac) : n.tint ? ac : fg;
        if (fill !== curFill) {
          ctx.fillStyle = fill;
          curFill = fill;
        }
        ctx.globalAlpha = alpha;
        const glyph = h > 0.12 ? garble(n.g, h * (0.4 + api.m.speed * 0.9), n.seed, step) : n.g;
        ctx.fillText(h > 0.12 && glyph === n.g && h > 0.3 ? SCRAMBLE[(hash(n.seed + step) * SCRAMBLE.length) | 0] : glyph, n.px, n.py);
      }

      // soft threads from the pointer to the hottest symbols
      if (api.m.on && hot.length) {
        hot.sort((p, q) => q.heat - p.heat);
        ctx.strokeStyle = ac;
        ctx.lineWidth = 1;
        const cnt = Math.min(4, hot.length);
        for (let i = 0; i < cnt; i++) {
          const k = hot[i];
          const mx = (api.m.x + k.px) / 2, my = (api.m.y + k.py) / 2;
          const bend = Math.sin(t * 2 + i * 1.7) * 12;
          const nx = -(k.py - api.m.y), ny = k.px - api.m.x;
          const nl = Math.hypot(nx, ny) || 1;
          ctx.globalAlpha = clamp(k.heat * 0.4);
          ctx.beginPath();
          ctx.moveTo(api.m.x, api.m.y);
          ctx.quadraticCurveTo(mx + (nx / nl) * bend, my + (ny / nl) * bend, k.px, k.py);
          ctx.stroke();
        }
      }

      // ink trail behind the pointer
      if (api.m.on) {
        const last = trail[trail.length - 1];
        if (!last || Math.hypot(api.m.x - last.x, api.m.y - last.y) > 8) trail.push({ x: api.m.x, y: api.m.y, life: 1 });
        if (trail.length > 14) trail.shift();
      }
      if (trail.length) {
        ctx.fillStyle = ac;
        for (const p of trail) {
          p.life -= dt * 1.7;
          if (p.life <= 0) continue;
          ctx.globalAlpha = p.life * 0.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1 + p.life * 1.8, 0, 6.283);
          ctx.fill();
        }
        trail = trail.filter((p) => p.life > 0);
        if (trail.length) active = true;
      }

      // sparks from a click
      if (sparks.length) {
        ctx.font = `500 12px ${MONO}`;
        const drag = Math.exp(-dt * 2.2);
        for (const s of sparks) {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vx *= drag;
          s.vy *= drag;
          s.life -= dt / 1.3;
          if (s.life <= 0) continue;
          ctx.fillStyle = s.c ? rd : ac;
          ctx.globalAlpha = s.life * 0.9;
          ctx.fillText(s.g, s.x, s.y);
        }
        sparks = sparks.filter((s) => s.life > 0);
        if (sparks.length) active = true;
      }
      return active || api.m.on || api.ripples.length > 0;
    },
  };
};

export default scene;
