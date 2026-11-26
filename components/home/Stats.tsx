import { about, projects, published, skillNames } from "@/lib/data";
import Counter from "@/components/ui/Counter";
import Reveal from "@/components/ui/Reveal";

const CODING_SINCE = 2023;

export default function Stats() {
  // Numbers set by hand in about.stats win; otherwise they are counted from the real data on the site.
  const stats =
    about.stats.length > 0
      ? about.stats
      : [
          { value: projects.length, suffix: "", label: "Projects built" },
          { value: published.length, suffix: "", label: "Minecraft mods published" },
          { value: skillNames.length, suffix: "", label: "Technologies used" },
          { value: new Date().getFullYear() - CODING_SINCE, suffix: "+", label: "Years of coding" },
        ];
  return (
    <section className="sec-sm">
      <div className="wrap">
        <ul className="stats">
          {stats.map((s, i) => (
            <Reveal as="li" key={s.label} delay={i * 90}>
              <Counter value={s.value} suffix={s.suffix} className="stat-n" />
              <span className="stat-l">{s.label}</span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
