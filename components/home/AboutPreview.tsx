import { about, site } from "@/lib/data";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";
import Magnetic from "@/components/ui/Magnetic";
import SectionHead from "@/components/pages/SectionHead";
import BadgeSection from "@/components/pages/BadgeSection";
import TransitionLink from "@/components/layout/TransitionLink";

/** Home summary of the About page, kept short: portrait, one intro paragraph and four quick facts. The rest lives on /about. */
const QUICK = ["Age", "Year", "Focus", "Status"];

export default function AboutPreview() {
  return (
    <section className="sec hp-about">
      <div className="wrap">
        <SectionHead index="02" title="About" sub="A little about me" href="/about" cta="Full story" />

        <div className="about-grid">
          <Reveal variant="scale">
            <BadgeSection />
          </Reveal>
          <div>
            <Reveal>
              <p className="lead">{about.paragraphs[0]}</p>
            </Reveal>
            <Reveal delay={160}>
              <dl className="facts">
                {about.facts.filter((f) => QUICK.includes(f.k)).map((f) => (
                  <div key={f.k}>
                    <dt>{f.k}</dt>
                    <dd>{f.v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
            <Reveal delay={220}>
              <div className="btn-row">
                <Magnetic>
                  <TransitionLink className="btn btn-solid" href="/about" data-cursor="Go">
                    More about me <Icon name="arrow-right" size={18} />
                  </TransitionLink>
                </Magnetic>
                {site.cv && (
                  <Magnetic>
                    <a className="btn" href={site.cv} data-cursor="CV">
                      <Icon name="download" size={18} /> Download CV
                    </a>
                  </Magnetic>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
