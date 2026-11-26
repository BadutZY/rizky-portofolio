"use client";

import { useEffect, useRef, useState } from "react";
import { createTimeline, stagger } from "animejs";
import { reducedMotion } from "@/lib/gsap";
import { site } from "@/lib/data";
import { setGo } from "@/lib/motion";
import { lockScroll } from "./SmoothScroll";
import Icon from "@/components/ui/Icon";

const STRIPS = 7;
const GBARS = 6;

/* ───────── Script of the sequence ─────────
 * boot → warnings → errors pile up → crash (CRT switches off) → reboot → auto fix → the name decodes → site opens.
 * Everything is a pure function of the elapsed time `t` (ms), so skipping simply runs the clock faster.
 */
const TM = {
  boot: 600, // calm boot ends, glitching starts to build
  crash: 2000, // peak: fatal error, screen flash
  off: 2250, // CRT collapses to a line
  dark: 2340, // fully off
  reboot: 2440, // switches back on
  open: 2540, // line opens up into the full screen again
  name: 3150, // the name starts to decode
  exit: 4250, // name leaves, strips lift, site starts
} as const;

type Kind = "cmd" | "ok" | "warn" | "err" | "dim";
type Phase = "boot" | "err" | "fix";
type Line = { at: number; text: string; kind: Kind; phase: Phase };

const LINES: Line[] = [
  { at: 0, text: "$ npm run dev", kind: "cmd", phase: "boot" },
  { at: 170, text: "> compiling portfolio...", kind: "dim", phase: "boot" },
  { at: 360, text: "✓ compiled in 312ms", kind: "ok", phase: "boot" },
  { at: 780, text: "⚠ warn  hydration mismatch in <Hero />", kind: "warn", phase: "err" },
  { at: 980, text: "✕ TypeError: Cannot read 'name' of undefined", kind: "err", phase: "err" },
  { at: 1170, text: "    at render (portfolio.tsx:36:12)", kind: "err", phase: "err" },
  { at: 1350, text: "✕ ReferenceError: rizky is not defined", kind: "err", phase: "err" },
  { at: 1540, text: "✕ FATAL: memory corrupted @ 0xDEADBEEF", kind: "err", phase: "err" },
  { at: 1740, text: "✕ unhandled exception, exit code 1", kind: "err", phase: "err" },
  { at: 2580, text: "$ fix --auto", kind: "cmd", phase: "fix" },
  { at: 2700, text: "✓ patched undefined reference", kind: "ok", phase: "fix" },
  { at: 2820, text: "✓ memory restored", kind: "ok", phase: "fix" },
  { at: 2940, text: "✓ build passing, 0 errors", kind: "ok", phase: "fix" },
];

/** Fake error windows that pop up while the system falls apart. */
const POPS = [
  { at: 880, x: 6, y: 27, title: "error.exe", body: "undefined is not a function" },
  { at: 1280, x: 50, y: 17, title: "warning", body: "stack overflow in render()" },
  { at: 1580, x: 10, y: 63, title: "fatal", body: "kernel panic: portfolio not found" },
  { at: 1790, x: 52, y: 60, title: "404", body: "cannot find module 'rizky'" },
];
const RAIN = "01{}[]<>/\\;=+-*#%&$xX";

const TOKENS = ["undefined", "NaN", "null", "404", "0xDEADBEEF", "SEGFAULT", "Error", "undefined", "NaN"];
const GLYPHS = "█▓▒░▌▐╳#@%&$!?<>/\\{}[]01xX";
const DECODE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%&$<>/{}[]*+=_";

const rnd = () => Math.random();
const clamp01 = (k: number) => Math.max(0, Math.min(1, k));
const easeOut = (k: number) => 1 - Math.pow(1 - clamp01(k), 3);
const easeIO = (k: number) => {
  k = clamp01(k);
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
};
const pick = <V,>(a: readonly V[]) => a[(rnd() * a.length) | 0];

/** Randomly swaps characters for glitch glyphs. */
function corrupt(s: string, p: number) {
  if (p <= 0) return s;
  let out = "";
  for (const ch of s) out += ch === " " || rnd() > p ? ch : GLYPHS[(rnd() * GLYPHS.length) | 0];
  return out;
}

/** How broken the screen is, 0 = clean, 1 = peak, above 1 = crash. */
function intensityAt(t: number) {
  if (t < TM.boot) return 0.06 + 0.2 * (t / TM.boot);
  if (t < TM.crash) {
    const k = (t - TM.boot) / (TM.crash - TM.boot);
    return 0.26 + 0.74 * k * k;
  }
  if (t < TM.off) return 1.5;
  if (t < TM.reboot) return 0;
  if (t < TM.name) {
    // shudders that die out while the fix runs
    const k = (t - TM.reboot) / (TM.name - TM.reboot);
    return 0.7 * Math.pow(1 - k, 2) * (0.6 + 0.4 * Math.abs(Math.cos(k * 14)));
  }
  if (t < TM.name + 800) return 0.25 * (1 - (t - TM.name) / 800);
  return 0;
}

/** The big code word in the middle. */
function wordAt(t: number) {
  if (t < 700) return "<Portfolio />";
  if (t < TM.crash) {
    const k = (t - 700) / (TM.crash - 700);
    return TOKENS[Math.floor(Math.pow(k, 1.6) * 14) % TOKENS.length]; // cycles faster and faster
  }
  if (t < TM.dark) return "FATAL ERROR";
  if (t < 2900) return "REBOOT";
  return "FIXED";
}

function stateAt(t: number): [string, string, string] {
  if (t < 700) return ["boot", "● RUNNING", "Booting portfolio"];
  if (t < 1300) return ["warn", "▲ WARNING", "Unstable build"];
  if (t < TM.crash) return ["err", "✕ CRITICAL", "Error, process unstable"];
  if (t < TM.dark) return ["crash", "✕ CRASHED", "Process crashed"];
  if (t < TM.name) return ["fix", "↻ RECOVERING", "Recovering"];
  return ["ok", "✓ FIXED", "Ready"];
}

/** Loading progress: runs, stalls while broken, then catches up in one go after the fix. */
function progressAt(t: number) {
  if (t < TM.boot) return 0.34 * easeOut(t / TM.boot);
  if (t < TM.dark) return 0.34 + 0.07 * clamp01((t - TM.boot) / 1650);
  if (t < 2580) return 0.41;
  return 0.41 + 0.59 * easeIO((t - 2580) / 670);
}

/** CRT switch-off and switch-on: collapses to a line, then a dot, and later grows back. */
function crtAt(t: number) {
  if (t < TM.off) return { sx: 1, sy: 1, hidden: false, glow: false };
  if (t < TM.off + 50) return { sx: 1, sy: 1 - 0.994 * easeIO((t - TM.off) / 50), hidden: false, glow: true };
  if (t < TM.dark) return { sx: 1 - easeIO((t - (TM.off + 50)) / (TM.dark - TM.off - 50)), sy: 0.006, hidden: false, glow: true };
  if (t < TM.reboot) return { sx: 0, sy: 0.006, hidden: true, glow: false };
  if (t < TM.open) return { sx: easeIO((t - TM.reboot) / (TM.open - TM.reboot)), sy: 0.006, hidden: false, glow: true };
  if (t < TM.open + 160) return { sx: 1, sy: 0.006 + 0.994 * easeIO((t - TM.open) / 160), hidden: false, glow: true };
  return { sx: 1, sy: 1, hidden: false, glow: false };
}

/**
 * Opening sequence (once per session, about 5 seconds): the page "boots", errors pile up with screen shake,
 * RGB split and glitch bars, the screen crashes and switches off, then it reboots, fixes itself and the name
 * decodes out of the noise before the strips lift away. Skip with the button, Enter, Space or Esc.
 */
export default function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = root.current;
    const d = document.documentElement;
    if (!el) return;
    if (d.dataset.intro === "skip" || reducedMotion()) {
      setGo(true);
      setGone(true);
      return;
    }
    lockScroll(true);

    const q = (sel: string) => el.querySelector<HTMLElement>(sel)!;
    const qa = (sel: string) => Array.from(el.querySelectorAll<HTMLElement>(sel));
    const stage = q("[data-stage]");
    const word = q("[data-word]");
    const tag = q("[data-tag]");
    const sub = q("[data-sub]");
    const nameEl = q("[data-name]");
    const num = q("[data-num]");
    const bar = q("[data-bar]");
    const status = q("[data-status]");
    const flash = q("[data-flash]");
    const noise = q("[data-noise]");
    const gbars = qa("[data-gbar]");
    const lines = qa("[data-ln]");
    const chars = qa("[data-ch]");
    const strips = qa(".in-strip");
    const rain = q("[data-rain]") as unknown as HTMLCanvasElement;
    const rctx = rain.getContext("2d");
    const pops = qa("[data-pop]");
    const alarm = q("[data-alarm]");
    const sweep = q("[data-sweep]");
    const rings = qa("[data-ring]");
    const warpN = el.querySelector<SVGElement>("[data-warp-n]");
    const warpD = el.querySelector<SVGElement>("[data-warp-d]");
    const heavy = (navigator.hardwareConcurrency || 8) > 4; // the screen-tear filter is skipped on weak devices

    // code rain canvas (red while the system is failing, green while it repairs itself)
    const CELL = 18;
    const cs = getComputedStyle(el);
    const cErr = cs.getPropertyValue("--err").trim() || "#ff3158";
    const cOk = cs.getPropertyValue("--ok").trim() || "#2bd576";
    let rw = 0, rh = 0;
    let drops: number[] = [];
    let rainClear = true;
    const sizeRain = () => {
      rw = rain.width = window.innerWidth;
      rh = rain.height = window.innerHeight;
      drops = Array.from({ length: Math.ceil(rw / CELL) }, () => -1);
    };
    sizeRain();
    window.addEventListener("resize", sizeRain);
    const sweepH = window.innerHeight * 0.18;
    let warpOn = false;

    let finished = false;
    let exiting = false;
    let speed = 1;
    let raf = 0;
    let tl: ReturnType<typeof createTimeline> | null = null;

    // shake state, refreshed ~30 times a second so the glitch feels stepped rather than smooth
    let dx = 0, dy = 0, sk = 0;
    let state = "";
    let lastWord = "";
    let lastTag = "";
    let measured = false;
    let snapped = false;
    const lastLine: string[] = lines.map(() => "");
    const lastLock = TM.name + 140 + (chars.length - 1) * 42;

    const finish = () => {
      if (finished) return;
      finished = true;
      try { sessionStorage.setItem("intro", "1"); } catch {}
      lockScroll(false);
      setGone(true);
    };

    const tick = (t: number) => {
      const I = intensityAt(t);

      // shake + RGB split (a calm frame now and then makes it feel like a real fault)
      const calm = rnd() > Math.min(0.95, I * 0.9 + 0.05);
      if (calm) {
        dx = dy = sk = 0;
        stage.style.setProperty("--gx", "0");
        stage.removeAttribute("data-fx");
      } else {
        dx = (rnd() - 0.5) * 2 * I * 16;
        dy = (rnd() - 0.5) * 2 * I * 8;
        sk = (rnd() - 0.5) * 2 * I * 3.2;
        const gx = (0.5 + rnd()) * I * 7;
        stage.style.setProperty("--gx", gx.toFixed(1));
        stage.style.setProperty("--gy", ((rnd() - 0.5) * I * 3).toFixed(1));
        stage.toggleAttribute("data-fx", gx > 0.3);
      }

      // glitch bars that invert whatever is under them, and film grain
      gbars.forEach((b) => {
        if (I > 0.15 && rnd() < Math.min(0.85, I * 0.45)) {
          b.style.top = (rnd() * 100).toFixed(1) + "%";
          b.style.height = (0.6 + rnd() * (2 + I * 7)).toFixed(1) + "vh";
          b.style.transform = `translateX(${((rnd() - 0.5) * 2 * I * 90).toFixed(0)}px)`;
          b.style.opacity = (0.3 + rnd() * 0.5).toFixed(2);
        } else b.style.opacity = "0";
      });
      noise.style.opacity = I > 0.2 ? Math.min(0.24, I * 0.16).toFixed(2) : "0";
      noise.style.backgroundPosition = `${(rnd() * 160) | 0}px ${(rnd() * 160) | 0}px`;

      // status chip, state colours and the footer status text
      const [s, tg, st] = stateAt(t);
      if (s !== state) {
        state = s;
        el.dataset.state = s;
      }
      if (tg !== lastTag) {
        lastTag = tg;
        tag.textContent = tg;
      }
      status.textContent = s === "warn" || s === "err" ? corrupt(st, I * 0.12) : st;

      // the big word, torn sideways when things get bad
      let w = wordAt(t);
      if (I > 0.5 && t < TM.dark) w = corrupt(w, Math.min(0.3, (I - 0.4) * 0.25));
      if (w !== lastWord) {
        lastWord = w;
        word.textContent = w;
      }
      word.dataset.text = w;
      if (I > 0.3 && !calm) {
        // two coloured copies of the word, each showing only a torn band and pushed sideways
        const a = rnd() * 70, ha = 8 + rnd() * 24, b = rnd() * 70, hb = 8 + rnd() * 24;
        word.style.setProperty("--t1", a.toFixed(0) + "%");
        word.style.setProperty("--b1", Math.max(0, 100 - a - ha).toFixed(0) + "%");
        word.style.setProperty("--o1", ((rnd() - 0.5) * I * 0.14).toFixed(3) + "em");
        word.style.setProperty("--t2", b.toFixed(0) + "%");
        word.style.setProperty("--b2", Math.max(0, 100 - b - hb).toFixed(0) + "%");
        word.style.setProperty("--o2", ((rnd() - 0.5) * I * 0.14).toFixed(3) + "em");
        word.setAttribute("data-slice", "");
      } else word.removeAttribute("data-slice");
      word.style.opacity = t >= TM.name ? "0" : "1";
      word.style.transform =
        I > 0.45 && rnd() < 0.5 ? `translate(${((rnd() - 0.5) * I * 40).toFixed(1)}px, 0) skewX(${((rnd() - 0.5) * I * 12).toFixed(1)}deg)` : "";

      // terminal: lines type in, and old ones get corrupted as the system degrades
      let live = -1;
      lines.forEach((ln, i) => {
        const L = LINES[i];
        const shown = L.phase === "fix" ? t >= L.at : t >= L.at && t < TM.dark;
        if (!shown) {
          if (ln.style.display !== "none") ln.style.display = "none";
          return;
        }
        if (ln.style.display !== "block") ln.style.display = "block";
        const typed = L.text.slice(0, Math.max(0, Math.floor((t - L.at) / 16)));
        const out = L.phase === "fix" ? typed : corrupt(typed, I * 0.14);
        if (out !== lastLine[i]) {
          lastLine[i] = out;
          ln.textContent = out;
        }
        if (typed.length <= L.text.length) live = i;
        ln.classList.remove("is-live");
      });
      if (live >= 0) lines[live].classList.add("is-live");

      // error windows, red alarm glow at the edges, screen tear and the code rain
      pops.forEach((pp, i) => pp.classList.toggle("is-on", t >= POPS[i].at && t < TM.off));
      alarm.style.opacity =
        t < TM.off && I > 0.35 ? Math.min(0.6, (I - 0.25) * 0.55 * (0.6 + 0.4 * Math.abs(Math.sin(t / 85)))).toFixed(2) : "0";
      warpOn = heavy && I > 0.6 && t < TM.off && !!warpD && !!warpN;
      if (warpOn) {
        warpD!.setAttribute("scale", (I * 38 * (0.4 + rnd() * 0.8)).toFixed(0));
        warpN!.setAttribute("seed", String((rnd() * 200) | 0));
      }
      if (rctx) {
        const fixRain = t >= TM.open;
        const rainOn = (t >= 650 && t < TM.off) || (fixRain && t < TM.name + 300);
        if (!rainOn) {
          if (!rainClear) {
            rctx.clearRect(0, 0, rw, rh);
            rainClear = true;
          }
        } else {
          rainClear = false;
          const dens = fixRain ? 0.05 + 0.5 * (1 - clamp01((t - TM.open) / (TM.name + 300 - TM.open))) : clamp01((I - 0.15) * 0.75);
          rctx.globalCompositeOperation = "destination-out";
          rctx.fillStyle = "rgba(0,0,0,0.16)";
          rctx.fillRect(0, 0, rw, rh);
          rctx.globalCompositeOperation = "source-over";
          rctx.font = "15px monospace";
          rctx.fillStyle = fixRain ? cOk : cErr;
          for (let i = 0; i < drops.length; i++) {
            if (drops[i] < 0) {
              if (rnd() < dens * 0.06) drops[i] = 0;
              continue;
            }
            const y = drops[i] * CELL;
            rctx.fillText(RAIN[(rnd() * RAIN.length) | 0], i * CELL, y);
            drops[i]++;
            if (y > rh) drops[i] = -1;
          }
        }
      }

      // progress: stutters and shows garbage while broken
      const p = progressAt(t);
      let label = String(Math.round(p * 100)).padStart(3, "0");
      let bad = false;
      if (t >= 700 && t < TM.dark && rnd() < I * 0.33) {
        bad = true;
        label = pick(["ERR", "NaN", "???", String((rnd() * 999) | 0).padStart(3, "0"), "0xF"]);
      }
      num.textContent = label;
      num.toggleAttribute("data-bad", bad);
      bar.style.transform = `scaleX(${clamp01(p + (t < TM.dark ? (rnd() - 0.5) * 0.06 * I : 0)).toFixed(3)})`;

      // the name decodes out of noise, left to right
      if (t >= TM.name) {
        if (!measured) {
          measured = true;
          // pin every letter to its real width so the layout does not jump while it scrambles
          chars.forEach((c) => { c.textContent = c.dataset.ch!; c.style.width = ""; });
          const widths = chars.map((c) => c.getBoundingClientRect().width);
          chars.forEach((c, i) => (c.style.width = widths[i] + "px"));
          nameEl.style.opacity = "1";
        }
        chars.forEach((c, i) => {
          if (t >= TM.name + 140 + i * 42) {
            if (c.dataset.locked !== "1") {
              c.dataset.locked = "1";
              c.textContent = c.dataset.ch!;
              c.style.transform = "";
              c.style.opacity = "";
              c.style.color = "";
            }
          } else {
            c.textContent = DECODE[(rnd() * DECODE.length) | 0];
            c.style.transform = `translate(${((rnd() - 0.5) * 6).toFixed(1)}px, ${((rnd() - 0.5) * 8).toFixed(1)}px)`;
            c.style.opacity = (0.55 + rnd() * 0.45).toFixed(2);
            c.style.color = rnd() < 0.45 ? "var(--ok)" : "";
          }
        });
        if (!snapped && t >= lastLock + 40) {
          snapped = true;
          nameEl.classList.add("in-snap");
          rings.forEach((r) => r.classList.add("go"));
        }
        if (t >= lastLock + 90) sub.style.opacity = "1";
      }
    };

    const exit = () => {
      if (exiting) return;
      exiting = true;
      cancelAnimationFrame(raf);
      stage.style.transform = "";
      stage.style.filter = "";
      stage.style.visibility = "visible";
      stage.removeAttribute("data-fx");
      flash.style.opacity = "0";
      noise.style.opacity = "0";
      gbars.forEach((b) => (b.style.opacity = "0"));
      word.style.opacity = "0";
      alarm.style.opacity = "0";
      sweep.style.display = "none";
      pops.forEach((pp) => pp.classList.remove("is-on"));
      rctx?.clearRect(0, 0, rw, rh);

      tl = createTimeline({ defaults: { ease: "outExpo" }, onComplete: finish });
      tl.add(chars, { translateY: ["0%", "-120%"], opacity: [1, 0], duration: 550, ease: "inOutCubic", delay: stagger(14) }, 0)
        .add(qa(".in-fade"), { opacity: [1, 0], duration: 400, ease: "inOutQuad" }, 0)
        .call(() => setGo(true), 740)
        .add(strips, { scaleY: [1, 0], duration: 800, ease: "inOutQuart", delay: stagger(70, { from: "center" }) }, 620);
      tl.speed = speed;
    };

    let last = performance.now();
    let lastTick = -999;
    let t = 0;
    const frame = (now: number) => {
      const dt = Math.min(now - last, 50); // a hidden tab must not jump the clock
      last = now;
      t += dt * speed;

      if (now - lastTick >= 33) {
        lastTick = now;
        tick(t);
      }

      // smooth, every frame: CRT switch off/on, the screen flash and the shake from the last tick
      const c = crtAt(t);
      stage.style.visibility = c.hidden ? "hidden" : "visible";
      stage.style.filter = `${warpOn ? "url(#in-warp) " : ""}${c.glow ? "brightness(2.2)" : ""}`.trim();
      if (t >= 2600 && t < 3080) {
        // green repair line sweeping down the screen while the fix runs
        sweep.style.display = "block";
        sweep.style.transform = `translateY(${(-sweepH + (window.innerHeight + sweepH) * easeIO((t - 2600) / 480)).toFixed(0)}px)`;
      } else sweep.style.display = "none";
      stage.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) skewX(${sk.toFixed(2)}deg) scale(${c.sx.toFixed(3)}, ${c.sy.toFixed(3)})`;
      flash.style.opacity = t >= TM.crash && t < TM.crash + 90 ? (0.45 * (1 - (t - TM.crash) / 90)).toFixed(2) : "0";

      if (t >= TM.exit) return exit();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const skip = () => {
      speed = 6;
      if (tl) tl.speed = 6;
    };
    const onKey = (e: KeyboardEvent) => {
      if (["Escape", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", onKey);
    el.querySelector("[data-skip]")?.addEventListener("click", skip);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", sizeRain);
      cancelAnimationFrame(raf);
      tl?.cancel();
      if (!finished) lockScroll(false);
    };
  }, []);

  if (gone) return null;

  const name = site.name.toUpperCase();

  return (
    <div ref={root} className="intro" data-state="boot" role="dialog" aria-label="Loading">
      <div className="in-strips" aria-hidden>
        {Array.from({ length: STRIPS }, (_, i) => (
          <span key={i} className="in-strip" />
        ))}
      </div>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden focusable="false">
        <filter id="in-warp" x="0" y="-5%" width="100%" height="110%" colorInterpolationFilters="sRGB">
          <feTurbulence data-warp-n type="fractalNoise" baseFrequency="0.002 0.28" numOctaves={1} seed={3} result="n" />
          <feDisplacementMap data-warp-d in="SourceGraphic" in2="n" scale={0} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className="in-grid in-fade" aria-hidden />
      <canvas className="in-rain" data-rain aria-hidden />

      <div className="in-stage" data-stage aria-hidden>
        <div className="in-term in-fade">
          {LINES.map((l, i) => (
            <p key={i} className="in-ln" data-ln data-kind={l.kind} />
          ))}
        </div>

        <div className="in-center">
          <div className="in-stack">
            <span className="in-tag in-fade" data-tag>
              ● RUNNING
            </span>
            <div className="in-main">
              <span className="in-big" data-word>
                {"<Portfolio />"}
              </span>
              <span className="in-name" data-name>
                {name.split(" ").map((w, wi) => (
                  <span key={wi} className="in-word">
                    {Array.from(w).map((c, i) => (
                      <span key={i} className="in-mask">
                        <span className="in-c" data-ch={c}>
                          {c}
                        </span>
                      </span>
                    ))}
                  </span>
                ))}
              </span>
            </div>
            <span className="in-sub in-fade" data-sub>
              {"// build passing, welcome"}
            </span>
          </div>
        </div>

        {POPS.map((pp, i) => (
          <div key={i} className="in-pop" data-pop style={{ left: pp.x + "%", top: pp.y + "%" }}>
            <div className="in-pop-bar">
              <span>{pp.title}</span>
              <i>✕</i>
            </div>
            <p>{pp.body}</p>
          </div>
        ))}

        <div className="in-bottom in-fade">
          <div className="in-bar">
            <i data-bar />
          </div>
          <div className="in-meta">
            <span data-status>Booting portfolio</span>
            <span className="in-num">
              <span data-num>000</span>
            </span>
          </div>
        </div>
      </div>

      <i className="in-alarm" data-alarm aria-hidden />
      <i className="in-sweep" data-sweep aria-hidden />
      <i className="in-ring" data-ring aria-hidden />
      <i className="in-ring in-ring-2" data-ring aria-hidden />
      <i className="in-scan" aria-hidden />
      <i className="in-noise" data-noise aria-hidden />
      <div className="in-gbars" aria-hidden>
        {Array.from({ length: GBARS }, (_, i) => (
          <i key={i} data-gbar />
        ))}
      </div>
      <i className="in-flash" data-flash aria-hidden />

      <div className="in-top in-fade">
        <span className="in-brand">
          <i className="in-logo" aria-hidden /> {site.short} / Portfolio
        </span>
        <span>{site.location}</span>
        <button type="button" className="in-skip" data-skip>
          Skip <Icon name="arrow-right" size={14} />
        </button>
      </div>
    </div>
  );
}
