import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { contactGraph, pageMeta } from "@/lib/seo";
import { site, socials } from "@/lib/data";
import PageHero from "@/components/pages/PageHero";
import ContactForm from "@/components/pages/ContactForm";
import CopyEmail from "@/components/pages/CopyEmail";
import Faq from "@/components/pages/Faq";
import SectionHead from "@/components/pages/SectionHead";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import Magnetic from "@/components/ui/Magnetic";
import Marquee from "@/components/ui/Marquee";
import Clock from "@/components/ui/Clock";
import Tilt from "@/components/about/Tilt";
import HeroExtras from "@/components/contact/HeroExtras";
import SocialCards from "@/components/contact/SocialCards";
import AnalogClock from "@/components/contact/AnalogClock";
import "./contact.css";

export const metadata: Metadata = pageMeta("contact");

const BAND = ["Say hello", "Let's collaborate", "Websites", "Games", "Minecraft mods", "New ideas"];

export default function ContactPage() {
  // The form and the email card only appear once site.email is filled in (lib/data.ts).
  const hasEmail = site.email.trim().length > 0;

  return (
    <div className="ct-page">
      <JsonLd data={contactGraph()} />
      <PageHero index="05" bg="contact" title="Contact" lead="Want to collaborate, have an idea or need a website? Say hello, I'd love to hear from you." />
      <HeroExtras timezone={site.timezone} targetId="ct-start" />

      <section className="sec-sm">
        <div className="wrap contact-grid">
          <Reveal>
            {hasEmail ? (
              <div className="form-card ct-card" id="ct-start">
                <p className="ct-kicker">
                  <i /> Send a message
                </p>
                <ContactForm />
              </div>
            ) : (
              <SocialCards />
            )}
          </Reveal>

          <aside className="cinfo">
            {hasEmail && (
              <Reveal delay={80}>
                <Tilt max={5} scale={1.02}>
                  <div className="cinfo-card spot ct-info">
                    <span className="cinfo-ic ct-wig"><Icon name="mail" size={20} /></span>
                    <div>
                      <p>Email</p>
                      <a href={`mailto:${site.email}`}>{site.email}</a>
                    </div>
                    <CopyEmail />
                  </div>
                </Tilt>
              </Reveal>
            )}
            <Reveal delay={140}>
              <Tilt max={5} scale={1.02}>
                <div className="cinfo-card spot ct-info">
                  <span className="cinfo-ic ct-pin"><Icon name="map-pin" size={20} /></span>
                  <div>
                    <p>Location</p>
                    <span>{site.location}</span>
                  </div>
                </div>
              </Tilt>
            </Reveal>
            <Reveal delay={200}>
              <Tilt max={5} scale={1.02}>
                <div className="cinfo-card spot ct-info">
                  <span className="cinfo-ic ct-wig"><Icon name="clock" size={20} /></span>
                  <div>
                    <p>Local time</p>
                    <span><Clock /></span>
                  </div>
                  <AnalogClock />
                </div>
              </Tilt>
            </Reveal>
            <Reveal delay={260}>
              <Tilt max={5} scale={1.02}>
                <div className="cinfo-card spot ct-info">
                  <span className="cinfo-ic ct-wig"><Icon name="zap" size={20} /></span>
                  <div>
                    <p>Reply time</p>
                    <span>Usually within a day</span>
                    <i className="ct-meter" aria-hidden><b /></i>
                  </div>
                </div>
              </Tilt>
            </Reveal>
            {hasEmail && (
              <Reveal delay={320}>
                <ul className="csocial ct-soc">
                  {socials.map((s) => (
                    <li key={s.label}>
                      <Magnetic strength={0.3}>
                        <a href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} data-cursor={s.label}>
                          <Icon name={s.icon} size={22} />
                        </a>
                      </Magnetic>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
          </aside>
        </div>
      </section>

      <section className="ct-band" aria-hidden>
        <Marquee items={BAND} outline size="xl" duration={55} direction={-1} />
      </section>

      <section className="sec">
        <div className="wrap faq-wrap">
          <SectionHead index="01" title="FAQ" sub="Before you write" />
          <Faq />
        </div>
      </section>

    </div>
  );
}