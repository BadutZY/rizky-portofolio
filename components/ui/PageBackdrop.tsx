"use client";

import { useEffect, useRef } from "react";
import { whenGo } from "@/lib/motion";

export type BackdropVariant = "home" | "about" | "projects" | "experience" | "skills" | "contact";

/** Each page's scene is loaded on its own, so a page only downloads the code of its own background. */
const load = (v: BackdropVariant) => {
  switch (v) {
    case "home":
      return import("@/lib/bg/home");
    case "about":
      return import("@/lib/bg/about");
    case "projects":
      return import("@/lib/bg/projects");
    case "experience":
      return import("@/lib/bg/experience");
    case "skills":
      return import("@/lib/bg/skills");
    case "contact":
      return import("@/lib/bg/contact");
  }
};

/**
 * Interactive background for the header (hero) area of an inner page. One light canvas, different scene per page:
 * About = drifting words, Projects = tile mosaic that builds mini screens, Experience = timeline waves with milestones,
 * Skills = clustered tech network, Contact = a transmitter with orbiting messages.
 * See lib/bg/engine.ts for what is shared (pointer, rings, frame rate, pausing offscreen).
 */
export default function PageBackdrop({ variant }: { variant: BackdropVariant }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let dead = false;
    let stop = () => {};
    let stopGo = () => {};
    (async () => {
      const [{ mountBackdrop }, mod] = await Promise.all([import("@/lib/bg/engine"), load(variant)]);
      if (dead) return;
      // the home hero is a full screen canvas, so it renders at a lower pixel ratio than the page headers
      stop = mountBackdrop(c, mod.default, variant === "home" ? { maxDpr: 1.25 } : undefined);
      stopGo = whenGo(() => c.classList.add("on")); // fades in once the intro or page curtain opens
    })();
    return () => {
      dead = true;
      stop();
      stopGo();
    };
  }, [variant]);

  return <canvas ref={ref} className="pbg" data-v={variant} aria-hidden />;
}
