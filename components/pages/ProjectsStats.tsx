import { projects } from "@/lib/data";
import Counter from "@/components/ui/Counter";
import Marquee from "@/components/ui/Marquee";
import Reveal from "@/components/ui/Reveal";

/** Numbers that count up when scrolled into view, plus a slow ticker of every technology used across the projects. */
export default function ProjectsStats() {
  const stack = Array.from(new Set(projects.flatMap((p) => p.stack)));
  const kinds = new Set(projects.map((p) => p.kind)).size;
  const live = projects.filter((p) => p.link || (p.links && p.links.length)).length;
  const stats = [
    { value: projects.length, label: "Projects built" },
    { value: kinds, label: "Kinds of work" },
    { value: stack.length, label: "Technologies used" },
    { value: live, label: "Live on the web" },
  ];

  return (
    <section className="pj-stats-sec" aria-label="Project statistics">
      <div className="wrap">
        <ul className="pj-stats">
          {stats.map((s, i) => (
            <li key={s.label}>
              <Reveal delay={i * 90} variant="up" className="pj-stat-rv">
                <div className="pj-stat">
                  <Counter value={s.value} className="pj-stat-n" />
                  <span className="pj-stat-l">{s.label}</span>
                  <i className="pj-stat-bar" aria-hidden />
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
      <div className="pj-ticker" aria-hidden>
        <Marquee items={stack} duration={50} />
      </div>
    </section>
  );
}
