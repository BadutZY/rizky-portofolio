"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger, reducedMotion } from "@/lib/gsap";
import { setGo } from "@/lib/motion";
import { nav, titleFor } from "@/lib/data";
import { scrollToTop, scrollToTarget } from "./SmoothScroll";

type Ctx = {
  navigate: (href: string) => void;
  /** called by the template whenever a new page has mounted */
  enter: (path: string) => void;
};

const TransitionCtx = createContext<Ctx | null>(null);

export function usePageTransition() {
  const c = useContext(TransitionCtx);
  if (!c) throw new Error("usePageTransition must be used inside TransitionProvider");
  return c;
}

const COLS = 6;

function indexFor(path: string) {
  if (path === "/") return "00";
  const first = "/" + path.split("/").filter(Boolean)[0];
  const i = nav.findIndex((n) => n.href === first);
  return String(i + 1).padStart(2, "0");
}

/**
 * Page transition: monochrome bars rise to cover the screen, the page name
 * is revealed, the route changes, and the bars fall away to open the new page.
 */
export default function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const overlay = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const covered = useRef(false);
  const last = useRef<string | null>(null);
  const safety = useRef(0);

  const bars = () => (overlay.current ? gsap.utils.toArray<HTMLElement>(".cv-bar", overlay.current) : []);
  const words = () => (label.current ? gsap.utils.toArray<HTMLElement>(".cv-w", label.current) : []);

  const setLabel = (path: string) => {
    if (!label.current) return;
    const t = label.current.querySelector<HTMLElement>("[data-cv-title]");
    const n = label.current.querySelector<HTMLElement>("[data-cv-index]");
    if (t) t.textContent = titleFor(path);
    if (n) n.textContent = indexFor(path);
  };

  const reveal = useCallback(() => {
    const o = overlay.current;
    if (!o) return;
    tl.current?.kill();
    window.clearTimeout(safety.current);
    if (reducedMotion()) {
      gsap.set(o, { autoAlpha: 0 });
      if (label.current) gsap.set(label.current, { autoAlpha: 0 });
      covered.current = false;
      setGo(true);
      return;
    }
    const t = gsap.timeline({
      onComplete: () => {
        gsap.set(o, { autoAlpha: 0 });
        if (label.current) gsap.set(label.current, { autoAlpha: 0 });
        covered.current = false;
      },
    });
    // 1) the page name leaves smoothly (slide up + fade) while the curtain is still closed ...
    const EXIT = 0.6;
    const STAG = 0.07;
    const exitEnd = EXIT + STAG * Math.max(0, words().length - 1);
    t.to(words(), { yPercent: -115, duration: EXIT, ease: "power3.inOut", stagger: STAG }, 0);
    t.to(words(), { opacity: 0, duration: EXIT * 0.6, ease: "power1.in", stagger: STAG }, EXIT * 0.35);
    // 2) ... and only once it is completely gone do the bars open, so no text can sit on the new page
    t.set(label.current, { autoAlpha: 0 }, exitEnd);
    t.add(() => setGo(true), exitEnd + 0.12);
    t.to(bars(), { scaleY: 0, transformOrigin: "50% 0%", duration: 0.85, ease: "power4.inOut", stagger: { each: 0.06, from: "center" } }, exitEnd + 0.02);
    tl.current = t;
  }, []);

  const navigate = useCallback(
    (href: string) => {
      const [pathPart, hash] = href.split("#");
      const target = pathPart || pathname;
      if (target === pathname) {
        if (hash) scrollToTarget("#" + hash);
        else scrollToTarget(0, 0);
        return;
      }
      const o = overlay.current;
      if (!o || reducedMotion()) {
        router.push(href, { scroll: false });
        return;
      }
      tl.current?.kill();
      setLabel(target);
      gsap.set(o, { autoAlpha: 1 });
      gsap.set(label.current, { autoAlpha: 1 });
      gsap.set(words(), { x: 0, y: 0, yPercent: 115, opacity: 1 });
      const t = gsap.timeline({
        onComplete: () => {
          covered.current = true;
          router.push(href, { scroll: false });
          safety.current = window.setTimeout(reveal, 3500);
        },
      });
      t.fromTo(bars(), { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.7, ease: "power4.inOut", stagger: { each: 0.06, from: "edges" } }, 0);
      // the name only starts once the bars have (almost) covered the screen, so it never sits on the old page
      const TEXT_AT = 0.6;
      t.to(words(), { yPercent: 0, duration: 0.6, ease: "power4.out", stagger: 0.05 }, TEXT_AT);
      t.to({}, { duration: 0.25 }, ">");
      tl.current = t;
    },
    [pathname, router, reveal],
  );

  const enter = useCallback(
    (path: string) => {
      const first = last.current === null;
      const same = last.current === path;
      last.current = path;
      if (first || same) return;
      scrollToTop();
      requestAnimationFrame(() => ScrollTrigger.refresh());
      // new page mounts hidden under the curtain; animations restart when "go" turns back on
      setGo(false);
      if (!covered.current && !reducedMotion() && overlay.current) {
        // browser back/forward: cover instantly so the page still opens with the curtain
        setLabel(path);
        gsap.set(overlay.current, { autoAlpha: 1 });
        gsap.set(label.current, { autoAlpha: 1 });
        gsap.set(bars(), { scaleY: 1, transformOrigin: "50% 100%" });
        gsap.set(words(), { x: 0, y: 0, yPercent: 0, opacity: 1 });
        covered.current = true;
      }
      reveal();
    },
    [reveal],
  );

  useEffect(() => () => void tl.current?.kill(), []);

  const value = useMemo(() => ({ navigate, enter }), [navigate, enter]);

  return (
    <TransitionCtx.Provider value={value}>
      {children}
      <div ref={overlay} className="curtain" aria-hidden>
        {Array.from({ length: COLS }, (_, i) => (
          <span key={i} className="cv-bar" />
        ))}
      </div>
      {/* sibling of the curtain, so its blend mode works against the page as well as the bars */}
      <div ref={label} className="cv-label" aria-hidden>
        <span className="cv-mask">
          <span className="cv-w cv-index" data-cv-index>
            00
          </span>
        </span>
        <span className="cv-mask">
          <span className="cv-w cv-title" data-cv-title>
            Home
          </span>
        </span>
      </div>
    </TransitionCtx.Provider>
  );
}