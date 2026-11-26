"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, m, useInView, useScroll, useSpring } from "motion/react";
import { projects, type Project } from "@/lib/data";
import { whenGo } from "@/lib/motion";
import ProjectCard from "./ProjectCard";
import ProjectModal from "./ProjectModal";
import Icon from "@/components/ui/Icon";

type Sort = "curated" | "newest" | "az";
const SORTS: { id: Sort; label: string }[] = [
  { id: "curated", label: "Curated" },
  { id: "newest", label: "Newest" },
  { id: "az", label: "A – Z" },
];

const haystack = (p: Project) => [p.title, p.desc, p.kind, p.year, p.role, ...p.stack].join(" ").toLowerCase();

/** One grid cell: glides to its new place when the list changes, and rises into view the first time it is scrolled to. */
function Item({ p, idx, pos, go, onOpen }: { p: Project; idx: number; pos: number; go: boolean; onOpen: (slug: string) => void }) {
  const ref = useRef<HTMLLIElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  const on = seen && go;
  return (
    <m.li ref={ref} layout="position" className="pgrid-item shown" exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}>
      <m.div
        className={`pj-reveal${on ? " is-in" : ""}`}
        initial={{ opacity: 0, y: 56 }}
        animate={on ? { opacity: 1, y: 0, transition: { delay: (pos % 3) * 0.09, type: "spring", stiffness: 130, damping: 22 } } : undefined}
      >
        <ProjectCard p={p} i={idx} onOpen={onOpen} />
      </m.div>
    </m.li>
  );
}

/**
 * Projects list with live search, kind filter (with counts), sorting and a grid / list switch.
 * The toolbar sticks under the header, gets a frosted background once it is stuck and shows how far
 * through the list you are. Cards animate with Motion layout animations, so nothing remounts.
 */
export default function ProjectsExplorer() {
  const kinds = useMemo(() => ["All", ...Array.from(new Set(projects.map((p) => p.kind)))], []);
  const counts = useMemo(() => {
    const c: Record<string, number> = { All: projects.length };
    projects.forEach((p) => (c[p.kind] = (c[p.kind] ?? 0) + 1));
    return c;
  }, []);
  const index = useMemo(() => new Map(projects.map((p, i) => [p.slug, i])), []);
  const texts = useMemo(() => new Map(projects.map((p) => [p.slug, haystack(p)])), []);

  const [kind, setKind] = useState("All");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<Sort>("curated");
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [go, setGo] = useState(false);
  const [stuck, setStuck] = useState(false);

  const bar = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // entrance animations wait until the intro / page curtain is gone
  useEffect(() => whenGo(() => setGo(true)), []);

  // toolbar: frosted once it is stuck to the top
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // toolbar: sits under the header while it is visible and moves up when the header hides on scroll
  useEffect(() => {
    const h = document.querySelector(".header");
    const b = bar.current;
    if (!h || !b) return;
    const sync = () => b.setAttribute("data-hdr", h.classList.contains("hide") ? "hide" : "show");
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(h, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  // "/" jumps to the search field
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      input.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // progress through the list
  const { scrollYProgress } = useScroll({ target: list, offset: ["start 75%", "end 35%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });

  const shown = useMemo(() => {
    const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const out = projects.filter((p) => (kind === "All" || p.kind === kind) && terms.every((t) => texts.get(p.slug)!.includes(t)));
    if (sort === "az") out.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "newest") out.sort((a, b) => parseInt(b.year) - parseInt(a.year) || index.get(a.slug)! - index.get(b.slug)!);
    return out;
  }, [q, kind, sort, texts, index]);

  const nextSort = () => setSort((s) => SORTS[(SORTS.findIndex((x) => x.id === s) + 1) % SORTS.length].id);
  const sortLabel = SORTS.find((s) => s.id === sort)!.label;
  const filtered = kind !== "All" || q.trim() !== "";
  const reset = () => {
    setKind("All");
    setQ("");
  };

  return (
    <div className="wrap">
      <LayoutGroup>
        <div ref={sentinel} className="pj-sentinel" aria-hidden />
        <div ref={bar} data-hdr="show" className={`pj-bar fade${stuck ? " stuck" : ""}`} style={{ "--d": "0.7s" } as React.CSSProperties}>
          <div className="pj-top">
            <label className="pj-search">
              <Icon name="search" size={18} />
              <input
                ref={input}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setQ("");
                    input.current?.blur();
                  }
                }}
                placeholder="Search projects, stack or year"
                aria-label="Search projects"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
              />
              <AnimatePresence initial={false} mode="wait">
                {q ? (
                  <m.button
                    key="clear"
                    type="button"
                    className="pj-clear"
                    aria-label="Clear search"
                    onClick={() => {
                      setQ("");
                      input.current?.focus();
                    }}
                    initial={{ opacity: 0, scale: 0.4, rotate: -90 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.4, rotate: 90 }}
                  >
                    <Icon name="close" size={14} />
                  </m.button>
                ) : (
                  <m.kbd key="kbd" className="pj-kbd" aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    /
                  </m.kbd>
                )}
              </AnimatePresence>
            </label>
            <div className="seg" role="group" aria-label="Layout">
              {(["grid", "list"] as const).map((l) => (
                <button key={l} className={`pj-seg${layout === l ? " on" : ""}`} onClick={() => setLayout(l)} aria-label={`${l === "grid" ? "Grid" : "List"} layout`} aria-pressed={layout === l}>
                  {layout === l && <m.span layoutId="seg-bg" className="pj-seg-bg" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                  <Icon name={l === "grid" ? "layout" : "menu"} size={18} />
                </button>
              ))}
            </div>
          </div>

          <div className="pj-filters">
            <button type="button" className="pj-sort" onClick={nextSort} aria-label={`Sort: ${sortLabel}. Click to change`} data-cursor-snap>
              <span className="pj-sort-k">Sort</span>
              <span className="pj-sort-v">
                <AnimatePresence initial={false} mode="popLayout">
                  <m.span key={sort} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 32 }}>
                    {sortLabel}
                  </m.span>
                </AnimatePresence>
              </span>
            </button>

            <ul className="chips pj-chips" role="tablist" aria-label="Filter projects">
              {kinds.map((k) => (
                <li key={k}>
                  <button role="tab" aria-selected={kind === k} className={`chip${kind === k ? " on" : ""}`} onClick={() => setKind(k)}>
                    {kind === k && <m.span layoutId="chip-bg" className="chip-bg" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                    {k}
                    <sup className="chip-n">{counts[k]}</sup>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <m.span className="pj-prog" style={{ scaleX: progress }} aria-hidden />
        </div>

        <m.ul ref={list} layout className={`pgrid ${layout}`}>
          <AnimatePresence mode="popLayout">
            {shown.map((p, pos) => (
              <Item key={p.slug} p={p} idx={index.get(p.slug)!} pos={pos} go={go} onOpen={setActive} />
            ))}
          </AnimatePresence>
        </m.ul>

        <AnimatePresence>
          {shown.length === 0 && (
            <m.div className="pj-empty" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} role="status">
              <span className="pj-empty-ic">
                <Icon name="search" size={30} />
              </span>
              <h3>No projects found</h3>
              <p>{q.trim() ? `Nothing matches “${q.trim()}”${kind !== "All" ? ` in ${kind}` : ""}.` : `There are no ${kind} projects yet.`} Try a different word or clear the filters.</p>
              <button type="button" className="pj-reset" onClick={reset} data-cursor-snap>
                <Icon name="close" size={14} /> Clear filters
              </button>
            </m.div>
          )}
        </AnimatePresence>
      </LayoutGroup>

      <p className="count pj-count" aria-live="polite">
        Showing{" "}
        <span className="pj-count-n">
          <AnimatePresence initial={false} mode="popLayout">
            <m.b key={shown.length} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}>
              {shown.length}
            </m.b>
          </AnimatePresence>
        </span>{" "}
        of {projects.length} projects
        {filtered && (
          <button type="button" className="pj-link" onClick={reset}>
            Reset
          </button>
        )}
      </p>
      <ProjectModal slug={active} onChange={setActive} />
    </div>
  );
}