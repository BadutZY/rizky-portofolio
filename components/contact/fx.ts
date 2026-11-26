/** Small, dependency-free effects used on the Contact page. Everything cleans up after itself. */

export const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const hasFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** Expanding circle from the click point. The host element needs `position: relative; overflow: hidden` (class .ct-rip). */
export function ripple(e: React.PointerEvent<HTMLElement> | React.MouseEvent<HTMLElement>) {
  if (prefersReduced()) return;
  const host = e.currentTarget;
  const r = host.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 2;
  const dot = document.createElement("span");
  dot.className = "ct-ripple";
  dot.style.width = dot.style.height = `${size}px`;
  dot.style.left = `${e.clientX - r.left - size / 2}px`;
  dot.style.top = `${e.clientY - r.top - size / 2}px`;
  host.appendChild(dot);
  dot.addEventListener("animationend", () => dot.remove(), { once: true });
  window.setTimeout(() => dot.remove(), 1200);
}

/** Monochrome particle burst from an element (success moment). Uses the Web Animations API, then removes every node. */
export function burst(origin: HTMLElement, count = 34) {
  if (prefersReduced()) return;
  const r = origin.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const layer = document.createElement("div");
  layer.className = "ct-burst";
  document.body.appendChild(layer);
  let left = count;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("i");
    const kind = i % 3;
    p.className = `ct-bp ct-bp-${kind}`;
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    layer.appendChild(p);
    const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 90 + Math.random() * 190;
    const dx = Math.cos(ang) * dist;
    const dy = Math.sin(ang) * dist - 40;
    const rot = (Math.random() - 0.5) * 720;
    const a = p.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.2) rotate(0deg)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx * 0.7}px), calc(-50% + ${dy * 0.7}px)) scale(1) rotate(${rot * 0.6}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 120}px)) scale(0.6) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: 1100 + Math.random() * 600, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" },
    );
    a.onfinish = () => {
      p.remove();
      if (--left === 0) layer.remove();
    };
  }
  window.setTimeout(() => layer.remove(), 2600);
}
