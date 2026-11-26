"use client";

import { useRef, useState } from "react";
import { faqs } from "@/lib/data";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { scrambleTo } from "@/lib/scramble";

/**
 * Accordion with keyboard support (arrow keys, Home, End), a line that draws under the open question,
 * a number that decodes on hover and an answer that fades in line by line.
 */
export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);

  const key = (e: React.KeyboardEvent, i: number) => {
    const last = faqs.length - 1;
    const to = e.key === "ArrowDown" ? (i === last ? 0 : i + 1) : e.key === "ArrowUp" ? (i === 0 ? last : i - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (to < 0) return;
    e.preventDefault();
    btns.current[to]?.focus();
  };
  const decode = (e: React.PointerEvent<HTMLButtonElement>, i: number) => {
    const n = e.currentTarget.querySelector<HTMLElement>(".faq-n");
    if (n) scrambleTo(n, String(i + 1).padStart(2, "0"), 380);
  };

  return (
    <ul className="faq ct-faq">
      {faqs.map((f, i) => (
        <Reveal as="li" key={f.q} delay={i * 70}>
          <div className={`faq-item${open === i ? " open" : ""}`}>
            <button
              ref={(el) => void (btns.current[i] = el)}
              className="faq-q"
              onClick={() => setOpen(open === i ? null : i)}
              onKeyDown={(e) => key(e, i)}
              onPointerEnter={(e) => decode(e, i)}
              aria-expanded={open === i}
            >
              <span className="faq-n">{String(i + 1).padStart(2, "0")}</span>
              <span className="ct-faq-q">{f.q}</span>
              <span className="faq-ic">
                <Icon name="plus" size={20} />
              </span>
            </button>
            <div className="faq-a">
              <div>
                <p>{f.a}</p>
              </div>
            </div>
          </div>
        </Reveal>
      ))}
    </ul>
  );
}
