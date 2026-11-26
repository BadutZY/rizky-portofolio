import { whenGo } from "@/lib/motion";

/**
 * Idle glitch for the big page titles (About me, Projects, Experience, Skills, Contact).
 *
 * - Only ONE word glitches at a time. Multi-word titles take turns ("About", then "me", then "About" again).
 * - Gaps between glitches and the shape of every burst are random, so no title ever repeats a rhythm.
 * - A burst is 2 to 4 hits that fade out: red and cyan RGB-split bands, torn slices that slide sideways,
 *   a chromatic fringe on the base text, jitter and skew, flicker, and letters that briefly corrupt into symbols.
 * - Nothing here touches layout. Only copies (absolutely positioned), clip-path, transforms and opacity change.
 * - It pauses while the title is off screen, the tab is hidden, or the ASCII lens is active (hover).
 *
 * Expected markup (see components/ui/GlitchTitle.tsx):
 *   root  >  [data-gword]  >  .st-mask > .st-c   (the real letters)
 *                          >  .gt-ov[data-k=r|c|s1|s2|x] > .st-mask   (overlay copies, one element per letter)
 */

const SYMS = "#%&@$*+=<>/\\|{}[]01?!;:~^";

type Hit = [start: number, length: number, strength: number];

type Word = {
  el: HTMLElement;
  base: HTMLElement[]; // .st-mask of the real letters
  baseC: HTMLElement[]; // .st-c of the real letters
  sym: HTMLElement[]; // .st-mask of the symbol layer
  swapped: number[];
};

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * `lite` is for the big home hero: slower frames, only the red / cyan bands (no torn slices), longer pauses between bursts,
 * and it never glitches while the page is scrolling, so scrolling keeps the main thread free.
 */
export function attachTitleGlitch(root: HTMLElement, opts: { lite?: boolean } = {}): () => void {
  const lite = !!opts.lite;
  if (typeof window === "undefined" || reduced()) return () => {};

  const words: Word[] = Array.from(root.querySelectorAll<HTMLElement>("[data-gword]")).map((el) => ({
    el,
    base: Array.from(el.querySelectorAll<HTMLElement>(":scope > .st-mask")),
    baseC: Array.from(el.querySelectorAll<HTMLElement>(":scope > .st-mask > .st-c")),
    sym: Array.from(el.querySelectorAll<HTMLElement>(':scope > .gt-ov[data-k="x"] > .st-mask')),
    swapped: [],
  }));
  if (!words.length) return () => {};

  const r = Math.random;
  const timers = new Set<number>();
  let alive = true;
  let inView = true;
  let turn = (r() * words.length) | 0; // which word goes first is random too

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };

  /** The hover lens owns the title while it is on. */
  const locked = () => root.hasAttribute("data-lens");

  const restoreSymbols = (w: Word) => {
    for (const i of w.swapped) {
      w.baseC[i] && (w.baseC[i].style.opacity = "");
      if (w.sym[i]) {
        w.sym[i].classList.remove("on");
        w.sym[i].style.width = "";
      }
    }
    w.swapped.length = 0;
  };

  const calm = (w: Word) => {
    w.el.removeAttribute("data-f");
    w.el.style.removeProperty("transform");
    w.el.style.removeProperty("opacity");
    restoreSymbols(w);
  };

  const band = (min: number, max: number): [string, string] => {
    const h = min + r() * (max - min);
    const t = r() * (100 - h);
    return [t.toFixed(0) + "%", Math.max(0, 100 - t - h).toFixed(0) + "%"];
  };

  /** One frame of a hit. k is the strength of the hit (1 = hardest). */
  let lastScroll = 0;
  const onScroll = () => (lastScroll = performance.now());
  const scrolling = () => lite && performance.now() - lastScroll < 200;
  if (lite) window.addEventListener("scroll", onScroll, { passive: true });

  const frame = (w: Word, k: number) => {
    if (r() < 0.14) return calm(w); // a calm frame now and then keeps it jumpy instead of smeared
    const s = w.el.style;

    const [t1, b1] = band(8, 30);
    const [t2, b2] = band(8, 30);
    const [t3, b3] = lite ? ["0%", "100%"] : band(3, 14);
    const [t4, b4] = lite ? ["0%", "100%"] : band(3, 12);
    s.setProperty("--t1", t1);
    s.setProperty("--b1", b1);
    s.setProperty("--o1", ((r() - 0.5) * 0.17 * k).toFixed(3) + "em");
    s.setProperty("--t2", t2);
    s.setProperty("--b2", b2);
    s.setProperty("--o2", ((r() - 0.5) * 0.17 * k).toFixed(3) + "em");
    s.setProperty("--t3", t3);
    s.setProperty("--b3", b3);
    s.setProperty("--o3", ((r() - 0.5) * 0.34 * k).toFixed(3) + "em");
    s.setProperty("--t4", t4);
    s.setProperty("--b4", b4);
    s.setProperty("--o4", ((r() - 0.5) * 0.3 * k).toFixed(3) + "em");
    s.setProperty("--sh", (0.006 + r() * 0.026 * k).toFixed(3) + "em");

    s.transform = `translate(${((r() - 0.5) * 0.05 * k).toFixed(3)}em, ${((r() - 0.5) * 0.014 * k).toFixed(3)}em) skewX(${((r() - 0.5) * 14 * k).toFixed(1)}deg)`;
    s.opacity = r() < 0.1 ? "0.4" : "";

    // letters that corrupt into symbols for a frame or two
    restoreSymbols(w);
    if (r() < 0.55 * k) {
      const n = 1 + (r() < 0.35 ? 1 : 0);
      for (let j = 0; j < n; j++) {
        const i = (r() * w.base.length) | 0;
        const target = w.sym[i];
        if (!target || w.swapped.includes(i)) continue;
        target.textContent = SYMS[(r() * SYMS.length) | 0];
        target.style.width = w.base[i].offsetWidth + "px"; // keep the slot the real letter had
        target.classList.add("on");
        w.baseC[i].style.opacity = "0";
        w.swapped.push(i);
      }
    }
    w.el.setAttribute("data-f", "1");
  };

  /** 2 to 4 hits, the first one hardest, every later one weaker. Different every time. */
  const plan = (): Hit[] => {
    const n = 2 + ((r() * 3) | 0);
    const out: Hit[] = [];
    let t = 0;
    let k = 0.8 + r() * 0.2;
    for (let i = 0; i < n; i++) {
      const len = (i === 0 ? 150 : 60) + r() * (i === 0 ? 260 : 150);
      out.push([t, len, k]);
      t += len + 25 + r() * 170;
      k *= 0.5 + r() * 0.32;
    }
    return out;
  };

  const run = (w: Word) => {
    const hits = plan();
    const last = hits[hits.length - 1];
    const end = last[0] + last[1];
    const start = performance.now();
    const step = () => {
      if (!alive || locked() || scrolling()) return calm(w);
      const el = performance.now() - start;
      if (el >= end) return calm(w);
      const h = hits.find(([s, d]) => el >= s && el < s + d);
      if (h) frame(w, h[2]);
      else calm(w);
      later(step, lite ? 60 + r() * 60 : 32 + r() * 42);
    };
    step();
  };

  const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting));
  io.observe(root);

  const cycle = () => {
    if (!alive) return;
    if (inView && !document.hidden && !locked() && !scrolling()) run(words[turn++ % words.length]);
    // random gap: 1.8s to 6s (a bit longer for single word titles so it does not feel nervous)
    later(cycle, (lite ? 2600 : 1800) + r() * 4200 + (words.length === 1 ? 700 : 0));
  };

  // wait until the letters have finished rising in, then start at a random moment
  const stop = whenGo(() => later(cycle, 2600 + r() * 2200));

  return () => {
    alive = false;
    stop();
    if (lite) window.removeEventListener("scroll", onScroll);
    io.disconnect();
    timers.forEach((id) => clearTimeout(id));
    words.forEach(calm);
  };
}
