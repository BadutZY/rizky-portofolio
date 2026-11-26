import type { Entry } from "@/lib/data";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";

/** "Grade 10: Pascal..." becomes a label and a text. Points without a short label before the colon keep the whole text. */
const parse = (p: string) => {
  const i = p.indexOf(":");
  return i > 0 && i <= 14 ? { k: p.slice(0, i), v: p.slice(i + 1).trim() } : { k: "", v: p };
};

/**
 * Education as a stepper: a line fills from step to step while the dots light up in turn (CSS, started by Reveal),
 * hovering one step dims the others, and the last step of an ongoing course is marked as the current one.
 */
export default function EducationShowcase({ items }: { items: Entry[] }) {
  return (
    <div className="edu-list">
      {items.map((e) => {
        const steps = (e.points ?? []).map(parse);
        const ongoing = /present/i.test(e.period);
        return (
          <Reveal key={e.title + e.period}>
            <article className="edu spot">
              <header className="edu-head">
                <div>
                  <p className="tl2-period">{e.period}</p>
                  <h3 className="edu-title">{e.title}</h3>
                  <p className="tl2-org">
                    {e.org}
                    {e.place ? <span> / {e.place}</span> : null}
                  </p>
                </div>
                <span className="edu-badge">
                  <Icon name="graduation" size={16} /> {ongoing ? "In progress" : "Completed"}
                </span>
              </header>
              <p className="tl2-desc">{e.desc}</p>

              {steps.length > 0 && (
                <ol className="edu-steps" style={{ "--n": steps.length } as React.CSSProperties}>
                  {steps.map((s, i) => {
                    const current = ongoing && i === steps.length - 1;
                    return (
                      <li key={s.k + s.v} className={current ? "now" : undefined} style={{ "--i": i } as React.CSSProperties}>
                        <span className="edu-dot" aria-hidden />
                        <div className="edu-step">
                          <span className="edu-k">
                            {s.k || `Step ${i + 1}`}
                            {current && <em>Now</em>}
                          </span>
                          <p className="edu-v">{s.v}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}
