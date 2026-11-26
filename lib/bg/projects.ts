import { MONO, clamp, hash } from "@/lib/ascii";
import { ringPush, ring, type SceneFactory } from "./engine";

/**
 * Projects: "Build". A mosaic of small squares (think pixels, cards, a screen full of projects) that swell and fade in slow
 * waves. A window frame with corner marks hops across the mosaic and, once it lands, a tiny screen builds itself out of
 * tiles inside it: a landing page, a dashboard or a platformer level, with the file name typed above the frame.
 * Near the pointer tiles grow, light up cyan and leave a fading trail. A click opens a new window right where you click,
 * and resting the pointer inside a window keeps it from hopping away.
 * Squares are batched into 7 paths (one fill per brightness level), so a frame is just a handful of draw calls.
 */
const LEVELS = 6;
const W = 8;
const H = 5;

// '#' bright, '+' medium, '.' faint, '@' accent
const SHAPES = [
  { file: "landing.tsx", rows: ["#.....++", "........", "####.+++", "##...+++", "#.@..+++"] },
  { file: "dashboard.tsx", rows: ["#+++++++", "#.###.##", "#.###.##", "#.......", "#.+++.+."] },
  { file: "game.gd", rows: ["......+.", "..##....", "......+.", ".@..###.", "########"] },
];
const LEVEL_OF: Record<string, number> = { "#": 0.92, "+": 0.55, ".": 0.24, "@": 1 };

const scene: SceneFactory = (a) => {
  let cell = 26, cols = 0, rows = 0;
  let heat = new Float32Array(0);
  const sel = { x: 3, y: 2, tx: 3, ty: 2, shape: 0, born: 0, landed: 0, next: 0, flash: 0, seed: 1, moving: true };
  let lastRip = 0;

  const clampSel = () => {
    sel.tx = Math.max(0, Math.min(sel.tx, cols - W - 1));
    sel.ty = Math.max(0, Math.min(sel.ty, rows - H - 1));
  };
  const layout = (api = a) => {
    cell = api.small ? 20 : 26;
    cols = Math.ceil(api.w / cell) + 1;
    rows = Math.ceil(api.h / cell) + 1;
    heat = new Float32Array(cols * rows);
    clampSel();
    sel.x = sel.tx;
    sel.y = sel.ty;
  };
  layout();

  const open = (now: number, tx: number, ty: number) => {
    sel.shape = (sel.shape + 1 + ((Math.random() * (SHAPES.length - 1)) | 0)) % SHAPES.length;
    sel.tx = tx;
    sel.ty = ty;
    clampSel();
    sel.born = now;
    sel.landed = 0;
    sel.moving = true;
    sel.flash = 1;
    sel.seed = (Math.random() * 1000) | 0;
    sel.next = now + 5200 + Math.random() * 2600;
  };

  return {
    resize: layout,
    draw(ctx, now, dt, api) {
      const t = api.reduce ? 0 : now / 1000;
      const step = Math.floor(now / 110);
      if (!sel.born) {
        sel.born = now;
        sel.next = now + 3000;
        sel.landed = api.reduce ? now - 5000 : 0;
      }

      // a click opens a window at that spot
      const newest = api.ripples.length ? api.ripples[api.ripples.length - 1] : null;
      if (newest && newest.t0 !== lastRip) open(now, Math.round(newest.x / cell - W / 2), Math.round(newest.y / cell - H / 2));
      lastRip = newest ? newest.t0 : 0;

      const ease = 1 - Math.exp(-dt * 4.5);
      sel.x += (sel.tx - sel.x) * ease;
      sel.y += (sel.ty - sel.y) * ease;
      sel.flash *= Math.exp(-dt * 1.6);
      const trav = Math.hypot(sel.tx - sel.x, sel.ty - sel.y);
      if (sel.moving && trav < 0.35) {
        sel.moving = false;
        sel.landed = now;
      }

      // pointer resting inside the window keeps it open
      const wx0 = sel.x * cell, wy0 = sel.y * cell; // left/top edge of the window's first tile
      const hovered = api.m.on && api.m.x > wx0 && api.m.x < wx0 + W * cell && api.m.y > wy0 && api.m.y < wy0 + H * cell;
      if (!api.reduce && !sel.moving && !hovered && now > sel.next) {
        open(now, Math.floor(Math.random() * Math.max(1, cols - W - 1)), Math.floor(Math.random() * Math.max(1, rows - H - 1)));
      }
      if (hovered) sel.next = Math.max(sel.next, now + 2500);

      const shape = SHAPES[sel.shape];
      const R = api.small ? 120 : 170;
      const decay = Math.exp(-dt * 2.2);
      const cx = cols * 0.5, cy = rows * 0.4;
      const side = cell - 4;
      const paths = Array.from({ length: LEVELS }, () => new Path2D());
      const hot = new Path2D();
      let active = false;
      let building = false;

      for (let j = 0; j < rows; j++) {
        const py = j * cell + cell / 2;
        for (let i = 0; i < cols; i++) {
          const idx = j * cols + i;
          const px = i * cell + cell / 2;
          const v = clamp(
            (Math.sin(i * 0.21 + t * 0.6) + Math.sin(j * 0.27 - t * 0.5) + Math.sin(Math.hypot(i - cx, (j - cy) * 1.4) * 0.18 - t * 0.8)) / 6 + 0.5,
          );

          let hv = heat[idx];
          if (api.m.on) {
            const dx = px - api.m.x, dy = py - api.m.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < R * R) {
              const f = 1 - Math.sqrt(d2) / R;
              if (f > hv) hv = f;
            }
          }
          heat[idx] = hv > 0.01 ? hv * decay : 0;

          const rp = ringPush(api, now, px, py, 70, 0);
          const k = rp.k;

          // the little screen that builds itself inside the window
          let s = 0;
          let accent = false;
          const ci = i - sel.tx, cj = j - sel.ty;
          if (ci >= 0 && ci < W && cj >= 0 && cj < H) {
            if (sel.moving) {
              s = 0.1;
            } else {
              const delay = hash(ci * 31 + cj * 17 + sel.seed) * 650;
              const since = now - sel.landed - delay;
              if (since > 0) {
                const ch = shape.rows[cj][ci];
                s = LEVEL_OF[ch] ?? 0.2;
                accent = ch === "@";
                s += clamp(1 - since / 260) * 0.45;
              } else {
                s = hash(i * 7 + j * 13 + step) < 0.16 ? 0.34 : 0.1;
                building = true;
              }
            }
          }

          const e = Math.max(hv * hv, k, s);
          if (e > 0.03) active = true;
          const size = Math.min(side, side * (0.26 + v * 0.34 + e * 0.75));
          const alpha = 0.05 + v * 0.13 + e * 0.8;
          const half = size / 2;
          if (accent || (e > 0.62 && s < 0.5)) hot.rect(px - half, py - half, size, size);
          else paths[Math.min(LEVELS - 1, Math.floor(alpha / 0.17))].rect(px - half, py - half, size, size);
        }
      }

      ctx.fillStyle = `rgb(${api.rgb})`;
      for (let l = 0; l < LEVELS; l++) {
        ctx.globalAlpha = (l + 0.6) * 0.15;
        ctx.fill(paths[l]);
      }
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = `rgb(${api.accent})`;
      ctx.fill(hot);

      // window frame with corner marks and the file name
      const x0 = wx0 + 1, y0 = wy0 + 1;
      const ww = W * cell - 2, hh = H * cell - 2;
      const frameCol = hovered ? `rgb(${api.accent})` : `rgb(${api.rgb})`;
      ctx.strokeStyle = frameCol;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3 + sel.flash * 0.5 + (hovered ? 0.25 : 0);
      ctx.strokeRect(x0 + 0.5, y0 + 0.5, ww, hh);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = `rgb(${api.accent})`;
      for (const [mx, my] of [[x0, y0], [x0 + ww, y0], [x0, y0 + hh], [x0 + ww, y0 + hh]]) ctx.fillRect(mx - 2, my - 2, 5, 5);

      const typed = sel.moving ? 0 : Math.min(shape.file.length, Math.floor((now - sel.landed) / 45));
      ctx.font = `500 ${api.small ? 9 : 10}px ${MONO}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = frameCol;
      ctx.globalAlpha = 0.55 + sel.flash * 0.4;
      const label = shape.file.slice(0, typed) + (typed < shape.file.length || Math.floor(now / 500) % 2 ? "_" : " ");
      ctx.fillText(label, x0, y0 - 5);

      return (
        active ||
        api.m.on ||
        api.ripples.length > 0 ||
        sel.flash > 0.05 ||
        sel.moving ||
        building ||
        typed < shape.file.length ||
        trav > 0.05 ||
        ring.k > 0
      );
    },
  };
};

export default scene;
