"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SkillIcon from "@/components/ui/SkillIcon";
import { whenGo } from "@/lib/motion";
import type { Skill } from "@/lib/data";

/** How many logos sit on each ring (inner to outer). Fewer skills than this just fills the inner rings first. */
const RINGS = [6, 10, 14];
const SPEED = [38, 58, 84]; // seconds per turn
type Group = { group: string; items: Skill[] };

/**
 * Orbiting logos. Three rings turn at different speeds (the outer one the other way), logos stay upright,
 * the whole stage leans toward the pointer in 3D, and hovering a logo pauses the orbit and shows its name in the core.
 * Skills with a logo are picked round-robin from every group, so each ring mixes frontend, backend, mobile, etc.
 */
export default function SkillsOrbit({ groups, total }: { groups: Group[]; total: number }) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const holding = useRef(false); // true while a logo is hovered: the stage stops leaning so the logo never slides away from the cursor
  const [on, setOn] = useState<{ name: string; group: string } | null>(null);

  const rings = useMemo(() => {
    const pools = groups.map((g) => g.items.filter((s) => s.logo).map((s) => ({ s, group: g.group })));
    const want = RINGS.reduce((a, b) => a + b, 0);
    const seen = new Set<string>();
    const picked: { s: Skill; group: string }[] = [];
    for (let guard = 0; picked.length < want && pools.some((p) => p.length) && guard < 200; guard++) {
      for (const p of pools) {
        const x = p.shift();
        if (x && !seen.has(x.s.name)) {
          seen.add(x.s.name);
          picked.push(x);
        }
        if (picked.length >= want) break;
      }
    }
    const out: { s: Skill; group: string }[][] = [];
    let at = 0;
    for (const n of RINGS) {
      out.push(picked.slice(at, at + n));
      at += n;
    }
    return out.filter((r) => r.length);
  }, [groups]);

  // entrance: rings scale in one after another once the orbit is on screen (and the page curtain is gone)
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let io: IntersectionObserver | undefined;
    const stop = whenGo(() => {
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            el.classList.add("in");
            io?.disconnect();
          }
        },
        { threshold: 0.2 },
      );
      io.observe(el);
    });
    return () => {
      stop();
      io?.disconnect();
    };
  }, []);

  // the stage leans toward the pointer (mouse only)
  useEffect(() => {
    const el = root.current;
    const st = stage.current;
    if (!el || !st) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let ev: PointerEvent | null = null;
    const apply = () => {
      raf = 0;
      if (!ev) return;
      if (holding.current) return;
      const r = el.getBoundingClientRect();
      st.style.setProperty("--px", (((ev.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
      st.style.setProperty("--py", (((ev.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      ev = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const leave = () => {
      st.style.setProperty("--px", "0");
      st.style.setProperty("--py", "0");
    };
    el.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, []);

  const enter = (s: Skill, group: string) => {
    holding.current = true;
    root.current?.classList.add("hold");
    setOn({ name: s.name, group });
  };
  const leave = () => {
    holding.current = false;
    root.current?.classList.remove("hold");
    setOn(null);
  };

  return (
    // a tap outside any logo clears the name on touch screens (there is no pointer-leave there)
    <div
      ref={root}
      className="orb"
      aria-label="Orbit of the technologies I use"
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse" && !(e.target as Element).closest(".orb-chip")) leave();
      }}
    >
      <div ref={stage} className="orb-stage">
        <div className="orb-core" aria-live="polite">
          <span className="orb-halo" />
          <span className="orb-halo orb-halo-2" />
          {on ? (
            <span key={on.name} className="orb-core-in">
              <b>{on.name}</b>
              <small>{on.group}</small>
            </span>
          ) : (
            <span className="orb-core-in">
              <b>{total}</b>
              <small>technologies</small>
            </span>
          )}
        </div>

        {rings.map((items, r) => (
          <div key={r} className="orb-rw" style={{ "--r": r } as React.CSSProperties}>
            <div
              className="orb-ring"
              style={{ "--rad": `${22 + r * 11}cqw`, "--dur": `${SPEED[r]}s`, "--dir": r % 2 ? "reverse" : "normal" } as React.CSSProperties}
            >
              <i className="orb-path" />
              {items.map(({ s, group }, i) => (
                <span key={s.name} className="orb-slot" style={{ "--a": `${(360 / items.length) * i}deg` } as React.CSSProperties}>
                  <span className="orb-pos">
                    <span className="orb-item">
                      <button
                        type="button"
                        className={`orb-chip${on?.name === s.name ? " is-on" : ""}`}
                        aria-label={s.name}
                        onPointerEnter={() => enter(s, group)}
                        onPointerLeave={(e) => {
                          if (e.pointerType === "mouse" || e.pointerType === "pen") leave();
                        }}
                        onFocus={() => enter(s, group)}
                        onBlur={leave}
                        onClick={() => enter(s, group)}
                      >
                        <SkillIcon skill={s} size={32} />
                      </button>
                    </span>
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}