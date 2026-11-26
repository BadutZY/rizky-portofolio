import { MONO, clamp } from "@/lib/ascii";
import { garble, ringPush, ring, type SceneFactory } from "./engine";

/**
 * About: "Drift". Words from my world (vibecoding, JKT48, Godot, Minecraft...) float upwards like thoughts, in three depths
 * with big outlined words far behind them. The pointer is a camera (near words move more than far ones) and a lens:
 * words close to it swell and glow cyan, flicker through code symbols while the pointer moves and settle back into
 * readable text when it rests. The hottest words are tied to the pointer with soft threads, it leaves a short ink trail,
 * and a click sends a ring plus a burst of sparks. About 30 words, 3 outlined words and some dust, one pass, no per-pixel work.
 */
const WORDS = [
  "vibecoding", "JKT48 ♡", "Godot", "Minecraft mods", "React", "Next.js", "Unity", "Laravel", "TypeScript",
  "Kotlin", "games", "ideas", "learn", "build", "Bogor", "2023", "Java", "websites", "create", "try again",
  "</>", "{ }", "01", "Tailwind", "Supabase", "PHP", "keep going", "new project",
];
const BIG = ["CREATE", "LEARN", "BUILD", "PLAY", "SHIP"];
const SPARK = "+*·:×";

type Tok = { t: string; x: number; y: number; z: number; ph: number; sway: number; seed: number; ox: number; oy: number; heat: number; px: number; py: number };
type Dust = { x: number; y: number; z: number; ph: number };
type Big = { t: string; x: number; y: number; s: number; v: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; g: string };
type Dot = { x: number; y: number; life: number };

const shuffle = <T,>(arr: T[]) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const scene: SceneFactory = (a) => {
  let toks: Tok[] = [];
  let dust: Dust[] = [];
  let bigs: Big[] = [];
  let sparks: Spark[] = [];
  let trail: Dot[] = [];
  let lw = 0, lh = 0, lastRip = 0;
  const cam = { x: 0, y: 0 };
  const hot: Tok[] = [];

  const seed = () => {
    const n = a.small ? 14 : 28;
    toks = shuffle(WORDS)
      .slice(0, n)
      .map((t) => ({
        t,
        x: Math.random() * a.w,
        y: Math.random() * a.h,
        z: 0.3 + Math.random() * 0.7,
        ph: Math.random() * 6.28,
        sway: 8 + Math.random() * 18,
        seed: (Math.random() * 1000) | 0,
        ox: 0, oy: 0, heat: 0, px: 0, py: 0,
      }))
      .sort((p, q) => p.z - q.z); // far words are drawn first
    dust = Array.from({ length: a.small ? 26 : 64 }, () => ({ x: Math.random() * a.w, y: Math.random() * a.h, z: Math.random(), ph: Math.random() * 6.28 }));
    // three outlined words, each on its own row so they never sit on top of each other
    const nb = a.small ? 2 : 3;
    const rows = shuffle(a.small ? [0.3, 0.72] : [0.24, 0.52, 0.8]);
    bigs = shuffle(BIG).slice(0, nb).map((t, i) => ({
      t,
      s: (a.small ? 66 : 104) + Math.random() * 26,
      x: (a.w / nb) * i + Math.random() * (a.w / nb) * 0.5 - 20,
      y: a.h * rows[i],
      v: 5 + Math.random() * 5,
    }));
    lw = a.w;
    lh = a.h;
  };

  return {
    resize(api) {
      if (!toks.length) return seed();
      const sx = api.w / (lw || 1), sy = api.h / (lh || 1);
      for (const k of toks) { k.x *= sx; k.y *= sy; }
      for (const d of dust) { d.x *= sx; d.y *= sy; }
      for (const b of bigs) { b.x *= sx; b.y *= sy; }
      lw = api.w;
      lh = api.h;
    },
    draw(ctx, now, dt, api) {
      if (!toks.length) seed();
      const t = api.reduce ? 0 : now / 1000;
      const step = Math.floor(now / 85);
      const R = api.small ? 120 : 190;
      const fg = `rgb(${api.rgb})`;
      const ac = `rgb(${api.accent})`;
      let active = false;

      // camera follows the pointer a little: near words move more than far ones
      const ck = 1 - Math.exp(-dt * 3);
      cam.x += ((api.m.on ? api.m.x - api.w / 2 : 0) - cam.x) * ck;
      cam.y += ((api.m.on ? api.m.y - api.h / 2 : 0) - cam.y) * ck;
      if (Math.abs(cam.x) + Math.abs(cam.y) > 0.6) active = true;

      // a click sends sparks out from where it landed
      const newest = api.ripples.length ? api.ripples[api.ripples.length - 1] : null;
      if (newest && newest.t0 !== lastRip) {
        for (let i = 0; i < 16; i++) {
          const ang = (Math.PI * 2 * i) / 16 + Math.random() * 0.4;
          const sp = 60 + Math.random() * 150;
          sparks.push({ x: newest.x, y: newest.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, g: SPARK[(Math.random() * SPARK.length) | 0] });
        }
        if (sparks.length > 60) sparks.splice(0, sparks.length - 60);
      }
      lastRip = newest ? newest.t0 : 0;

      // big outlined words, far behind everything
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = fg;
      ctx.lineWidth = 1;
      for (const b of bigs) {
        if (!api.reduce) {
          b.x -= dt * b.v;
          const wd = b.s * 0.62 * b.t.length;
          if (b.x < -wd) b.x = api.w + 40;
        }
        ctx.font = `700 ${b.s}px ${MONO}`;
        ctx.globalAlpha = 0.055;
        ctx.strokeText(b.t, b.x - cam.x * 0.012, b.y - cam.y * 0.012);
      }

      // dust: tiny twinkling squares
      ctx.fillStyle = fg;
      for (const d of dust) {
        const tw = 0.5 + 0.5 * Math.sin(t * 0.8 + d.ph);
        ctx.globalAlpha = 0.04 + 0.12 * tw * d.z;
        ctx.fillRect(d.x - cam.x * d.z * 0.04, d.y - cam.y * d.z * 0.04, 1.6, 1.6);
      }

      // words
      ctx.textAlign = "center";
      hot.length = 0;
      for (const k of toks) {
        if (!api.reduce) {
          k.y -= dt * (4 + k.z * 10);
          if (k.y < -30) {
            k.y = api.h + 30;
            k.x = Math.random() * api.w;
          }
        }
        const bx = k.x + Math.sin(t * 0.4 + k.ph) * k.sway - cam.x * k.z * 0.05;
        const by = k.y - cam.y * k.z * 0.05;
        let f = 0, tox = 0, toy = 0;

        if (api.m.on) {
          const dx = bx - api.m.x, dy = by - api.m.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < R) {
            f = 1 - d / R;
            const push = f * f * 46 * k.z;
            tox = (dx / d) * push;
            toy = (dy / d) * push;
          }
        }
        ringPush(api, now, bx, by, 80, 26);
        if (ring.k > f) f = ring.k;
        tox += ring.ox;
        toy += ring.oy;

        k.ox += (tox - k.ox) * 0.12;
        k.oy += (toy - k.oy) * 0.12;
        k.heat += (f - k.heat) * 0.16;
        const h = k.heat;
        if (h > 0.02) active = true;
        k.px = bx + k.ox;
        k.py = by + k.oy;
        if (h > 0.35) hot.push(k);

        // swell and glow near the pointer; flicker while it moves, settle when it rests
        const size = 10 + k.z * 13 + h * 7;
        ctx.font = `${h > 0.35 ? 700 : 500} ${size.toFixed(1)}px ${MONO}`;
        ctx.globalAlpha = clamp(0.07 + k.z * 0.15 + h * 0.78);
        ctx.fillStyle = h > 0.45 ? ac : fg;
        ctx.fillText(garble(k.t, h * (0.3 + api.m.speed * 0.9), k.seed, step), k.px, k.py);
      }

      // soft threads from the pointer to the hottest words
      if (api.m.on && hot.length) {
        hot.sort((p, q) => q.heat - p.heat);
        ctx.strokeStyle = ac;
        ctx.lineWidth = 1;
        const n = Math.min(4, hot.length);
        for (let i = 0; i < n; i++) {
          const k = hot[i];
          const mx = (api.m.x + k.px) / 2, my = (api.m.y + k.py) / 2;
          const bend = Math.sin(t * 2 + i * 1.7) * 14;
          const nx = -(k.py - api.m.y), ny = k.px - api.m.x;
          const nl = Math.hypot(nx, ny) || 1;
          ctx.globalAlpha = clamp(k.heat * 0.45);
          ctx.beginPath();
          ctx.moveTo(api.m.x, api.m.y);
          ctx.quadraticCurveTo(mx + (nx / nl) * bend, my + (ny / nl) * bend, k.px, k.py);
          ctx.stroke();
        }
      }

      // ink trail behind the pointer
      if (api.m.on) {
        const last = trail[trail.length - 1];
        if (!last || Math.hypot(api.m.x - last.x, api.m.y - last.y) > 7) trail.push({ x: api.m.x, y: api.m.y, life: 1 });
        if (trail.length > 18) trail.shift();
      }
      if (trail.length) {
        ctx.fillStyle = ac;
        for (const p of trail) {
          p.life -= dt * 1.6;
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
        ctx.fillStyle = ac;
        const drag = Math.exp(-dt * 2.2);
        for (const s of sparks) {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vx *= drag;
          s.vy *= drag;
          s.life -= dt / 1.3;
          if (s.life <= 0) continue;
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
