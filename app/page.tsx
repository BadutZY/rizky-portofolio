import Hero from "@/components/home/Hero";
import Statement from "@/components/home/Statement";
import Stats from "@/components/home/Stats";
import AboutPreview from "@/components/home/AboutPreview";
import Featured from "@/components/home/Featured";
import ExperiencePreview from "@/components/home/ExperiencePreview";
import SkillsPreview from "@/components/home/SkillsPreview";
import SkillsBand from "@/components/home/SkillsBand";
import ContactCta from "@/components/home/ContactCta";

export default function Home() {
  return (
    <>
      <Hero />
      <Statement />
      <Stats />
      <AboutPreview />
      <Featured />
      <ExperiencePreview />
      <SkillsPreview />
      <SkillsBand />
      <ContactCta />
    </>
  );
}
