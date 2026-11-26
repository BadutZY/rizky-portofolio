"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { getProject, projects, type GalleryItem, type Project } from "@/lib/data";
import { gsap, reducedMotion } from "@/lib/gsap";
import Art from "@/components/ui/Art";
import CoverImage from "@/components/ui/CoverImage";
import Icon from "@/components/ui/Icon";
import StackTag from "@/components/ui/StackTag";
import { lockScroll } from "@/components/layout/SmoothScroll";

type Shot = { src: string; caption?: string };

/** Gallery entries can be a plain path or { src, caption }, so normalise them once. */
const shotsOf = (g?: GalleryItem[]): Shot[] => (g ?? []).map((x) => (typeof x === "string" ? { src: x } : x));

const DEFAULT_RATIO = 4 / 3;
/** Thumbnail boxes keep each photo's own shape, within sane limits (anything wilder is letterboxed, never cropped). */
const boxRatio = (r: number) => Math.min(4, Math.max(0.5, r));

/**
 * Project detail shown as a modal, so projects no longer need their own page.
 * Pass the slug of the project to show (or null to close) and a setter for it.
 *
 * Motion is driven by GSAP (transform and opacity only, so it stays on the GPU):
 * the backdrop fades, the panel rises and settles, the cover zooms out, and the content
 * lines glide in one after another. Closing is a short, quiet reverse.
 */
export default function ProjectModal({ slug, onChange }: { slug: string | null; onChange: (slug: string | null) => void }) {
  const [current, setCurrent] = useState<Project | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const isOpen = useRef(false);
  const prevSlug = useRef<string | null>(null);

  // gallery viewer: index of the open image (null = closed)
  const [lb, setLb] = useState<number | null>(null);
  const lbClose = useRef<HTMLButtonElement>(null);
  const swipeX = useRef<number | null>(null);
  const shots = useMemo(() => shotsOf(current?.gallery), [current]);
  // natural width / height of every gallery image, so each thumbnail can take the shape of its photo
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const sizing = useRef<Set<string>>(new Set());
  const count = shots.length;
  const lbOpen = lb !== null;
  // the viewer stays mounted while its exit animation plays, then it is removed (closeLb)
  const [lbClosing, setLbClosing] = useState(false);
  const lbTimer = useRef(0);
  const closeLb = useCallback(() => {
    if (lbTimer.current) return; // already closing
    setLbClosing(true);
    lbTimer.current = window.setTimeout(() => {
      lbTimer.current = 0;
      setLb(null);
      setLbClosing(false);
    }, 320);
  }, []);
  useEffect(() => () => window.clearTimeout(lbTimer.current), []);
  const step = useCallback((d: number) => setLb((v) => (v === null || count === 0 ? v : (v + d + count) % count)), [count]);

  // content lines glide in one after another (also used when switching to another project)
  const playContent = useCallback((delay: number) => {
    const p = panel.current;
    if (!p) return;
    const items = gsap.utils.toArray<HTMLElement>(".pm-body > *", p);
    if (reducedMotion()) {
      gsap.set(items, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(
      items,
      { y: 36, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "expo.out", stagger: 0.07, delay, overwrite: true, clearProps: "transform,opacity" },
    );
  }, []);

  const playOpen = useCallback(() => {
    const b = backdrop.current;
    const p = panel.current;
    if (!b || !p) return;
    tl.current?.kill();
    isOpen.current = true;
    if (reducedMotion()) {
      gsap.set(b, { opacity: 1 });
      gsap.set(p, { opacity: 1, y: 0, scale: 1 });
      return;
    }
    const media = p.querySelector<HTMLElement>(".pm-cover > *");
    const t = gsap.timeline();
    t.to(b, { opacity: 1, duration: 0.55, ease: "power2.out" }, 0);
    t.fromTo(p, { y: 80, scale: 0.96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 1, ease: "expo.out" }, 0.04);
    if (media) t.fromTo(media, { scale: 1.2 }, { scale: 1, duration: 1.6, ease: "expo.out" }, 0.1);
    tl.current = t;
  }, []);

  const playClose = useCallback((done: () => void) => {
    const b = backdrop.current;
    const p = panel.current;
    tl.current?.kill();
    isOpen.current = false;
    if (!b || !p || reducedMotion()) {
      done();
      return;
    }
    const t = gsap.timeline({ onComplete: done });
    t.to(p, { y: 50, scale: 0.975, opacity: 0, duration: 0.5, ease: "power3.inOut" }, 0);
    t.to(b, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, 0.08);
    tl.current = t;
  }, []);

  // mount the project when a slug arrives
  useEffect(() => {
    if (!slug) return;
    const p = getProject(slug);
    if (p) setCurrent(p);
  }, [slug]);

  // open when the modal has mounted, close when the slug goes away
  useEffect(() => {
    if (!current) return;
    if (slug && !isOpen.current) {
      if (!opener.current) opener.current = document.activeElement as HTMLElement | null;
      playOpen();
      playContent(0.3);
      closeBtn.current?.focus({ preventScroll: true });
    } else if (!slug && isOpen.current) {
      playClose(() => {
        setCurrent(null);
        opener.current?.focus?.({ preventScroll: true });
        opener.current = null;
      });
    }
  }, [slug, current, playOpen, playContent, playClose]);

  // switching to another project while open: back to top and glide the new content in
  // (layout effect, so the new content never flashes at full opacity for one frame)
  useLayoutEffect(() => {
    if (!current) {
      prevSlug.current = null;
      return;
    }
    scroller.current?.scrollTo({ top: 0 });
    window.clearTimeout(lbTimer.current);
    lbTimer.current = 0;
    setLbClosing(false);
    setLb(null); // a different project always starts with the viewer closed
    if (prevSlug.current && prevSlug.current !== current.slug) playContent(0.05);
    prevSlug.current = current.slug;
  }, [current, playContent]);

  // lock page scrolling while the modal exists (the scrollbar gutter is reserved in CSS, so nothing jumps)
  const mounted = current !== null;
  useEffect(() => {
    if (!mounted) return;
    lockScroll(true);
    return () => lockScroll(false);
  }, [mounted]);

  // Esc closes (the gallery viewer first, then the modal); arrow keys flip through the gallery
  const close = useCallback(() => onChange(null), [onChange]);
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (lbOpen) {
        if (lbClosing) return;
        if (e.key === "Escape") closeLb();
        else if (e.key === "ArrowRight") step(1);
        else if (e.key === "ArrowLeft") step(-1);
        return;
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, close, lbOpen, lbClosing, closeLb, step]);

  // viewer focus: move it to the close button, give it back to the thumbnail afterwards
  useEffect(() => {
    if (!lbOpen) return;
    const from = document.activeElement as HTMLElement | null;
    lbClose.current?.focus({ preventScroll: true });
    return () => {
      if (from?.isConnected) from.focus?.({ preventScroll: true });
    };
  }, [lbOpen]);

  // measure the gallery images once, so the grid can be laid out before anything is painted
  useEffect(() => {
    shots.forEach(({ src }) => {
      if (sizing.current.has(src)) return;
      sizing.current.add(src);
      const im = new Image();
      const done = (r: number) => setRatios((v) => (v[src] ? v : { ...v, [src]: r }));
      im.onload = () => done(im.naturalWidth && im.naturalHeight ? im.naturalWidth / im.naturalHeight : DEFAULT_RATIO);
      im.onerror = () => done(DEFAULT_RATIO);
      im.src = src;
    });
  }, [shots]);

  // warm up the neighbouring images so flipping feels instant
  useEffect(() => {
    if (lb === null || count < 2) return;
    [1, count - 1].forEach((d) => {
      const im = new Image();
      im.src = shots[(lb + d) % count].src;
    });
  }, [lb, count, shots]);

  // safety net: whatever happens to the timeline, an open modal must end up visible and usable
  useEffect(() => {
    if (!slug || !mounted) return;
    const id = window.setTimeout(() => {
      if (!isOpen.current) return;
      const b = backdrop.current;
      const pn = panel.current;
      if (b && Number(gsap.getProperty(b, "opacity")) < 1 && !tl.current?.isActive()) gsap.set(b, { opacity: 1 });
      if (pn && Number(gsap.getProperty(pn, "opacity")) < 1 && !tl.current?.isActive()) gsap.set(pn, { opacity: 1, y: 0, scale: 1 });
    }, 2500);
    return () => window.clearTimeout(id);
  }, [slug, mounted]);

  useEffect(() => () => void tl.current?.kill(), []);

  if (!current || typeof document === "undefined") return null;

  const p = current;
  const i = projects.indexOf(p);
  const prev = projects[(i + projects.length - 1) % projects.length];
  const next = projects[(i + 1) % projects.length];
  const galleryReady = shots.every((x) => ratios[x.src]);

  return createPortal(
    <div ref={root} className="pm" role="dialog" aria-modal="true" aria-label={p.title} data-open={slug ? "1" : "0"}>
      <div ref={backdrop} className="pm-backdrop" onClick={close} />
      <div ref={panel} className="pm-panel">
        <div className="pm-bar">
          <span className="pm-count">
            {String(i + 1).padStart(2, "0")} <i /> {String(projects.length).padStart(2, "0")}
          </span>
          <div className="pm-bar-actions">
            <button type="button" className="pm-icon" onClick={() => onChange(prev.slug)} aria-label={`Previous project: ${prev.title}`} data-cursor="Prev">
              <Icon name="arrow-left" size={18} />
            </button>
            <button type="button" className="pm-icon" onClick={() => onChange(next.slug)} aria-label={`Next project: ${next.title}`} data-cursor="Next">
              <Icon name="arrow-right" size={18} />
            </button>
            <button ref={closeBtn} type="button" className="pm-icon pm-close" onClick={close} aria-label="Close" data-cursor="Close">
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>

        <div ref={scroller} className="pm-scroll" data-lenis-prevent>
          <div key={p.slug} className="pm-body">
            <div className="pm-cover"><CoverImage p={p} lazy={false} /></div>

            <header className="pm-head">
              <p className="pm-kind">
                {p.kind} <b>/</b> {p.year}
              </p>
              <h2 className="pm-title">{p.title}</h2>
              <p className="pm-desc">{p.desc}</p>
              <div className="pm-links">
                {p.links && p.links.length > 0
                  ? p.links.map((l, i) => (
                      <a key={l.href} className={i === 0 ? "btn btn-solid" : "btn"} href={l.href} target="_blank" rel="noreferrer">
                        {l.label} <Icon name="arrow-up-right" size={18} />
                      </a>
                    ))
                  : p.link && (
                      <a className="btn btn-solid" href={p.link} target="_blank" rel="noreferrer">
                        Visit website <Icon name="arrow-up-right" size={18} />
                      </a>
                    )}
                {p.repo && (
                  <a className="btn" href={p.repo} target="_blank" rel="noreferrer">
                    <Icon name="github" size={18} /> Source code
                  </a>
                )}
              </div>
            </header>

            <dl className="pm-meta">
              {p.client && <div><dt>Client</dt><dd>{p.client}</dd></div>}
              <div><dt>Role</dt><dd>{p.role}</dd></div>
              <div><dt>Duration</dt><dd>{p.duration}</dd></div>
              <div><dt>Team</dt><dd>{p.team}</dd></div>
            </dl>

            <section className="pm-sec">
              <h3 className="pm-h">Overview</h3>
              <p className="pm-text">{p.overview}</p>
            </section>

            <div className="pm-two">
              <section className="pm-sec">
                <h3 className="pm-h">The challenge</h3>
                <p className="pm-text pm-mut">{p.challenge}</p>
              </section>
              <section className="pm-sec">
                <h3 className="pm-h">The solution</h3>
                <p className="pm-text pm-mut">{p.solution}</p>
              </section>
            </div>

            <ul className="pm-results">
              {p.results.map((r) => (
                <li key={r.label}>
                  <b>
                    {r.value}
                    {r.suffix}
                  </b>
                  <span>{r.label}</span>
                </li>
              ))}
            </ul>

            <section className="pm-sec">
              <h3 className="pm-h">Highlights</h3>
              <ul className="pm-hl">
                {p.highlights.map((h) => (
                  <li key={h}>
                    <Icon name="check" size={16} /> {h}
                  </li>
                ))}
              </ul>
            </section>

            <section className="pm-sec">
              <h3 className="pm-h">Tech stack</h3>
              <ul className="tags">
                {p.stack.map((s) => (
                  <StackTag key={s} name={s} />
                ))}
              </ul>
            </section>

            {count > 0 ? (
              <section className="pm-sec">
                <h3 className="pm-h">Gallery</h3>
                <div className="pm-gallery-real" data-ready={galleryReady ? "1" : "0"}>
                  {shots.map((s, g) => (
                    <button
                      key={`${s.src}-${g}`}
                      type="button"
                      className="pm-shot pm-shot-btn"
                      onClick={() => setLb(g)}
                      aria-label={`Open image ${g + 1} of ${count}${s.caption ? `: ${s.caption}` : ""}`}
                      style={{ "--r": boxRatio(ratios[s.src] ?? DEFAULT_RATIO) } as CSSProperties}
                      data-cursor="View"
                    >
                      <i aria-hidden="true" />
                      <img src={s.src} alt={s.caption ?? `${p.title} screenshot ${g + 1}`} decoding="async" draggable={false} />
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <section className="pm-sec">
                <h3 className="pm-h">Gallery</h3>
                <div className="pm-gallery">
                  {(["landing", "dashboard", "mobile"] as const).map((k, g) => (
                    <div key={k} className="pm-shot">
                      <Art kind={g === 0 ? p.art : k} chrome={g !== 2} />
                    </div>
                  ))}
                </div>
                {!p.image && <p className="note">Gallery images are generated placeholders. Add real screenshots in /public/projects.</p>}
              </section>
            )}

            <div className="pm-nav">
              <button type="button" onClick={() => onChange(prev.slug)} className="pm-nav-a">
                <Icon name="arrow-left" size={18} />
                <span>
                  Previous<b>{prev.title}</b>
                </span>
              </button>
              <button type="button" onClick={() => onChange(next.slug)} className="pm-nav-a right">
                <span>
                  Next<b>{next.title}</b>
                </span>
                <Icon name="arrow-right" size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {lb !== null && shots[lb] && (
        <div
          className={`pm-lb${lbClosing ? " is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label={`${p.title} gallery`}
          onClick={(e) => {
            if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.lbClose) closeLb();
          }}
        >
          <div className="pm-lb-bar">
            <span className="pm-count">
              {String(lb + 1).padStart(2, "0")} <i /> {String(count).padStart(2, "0")}
            </span>
            <div className="pm-bar-actions">
              {count > 1 && (
                <>
                  <button type="button" className="pm-icon" onClick={() => !lbClosing && step(-1)} aria-label="Previous image" data-cursor="Prev">
                    <Icon name="arrow-left" size={18} />
                  </button>
                  <button type="button" className="pm-icon" onClick={() => !lbClosing && step(1)} aria-label="Next image" data-cursor="Next">
                    <Icon name="arrow-right" size={18} />
                  </button>
                </>
              )}
              <button ref={lbClose} type="button" className="pm-icon pm-close" onClick={closeLb} aria-label="Close gallery" data-cursor="Close">
                <Icon name="close" size={18} />
              </button>
            </div>
          </div>
          <figure
            className="pm-lb-stage"
            data-lb-close="1"
            onPointerDown={(e) => {
              swipeX.current = e.clientX;
            }}
            onPointerCancel={() => {
              swipeX.current = null;
            }}
            onPointerUp={(e) => {
              const x = swipeX.current;
              swipeX.current = null;
              if (x === null) return;
              const dx = e.clientX - x;
              if (Math.abs(dx) > 50 && !lbClosing) step(dx < 0 ? 1 : -1);
            }}
          >
            <img key={lb} className="pm-lb-img" src={shots[lb].src} alt={shots[lb].caption ?? `${p.title} screenshot ${lb + 1}`} draggable={false} />
            {shots[lb].caption && <figcaption data-lb-close="1">{shots[lb].caption}</figcaption>}
          </figure>
        </div>
      )}
    </div>,
    document.body,
  );
}