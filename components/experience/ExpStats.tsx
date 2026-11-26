import { competitions, experience, projects, published } from "@/lib/data";
import Counter from "@/components/ui/Counter";
import Reveal from "@/components/ui/Reveal";

/** Count-up numbers taken straight from the data on this site, so they can never go out of date. */
export default function ExpStats() {
  const stats = [
    { value: experience.length, label: "Chapters so far" },
    { value: projects.length, label: "Projects built" },
    { value: competitions.length, label: "Challenges taken" },
    { value: published.length, label: "Mods published" },
  ];
  return (
    <section className="sec-sm">
      <div className="wrap">
        <ul className="xs">
          {stats.map((s, i) => (
            <Reveal as="li" key={s.label} delay={i * 90} variant="scale">
              <div className="xs-card spot">
                <span className="xs-n">{String(i + 1).padStart(2, "0")}</span>
                <Counter value={s.value} className="stat-n" />
                <span className="stat-l">{s.label}</span>
                <i className="xs-bar" aria-hidden />
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
