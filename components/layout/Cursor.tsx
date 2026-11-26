"use client";

import { useEffect, useRef } from "react";
import { m, useMotionValue, useSpring, useTransform } from "motion/react";

const TARGETS = "a, button, input, textarea, select, summary, [data-cursor], [data-cursor-snap]";

/**
 * Cursor built on Motion springs. It follows the pointer with spring physics, grows over links, shows a
 * label for [data-cursor="Label"], and morphs into the outline of buttons and chips (snap) so the target
 * feels "picked up". Mouse and trackpad only. No blend modes, so it costs nothing while scrolling.
 */
export default function Cursor() {
  const wrap = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  const px = useMotionValue(-100);
  const py = useMotionValue(-100);
  const x = useSpring(px, { stiffness: 900, damping: 50, mass: 0.35 });
  const y = useSpring(py, { stiffness: 900, damping: 50, mass: 0.35 });
  const w = useMotionValue(12);
  const h = useMotionValue(12);
  const r = useMotionValue(6);
  const sw = useSpring(w, { stiffness: 420, damping: 32 });
  const sh = useSpring(h, { stiffness: 420, damping: 32 });
  const sr = useSpring(r, { stiffness: 420, damping: 32 });
  const ox = useMotionValue(0);
  const oy = useMotionValue(0);
  const mlft = useTransform(sw, (n) => -n / 2);
  const mtop = useTransform(sh, (n) => -n / 2);
  const sox = useSpring(ox, { stiffness: 420, damping: 32 });
  const soy = useSpring(oy, { stiffness: 420, damping: 32 });

  useEffect(() => {
    const el = wrap.current;
    const b = body.current;
    if (!el || !b) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let snapEl: HTMLElement | null = null;
    let down = false;
    let cancelSettle: (() => void) | null = null;
    let cancelEnter: (() => void) | null = null;
    let lastX = -100;
    let lastY = -100;
    const cancelAll = () => {
      cancelSettle?.();
      cancelEnter?.();
    };
    /** while snapped, the outline stays on the element and leans slightly toward the pointer */
    const snapTo = (el: HTMLElement, cx: number, cy: number) => {
      const rc = el.getBoundingClientRect();
      px.set(rc.left + rc.width / 2 + (cx - (rc.left + rc.width / 2)) * 0.12);
      py.set(rc.top + rc.height / 2 + (cy - (rc.top + rc.height / 2)) * 0.2);
    };

    const set = (size: number, radius: number, text = "", snap = false) => {
      w.set(size);
      h.set(size);
      r.set(radius);
      ox.set(0);
      oy.set(0);
      if (label.current) label.current.textContent = text;
      b.classList.toggle("snap", snap);
    };
    /**
     * Leaving a snapped outline in two calm steps instead of one jump:
     * 1) the outline stays hollow and shrinks into a small ring,
     * 2) only then does it fill in (CSS fade) and settle into its final size.
     * Without a snapped outline there is nothing to wait for, so it applies at once.
     */
    const settle = (apply: () => void) => {
      cancelAll();
      if (!b.classList.contains("snap")) {
        apply();
        return;
      }
      const RING = 40;
      w.set(RING);
      h.set(RING);
      r.set(RING / 2);
      ox.set(0);
      oy.set(0);
      if (label.current) label.current.textContent = "";
      let done = false;
      const stopW = sw.on("change", () => check());
      const stopH = sh.on("change", () => check());
      const timer = window.setTimeout(() => finish(), 700);
      const cleanup = () => {
        done = true;
        stopW();
        stopH();
        window.clearTimeout(timer);
        cancelSettle = null;
      };
      const finish = () => {
        if (done) return;
        cleanup();
        b.classList.remove("snap");
        apply();
      };
      const check = () => {
        if (Math.abs(sw.get() - RING) < 5 && Math.abs(sh.get() - RING) < 5) finish();
      };
      cancelSettle = cleanup;
    };
    const rest = () => {
      snapEl = null;
      settle(() => set(down ? 8 : 12, 6));
    };

    const move = (e: PointerEvent) => {
      el.classList.add("on");
      lastX = e.clientX;
      lastY = e.clientY;
      if (snapEl) {
        snapTo(snapEl, e.clientX, e.clientY);
      } else {
        px.set(e.clientX);
        py.set(e.clientY);
      }
    };
    const over = (e: PointerEvent) => {
      const t = (e.target as Element | null)?.closest<HTMLElement>(TARGETS);
      if (!t) return rest();
      const text = t.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? "";
      const snappable = t.matches(".btn, .icon-btn, .chip, .seg button, .pm-icon, .menu-btn, [data-cursor-snap]") && !text;
      if (text) {
        snapEl = null;
        cancelAll();
        set(text.length > 4 ? 84 : 68, 42, text);
      } else if (snappable) {
        // Two calm steps: 1) the dot turns into a hollow ring where it is, 2) only then does the hollow outline grow around the element.
        cancelAll();
        snapEl = null;
        ox.set(0);
        oy.set(0);
        if (label.current) label.current.textContent = "";
        b.classList.add("snap");
        const timer = window.setTimeout(() => {
          cancelEnter = null;
          if (!t.isConnected) return;
          snapEl = t;
          const rc = t.getBoundingClientRect();
          w.set(rc.width + 10);
          h.set(rc.height + 10);
          r.set(Math.min(rc.height / 2 + 5, 28));
          snapTo(t, lastX, lastY);
        }, 150);
        cancelEnter = () => {
          window.clearTimeout(timer);
          cancelEnter = null;
        };
      } else {
        snapEl = null;
        settle(() => set(40, 20));
      }
    };
    const out = (e: PointerEvent) => {
      if (!e.relatedTarget) el.classList.remove("on");
    };
    const dn = () => {
      down = true;
      if (!snapEl) w.set(w.get() * 0.8), h.set(h.get() * 0.8);
    };
    const up = () => {
      down = false;
      if (!snapEl) rest();
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerout", out, { passive: true });
    window.addEventListener("pointerdown", dn);
    window.addEventListener("pointerup", up);
    return () => {
      cancelAll();
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      window.removeEventListener("pointerdown", dn);
      window.removeEventListener("pointerup", up);
    };
  }, [px, py, w, h, r, ox, oy]);

  return (
    <m.div ref={wrap} className="cursor" style={{ x, y }} aria-hidden>
      <m.div
        ref={body}
        className="cursor-body"
        style={{ width: sw, height: sh, borderRadius: sr, x: sox, y: soy, marginLeft: mlft, marginTop: mtop }}
      >
        <span ref={label} className="cursor-label" />
      </m.div>
    </m.div>
  );
}
