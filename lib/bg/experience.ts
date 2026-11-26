import { MONO } from "@/lib/ascii";
import { RIPPLE_MS, type Api, type SceneFactory } from "./engine";

/**
 * Experience: "Timeline". Flowing contour lines that fade in from the left and swell towards the right like progress over
 * the years. Four milestones (2023 to 2026) stand on them with a short caption; a runner travels along the middle line
 * and sends a pulse ring out of every milestone it passes. The pointer pulls the lines towards it like gravity, lights up the
 * stretch it touches and scrubs through time: a thin cursor line reads out the year under it (2025.3). A click sends a wave
 * through the lines. ~15 lines of ~110 points each, nothing else.
 */
const MARKS = [
  { u: 0.12, year: "2023", tag: "first line of code" },
  { u: 0.37, year: "2024", tag: "vocational school" },
  { u: 0.62, year: "2025", tag: "robotics, react, mods" },
  { u: 0.87, year: "2026", tag: "final year, full stack" },
];
const PULSE_MS = 1500;

const scene: SceneFactory = () => {
  const pulse = [0, 0, 0, 0];
  let prevHead = -1;

  /** y of line `i` at x, and how strongly the pointer or a ring touches it there (0..1) */
  const sample = (i: number, n: number, x: number, t: number, now: number, a: Api): [number, number] => {
    const u = x / a.w;
    const base = a.h * (0.2 + (0.68 * i) / (n - 1));
    const depth = 0.55 + (i / (n - 1)) * 0.7;
    const amp = (5 + u * 22) * depth;
    let y = base + Math.sin(u * 5.2 + t * 0.5 + i * 0.45) * amp + Math.sin(u * 11 - t * 0.7 + i * 0.9) * amp * 0.45;
    let g = 0;
    if (a.m.on) {
      const dx = x - a.m.x, dy = base - a.m.y;
      g = Math.exp(-(dx * dx) / (2 * 150 * 150)) * Math.exp(-(dy * dy) / (2 * 130 * 130));
      y += (a.m.y - y) * 0.38 * g;
    }
    for (const r of a.ripples) {
      const age = now - r.t0;
      const dist = Math.hypot(x - r.x, base - r.y);
      const w = dist - age * 0.9;
      const kk = Math.exp(-(w * w) / (2 * 42 * 42)) * (1 - age / RIPPLE_MS);
      y += Math.sin(w * 0.08) * kk * 20;
      if (kk > g) g = kk;
    }
    return [y, g];
  };

  return {
    draw(ctx, now, _dt, a) {
      const t = a.reduce ? 0 : now / 1000;
      const n = a.small ? 9 : 15;
      const mid = Math.floor(n / 2);
      const stepX = a.small ? 18 : 12;
      const pts = Math.ceil(a.w / stepX) + 1;
      let active = false;

      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      const hot = new Path2D();

      // the lines: transparent on the left, stronger on the right
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        let px = 0, py = 0;
        for (let p = 0; p < pts; p++) {
          const x = p * stepX;
          const [y, g] = sample(i, n, x, t, now, a);
          if (p === 0) ctx.moveTo(x, y);
          else {
            ctx.lineTo(x, y);
            if (g > 0.3) {
              hot.moveTo(px, py);
              hot.lineTo(x, y);
              active = true;
            }
          }
          px = x;
          py = y;
        }
        const al = 0.09 + (i / (n - 1)) * 0.15;
        const gr = ctx.createLinearGradient(0, 0, a.w, 0);
        gr.addColorStop(0, `rgba(${a.rgb},${(al * 0.2).toFixed(3)})`);
        gr.addColorStop(1, `rgba(${a.rgb},${al.toFixed(3)})`);
        ctx.strokeStyle = gr;
        ctx.globalAlpha = 1;
        ctx.stroke();
      }
      ctx.strokeStyle = `rgb(${a.accent})`;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.78;
      ctx.stroke(hot);

      const idxs = a.small ? [0, 3] : [0, 1, 2, 3];
      const ux = a.small ? [0.2, 0.8] : MARKS.map((m) => m.u);

      // runner: a dot that travels along the middle line with a short comet tail
      const head = ((t * 0.09) % 1.2) * a.w - a.w * 0.1;
      if (!a.reduce) {
        if (prevHead >= 0 && head > prevHead) {
          for (let k = 0; k < idxs.length; k++) {
            const mx = ux[k] * a.w;
            if (prevHead < mx && head >= mx) pulse[idxs[k]] = now;
          }
        }
        prevHead = head;
        ctx.fillStyle = `rgb(${a.accent})`;
        for (let k = 0; k < 16; k++) {
          const x = head - k * 7;
          if (x < 0 || x > a.w) continue;
          const [y] = sample(mid, n, x, t, now, a);
          ctx.globalAlpha = (1 - k / 16) * 0.9;
          ctx.beginPath();
          ctx.arc(x, y, k === 0 ? 3.2 : 2.4 * (1 - k / 20), 0, 6.283);
          ctx.fill();
        }
      }

      // milestones: dashed marker, year, caption, a node on the middle line and the pulse ring
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const showTag = !a.small;
      idxs.forEach((mi, k) => {
        const m = MARKS[mi];
        const x = ux[k] * a.w;
        const near = a.m.on ? Math.max(0, 1 - Math.abs(a.m.x - x) / 120) : 0;
        if (near > 0.02) active = true;
        const hotc = near > 0.4;
        const col = hotc ? `rgb(${a.accent})` : `rgb(${a.rgb})`;

        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.06 + near * 0.3;
        ctx.setLineDash([2, 6]);
        ctx.beginPath();
        ctx.moveTo(x, a.h * 0.13);
        ctx.lineTo(x, a.h * 0.94);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = col;
        ctx.font = `600 ${a.small ? 10 : 12}px ${MONO}`;
        ctx.globalAlpha = 0.3 + near * 0.7;
        ctx.fillText(m.year, x, a.h * 0.1);
        if (showTag) {
          ctx.font = `500 10px ${MONO}`;
          ctx.globalAlpha = 0.12 + near * 0.7;
          ctx.fillText(m.tag, x, a.h * 0.1 + 16);
        }

        const [ny] = sample(mid, n, x, t, now, a);
        const age = now - pulse[mi];
        ctx.strokeStyle = `rgb(${a.accent})`;
        if (age < PULSE_MS) {
          active = true;
          const q = age / PULSE_MS;
          ctx.globalAlpha = (1 - q) * 0.7;
          ctx.beginPath();
          ctx.arc(x, ny, 6 + q * 48, 0, 6.283);
          ctx.stroke();
        }
        ctx.strokeStyle = col;
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.35 + near * 0.6;
        ctx.beginPath();
        ctx.arc(x, ny, 5 + near * 2.5, 0, 6.283);
        ctx.stroke();
        ctx.globalAlpha = 0.55 + near * 0.45;
        ctx.beginPath();
        ctx.arc(x, ny, 2 + near * 1.2, 0, 6.283);
        ctx.fill();
      });

      // time scrubber under the pointer
      if (a.m.on) {
        const u = a.m.x / a.w;
        const year = 2023 + Math.max(0, Math.min(3.4, (u - 0.12) / 0.25));
        ctx.strokeStyle = `rgb(${a.accent})`;
        ctx.fillStyle = `rgb(${a.accent})`;
        ctx.globalAlpha = 0.16;
        ctx.beginPath();
        ctx.moveTo(a.m.x, a.h * 0.13);
        ctx.lineTo(a.m.x, a.h * 0.94);
        ctx.stroke();
        ctx.font = `600 11px ${MONO}`;
        ctx.globalAlpha = 0.85;
        ctx.fillText(year.toFixed(1), a.m.x, a.h * 0.045);
      }
      return active || a.m.on || a.ripples.length > 0;
    },
  };
};

export default scene;
