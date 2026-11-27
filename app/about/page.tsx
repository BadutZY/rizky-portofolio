import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { aboutGraph, pageMeta } from "@/lib/seo";
import { about, site } from "@/lib/data";
import PageHero from "@/components/pages/PageHero";
import SectionHead from "@/components/pages/SectionHead";
import BadgeSection from "@/components/pages/BadgeSection";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";
import Magnetic from "@/components/ui/Magnetic";
import Marquee from "@/components/ui/Marquee";
import TransitionLink from "@/components/layout/TransitionLink";
import LocationMap from "@/components/pages/LocationMap";
import Stats from "@/components/home/Stats";
import ScrollWords from "@/components/about/ScrollWords";
import FactGrid from "@/components/about/FactGrid";
import QuoteBlock from "@/components/about/QuoteBlock";
import JourneyTimeline from "@/components/about/JourneyTimeline";
import BeyondCode from "@/components/about/BeyondCode";
import AboutRail from "@/components/about/AboutRail";
import MusicSection from "@/components/about/MusicSection";
import "./geo.css";
import "./about.css";
import "./music.css";

export const metadata: Metadata = pageMeta("about");

const sections = [
  { id: "about-intro", label: "Intro" },
  { id: "about-quote", label: "Quote" },
  { id: "about-journey", label: "Journey" },
  { id: "about-location", label: "Location" },
  { id: "about-beyond", label: "Beyond code" },
  { id: "about-music", label: "Music" },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd data={aboutGraph()} />
      <AboutRail sections={sections} />

      <PageHero
        index="01" bg="about"
        title="About me"
        lead={about.statement}
        meta={about.heroMeta}
      />

      <section className="band about-roles" aria-hidden>
        <Marquee items={site.roles} outline size="xl" duration={50} direction={-1} />
      </section>

      <section id="about-intro" className="sec-sm">
        <div className="wrap about-grid">
          <Reveal variant="scale">
            <BadgeSection />
          </Reveal>
          <div>
            <div className="about-copy">
              {about.paragraphs.map((t) => (
                <ScrollWords key={t} text={t} />
              ))}
            </div>
            <FactGrid facts={about.facts} />
            <Reveal delay={260}>
              <div className="btn-row">
                <Magnetic>
                  <TransitionLink className="btn btn-solid" href="/contact" data-cursor="Go">
                    Say hello
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
      </section>

      <Stats />

      <section id="about-quote" className="sec">
        <div className="wrap">
          <SectionHead index="01" title="Quote" sub={about.quote.label} />
          <QuoteBlock text={about.quote.text} />
        </div>
      </section>

      <section id="about-journey" className="sec">
        <div className="wrap">
          <SectionHead index="02" title="Journey" sub="How I got here" />
          <JourneyTimeline items={about.journey} />
        </div>
      </section>

      <section id="about-location" className="sec">
        <div className="wrap">
          <SectionHead index="03" title="Location" sub="Where I'm based" />
          <Reveal>
            <LocationMap />
          </Reveal>
        </div>
      </section>

      <section id="about-beyond" className="sec">
        <div className="wrap">
          <SectionHead index="04" title="Beyond code" sub="Interests and small facts" />
          <BeyondCode interests={about.interests} funFacts={about.funFacts} />
        </div>
      </section>

      <section id="about-music" className="sec">
        <div className="wrap">
          <SectionHead index="05" title="Music" sub="Songs I keep on repeat" />
          <MusicSection />
        </div>
      </section>

      <section className="band">
        <Marquee items={about.interests} outline size="xl" duration={55} />
      </section>
    </>
  );
}