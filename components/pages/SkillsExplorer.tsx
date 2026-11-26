"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import Icon from "@/components/ui/Icon";
import SkillIcon from "@/components/ui/SkillIcon";
import { whenGo } from "@/lib/motion";
import { reducedMotion } from "@/lib/gsap";
import { bindFollow, bindTilt } from "@/lib/tilt";
import type { Skill } from "@/lib/data";

type Group = { group: string; icon: string; items: Skill[] };
const ALL = "All";

/**
 * Interactive stack: a category switcher with a sliding pill, live search, cards that tilt in 3D toward the pointer,
 * logos that lean toward the cursor, a ripple when a logo is clicked, and staggered enter / exit when the category changes.
 */
export default function SkillsExplorer({ groups }: { groups: Group[] }) {
  const [active, setActive] = useState(ALL);
  const [q, setQ] = useState("");
  const [pill, setPill] = useState({ x: 0, w: 0 });
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLUListElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const total = useMemo(() => groups.reduce((n, g) => n + g.items.length, 0), [groups]);
  const needle = q.trim().toLowerCase();

  const visible = useMemo(() => {
    const pool = active === ALL ? groups : groups.filter((g) => g.group === active);
    const rows = pool.map((g) => ({ ...g, hits: g.items.filter((s) => s.name.toLowerCase().includes(needle)).length }));
    return needle ? rows.filter((g) => g.hits > 0) : rows;
  }, [groups, active, needle]);
  const matches = visible.reduce((n, g) => n + g.hits, 0);

  // sliding pill under the active tab, kept in sync on resize
  useLayoutEffect(() => {
    const bar = tabs.current;
    if (!bar) return;
    const place = () => {
      const b = bar.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!b) return;
      setPill({ x: b.offsetLeft, w: b.offsetWidth });
      bar.scrollTo({ left: b.offsetLeft - (bar.clientWidth - b.offsetWidth) / 2, behavior: "smooth" });
    };
    place();
    const ro = new ResizeObserver(() => {
      const b = bar.querySelector<HTMLElement>('[aria-selected="true"]');
      if (b) setPill({ x: b.offsetLeft, w: b.offsetWidth });
    });
    ro.observe(bar);
    return () => ro.disconnect();
  }, [active]);

  // start the entrance once the section is on screen (and the page curtain is gone)
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (reducedMotion()) {
      el.classList.add("in");
      return;
    }
    let io: IntersectionObserver | undefined;
    const stop = whenGo(() => {
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            el.classList.add("in");
            io?.disconnect();
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
      );
      io.observe(el);
    });
    return () => {
      stop();
      io?.disconnect();
    };
  }, []);

  // 3D tilt on the cards and the "leaning" logos: one delegated listener each, so they survive re-renders
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const a = bindTilt(el, ".sk-card", 6);
    const b = bindFollow(el, ".sk-t", 9);
    return () => {
      a();
      b();
    };
  }, []);

  /** Cards fly out, then the new category flies in (the grid is keyed by `active`, so it plays the CSS entrance again). */
  const pick = (name: string) => {
    if (name === active || busy.current) return;
    const cells = grid.current ? Array.from(grid.current.children) : [];
    if (reducedMotion() || !cells.length) return setActive(name);
    busy.current = true;
    animate(cells, {
      opacity: [1, 0],
      translateY: [0, -14],
      scale: [1, 0.97],
      duration: 240,
      ease: "inQuad",
      delay: stagger(35),
      onComplete: () => {
        setActive(name);
        busy.current = false;
      },
    });
  };

  const ripple = (e: React.MouseEvent<HTMLElement>) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>(".sk-t");
    if (!el) return;
    el.classList.remove("pulse");
    void el.offsetWidth; // restart the animation
    el.classList.add("pulse");
  };

  const names = ["All", ...groups.map((g) => g.group)];

  return (
    <div ref={root} className="sk-explorer">
      <div className="sk-bar">
        <div ref={tabs} className="sk-tabs" role="tablist" aria-label="Skill categories">
          <span className="sk-pill" style={{ width: pill.w, transform: `translateX(${pill.x}px)` }} aria-hidden />
          {names.map((n) => (
            <button key={n} type="button" role="tab" aria-selected={active === n} className="sk-tab" onClick={() => pick(n)} data-cursor-snap>
              {n}
              <b>{String(n === ALL ? total : groups.find((g) => g.group === n)?.items.length ?? 0).padStart(2, "0")}</b>
            </button>
          ))}
        </div>

        <label className="sk-search" role="search">
          <Icon name="search" size={18} />
          <input
            type="search"
            value={q}
            placeholder="Search a skill..."
            aria-label="Search a skill"
            autoComplete="off"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQ("")}
          />
          {q && (
            <button type="button" className="sk-clear" aria-label="Clear search" onClick={() => setQ("")}>
              <Icon name="close" size={14} />
            </button>
          )}
        </label>
      </div>

      <p className="sk-count" aria-live="polite">
        {needle ? (matches ? `${matches} match${matches === 1 ? "" : "es"} for "${q.trim()}"` : "No match") : `${active === ALL ? total : visible[0]?.items.length ?? 0} skills${active === ALL ? ` in ${groups.length} categories` : ` in ${active}`}`}
      </p>

      {visible.length === 0 ? (
        <p className="sk-empty">Nothing here yet. Try another name, like "react" or "java".</p>
      ) : (
        <ul key={active} ref={grid} className={`cards3 sk-grid${visible.length === 1 ? " single" : ""}`} onClick={ripple}>
          {visible.map((g, i) => (
            <li key={g.group} className="sk-cell" style={{ "--i": i } as React.CSSProperties}>
              <div className="sk-card spot tilt">
                <div className="sk-head">
                  <span className="vcard-ic">
                    <Icon name={g.icon} size={24} />
                  </span>
                  <span className="sk-num">{String(g.items.length).padStart(2, "0")}</span>
                </div>
                <h3>{g.group}</h3>
                <ul className="sk-icons">
                  {g.items.map((s, k) => {
                    const hit = needle && s.name.toLowerCase().includes(needle);
                    const dim = needle && !hit;
                    return (
                      <li key={s.name} title={s.name} className={`sk-t${hit ? " hit" : ""}${dim ? " dim" : ""}`} style={{ "--k": k } as React.CSSProperties}>
                        <span className="sk-ic">
                          <SkillIcon skill={s} />
                        </span>
                        <span className="sk-name">{s.name}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}