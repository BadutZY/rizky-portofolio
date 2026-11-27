import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { skillsGraph, pageMeta } from "@/lib/seo";
import { learning, skills, tools } from "@/lib/data";
import PageHero from "@/components/pages/PageHero";
import SectionHead from "@/components/pages/SectionHead";
import ToolsGrid from "@/components/pages/ToolsGrid";
import SkillsOrbit from "@/components/pages/SkillsOrbit";
import SkillsExplorer from "@/components/pages/SkillsExplorer";
import Counter from "@/components/ui/Counter";
import Reveal from "@/components/ui/Reveal";
import Marquee from "@/components/ui/Marquee";
import ContributionGraph from "@/components/pages/ContributionGraph";
import { getContributions } from "@/lib/github";
import "./skills.css";

// the page is rebuilt at most once an hour, which also refreshes the GitHub contribution data
export const revalidate = 3600;

export const metadata: Metadata = pageMeta("skills");

export default async function SkillsPage() {
  const gh = await getContributions();
  const all = skills.flatMap((g) => g.items.map((i) => i.name));
  const unique = new Set(all).size;
  const stats = [
    { n: unique, l: "Technologies" },
    { n: skills.length, l: "Categories" },
    { n: tools.length, l: "Daily tools" },
  ];

  return (
    <>
      <JsonLd data={skillsGraph()} />
      <PageHero index="04" bg="skills" title="Skills" lead="The languages, frameworks and tools I've used across my projects, plus what I'm focused on lately." />

      <section className="band band-top">
        <Marquee items={all} outline size="xl" duration={55} />
        <div className="band-rows">
          <Marquee items={all} direction={-1} size="md" duration={48} />
        </div>
      </section>

      <section className="sec">
        <div className="wrap sk-intro">
          <div className="sk-intro-txt">
            <SectionHead index="01" title="Overview" sub="Everything I build with" />
            <Reveal delay={120}>
              <p className="lead-mut sk-intro-p">
                A quick look at the technologies I reach for most. Move your mouse over the orbit to explore it, then dive into the full stack below.
              </p>
            </Reveal>
            <ul className="sk-stats">
              {stats.map((s, i) => (
                <Reveal as="li" key={s.l} delay={200 + i * 110}>
                  <b className="sk-stat-n">
                    <Counter value={s.n} suffix="+" />
                  </b>
                  <span className="sk-stat-l">{s.l}</span>
                </Reveal>
              ))}
            </ul>
          </div>
          <Reveal variant="scale" delay={150}>
            <SkillsOrbit groups={skills} total={unique} />
          </Reveal>
        </div>
      </section>

      <section className="sec sk-sec-tight">
        <div className="wrap">
          <SectionHead index="02" title="Stack" sub="Core technologies" />
          <SkillsExplorer groups={skills} />

          <div className="sk-workspace">
            <SectionHead index="03" title="Tools" sub="My workspace" />
            <ToolsGrid />
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <SectionHead index="04" title="GitHub" sub="My contribution activity" />
          <Reveal>
            <ContributionGraph data={gh} />
          </Reveal>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <SectionHead index="05" title="Recent focus" sub="What I'm working on lately" />
          <Reveal>
            <ul className="tags tags-lg sk-focus">
              {learning.map((l, i) => (
                <li key={l} style={{ "--i": i } as React.CSSProperties} data-cursor-snap>
                  {l}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </>
  );
}