import type { Metadata } from "next";
import { competitions, education, experience, projects, published } from "@/lib/data";
import PageHero from "@/components/pages/PageHero";
import SectionHead from "@/components/pages/SectionHead";
import Marquee from "@/components/ui/Marquee";
import AboutRail from "@/components/about/AboutRail";
import YearStrip from "@/components/experience/YearStrip";
import ExpStats from "@/components/experience/ExpStats";
import ExperienceTimeline from "@/components/experience/ExperienceTimeline";
import EducationShowcase from "@/components/experience/EducationShowcase";
import HoverList from "@/components/experience/HoverList";
import ExpCta from "@/components/experience/ExpCta";
import "../about/about.css"; // side rail and shared band spacing
import "./experience.css";

export const metadata: Metadata = { title: "Experience", description: "What I've learned, built and published so far." };

const sections = [
  { id: "exp-hands", label: "Hands-on" },
  { id: "exp-edu", label: "Education" },
  { id: "exp-more", label: "Challenges and mods" },
  { id: "exp-cta", label: "Contact" },
];

// everything the page talks about, taken from the data so the bands never need editing by hand
const topBand = [...experience, ...education].map((e) => e.title).concat(competitions.map((c) => c.title), published.map((p) => p.title));
const bottomBand = projects.map((p) => p.title);

export default function ExperiencePage() {
  return (
    <>
      <AboutRail sections={sections} />

      <PageHero index="03" bg="experience" title="Experience" lead="A timeline of what I've learned, built and published so far, from my first website to my final year of vocational school." />

      <section className="sec-sm">
        <div className="wrap">
          <YearStrip items={experience} targetPrefix="exp-ch" />
        </div>
      </section>

      <section className="band about-roles" aria-hidden>
        <Marquee items={topBand} outline size="xl" duration={60} direction={-1} />
      </section>

      <ExpStats />

      <section id="exp-hands" className="sec-sm">
        <div className="wrap">
          <SectionHead index="01" title="Hands-on" sub="Learning by building" />
          <ExperienceTimeline items={experience} icon="briefcase" idPrefix="exp-ch" />
        </div>
      </section>

      <section id="exp-edu" className="sec">
        <div className="wrap">
          <SectionHead index="02" title="Education" sub="Where I study" />
          <EducationShowcase items={education} />
        </div>
      </section>

      <section id="exp-more" className="sec">
        <div className="wrap two">
          <div>
            <SectionHead index="03" title="Challenges" sub="Competitions and exams" />
            <HoverList rows={competitions} icon="zap" />
          </div>
          <div>
            <SectionHead index="04" title="Published" sub="Mods I released" />
            <HoverList rows={published} icon="rocket" />
          </div>
        </div>
      </section>

      <section id="exp-cta" className="sec-sm">
        <ExpCta />
      </section>

      <section className="band">
        <Marquee items={bottomBand} outline size="xl" duration={70} />
      </section>
    </>
  );
}
