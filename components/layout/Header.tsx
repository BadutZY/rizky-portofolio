"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { flushSync } from "react-dom";
import { nav, site, socials, primaryContact } from "@/lib/data";
import Scramble from "@/components/ui/Scramble";
import Icon from "@/components/ui/Icon";
import TransitionLink from "./TransitionLink";
import { lenisRef } from "./SmoothScroll";
import Clock from "@/components/ui/Clock";
import "./header-desktop.css";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  // close the menu after any navigation
  useEffect(() => setOpen(false), [pathname]);

  // the full-screen menu is mobile/tablet only: close it if the window grows into the desktop layout
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1040px)");
    const onChange = (e: MediaQueryListEvent) => e.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // header gains a blurred backdrop once scrolled, hides while scrolling down and returns on scroll up
  const menuOpen = useRef(false);
  menuOpen.current = open;
  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const y = window.scrollY;
      const h = header.current;
      if (!h) return;
      h.classList.toggle("scrolled", y > 24);
      const dy = y - lastY;
      if (Math.abs(dy) > 6) {
        h.classList.toggle("hide", dy > 0 && y > 480 && !menuOpen.current);
        lastY = y;
      }
      if (y < 120) h.classList.remove("hide");
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  // lock scroll while the menu is open
  const opened = useRef(false);
  useEffect(() => {
    if (!open && !opened.current) return;
    opened.current = true;
    const l = lenisRef.current;
    if (open) l?.stop();
    else l?.start();
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = theme === "dark" ? "light" : "dark";
    const apply = () => {
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch {}
      setTheme(next);
    };
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();
    // circular reveal from the button: the whole page changes theme in one smooth sweep instead of piece by piece
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = doc.startViewTransition(() => flushSync(apply));
    vt.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 650, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    }).catch(() => {});
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header ref={header} className="header">
        <TransitionLink href="/" className="logo" aria-label="Home">
          <span className="logo-mark" aria-hidden />
          <span className="logo-text">{site.short}</span>
        </TransitionLink>

        <nav className="nav" aria-label="Main">
          {nav.map((n) => (
            <TransitionLink key={n.href} href={n.href} className={isActive(n.href) ? "active" : ""}>
              <Scramble text={n.label} />
            </TransitionLink>
          ))}
        </nav>

        <div className="header-actions">
          <button className="icon-btn" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
            <span className={`theme-ic${theme === "light" ? " flip" : ""}`}>
              <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
            </span>
          </button>
          <button className={`menu-btn${open ? " open" : ""}`} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="menu">
            <span className="menu-btn-label">
              <span>Menu</span>
              <span>Close</span>
            </span>
            <span className="burger" aria-hidden>
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      <div id="menu" className={`menu${open ? " open" : ""}`} inert={!open} data-lenis-prevent>
        <div className="menu-in wrap">
          <nav className="menu-nav" aria-label="All pages">
            <p className="menu-cap">Navigation</p>
            <ul>
              <li style={{ "--i": 0 } as React.CSSProperties}>
                <TransitionLink href="/" className={pathname === "/" ? "active" : ""}>
                  <span className="menu-idx">00</span>
                  <span className="menu-txt">Home</span>
                </TransitionLink>
              </li>
              {nav.map((n, i) => (
                <li key={n.href} style={{ "--i": i + 1 } as React.CSSProperties}>
                  <TransitionLink href={n.href} className={isActive(n.href) ? "active" : ""}>
                    <span className="menu-idx">{String(i + 1).padStart(2, "0")}</span>
                    <span className="menu-txt">{n.label}</span>
                    <span className="menu-blurb">{n.blurb}</span>
                    <Icon name="arrow-up-right" size={26} className="menu-arrow" />
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>

          <aside className="menu-side">
            <div>
              <p className="menu-cap">Get in touch</p>
              <a className="menu-mail" href={primaryContact.href} {...(primaryContact.external ? { target: "_blank", rel: "noreferrer" } : {})}>
                {primaryContact.label}
              </a>
            </div>
            <div>
              <p className="menu-cap">Social</p>
              <ul className="menu-social">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noreferrer">
                      <Icon name={s.icon} size={18} /> {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="menu-cap">Local time</p>
              <p className="menu-time">
                <Clock /> <span>{site.location}</span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}