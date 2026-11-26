"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/data";
import { JAVA, REGION, WORLD } from "@/lib/geo-dots";
import { gsap } from "@/lib/gsap";
import { clamp } from "@/lib/ascii";
import Clock from "@/components/ui/Clock";
import Icon from "@/components/ui/Icon";

type Grid = { lon0: number; lat1: number; step: number; rows: string[] };
type Layer = { step: number; lon: Float32Array; lat: Float32Array; kind: Uint8Array };

/** Turn a generated dot grid (one string per row: 0 sea, 1 land, 2 Indonesia) into flat arrays of land dots. */
function decode(g: Grid): Layer {
  const lon: number[] = [], lat: number[] = [], kind: number[] = [];
  g.rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] === "0") continue;
      lon.push(g.lon0 + (c + 0.5) * g.step);
      lat.push(g.lat1 - (r + 0.5) * g.step);
      kind.push(row[c] === "2" ? 2 : 1);
    }
  });
  return { step: g.step, lon: Float32Array.from(lon), lat: Float32Array.from(lat), kind: Uint8Array.from(kind) };
}

const STOPS = [
  { id: "world", label: "World" },
  { id: "indonesia", label: "Indonesia" },
  { id: "java", label: "West Java" },
] as const;

const CITIES = [
  { name: "Jakarta", lat: -6.2088, lon: 106.8456, side: "l" },
  { name: "Bandung", lat: -6.9175, lon: 107.6191, side: "r" },
  { name: "Depok", lat: -6.4025, lon: 106.7942, side: "l" },
] as const;

const { lat: LAT, lon: LON } = site.geo;
const rad = Math.PI / 180;
const km = (lat: number, lon: number) => {
  const a = Math.sin(((lat - LAT) * rad) / 2) ** 2 + Math.cos(LAT * rad) * Math.cos(lat * rad) * Math.sin(((lon - LON) * rad) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
};
const dms = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`;
/** How visible a dot layer is for its on-screen dot spacing: fades in as dots get far enough apart, out when they get too sparse. */
const vis = (s: number, small: boolean) => {
  const k = small ? 0.9 : 1;
  const t = s < 2 * k ? 0 : s < 3.4 * k ? (s - 2 * k) / (1.4 * k) : s < 9.5 ? 1 : s < 17 ? 1 - (s - 9.5) / 7.5 : 0;
  return t * t * (3 - 2 * t);
};

/**
 * Dot-matrix map of the world that zooms from the whole planet, to Indonesia, to West Java, with a pin on Bogor.
 * Built from real country borders (see lib/geo-dots.ts). Three dot layers of different detail cross-fade as you zoom.
 * Interaction: dots swell and lean away from the pointer, a dashed line measures the distance from Bogor to the pointer
 * (with live latitude and longitude), a click sends a ripple, and clicking Indonesia or the pin zooms in.
 */
export default function LocationMap() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pin = useRef<HTMLButtonElement>(null);
  const cityRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const readout = useRef<HTMLDivElement>(null);
  const coordEl = useRef<HTMLSpanElement>(null);
  const distEl = useRef<HTMLSpanElement>(null);
  const stopRef = useRef(0);
  const [stop, setStopState] = useState(0);
  const [on, setOn] = useState(false);

  const go = (i: number) => {
    const n = ((i % STOPS.length) + STOPS.length) % STOPS.length;
    stopRef.current = n;
    setStopState(n);
  };

  useEffect(() => {
    const box = stage.current;
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!box || !c || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const layers = [decode(WORLD), decode(REGION), decode(JAVA)];
    let W = 0, H = 0, dpr = 1, small = false;
    let color = "255,255,255";
    let visible = false, seen = false, alive = true;
    let targets: { cx: number; cy: number; ls: number }[] = [];
    const cam = { cx: 0, cy: 13, ls: 0 };
    let intro = 0; // 0..1 fade-in of the whole map
    let prev = 0, lastActive = 0, lastDraw = 0;
    const m = { x: 0, y: 0, on: false, px: 0, py: 0, tpx: 0, tpy: 0 };
    let ripples: { x: number; y: number; t0: number }[] = [];

    const readColor = () => {
      color = getComputedStyle(document.documentElement).getPropertyValue("--fg-rgb").trim() || "255,255,255";
    };
    const fit = (spanLon: number, spanLat: number, frac: number) => Math.min((W * frac) / spanLon, (H * frac) / spanLat);
    const build = () => {
      const r = box.getBoundingClientRect();
      W = r.width;
      H = r.height;
      small = W < 640;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      targets = [
        small
          ? { cx: 68, cy: 10, ls: Math.log(fit(200, 142, 0.96)) }
          : { cx: 0, cy: 13, ls: Math.log(fit(360, 142, 0.97)) },
        small
          ? { cx: 112, cy: -3.5, ls: Math.log(fit(30, 22, 0.92)) }
          : { cx: 118, cy: -2.5, ls: Math.log(fit(50, 24, 0.92)) },
        { cx: 108.2, cy: -6.9, ls: Math.log(fit(small ? 5.6 : 9, 4.6, 0.84)) },
      ];
      if (!seen) {
        const t = targets[stopRef.current];
        cam.cx = t.cx; cam.cy = t.cy; cam.ls = t.ls;
      }
    };

    const sx = (lon: number) => W / 2 + (lon - cam.cx) * Math.exp(cam.ls) + m.px;
    const sy = (lat: number) => H / 2 - (lat - cam.cy) * Math.exp(cam.ls) + m.py;

    const draw = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - prev) / 1000));
      prev = now;
      const t = targets[stopRef.current];
      const k = reduce ? 1 : 1 - Math.exp(-dt * 3.6);
      cam.cx += (t.cx - cam.cx) * k;
      cam.cy += (t.cy - cam.cy) * k;
      cam.ls += (t.ls - cam.ls) * k;
      m.px += (m.tpx - m.px) * 0.08;
      m.py += (m.tpy - m.py) * 0.08;
      if (intro < 1) intro = reduce ? 1 : Math.min(1, intro + dt / 1.1);
      const ease = 1 - (1 - intro) ** 3;
      const scale = Math.exp(cam.ls);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = `rgb(${color})`;
      ctx.strokeStyle = `rgb(${color})`;
      ripples = ripples.filter((r) => now - r.t0 < 1400);
      const R = 120, R2 = R * R;
      const busy = Math.abs(t.ls - cam.ls) > 0.002 || Math.abs(t.cx - cam.cx) > 0.01 || intro < 1 || ripples.length > 0 || m.on;

      for (let li = 0; li < layers.length; li++) {
        const L = layers[li];
        const s = L.step * scale;
        const v = vis(s, small) * ease;
        if (v < 0.02) continue;
        const rBase = Math.max(0.6, Math.min(2.7, s * 0.3));
        const mainA = new Path2D(); // Indonesia
        const mainB = new Path2D(); // everything else
        const x0 = -12, x1 = W + 12, y0 = -12, y1 = H + 12;
        for (let i = 0; i < L.lon.length; i++) {
          let x = sx(L.lon[i]);
          let y = sy(L.lat[i]);
          if (x < x0 || x > x1 || y < y0 || y > y1) continue;
          const ind = L.kind[i] === 2;
          // pointer + ripple influence
          let e = 0, ox = 0, oy = 0;
          if (m.on) {
            const dx = x - m.x, dy = y - m.y, d2 = dx * dx + dy * dy;
            if (d2 < R2) {
              const d = Math.sqrt(d2) || 1;
              const f = 1 - d / R;
              e = f * f;
              ox = (dx / d) * f * f * 9;
              oy = (dy / d) * f * f * 9;
            }
          }
          for (let q = 0; q < ripples.length; q++) {
            const rp = ripples[q];
            const age = now - rp.t0;
            const dx = x - rp.x, dy = y - rp.y;
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            const dd = Math.abs(d - age * 0.55);
            if (dd < 46) {
              const kk = (1 - dd / 46) * (1 - age / 1400);
              if (kk > e) e = kk;
              ox += (dx / d) * kk * 7;
              oy += (dy / d) * kk * 7;
            }
          }
          if (e > 0.02) {
            const r = rBase * (1 + e * 1.7);
            ctx.globalAlpha = clamp((ind ? 0.92 : 0.34) * v + e * 0.7 * v, 0, 1);
            ctx.beginPath();
            ctx.arc(x + ox, y + oy, r, 0, 6.2832);
            ctx.fill();
          } else {
            const p = ind ? mainA : mainB;
            p.moveTo(x + rBase, y);
            p.arc(x, y, rBase, 0, 6.2832);
          }
        }
        ctx.globalAlpha = 0.34 * v;
        ctx.fill(mainB);
        ctx.globalAlpha = 0.92 * v;
        ctx.fill(mainA);
      }

      // pin and a dashed measuring line from Bogor to the pointer
      const px = sx(LON), py = sy(LAT);
      if (m.on) {
        ctx.globalAlpha = 0.45 * ease;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.9 * ease;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 3, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (pin.current) {
        pin.current.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
        pin.current.style.opacity = String(ease);
      }
      // nearby cities appear once zoomed in on Java
      const z = clamp((cam.ls - targets[1].ls - 0.5) / (targets[2].ls - targets[1].ls - 0.5));
      CITIES.forEach((ct, i) => {
        const el = cityRefs.current[i];
        if (!el) return;
        el.style.transform = `translate3d(${sx(ct.lon).toFixed(1)}px, ${sy(ct.lat).toFixed(1)}px, 0)`;
        el.style.opacity = String(z * z);
      });
      return busy;
    };

    const tick = () => {
      if (!alive || !visible || document.hidden) return;
      const now = performance.now();
      const busyRecently = m.on || ripples.length > 0 || now - lastActive < 600;
      if (!busyRecently && now - lastDraw < 90) return; // idle: only the camera and pin need updating
      lastDraw = now;
      if (draw(now)) lastActive = now;
    };

    const toGeo = (x: number, y: number) => {
      const s = Math.exp(cam.ls);
      return { lon: cam.cx + (x - W / 2 - m.px) / s, lat: cam.cy - (y - H / 2 - m.py) / s };
    };
    const setReadout = (x: number | null, y: number | null) => {
      const co = coordEl.current, di = distEl.current, ro = readout.current;
      if (!co || !di || !ro) return;
      if (x === null || y === null) {
        co.textContent = `${dms(LAT, "N", "S")}  ${dms(LON, "E", "W")}`;
        di.textContent = `${site.geo.city}, ${site.geo.country}`;
        ro.dataset.live = "0";
        return;
      }
      const g = toGeo(x, y);
      if (g.lat > 90 || g.lat < -90 || g.lon > 180 || g.lon < -180) return;
      co.textContent = `${dms(g.lat, "N", "S")}  ${dms(g.lon, "E", "W")}`;
      const d = km(g.lat, g.lon);
      di.textContent = d < 1 ? `You are at ${site.geo.city}` : `${Math.round(d).toLocaleString("en-US")} km from ${site.geo.city}`;
      ro.dataset.live = "1";
    };

    const local = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, r };
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      m.x = p.x; m.y = p.y; m.on = true;
      m.tpx = -((p.x / p.r.width) - 0.5) * 14;
      m.tpy = -((p.y / p.r.height) - 0.5) * 10;
      lastActive = performance.now();
      setReadout(p.x, p.y);
    };
    const onLeave = () => {
      m.on = false;
      m.tpx = m.tpy = 0;
      setReadout(null, null);
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      onMove(e);
      const p = local(e);
      ripples.push({ x: p.x, y: p.y, t0: performance.now() });
      if (ripples.length > 4) ripples.shift();
      // clicking Indonesia from the world view zooms in
      if (stopRef.current === 0) {
        const g = toGeo(p.x, p.y);
        if (g.lon > 94 && g.lon < 142 && g.lat < 7 && g.lat > -12) go(1);
      }
    };

    readColor();
    build();
    setReadout(null, null);
    const mo = new MutationObserver(readColor);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const io = new IntersectionObserver(
      ([en]) => {
        visible = en.isIntersecting;
        if (visible && !seen) {
          seen = true;
          setOn(true);
        }
      },
      { threshold: 0.15 },
    );
    io.observe(box);
    let lastW = 0;
    const ro = new ResizeObserver(() => {
      const w = Math.round(box.clientWidth);
      if (w === lastW) return;
      lastW = w;
      build();
      if (reduce) draw(performance.now());
    });
    ro.observe(box);
    c.addEventListener("pointermove", onMove, { passive: true });
    c.addEventListener("pointerdown", onDown, { passive: true });
    c.addEventListener("pointerleave", onLeave);
    c.addEventListener("pointerup", (e) => e.pointerType !== "mouse" && onLeave());
    if (reduce) {
      intro = 1;
      draw(performance.now());
    }
    gsap.ticker.add(tick);
    // with reduced motion the camera jumps, so redraw when the chosen stop changes
    const poll = reduce ? window.setInterval(() => draw(performance.now()), 250) : 0;

    return () => {
      alive = false;
      gsap.ticker.remove(tick);
      mo.disconnect();
      io.disconnect();
      ro.disconnect();
      if (poll) clearInterval(poll);
      c.removeEventListener("pointermove", onMove);
      c.removeEventListener("pointerdown", onDown);
      c.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className={`geo${on ? " in" : ""}`}>
      <div ref={stage} className="geo-stage">
        <canvas ref={canvas} aria-hidden />

        <div className="geo-chips chips" role="group" aria-label="Map zoom">
          {STOPS.map((s, i) => (
            <button key={s.id} type="button" className={`chip${stop === i ? " on" : ""}`} aria-pressed={stop === i} onClick={() => go(i)}>
              {s.label}
            </button>
          ))}
        </div>

        <button ref={pin} type="button" className="geo-pin" onClick={() => go(stop + 1)} aria-label={`${site.geo.city}, ${site.geo.country}. Zoom ${stop === 2 ? "out" : "in"}`} data-cursor={stop === 2 ? "Zoom out" : "Zoom in"}>
          <i className="geo-ring" />
          <i className="geo-ring r2" />
          <i className="geo-dot" />
          <span className="geo-label">{stop === 0 ? `${site.geo.city}, ${site.geo.country}` : site.geo.city}</span>
        </button>
        {CITIES.map((ct, i) => (
          <span key={ct.name} ref={(el) => { cityRefs.current[i] = el; }} className={`geo-city ${ct.side}`} aria-hidden>
            <i />
            <em>{ct.name}</em>
          </span>
        ))}

        <div ref={readout} className="geo-readout" data-live="0" aria-live="off">
          <span ref={coordEl} className="geo-coords" />
          <span ref={distEl} className="geo-dist" />
        </div>
        <p className="geo-hint">{stop === 0 ? "Click Indonesia or the pin to zoom in" : stop === 1 ? "Click the pin to zoom closer" : "Click the pin to zoom out"}</p>
      </div>

      <ul className="geo-facts">
        <li>
          <span>Based in</span>
          <b>
            {site.geo.city}, {site.geo.region}
          </b>
        </li>
        <li>
          <span>Country</span>
          <b>{site.geo.country}</b>
        </li>
        <li>
          <span>Coordinates</span>
          <b>
            {dms(LAT, "N", "S")}, {dms(LON, "E", "W")}
          </b>
        </li>
        <li>
          <span>Local time</span>
          <b className="geo-time">
            <Icon name="clock" size={16} /> <Clock />
          </b>
        </li>
      </ul>
    </div>
  );
}
