"use client";

import { useState } from "react";
import { site } from "@/lib/data";
import Icon from "@/components/ui/Icon";
import { ripple } from "@/components/contact/fx";

export default function CopyEmail() {
  const [ok, setOk] = useState(false);
  const copy = async (e: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
    ripple(e);
    try {
      await navigator.clipboard.writeText(site.email);
      setOk(true);
      setTimeout(() => setOk(false), 1800);
    } catch {
      window.location.href = `mailto:${site.email}`;
    }
  };
  return (
    <button className={`icon-btn ring ct-rip ct-copy${ok ? " ok" : ""}`} onClick={copy} aria-label="Copy email" aria-live="polite" data-cursor={ok ? "Copied" : "Copy"}>
      <span className="ct-copy-i ct-copy-a"><Icon name="copy" size={18} /></span>
      <span className="ct-copy-i ct-copy-b"><Icon name="check" size={18} /></span>
      <span className="ct-copy-tip" aria-hidden>Copied!</span>
    </button>
  );
}
