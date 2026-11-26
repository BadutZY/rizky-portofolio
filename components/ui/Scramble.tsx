"use client";

import { useRef } from "react";
import { scrambleTo } from "@/lib/scramble";

export default function Scramble({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const cancel = useRef<() => void>(() => {});

  const run = () => {
    if (!ref.current) return;
    cancel.current();
    cancel.current = scrambleTo(ref.current, text, 450);
  };

  return (
    <span ref={ref} className={className} onMouseEnter={run} onFocus={run} key={text}>
      {text}
    </span>
  );
}
