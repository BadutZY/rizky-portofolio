import { MONO, clamp } from "@/lib/ascii";
import { garble, ringPush, ring, type SceneFactory } from "./engine";

/**
 * Contact: "Signal". A transmitter on the right broadcasts rings of dots that spread out over a tilted plane, while small
 * message words (hello, halo, DM me...) orbit it like satellites and flash when a ring passes through them. Under it a little
 * chat line types itself. The pointer is the receiver: a dashed beam with a travelling packet links the transmitter to it,
 * the closer it gets the faster the transmitter pulses, dots near it scatter and light up cyan, and satellites it touches
 * read out their message (they flicker while it moves). Holding the button transmits rapidly, a click sends an extra pulse.
 * ~10 satellites and at most ~700 dots, batched into a few paths.
 */
const MSGS = ["hello", "halo", "hi!", "@", "DM me", "let's talk", "ping", "idea?", "collab?", "hola", "say hi", "email"];
const LINES = ["> hello?", "< halo! got an idea?", "> let's build it", "< send me a message"];
const RATIO = 0.45; // how flat the plane looks
const TILT = -0.3; // radians
const ORBITS = [0.42, 0.66, 0.9, 1.18];
const SPEED = 0.115; // ring growth, px per ms
const TYPE_MS = 46;
const HOLD_MS = 1900;

type Sat = { t: string; o: number; a0: number; sp: number; seed: number; heat: number; flash: number };

const scene: SceneFactory = () => {
  let sats: Sat[] = [];
  let built = -1;
  const pulses: number[] = [];
  let nextPulse = 0;
  let lastRip = 0;
  let charge = 0;
  let line = 0;
  let lineStart = 0;

  const build = (small: boolean) => {
    const n = small ? 6 : 10;
    const perOrbit = ORBITS.map((_, o) => Array.from({ length: n }, (_, i) => i).filter((i) => i % ORBITS.length === o).length);
    sats = Array.from({ length: n }, (_, i) => {
      const o = i % ORBITS.length;
      const m = Math.floor(i / ORBITS.length);
      return {
        t: MSGS[(i * 5 + 1) % MSGS.length],
        o,
        a0: (m / perOrbit[o]) * 6.283 + o * 1.1,
        sp: (0.36 - o * 0.06) * (o % 2 ? -1 : 1),
        seed: (Math.random() * 1000) | 0,
        heat: 0,
        flash: 0,
      };
    });
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
      const fg = `rgb(${api.rgb})`;
      const ac = `rgb(${api.accent})`;

      const base = api.small ? Math.min(api.w * 0.3, 150) : Math.min(api.w * 0.26, 250);
      const ax = api.small ? api.w * 0.5 : api.w * 0.74;
      const ay = api.small ? api.h * 0.33 : api.h * 0.42;
      const cT = Math.cos(TILT), sT = Math.sin(TILT);
      const rMax = base * 1.6;
      const life = rMax / SPEED;
      const dotGap = api.small ? 11 : 9;

      // the transmitter: pulses faster when the pointer comes close, rapid-fire while the button is held
      const dAnchor = api.m.on ? Math.hypot(api.m.x - ax, api.m.y - ay) : 9999;
      const prox = Math.max(0, 1 - dAnchor / 340);
      charge += ((api.m.down ? 1 : 0) - charge) * (1 - Math.exp(-dt * 6));
      if (api.reduce) {
        if (!pulses.length) pulses.push(now - life * 0.25, now - life * 0.55, now - life * 0.82);
      } else {
        if (!pulses.length) {
          pulses.push(now - 900, now - 2100);
          nextPulse = now + 600;
        }
        if (now >= nextPulse) {
          pulses.push(now);
          nextPulse = now + (api.m.down ? 380 : 2700 - prox * 1700);
        }
        const newest = api.ripples.length ? api.ripples[api.ripples.length - 1] : null;
        if (newest && newest.t0 !== lastRip) pulses.push(now);
        lastRip = newest ? newest.t0 : 0;
        while (pulses.length && now - pulses[0] > life) pulses.shift();
        if (pulses.length > 9) pulses.splice(0, pulses.length - 9);
      }

      // orbit guides
      ctx.strokeStyle = fg;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.07;
      for (const o of ORBITS) {
        ctx.beginPath();
        ctx.ellipse(ax, ay, base * o, base * o * RATIO, TILT, 0, 6.283);
        ctx.stroke();
      }

      // glow of the transmitter
      const gr = base * (0.55 + charge * 0.35 + prox * 0.15) * (1 + Math.sin(t * 2) * 0.04);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, gr);
      grad.addColorStop(0, `rgba(${api.accent},${(0.24 + charge * 0.2).toFixed(3)})`);
      grad.addColorStop(1, `rgba(${api.accent},0)`);
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(TILT);
      ctx.scale(1, RATIO * 1.4);
      ctx.globalAlpha = 1;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, gr, 0, 6.283);
      ctx.fill();
      ctx.restore();

      // rings of dots spreading over the plane
      const hot = new Path2D();
      const anyRipple = api.ripples.length > 0;
      const RR = 110;
      for (const born of pulses) {
        const r = (now - born) * SPEED;
        if (r < 4 || r > rMax) continue;
        const q = r / rMax;
        const al = Math.pow(1 - q, 1.25) * 0.8 * Math.min(1, q * 12);
        const n = clamp(Math.round((6.283 * r) / dotGap), 10, 150);
        const twist = born * 0.0004;
        const path = new Path2D();
        for (let i = 0; i < n; i++) {
          const th = (i / n) * 6.283 + twist;
          const px = Math.cos(th) * r, py = Math.sin(th) * r * RATIO;
          let x = ax + px * cT - py * sT;
          let y = ay + px * sT + py * cT;
          let big = false;
          if (api.m.on) {
            const dx = x - api.m.x, dy = y - api.m.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < RR * RR) {
              const d = Math.sqrt(d2) || 1;
              const f = 1 - d / RR;
              x += (dx / d) * f * f * 16;
              y += (dy / d) * f * f * 16;
              if (f > 0.3) big = true;
            }
          }
          if (anyRipple) {
            ringPush(api, now, x, y, 60, 10);
            if (ring.k > 0.05) {
              x += ring.ox;
              y += ring.oy;
              if (ring.k > 0.25) big = true;
            }
          }
          if (big) hot.rect(x - 1.5, y - 1.5, 3, 3);
          else path.rect(x - 1, y - 1, 2, 2);
        }
        ctx.fillStyle = fg;
        ctx.globalAlpha = al;
        ctx.fill(path);
      }
      ctx.fillStyle = ac;
      ctx.globalAlpha = 0.9;
      ctx.fill(hot);

      // satellites on their orbits
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      let flashing = false;
      const decay = Math.exp(-dt * 3);
      for (const s of sats) {
        const rx = base * ORBITS[s.o];
        const th = s.a0 + s.sp * t;
        const px = Math.cos(th) * rx, py = Math.sin(th) * rx * RATIO;
        const z = (Math.sin(th) + 1) / 2; // 1 = in front, 0 = behind
        const x = ax + px * cT - py * sT;
        const y = ay + px * sT + py * cT;

        // a passing ring makes it flash
        for (const born of pulses) {
          const d = Math.abs((now - born) * SPEED - rx);
          if (d < 16) s.flash = Math.max(s.flash, 1 - d / 16);
        }
        s.flash *= decay;
        let f = 0;
        if (api.m.on) {
          const d = Math.hypot(x - api.m.x, y - api.m.y);
          if (d < 150) f = 1 - d / 150;
        }
        ringPush(api, now, x, y, 70, 0);
        if (ring.k > f) f = ring.k;
        s.heat += (f - s.heat) * 0.16;
        const h = Math.max(s.heat, s.flash * 0.8);
        if (h > 0.05) flashing = true;
        const hotc = h > 0.45;
        const col = hotc ? ac : fg;

        // short tail behind it
        ctx.fillStyle = col;
        const dir = s.sp > 0 ? -1 : 1;
        for (let k = 1; k <= 6; k++) {
          const tt = th + dir * k * 0.07;
          const qx = Math.cos(tt) * rx, qy = Math.sin(tt) * rx * RATIO;
          ctx.globalAlpha = (0.2 + z * 0.3) * (1 - k / 7);
          ctx.fillRect(ax + qx * cT - qy * sT - 1, ay + qx * sT + qy * cT - 1, 2, 2);
        }

        ctx.globalAlpha = clamp(0.3 + z * 0.4 + h * 0.5);
        ctx.beginPath();
        ctx.arc(x, y, 1.8 + z * 1.6 + h * 2.4, 0, 6.283);
        ctx.fill();
        if (h > 0.15) {
          ctx.globalAlpha = h * 0.18;
          ctx.beginPath();
          ctx.arc(x, y, 10 + h * 12, 0, 6.283);
          ctx.fill();
        }
        ctx.font = `${hotc ? 700 : 500} ${(9.5 + z * 2.5 + h * 3).toFixed(1)}px ${MONO}`;
        ctx.globalAlpha = clamp(0.14 + z * 0.3 + h * 0.8);
        ctx.fillText(garble(s.t, h * (0.25 + api.m.speed * 0.9) + s.flash * 0.5, s.seed, step), x + 9, y - 7);
      }

      // transmitter core
      const beat = pulses.length ? Math.max(0, 1 - (now - pulses[pulses.length - 1]) / 600) : 0;
      ctx.fillStyle = ac;
      ctx.strokeStyle = ac;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.arc(ax, ay, 3.4 + beat * 1.4, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = 0.3 + beat * 0.4;
      ctx.beginPath();
      ctx.arc(ax, ay, 9 + beat * 5, 0, 6.283);
      ctx.stroke();

      // receiver beam from the transmitter to the pointer
      if (api.m.on) {
        ctx.strokeStyle = ac;
        ctx.fillStyle = ac;
        ctx.globalAlpha = 0.12 + prox * 0.25;
        ctx.setLineDash([3, 7]);
        ctx.lineDashOffset = -t * 30;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(api.m.x, api.m.y);
        ctx.stroke();
        ctx.setLineDash([]);
        const pq = (t * 0.9) % 1;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(ax + (api.m.x - ax) * pq, ay + (api.m.y - ay) * pq, 2.2, 0, 6.283);
        ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(api.m.x, api.m.y, 5, 0, 6.283);
        ctx.stroke();
        ctx.globalAlpha = 0.07;
        ctx.beginPath();
        ctx.arc(api.m.x, api.m.y, RR, 0, 6.283);
        ctx.stroke();
      }

      // the chat line that types itself under the orbits
      if (!lineStart) lineStart = now;
      const text = LINES[line];
      const typed = api.reduce ? text.length : Math.min(text.length, Math.floor((now - lineStart) / TYPE_MS));
      if (!api.reduce && now - lineStart > text.length * TYPE_MS + HOLD_MS) {
        line = (line + 1) % LINES.length;
        lineStart = now;
      }
      const ty = Math.min(api.h - 18, ay + base * ORBITS[ORBITS.length - 1] * RATIO + 42);
      const caret = typed < text.length || Math.floor(now / 500) % 2 === 0 ? "_" : " ";
      ctx.font = `500 ${api.small ? 11 : 12}px ${MONO}`;
      ctx.textAlign = "center";
      ctx.fillStyle = text[0] === "<" ? ac : fg;
      ctx.globalAlpha = 0.5;
      ctx.fillText(text.slice(0, typed) + caret, ax, ty);

      return api.m.on || api.ripples.length > 0 || flashing || charge > 0.02;
    },
  };
};

export default scene;
