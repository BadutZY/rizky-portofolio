const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789#%&*+";

/** Scrambles the letters, then locks them one by one into the final text. */
export function scrambleTo(el: HTMLElement, text: string, duration = 550) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = text;
    return () => {};
  }
  let raf = 0;
  const start = performance.now();
  const step = (now: number) => {
    const p = Math.min((now - start) / duration, 1);
    const fixed = Math.floor(p * text.length);
    let out = "";
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      out += i < fixed || c === " " ? c : CHARS[(Math.random() * CHARS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
