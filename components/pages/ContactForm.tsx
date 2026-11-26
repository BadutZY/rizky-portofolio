"use client";

import { useEffect, useRef, useState } from "react";
import { animate, createDrawable } from "animejs";
import { site } from "@/lib/data";
import Icon from "@/components/ui/Icon";
import Magnetic from "@/components/ui/Magnetic";
import { burst, prefersReduced, ripple } from "@/components/contact/fx";

const TOPICS = ["Collaboration", "Website", "Web app", "Game", "Minecraft mod", "Just saying hi"];
const MIN = 10;
const MAX = 600;
const RING = 2 * Math.PI * 15;

/**
 * Contact form. On submit it opens the visitor's email app with a prefilled message,
 * so it works without a backend. Swap the handler for your own API route if you prefer.
 * Extras: live validation marks, a message counter ring, error shake, a paper plane that flies off on send
 * and a particle burst plus self-drawing check on success.
 */
export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(0);
  const [touched, setTouched] = useState({ name: false, email: false, msg: false });

  const check = useRef<SVGSVGElement>(null);
  const mark = useRef<HTMLSpanElement>(null);

  const okName = name.trim().length > 0;
  const okEmail = /^\S+@\S+\.\S+$/.test(email);
  const okMsg = msg.trim().length >= MIN;
  const progress = Math.min(1, msg.length / MAX);
  const touch = (k: keyof typeof touched) => () => setTouched((t) => ({ ...t, [k]: true }));

  // the success mark draws itself (Anime.js line drawing) and a burst of particles leaves it
  useEffect(() => {
    if (state !== "done" || !check.current || prefersReduced()) return;
    const a = animate(createDrawable(check.current.querySelectorAll("path")), { draw: ["0 0", "0 1"], duration: 700, delay: 250, ease: "outExpo" });
    const t = window.setTimeout(() => mark.current && burst(mark.current), 280);
    return () => {
      a.cancel();
      clearTimeout(t);
    };
  }, [state]);

  // the error message goes away on its own as soon as everything is valid
  useEffect(() => {
    if (err && okName && okEmail && okMsg) setErr("");
  }, [err, okName, okEmail, okMsg]);

  const toggle = (t: string) => setTopics((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, msg: true });
    if (!okName || !okEmail || !okMsg) {
      setErr("Please add your name, a valid email and a message of at least 10 characters.");
      setShake((n) => n + 1);
      return;
    }
    setErr("");
    setState("sending");
    const body = `Name: ${name}\nEmail: ${email}\nAbout: ${topics.join(", ") || "-"}\n\n${msg}`;
    setTimeout(() => {
      window.location.href = `mailto:${site.email}?subject=${encodeURIComponent("Hello from " + name)}&body=${encodeURIComponent(body)}`;
      setState("done");
    }, 1100);
  };

  if (state === "done")
    return (
      <div className="form-done ct-done">
        <span ref={mark} className="form-check ct-check">
          <svg ref={check} width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>
        </span>
        <h3>Thank you, {name.trim().split(" ")[0]}.</h3>
        <p>Your email app should have opened with a ready message. If it did not, write to {site.email} directly.</p>
        <button className="btn ct-rip" onPointerDown={ripple} onClick={() => setState("idle")}>
          Send another message
        </button>
      </div>
    );

  return (
    <form className={`form ct-form${state === "sending" ? " is-sending" : ""}`} onSubmit={submit} noValidate>
      <div className="f-row">
        <label className={`f${touched.name ? (okName ? " ok" : " bad") : ""}`}>
          <input value={name} onChange={(e) => setName(e.target.value)} onBlur={touch("name")} placeholder=" " autoComplete="name" required />
          <span>Your name</span>
          <i className="f-bar" />
          <i className="f-mark"><Icon name="check" size={16} /></i>
        </label>
        <label className={`f${touched.email ? (okEmail ? " ok" : " bad") : ""}`}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} onBlur={touch("email")} placeholder=" " type="email" autoComplete="email" required />
          <span>Email address</span>
          <i className="f-bar" />
          <i className="f-mark"><Icon name="check" size={16} /></i>
        </label>
      </div>

      <fieldset className="f-set">
        <legend>What is it about?</legend>
        <ul className="chips">
          {TOPICS.map((t) => {
            const on = topics.includes(t);
            return (
              <li key={t}>
                <button type="button" className={`chip ct-rip${on ? " on" : ""}`} onPointerDown={ripple} onClick={() => toggle(t)} aria-pressed={on}>
                  <span className="chip-tick" aria-hidden><Icon name="check" size={14} /></span>
                  {t}
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <label className={`f f-area${touched.msg ? (okMsg ? " ok" : " bad") : ""}`}>
        <textarea value={msg} maxLength={MAX} onChange={(e) => setMsg(e.target.value)} onBlur={touch("msg")} placeholder=" " rows={5} required />
        <span>Tell me about your idea</span>
        <i className="f-bar" />
        <span className="f-count" aria-hidden>
          <svg viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" className="f-count-bg" />
            <circle cx="18" cy="18" r="15" className="f-count-fg" strokeDasharray={RING} strokeDashoffset={RING * (1 - progress)} />
          </svg>
          <b>{msg.length}</b>
        </span>
      </label>

      {err && (
        <p key={shake} className="f-err ct-shake" role="alert">
          {err}
        </p>
      )}

      <Magnetic>
        <button className="btn btn-solid btn-lg ct-send ct-rip" type="submit" disabled={state === "sending"} onPointerDown={ripple} data-cursor="Send">
          <span className="ct-send-t">{state === "sending" ? "Sending..." : "Send message"}</span>
          <span className="ct-plane">
            <Icon name="send" size={18} />
          </span>
        </button>
      </Magnetic>
    </form>
  );
}
