/**
 * Small pointer helpers for the Skills page. Each one uses ONE delegated listener on `root`,
 * so elements that mount or unmount later (filtering, tab changes) work without re-binding.
 * Mouse only: touch scrolling is never touched. Does nothing with prefers-reduced-motion.
 */
const enabled = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 3D tilt toward the pointer. Sets --rx / --ry (deg) and --mx / --my (px, for the glare) and toggles `.hot`. */
export function bindTilt(root: HTMLElement, selector: string, max = 8): () => void {
  if (!enabled()) return () => {};
  let cur: HTMLElement | null = null;
  let ev: PointerEvent | null = null;
  let raf = 0;

  const reset = (el: HTMLElement | null) => {
    if (!el) return;
    el.classList.remove("hot");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  const apply = () => {
    raf = 0;
    if (!ev) return;
    const el = (ev.target as Element | null)?.closest<HTMLElement>(selector) ?? null;
    if (el !== cur) {
      reset(cur);
      cur = el && root.contains(el) ? el : null;
    }
    if (!cur) return;
    const r = cur.getBoundingClientRect();
    const px = (ev.clientX - r.left) / r.width;
    const py = (ev.clientY - r.top) / r.height;
    cur.classList.add("hot");
    cur.style.setProperty("--rx", `${((0.5 - py) * 2 * max).toFixed(2)}deg`);
    cur.style.setProperty("--ry", `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
    cur.style.setProperty("--mx", `${ev.clientX - r.left}px`);
    cur.style.setProperty("--my", `${ev.clientY - r.top}px`);
  };
  const move = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    ev = e;
    if (!raf) raf = requestAnimationFrame(apply);
  };
  const leave = () => {
    reset(cur);
    cur = null;
  };

  root.addEventListener("pointermove", move, { passive: true });
  root.addEventListener("pointerleave", leave);
  return () => {
    root.removeEventListener("pointermove", move);
    root.removeEventListener("pointerleave", leave);
    cancelAnimationFrame(raf);
    reset(cur);
  };
}

/** Makes the element's inner icon lean toward the pointer: sets --tx / --ty (px) on the matched element. */
export function bindFollow(root: HTMLElement, selector: string, strength = 9): () => void {
  if (!enabled()) return () => {};
  let cur: HTMLElement | null = null;
  const reset = (el: HTMLElement | null) => {
    if (!el) return;
    el.style.setProperty("--tx", "0px");
    el.style.setProperty("--ty", "0px");
  };
  const move = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = (e.target as Element | null)?.closest<HTMLElement>(selector) ?? null;
    if (el !== cur) {
      reset(cur);
      cur = el && root.contains(el) ? el : null;
    }
    if (!cur) return;
    const r = cur.getBoundingClientRect();
    cur.style.setProperty("--tx", `${(((e.clientX - r.left) / r.width - 0.5) * 2 * strength).toFixed(1)}px`);
    cur.style.setProperty("--ty", `${(((e.clientY - r.top) / r.height - 0.5) * 2 * strength).toFixed(1)}px`);
  };
  const leave = () => {
    reset(cur);
    cur = null;
  };
  root.addEventListener("pointermove", move, { passive: true });
  root.addEventListener("pointerleave", leave);
  return () => {
    root.removeEventListener("pointermove", move);
    root.removeEventListener("pointerleave", leave);
    reset(cur);
  };
}