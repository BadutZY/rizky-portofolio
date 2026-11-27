import type { Metadata } from "next";
import {
  about,
  competitions,
  education,
  experience,
  faqs,
  learning,
  nav,
  projects,
  published,
  site,
  skills,
  socials,
  tools,
  type Project,
} from "./data";

/**
 * SEO, GEO and AIO in one place.
 * Everything here is built from lib/data.ts, so when you change your content (projects, skills, intro, FAQ ...)
 * the meta tags, structured data (JSON-LD), sitemap and llms.txt follow automatically.
 */

type Json = Record<string, unknown>;

/**
 * The public address of the website. It must be the same address Google indexes (Google currently shows the www version).
 * Override it with NEXT_PUBLIC_SITE_URL in Vercel (Settings > Environment Variables) if you ever change the main domain.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.rizkymp.my.id").replace(/\/+$/, "");

/** Absolute URL for a path on this site ("/" gives the home page). Full URLs are returned as they are. */
export const abs = (path = "/"): string => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path}`);

const unique = <T>(list: T[]): T[] => [...new Set(list)];
const strip = (handle: string) => handle.replace(/^@/, "");

/** Stable ids so every JSON-LD node can point at the same person and website. */
export const ID = {
  person: `${SITE_URL}/#person`,
  website: `${SITE_URL}/#website`,
};

/* ───────── Facts taken from the data ───────── */

const city = site.geo.city;
const country = site.geo.country;
const skillNames = unique(skills.flatMap((g) => g.items.map((i) => i.name)));
const toolNames = unique(tools.map((t) => t.name));
const xHandle = socials.find((s) => s.label === "X")?.handle;

export const OG_IMAGE = abs("/opengraph-image");
const OG_ALT = `${site.name}, ${site.roles[0]} from ${city}, ${country}`;
export const OG_IMAGES = [{ url: OG_IMAGE, width: 1200, height: 630, alt: OG_ALT }];

/** Search keywords. Google ignores them, but Bing, Yandex and many AI tools still read them. */
export const keywords: string[] = unique([
  site.name,
  `${site.name} ${city}`,
  site.github,
  strip(site.handle),
  "rizkymp",
  ...site.roles,
  ...site.roles.map((r) => `${r} ${city}`),
  `${site.roles[0]} ${country}`,
  `${site.roles[1]} ${country}`,
  "portfolio",
  ...["React", "Next.js", "Laravel", "TypeScript", "Supabase"].filter((n) => skillNames.includes(n)).map((n) => `${n} developer`),
  ...["Godot", "Unity"].filter((n) => toolNames.includes(n)).map((n) => `${n} game developer`),
  "Minecraft mod Fabric Forge NeoForge",
  "JKT48 fan website",
  "Software Engineering student Indonesia",
]);

/* ───────── Pages ───────── */

export type PageKey = "home" | "about" | "projects" | "skills" | "experience" | "contact";

type PageInfo = { path: string; name: string; title: string; description: string };

const label = (path: string, fallback: string) => nav.find((n) => n.href === path)?.label ?? fallback;

export const pages: Record<PageKey, PageInfo> = {
  home: {
    path: "/",
    name: "Home",
    title: `${site.name} | ${site.roles[0]} & ${site.roles[1]}, ${city}`,
    description: `${site.intro} ${site.status}.`,
  },
  about: {
    path: "/about",
    name: label("/about", "About"),
    title: `About Me, ${site.roles[0]} from ${city}, ${country}`,
    description: `About ${site.name}, a ${site.roles[0].toLowerCase()} from ${city}, ${country}. ${about.heroMeta[2].text}, ${about.heroMeta[1].text}. Story, journey, interests and music.`,
  },
  projects: {
    path: "/projects",
    name: label("/projects", "Projects"),
    title: "Projects: Websites, Web Apps and Games",
    description: `${projects.length} projects by ${site.name}: websites, web apps, a 3D web experience and web games built with React, TypeScript, Supabase and Vercel. Search, filter and read each case study.`,
  },
  skills: {
    path: "/skills",
    name: label("/skills", "Skills"),
    title: "Skills and Tech Stack",
    description: `The tech stack of ${site.name}: ${skillNames.length} technologies in ${skills.length} categories, including React, Next.js, Laravel, TypeScript, Supabase, Kotlin and Godot, plus the tools used every day.`,
  },
  experience: {
    path: "/experience",
    name: label("/experience", "Experience"),
    title: "Experience, Education and Minecraft Mods",
    description: `From a first HTML website in 2023 to full-stack and game projects: the experience, Software Engineering education, competitions and Minecraft mods on Modrinth and CurseForge of ${site.name}.`,
  },
  contact: {
    path: "/contact",
    name: label("/contact", "Contact"),
    title: "Contact, Collaborate or Request a Website",
    description: `Contact ${site.name} in ${city}, ${country} to collaborate on a project or ask for a website. Reach out on Instagram, X or GitHub. Usually replies within a day.`,
  },
};

/** Lets browsers and AI tools discover llms.txt from every page. */
const ALTERNATE_TYPES = { "text/plain": [{ url: "/llms.txt", title: "llms.txt" }] };

/** Meta tags for one page: title, description, canonical URL, Open Graph and X (Twitter) card. */
export function pageMeta(key: PageKey): Metadata {
  const p = pages[key];
  const url = abs(p.path);
  const shareTitle = key === "home" ? p.title : `${p.title} | ${site.name}`;
  const creator = xHandle ? { creator: xHandle } : {};

  return {
    title: key === "home" ? { absolute: p.title } : p.title,
    description: p.description,
    alternates: { canonical: url, types: ALTERNATE_TYPES },
    openGraph: {
      type: key === "about" ? "profile" : "website",
      url,
      siteName: site.name,
      locale: "en_US",
      title: shareTitle,
      description: p.description,
      images: OG_IMAGES,
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: p.description,
      images: [OG_IMAGE],
      ...creator,
    },
  };
}

/** Site wide meta tags, used by app/layout.tsx. */
export function siteMeta(): Metadata {
  const home = pages.home;
  const { lat, lon } = site.geo;
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: site.name,
    title: { default: home.title, template: `%s | ${site.name}` },
    description: home.description,
    keywords,
    authors: [{ name: site.name, url: SITE_URL }],
    creator: site.name,
    publisher: site.name,
    category: "technology",
    referrer: "origin-when-cross-origin",
    formatDetection: { email: false, address: false, telephone: false },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    verification: { google: "I_4_fX2KLHYeWVqfJ2Lx2dOebJxxnKu39YE_y2vzr0w" },
    alternates: { types: ALTERNATE_TYPES },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "en_US",
      title: home.title,
      description: home.description,
      images: OG_IMAGES,
    },
    twitter: {
      card: "summary_large_image",
      title: home.title,
      description: home.description,
      images: [OG_IMAGE],
      ...(xHandle ? { creator: xHandle } : {}),
    },
    // location hints (GEO): city level only
    other: {
      "geo.region": "ID-JB",
      "geo.placename": `${city}, ${site.geo.region}, ${country}`,
      "geo.position": `${lat};${lon}`,
      ICBM: `${lat}, ${lon}`,
    },
  };
}

/* ───────── Structured data (JSON-LD) ───────── */

const graph = (...nodes: Json[]): Json => ({ "@context": "https://schema.org", "@graph": nodes });

/** The person behind the website. Only things that are already public on the site are used (no email, no birth date). */
function personNode(): Json {
  const interests = about.interests.filter((i) => !/^playing games$/i.test(i));
  return {
    "@type": "Person",
    "@id": ID.person,
    name: site.name,
    alternateName: unique([site.short, site.github, strip(site.handle), ...(xHandle ? [strip(xHandle)] : [])]),
    url: abs("/"),
    mainEntityOfPage: abs("/about"),
    description: about.statement,
    jobTitle: site.roles[0],
    hasOccupation: site.roles.map((name) => ({ "@type": "Occupation", name })),
    address: {
      "@type": "PostalAddress",
      addressLocality: city,
      addressRegion: site.geo.region,
      addressCountry: "ID",
    },
    homeLocation: {
      "@type": "Place",
      name: `${city}, ${site.geo.region}, ${country}`,
      geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lon },
    },
    sameAs: socials.map((s) => s.href),
    knowsAbout: unique([...site.roles, ...learning, ...interests, ...skillNames]),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "collaboration and website requests",
      url: abs("/contact"),
      ...(site.email ? { email: site.email } : {}),
    },
  };
}

function websiteNode(): Json {
  return {
    "@type": "WebSite",
    "@id": ID.website,
    url: abs("/"),
    name: site.name,
    alternateName: unique(["rizkymp", site.short]),
    description: site.intro,
    inLanguage: "en",
    publisher: { "@id": ID.person },
    author: { "@id": ID.person },
  };
}

function breadcrumb(key: PageKey): Json {
  const home = pages.home;
  const crumbs = key === "home" ? [home] : [home, pages[key]];
  return {
    "@type": "BreadcrumbList",
    "@id": `${abs(pages[key].path)}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.path) })),
  };
}

function webPage(key: PageKey, type: string = "WebPage", extra: Json = {}): Json {
  const p = pages[key];
  return {
    "@type": type,
    "@id": `${abs(p.path)}#webpage`,
    url: abs(p.path),
    name: p.title,
    description: p.description,
    inLanguage: "en",
    isPartOf: { "@id": ID.website },
    about: { "@id": ID.person },
    breadcrumb: { "@id": `${abs(p.path)}#breadcrumb` },
    primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGE, width: 1200, height: 630 },
    ...extra,
  };
}

/** One project as a schema.org node. Websites are CreativeWork, apps are WebApplication, games are VideoGame. */
function projectNode(p: Project): Json {
  const type = p.kind === "Web Game" ? "VideoGame" : p.kind === "Website" ? "CreativeWork" : "WebApplication";
  const appCategory = p.kind === "Web 3D" ? "3D web experience" : "Web application";
  const kindProps: Json =
    type === "VideoGame"
      ? { applicationCategory: "Game", gamePlatform: "Web browser" }
      : type === "WebApplication"
        ? { applicationCategory: appCategory, operatingSystem: "Web browser" }
        : { genre: p.kind };
  const editions = p.links && p.links.length > 1 ? p.links : null;

  return {
    "@type": type,
    "@id": `${abs("/projects")}#${p.slug}`,
    name: p.title,
    description: p.desc,
    url: p.link ?? abs("/projects"),
    ...(p.image ? { image: abs(p.image) } : {}),
    dateCreated: p.year,
    keywords: p.stack.join(", "),
    creator: { "@id": ID.person },
    author: { "@id": ID.person },
    ...kindProps,
    ...(editions
      ? { workExample: editions.map((l) => ({ "@type": type, name: l.label, url: l.href, ...kindProps })) }
      : {}),
    ...(p.repo
      ? {
          subjectOf: {
            "@type": "SoftwareSourceCode",
            name: `${p.title} source code`,
            codeRepository: p.repo,
            programmingLanguage: p.stack,
            author: { "@id": ID.person },
          },
        }
      : {}),
  };
}

const projectList = (list: Project[], id: string, name: string): Json => ({
  "@type": "ItemList",
  "@id": id,
  name,
  numberOfItems: list.length,
  itemListElement: list.map((p, i) => ({ "@type": "ListItem", position: i + 1, item: projectNode(p) })),
});

/** Added to every page by app/layout.tsx: who the person is and what the website is. */
export function siteGraph(): Json {
  return graph(personNode(), websiteNode());
}

export function homeGraph(): Json {
  const featured = projects.filter((p) => p.featured);
  return graph(
    webPage("home"),
    breadcrumb("home"),
    projectList(featured.length ? featured : projects.slice(0, 3), `${abs("/")}#featured`, "Featured projects"),
  );
}

export function aboutGraph(): Json {
  return graph(webPage("about", "ProfilePage", { mainEntity: { "@id": ID.person } }), breadcrumb("about"));
}

export function projectsGraph(): Json {
  const id = `${abs("/projects")}#projects`;
  return graph(
    webPage("projects", "CollectionPage", { mainEntity: { "@id": id } }),
    breadcrumb("projects"),
    projectList(projects, id, `Projects by ${site.name}`),
  );
}

export function skillsGraph(): Json {
  const id = `${abs("/skills")}#stack`;
  const group = (name: string, items: string[]) => ({
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((n, i) => ({ "@type": "ListItem", position: i + 1, name: n })),
  });
  const lists = [...skills.map((g) => group(g.group, g.items.map((i) => i.name))), group("Daily tools", toolNames)];
  return graph(
    webPage("skills", "CollectionPage", { mainEntity: { "@id": id } }),
    breadcrumb("skills"),
    {
      "@type": "ItemList",
      "@id": id,
      name: `Tech stack of ${site.name}`,
      numberOfItems: lists.length,
      itemListElement: lists.map((item, i) => ({ "@type": "ListItem", position: i + 1, item })),
    },
  );
}

export function experienceGraph(): Json {
  const timeline = [...experience, ...education];
  const mods = published.map((m) => ({
    "@type": "CreativeWork",
    name: m.title,
    description: m.org,
    genre: "Minecraft mod",
    dateCreated: m.year,
    creator: { "@id": ID.person },
  }));
  return graph(
    webPage("experience"),
    breadcrumb("experience"),
    {
      "@type": "ItemList",
      "@id": `${abs("/experience")}#timeline`,
      name: `Experience and education of ${site.name}`,
      numberOfItems: timeline.length,
      itemListElement: timeline.map((e, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: e.title,
        description: `${e.period}, ${e.org}. ${e.desc}`,
      })),
    },
    {
      "@type": "ItemList",
      "@id": `${abs("/experience")}#challenges`,
      name: "Competitions and exams",
      numberOfItems: competitions.length,
      itemListElement: competitions.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.title,
        description: `${c.year}, ${c.org}`,
      })),
    },
    {
      "@type": "ItemList",
      "@id": `${abs("/experience")}#mods`,
      name: "Published Minecraft mods",
      numberOfItems: mods.length,
      itemListElement: mods.map((item, i) => ({ "@type": "ListItem", position: i + 1, item })),
    },
  );
}

/** The FAQ here is the same list shown on the Contact page, so the markup always matches what visitors can read. */
export function contactGraph(): Json {
  return graph(
    webPage("contact", "ContactPage", { mainEntity: { "@id": ID.person } }),
    breadcrumb("contact"),
    {
      "@type": "FAQPage",
      "@id": `${abs("/contact")}#faq`,
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  );
}

/* ───────── llms.txt (for AI tools) ───────── */

/** Plain text summary of the whole website for AI tools. Served at /llms.txt by app/llms.txt/route.ts. */
export function llmsTxt(): string {
  const line = (title: string, path: string, desc: string) => `- [${title}](${abs(path)}): ${desc}`;
  const out: string[] = [
    `# ${site.name}`,
    "",
    `> ${site.intro} Based in ${city}, ${site.geo.region}, ${country}. ${site.status}.`,
    "",
    about.paragraphs[0],
    "",
    "## Pages",
    ...(Object.keys(pages) as PageKey[]).map((k) => line(pages[k].name, pages[k].path, pages[k].description)),
    "",
    "## Projects",
    ...projects.map((p) => `- [${p.title}](${p.link ?? abs("/projects")}): ${p.kind}, ${p.year}. ${p.desc}${p.repo ? ` Source: ${p.repo}` : ""}`),
    "",
    "## Skills",
    ...skills.map((g) => `- ${g.group}: ${g.items.map((i) => i.name).join(", ")}`),
    `- Daily tools: ${toolNames.join(", ")}`,
    "",
    "## Experience and education",
    ...[...experience, ...education].map((e) => `- ${e.title} (${e.period}, ${e.org}): ${e.desc}`),
    "",
    "## Competitions",
    ...competitions.map((c) => `- ${c.title} (${c.year}): ${c.org}`),
    "",
    "## Published Minecraft mods",
    ...published.map((m) => `- ${m.title} (${m.year}): ${m.org}`),
    "",
    "## Links",
    ...socials.map((s) => `- [${s.label}](${s.href}): ${s.handle}`),
    "",
    "## FAQ",
    ...faqs.flatMap((f) => [`### ${f.q}`, f.a, ""]),
  ];
  return out.join("\n").trim() + "\n";
}