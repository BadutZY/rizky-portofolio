import { site, socials } from "@/lib/data";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";
import Magnetic from "@/components/ui/Magnetic";
import TransitionLink from "@/components/layout/TransitionLink";

/** Closing call to action with the socials. The FAQ now lives only on the Contact page. */
export default function ContactCta() {
  return (
    <>
      <section className="sec-sm hp-cta">
        <div className="wrap cv">
          <Reveal>
            <h2 className="cv-t">Let&apos;s build something together.</h2>
            <p className="lead lead-mut">
              I&apos;m open to collaborating and happy to build a website for you. Send me a message and tell me about your idea.
            </p>
            <div className="btn-row">
              <Magnetic>
                <TransitionLink className="btn btn-solid btn-lg" href="/contact" data-cursor="Go">
                  Get in touch <Icon name="arrow-up-right" size={18} />
                </TransitionLink>
              </Magnetic>
              {site.cv && (
                <Magnetic>
                  <a className="btn btn-lg" href={site.cv} data-cursor="CV">
                    <Icon name="download" size={18} /> Download CV
                  </a>
                </Magnetic>
              )}
            </div>
            <ul className="csocial hp-social">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} data-cursor={s.label}>
                    <Icon name={s.icon} size={22} />
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </>
  );
}
