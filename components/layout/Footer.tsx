import { nav, primaryContact, site, socials } from "@/lib/data";
import Icon from "@/components/ui/Icon";
import Magnetic from "@/components/ui/Magnetic";
import Reveal from "@/components/ui/Reveal";
import SplitText from "@/components/ui/SplitText";
import Clock from "@/components/ui/Clock";
import AsciiName from "@/components/ui/AsciiName";
import TransitionLink from "./TransitionLink";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="cta">
          <Reveal>
            <p className="eyebrow">
              <span className="status-dot" /> {site.status}
            </p>
          </Reveal>
          <h2 className="cta-title">
            <SplitText text="Let's build something" mode="words" as="span" />
            <br />
            <SplitText text="cool together." mode="words" as="span" delay={140} />
          </h2>
          <Reveal delay={150}>
            <div className="cta-row">
              <Magnetic>
                <TransitionLink href="/contact" className="btn btn-solid btn-lg" data-cursor="Go">
                  Get in touch <Icon name="arrow-up-right" size={18} />
                </TransitionLink>
              </Magnetic>
              <a className="cta-mail" href={primaryContact.href} {...(primaryContact.external ? { target: "_blank", rel: "noreferrer" } : {})}>
                {primaryContact.label}
              </a>
            </div>
          </Reveal>
        </div>

        <div className="foot-grid">
          <div>
            <p className="foot-cap">Pages</p>
            <ul>
              <li>
                <TransitionLink href="/">Home</TransitionLink>
              </li>
              {nav.map((n) => (
                <li key={n.href}>
                  <TransitionLink href={n.href}>{n.label}</TransitionLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="foot-cap">Social</p>
            <ul>
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer" className="foot-social">
                    <Icon name={s.icon} size={16} /> {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="foot-cap">Contact</p>
            <ul>
              {site.email && (
                <li>
                  <a href={`mailto:${site.email}`} className="foot-social">
                    <Icon name="mail" size={16} /> {site.email}
                  </a>
                </li>
              )}
              <li className="foot-social">
                <Icon name="map-pin" size={16} /> {site.location}
              </li>
              <li className="foot-social">
                <Icon name="clock" size={16} /> <Clock />
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="foot-ascii">
        <AsciiName text={site.name.split(" ")[0].toUpperCase()} />
      </div>

      <div className="wrap foot-bottom">
        <span>
          &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
        </span>
        <span>Designed and built with care in {site.location.split(",")[0]}.</span>
      </div>
    </footer>
  );
}
