import { skills } from "@/lib/data";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";
import SkillIcon from "@/components/ui/SkillIcon";
import SectionHead from "@/components/pages/SectionHead";
import "@/app/skills/skills.css";

/** Only these three stack groups are shown on the Home page. The Skills page still lists every group. */
const HOME_GROUPS = ["Frontend", "Backend and Database", "Games and Hardware"];

/** Home summary of the Skills page: three stack groups with their top logos. */
export default function SkillsPreview() {
  const groups = HOME_GROUPS.map((name) => skills.find((g) => g.group === name)).filter((g): g is (typeof skills)[number] => !!g);
  return (
    <section className="sec hp-skills">
      <div className="wrap">
        <SectionHead index="05" title="Skills" sub="My main stack" href="/skills" cta="All skills" />

        <ul className="cards3">
          {groups.map((g, i) => (
            <Reveal as="li" key={g.group} delay={i * 70}>
              <div className="sk-card spot">
                <span className="vcard-ic">
                  <Icon name={g.icon} size={24} />
                </span>
                <h3>{g.group}</h3>
                <ul className="sk-icons">
                  {g.items.slice(0, 4).map((s) => (
                    <li key={s.name} title={s.name}>
                      <span className="sk-ic">
                        <SkillIcon skill={s} />
                      </span>
                      <span className="sk-name">{s.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}