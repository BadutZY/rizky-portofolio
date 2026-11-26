"use client";

import { useEffect, useState } from "react";
import Art from "./Art";
import type { Project } from "@/lib/data";

/**
 * Cover of a project card / modal.
 * - one `image`            -> a normal image
 * - `images` (2 or more)   -> the covers fade into each other every few seconds (stops with reduced motion)
 * - nothing                -> the generated Art placeholder
 */
export default function CoverImage({ p, lazy = true }: { p: Project; lazy?: boolean }) {
  const imgs = p.images && p.images.length > 1 ? p.images : null;
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!imgs) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % imgs.length), 4000);
    return () => window.clearInterval(t);
  }, [imgs]);

  if (!imgs) {
    // eslint-disable-next-line @next/next/no-img-element
    return p.image ? <img src={p.image} alt={p.title} loading={lazy ? "lazy" : undefined} /> : <Art kind={p.art} />;
  }

  return (
    <div className="cover-stack">
      {imgs.map((src, k) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={k === 0 ? p.title : ""}
          aria-hidden={k === 0 ? undefined : true}
          className={k === i ? "on" : undefined}
          loading={lazy ? "lazy" : undefined}
          decoding="async"
          draggable={false}
        />
      ))}
    </div>
  );
}
