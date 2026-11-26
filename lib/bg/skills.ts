import { MONO, clamp } from "@/lib/ascii";
import { garble, ringPush, ring, type SceneFactory } from "./engine";

/**
 * Skills: "Network". Technology names float as nodes of a graph, grouped into small clusters (frontend, backend, games,
 * mobile, mods, deploy) that link up when they come close, with little signals travelling along the links.
 * The pointer is a probe: it pulls nearby nodes closer (holding the button pulls harder), plugs into them with cyan lines and
 * makes their labels flicker through code symbols. A click fires the nearest node and the signal spreads through the graph
 * hop by hop, lighting every link on its way. ~28 nodes, ~80 links, one pass.
 */
const GROUPS = [
  { name: "frontend", items: ["React", "Next.js", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind"] },
  { name: "backend", items: ["Laravel", "PHP", "Node", "Prisma", "Supabase", "MySQL", "SQL"] },
  { name: "games", items: ["Godot", "GDScript", "Unity", "C#", "C++"] },
  { name: "mobile", items: ["Kotlin", "Expo", "Java"] },
  { name: "mods", items: ["Fabric", "Gradle"] },
  { name: "deploy", items: ["Vercel", "Vite"] },
];
// where each cluster lives (fractions of the canvas), for wide and for narrow screens
const WIDE = [[0.17, 0.4], [0.4, 0.72], [0.58, 0.3], [0.78, 0.7], [0.92, 0.34], [0.06, 0.82]];
const NARROW = [[0.28, 0.3], [0.74, 0.24], [0.3, 0.62], [0.74, 0.6], [0.5, 0.88], [0.12, 0.88]];
const HOP_MS = 140;
const FIRE_MS = 900;

type Node = { n: string; g: number; hub: boolean; dx: number; dy: number; ph: number; ph2: number; amp: number; x: number; y: number; ox: number; oy: number; heat: number; seed: number };
type Packet = { e: number; t: number; sp: number };

const scene: SceneFactory = () => {
  let nodes: Node[] = [];
  let built = -1;
  let fireAt = new Float64Array(0);
  let fireEnd = 0;
  let lastRip = 0;
  const packets: Packet[] = [];
  const eI: number[] = [], eJ: number[] = [], eD: number[] = [];

  const build = (small: boolean) => {
    nodes = [];
    GROUPS.forEach((grp, g) => {
      const items = small ? grp.items.slice(0, 3) : grp.items;
      items.forEach((n, i) => {
        const ang = i * 2.4 + g * 1.3;
        const rad = i === 0 ? 0 : 44 + 30 * Math.sqrt(i);
        nodes.push({
          n, g, hub: i === 0,
          dx: Math.cos(ang) * rad * 1.15, dy: Math.sin(ang) * rad * 0.8,
          ph: Math.random() * 6.28, ph2: Math.random() * 6.28, amp: 5 + Math.random() * 9,
          x: 0, y: 0, ox: 0, oy: 0, heat: 0, seed: (Math.random() * 1000) | 0,
        });
      });
    });
    fireAt = new Float64Array(nodes.length).fill(Infinity);
    packets.length = 0;
    for (let i = 0; i < (small ? 2 : 5); i++) packets.push({ e: -1, t: 1, sp: 0.5 + Math.random() * 0.6 });
    built = small ? 1 : 0;
  };

  return {
    resize(api) {
      if (built !== (api.small ? 1 : 0)) build(api.small);
    },
    draw(ctx, now, dt, api) {
      if (built !== (api.small ? 1 : 0)) build(api.small);
      const t = api.reduce ? 0 : now / 1000;
      const step = Math.floor(now / 85);
      const sc = clamp(Math.min(api.w, api.h * 1.7) / 520, 0.55, 1.2);
      const R = (api.small ? 130 : 200) * (api.m.down ? 1.25 : 1);
      const pull = api.m.down ? 2.2 : 1;
      const D = 150 * sc;
      const anchors = api.small ? NARROW : WIDE;
      const fg = `rgb(${api.rgb})`;
      const ac = `rgb(${api.accent})`;
      let active = now < fireEnd;

      // a click fires the nearest node; the signal then spreads along the links of the previous frame, one hop at a time
      const newest = api.ripples.length ? api.ripples[api.ripples.length - 1] : null;
      if (newest && newest.t0 !== lastRip) {
        let src = -1, best = 220;
        nodes.forEach((k, i) => {
          const d = Math.hypot(k.x + k.ox - newest.x, k.y + k.oy - newest.y);
          if (d < best) { best = d; src = i; }
        });
        if (src >= 0) {
          const hop = new Int16Array(nodes.length).fill(-1);
          hop[src] = 0;
          for (let L = 0, grew = true; grew && L < 40; L++) {
            grew = false;
            for (let e = 0; e < eI.length; e++) {
              const i = eI[e], j = eJ[e];
              if (hop[i] === L && hop[j] < 0) { hop[j] = L + 1; grew = true; }
              else if (hop[j] === L && hop[i] < 0) { hop[i] = L + 1; grew = true; }
            }
          }
          let last = 0;
          for (let i = 0; i < nodes.length; i++) {
            fireAt[i] = hop[i] >= 0 ? newest.t0 + hop[i] * HOP_MS : Infinity;
            if (hop[i] >= 0) last = Math.max(last, fireAt[i]);
          }
          fireEnd = last + FIRE_MS;
        }
      }
      lastRip = newest ? newest.t0 : 0;

      // place every node: it floats around its cluster, then the pointer and rings nudge it
      for (let i = 0; i < nodes.length; i++) {
        const k = nodes[i];
        const [au, av] = anchors[k.g];
        k.x = au * api.w + k.dx * sc + Math.sin(t * 0.35 + k.ph) * k.amp * sc;
        k.y = av * api.h + k.dy * sc + Math.cos(t * 0.3 + k.ph2) * k.amp * sc;
        let f = 0, tox = 0, toy = 0;
        if (api.m.on) {
          const dx = api.m.x - k.x, dy = api.m.y - k.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < R) {
            f = 1 - d / R;
            tox = (dx / d) * f * 26 * pull;
            toy = (dy / d) * f * 26 * pull;
          }
        }
        ringPush(api, now, k.x, k.y, 80, 22);
        if (ring.k > f) f = ring.k;
        tox += ring.ox;
        toy += ring.oy;
        const fa = fireAt[i];
        if (fa <= now) {
          const gl = Math.exp(-(now - fa) / 500);
          if (gl > f) f = gl;
        }
        k.ox += (tox - k.ox) * 0.12;
        k.oy += (toy - k.oy) * 0.12;
        k.heat += (f - k.heat) * 0.2;
        if (k.heat > 0.02) active = true;
      }

      // links between close nodes: same cluster is closer and brighter
      eI.length = 0; eJ.length = 0; eD.length = 0;
      ctx.lineWidth = 1;
      ctx.strokeStyle = fg;
      for (let i = 0; i < nodes.length; i++) {
        const A = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const B = nodes[j];
          const same = A.g === B.g;
          const lim = same ? D * 1.5 : D * 1.2;
          const dx = A.x + A.ox - (B.x + B.ox), dy = A.y + A.oy - (B.y + B.oy);
          const d2 = dx * dx + dy * dy;
          if (d2 > lim * lim) continue;
          const d = Math.sqrt(d2);
          eI.push(i); eJ.push(j); eD.push(d);
          ctx.globalAlpha = Math.pow(1 - d / lim, 1.2) * (same ? 0.3 : 0.16) + Math.max(A.heat, B.heat) * 0.16;
          ctx.beginPath();
          ctx.moveTo(A.x + A.ox, A.y + A.oy);
          ctx.lineTo(B.x + B.ox, B.y + B.oy);
          ctx.stroke();
        }
      }

      // the spreading signal: each lit link is drawn from the node that fired first towards the next one
      ctx.strokeStyle = ac;
      ctx.lineWidth = 1.6;
      for (let e = 0; e < eI.length; e++) {
        const fi = fireAt[eI[e]], fj = fireAt[eJ[e]];
        const first = Math.min(fi, fj);
        if (!isFinite(first) || Math.abs(fi - fj) < 1 || now < first || now - first > FIRE_MS) continue;
        const from = fi < fj ? nodes[eI[e]] : nodes[eJ[e]];
        const to = fi < fj ? nodes[eJ[e]] : nodes[eI[e]];
        const p = clamp((now - first) / HOP_MS);
        const x1 = from.x + from.ox, y1 = from.y + from.oy;
        ctx.globalAlpha = (1 - (now - first) / FIRE_MS) * 0.9;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + (to.x + to.ox - x1) * p, y1 + (to.y + to.oy - y1) * p);
        ctx.stroke();
      }

      // pointer probe: cyan lines to the nodes it reaches
      ctx.lineWidth = 1;
      if (api.m.on) {
        ctx.strokeStyle = ac;
        for (const k of nodes) {
          if (k.heat < 0.12) continue;
          ctx.globalAlpha = clamp(k.heat * 0.7);
          ctx.beginPath();
          ctx.moveTo(api.m.x, api.m.y);
          ctx.lineTo(k.x + k.ox, k.y + k.oy);
          ctx.stroke();
        }
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(api.m.x, api.m.y, 5, 0, 6.283);
        ctx.stroke();
        ctx.globalAlpha = 0.07;
        ctx.beginPath();
        ctx.arc(api.m.x, api.m.y, R, 0, 6.283);
        ctx.stroke();
        if (api.m.down) {
          const q = (now % 700) / 700;
          ctx.globalAlpha = (1 - q) * 0.35;
          ctx.beginPath();
          ctx.arc(api.m.x, api.m.y, R * (1 - q), 0, 6.283);
          ctx.stroke();
        }
      }

      // ambient signals running along the links
      ctx.fillStyle = ac;
      if (!api.reduce && eI.length) {
        for (const p of packets) {
          p.t += dt * p.sp;
          if (p.t >= 1 || p.e < 0 || p.e >= eI.length) {
            p.e = (Math.random() * eI.length) | 0;
            p.t = 0;
            if (Math.random() < 0.5) p.sp = -Math.abs(p.sp); else p.sp = Math.abs(p.sp);
          }
          const A = nodes[eI[p.e]], B = nodes[eJ[p.e]];
          const q = p.sp < 0 ? 1 - p.t : p.t;
          const x = A.x + A.ox + (B.x + B.ox - A.x - A.ox) * q;
          const y = A.y + A.oy + (B.y + B.oy - A.y - A.oy) * q;
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, 6.283);
          ctx.fill();
        }
      }

      // nodes and labels
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      for (const k of nodes) {
        const h = k.heat;
        const x = k.x + k.ox, y = k.y + k.oy;
        const hotc = h > 0.5;
        ctx.fillStyle = hotc ? ac : fg;
        ctx.strokeStyle = hotc ? ac : fg;
        if (h > 0.15) {
          ctx.globalAlpha = h * 0.14;
          ctx.beginPath();
          ctx.arc(x, y, 12 + h * 12, 0, 6.283);
          ctx.fill();
        }
        ctx.globalAlpha = clamp(0.3 + h * 0.7);
        ctx.beginPath();
        ctx.arc(x, y, (k.hub ? 3 : 2) + h * 2.4, 0, 6.283);
        ctx.fill();
        if (k.hub) {
          ctx.globalAlpha = clamp(0.18 + h * 0.5);
          ctx.beginPath();
          ctx.arc(x, y, 8 + h * 2, 0, 6.283);
          ctx.stroke();
        }
        ctx.font = `${k.hub ? 600 : 500} ${api.small ? 10 : 11}px ${MONO}`;
        ctx.globalAlpha = clamp(0.2 + h * 0.8 + (k.hub ? 0.15 : 0));
        ctx.fillText(garble(k.n, h * (0.3 + api.m.speed * 0.9), k.seed, step), x + 10, y - 7);
        if (k.hub) {
          ctx.font = `500 9px ${MONO}`;
          ctx.globalAlpha = 0.2 + h * 0.4;
          ctx.fillText(GROUPS[k.g].name, x + 10, y - 20);
        }
      }
      return active || api.m.on || api.ripples.length > 0;
    },
  };
};

export default scene;
