import type { Metadata } from "next";
import PageHero from "@/components/pages/PageHero";
import ProjectsExplorer from "@/components/pages/ProjectsExplorer";
import ProjectsStats from "@/components/pages/ProjectsStats";
import "./projects.css";

export const metadata: Metadata = { title: "Projects", description: "Selected case studies and experiments." };

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        index="02" bg="projects"
        title="Projects"
        lead="A selection of websites, apps and experiments. Search, filter or tap any card to see the full details."
      />
      <ProjectsStats />
      <section className="sec-sm pj-main">
        <ProjectsExplorer />
      </section>
    </>
  );
}
