import type { MetadataRoute } from "next";
import { abs, pages, type PageKey } from "@/lib/seo";

// Update this date whenever the content of the website changes in a meaningful way.
const LAST_UPDATED = new Date("2026-11-27");

const priority: Record<PageKey, number> = {
  home: 1,
  projects: 0.9,
  about: 0.8,
  skills: 0.7,
  experience: 0.7,
  contact: 0.6,
};

export default function sitemap(): MetadataRoute.Sitemap {
  return (Object.keys(pages) as PageKey[]).map((key) => ({
    url: abs(pages[key].path),
    lastModified: LAST_UPDATED,
    changeFrequency: key === "home" || key === "projects" ? "weekly" : "monthly",
    priority: priority[key],
  }));
}