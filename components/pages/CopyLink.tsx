"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

export default function CopyLink() {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setOk(true);
      setTimeout(() => setOk(false), 1800);
    } catch {}
  };
  return (
    <button className="btn" onClick={copy} aria-live="polite">
      <Icon name={ok ? "check" : "link"} size={18} /> {ok ? "Link copied" : "Copy link"}
    </button>
  );
}
