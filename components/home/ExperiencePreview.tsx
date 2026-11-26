import { education, experience } from "@/lib/data";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";
import SectionHead from "@/components/pages/SectionHead";

/** Home summary of the Experience page: latest hands-on work and education, kept short. */
export default function ExperiencePreview() {
  const latest = experience[0];
  const school = education[0];
  const cards = [
    { e: latest, icon: "briefcase", label: "Hands-on", limit: 2 },
    { e: school, icon: "graduation", label: "Education", limit: 2 },
  ];

  return (
    <section className="sec hp-exp">
      <div className="wrap">
        <SectionHead index="04" title="Experience" sub="Learning, school and published work" href="/experience" cta="Full timeline" />

        <div className="hp-exp-cards">
          {cards.map(({ e, icon, label, limit }, i) => (
            <Reveal key={e.title} delay={i * 90}>
              <div className="tl2-card spot">
                <p className="hp-exp-label">
                  <Icon name={icon} size={16} /> {label}
                </p>
                <p className="tl2-period">{e.period}</p>
                <h3>{e.title}</h3>
                <p className="tl2-org">
                  {e.org}
                  {e.place ? <span> / {e.place}</span> : null}
                </p>
                <p className="tl2-desc">{e.desc}</p>
                {e.points && (
                  <ul className="tl2-points">
                    {e.points.slice(0, limit).map((p) => (
                      <li key={p}>
                        <Icon name="check" size={14} /> {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
