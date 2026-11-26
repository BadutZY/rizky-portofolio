/**
 * ALL WEBSITE CONTENT LIVES HERE.
 * Everything is filled in, including the Projects section. The components do not need to change.
 */

export const site = {
  name: "Rizky Maulana Putra",
  short: "RMP",
  github: "BadutZY",
  handle: "@rzky.mp_36",
  roles: ["Vibe Coder", "Web Developer", "Game Developer", "Minecraft Modder"],
  location: "Bogor, Indonesia",
  geo: { city: "Bogor", region: "West Java", country: "Indonesia", lat: -6.595, lon: 106.8166 },
  timezone: "Asia/Jakarta",
  email: "",
  intro:
    "I'm an 18-year-old vibe coder from Bogor who builds websites, games and Minecraft mods, one curious experiment at a time.",
  available: true,
  status: "Open to collaboration",
  badge: "OPEN TO COLLABORATE - LET'S BUILD TOGETHER - ",
  cv: "",
  photo: "/profile.jpg" as string,
};

export type NavItem = { label: string; href: string; blurb: string };

export const nav: NavItem[] = [
  { label: "About", href: "/about", blurb: "My story, quote and journey" },
  { label: "Projects", href: "/projects", blurb: "Things I've built" },
  { label: "Experience", href: "/experience", blurb: "Learning, school and published work" },
  { label: "Skills", href: "/skills", blurb: "Stack, tools and recent focus" },
  { label: "Contact", href: "/contact", blurb: "Let's collaborate" },
];

export const socials = [
  { label: "GitHub", href: "https://github.com/BadutZY", icon: "github", handle: "@BadutZY" },
  { label: "Instagram", href: "https://www.instagram.com/rzky.mp_36/", icon: "instagram", handle: "@rzky.mp_36" },
  { label: "X", href: "https://x.com/BadutZYY_", icon: "x", handle: "@BadutZYY_" },
];

/**
 * The main way to reach you, used by the footer and the menu. It is your email once you add one,
 * and your Instagram until then.
 */
export const primaryContact = site.email
  ? { label: site.email, href: `mailto:${site.email}`, external: false }
  : { label: `${socials[1].handle} on Instagram`, href: socials[1].href, external: true };

/** Title shown on the page-transition curtain. */
export function titleFor(path: string): string {
  if (path === "/") return "Home";
  const first = "/" + path.split("/").filter(Boolean)[0];
  const hit = nav.find((n) => n.href === first);
  if (hit) return hit.label;
  return "Page";
}

/* ───────── About ───────── */

export const about = {
  statement:
    "I'm a vibe coder who loves turning ideas into websites, games and Minecraft mods, and I try to learn something new with every project.",
  /** The three small facts under the title of the About page. */
  heroMeta: [
    { icon: "map-pin", text: "Bogor, Indonesia" },
    { icon: "graduation", text: "Software Engineering, Grade 12" },
    { icon: "code", text: "Coding since 2023" },
  ],
  paragraphs: [
    "Hi, I'm Rizky Maulana Putra, an 18-year-old vibe coder from Bogor, Indonesia. I'm in my final year of vocational school, majoring in Software Engineering.",
    "My coding journey started in 2023 with a simple portfolio site in HTML and CSS. Since then I've built websites, games, mobile apps and Minecraft mods, and I keep exploring new frameworks and tools along the way.",
    "I'm also a long-time JKT48 fan, which is why several of my projects have a JKT48 link, like the VYRÉZTA fanbase website and JKT48 Stream. Building things for something I enjoy keeps me motivated.",
    "Every project I've made so far was built with the help of AI, and I'm upfront about that. I'm still learning, and I'm happy to collaborate with others or build a website for you.",
  ],
  facts: [
    { k: "Born in", v: "Bogor, Indonesia" },
    { k: "Age", v: "18 years old" },
    { k: "School", v: "Vocational High School, Software Engineering" },
    { k: "Year", v: "Grade 12 (final year)" },
    { k: "Focus", v: "Web, games and mods" },
    { k: "Status", v: "Open to collaboration" },
    { k: "Oshi", v: "Victoria Kimberly ♡\nCatherina Vallencia ♡\nFritzy Rosmerian ♡\nHillary Abigail ♡" },
  ],
  quote: {
    text: "Don't be afraid to fail. Be afraid not to try.",
    label: "A quote I like",
  },
  journey: [
    {
      year: "2023",
      title: "First line of code",
      text: "In 8th grade I built my first website, a portfolio in plain HTML and CSS. That was my first step into programming.",
    },
    {
      year: "2024",
      title: "Vocational school",
      text: "Started Software Engineering at Vocational High School. I learned Pascal and algorithms, then websites with HTML, CSS and JavaScript. An industry class introduced me to Laravel, Figma and Unity, and with two friends I shipped my first game, BoxSiege.",
    },
    {
      year: "2025",
      title: "Robotics, desktop and React",
      text: "Built ESP32 gadgets, Java desktop apps and Laravel sites with Filament. I fell for React and TypeScript, made mobile apps with React Native, and published Minecraft mods that earned my first income.",
    },
    {
      year: "2026",
      title: "Final year, full stack",
      text: "Built Android apps with Kotlin, the Unity game TwinParkour, a Next.js and Prisma backend for our class attendance site and a smart lock with an ESP32. I also picked up Supabase and Godot, and a missed setting at a school website competition taught me to always double-check my environment files.",
    },
    {
      year: "Next",
      title: "Work placement and graduation",
      text: "Heading into my work placement (PKL) and then graduation, with more websites, games and ideas on the way.",
    },
  ],
  interests: ["Vibecoding", "Playing games", "Game development", "Minecraft modding"],
  funFacts: [
    { k: "First website", v: "A portfolio in HTML and CSS" },
    { k: "First game", v: "BoxSiege, made with Unity" },
    { k: "First income", v: "Minecraft mod downloads" },
    { k: "Favorite stack", v: "React with TypeScript" },
  ],
  /**
   * Numbers are left empty on purpose for now. Add items like
   * { value: 10, suffix: "+", label: "Projects built" } and the stats blocks on Home and About appear again.
   */
  stats: [] as { value: number; suffix: string; label: string }[],
};

export const faqs = [
  {
    q: "Are you available for freelance work?",
    a: "Not full time yet, since I'm still a vocational school student. But I'm open to building websites for others when my schedule allows, so feel free to reach out and we can talk it through.",
  },
  {
    q: "What can we build together?",
    a: "Websites are my main thing, but I also make games, Minecraft mods and simple mobile apps. If you have an idea in one of those areas, I'd love to hear it.",
  },
  {
    q: "Do you build with AI?",
    a: "Yes, and I'm upfront about it. I describe what I want, review what comes back, and keep testing and fixing until it works. That's how I've built all of my projects, and I learn a lot along the way.",
  },
  {
    q: "How long does a project take?",
    a: "It depends on the size of the idea and how quickly we can go back and forth. Once we've talked it through, I'll give you an honest estimate before anything starts.",
  },
  {
    q: "What's the best way to reach me?",
    a: "A direct message on Instagram or X is the easiest way. You can also look at my code on GitHub if you'd like to see how I work.",
  },
];

/* ───────── Experience ───────── */

export type Entry = { period: string; title: string; org: string; place?: string; desc: string; points?: string[] };

export const experience: Entry[] = [
  {
    period: "2026 to Present",
    title: "Full-Stack and Game Development",
    org: "Personal projects and school",
    place: "Bogor",
    desc: "In my final year I'm going deeper into full-stack work and game development, while preparing for my work placement.",
    points: [
      "Built the backend of our class attendance website with Next.js, TypeScript and Prisma",
      "Added Supabase logins and editable student profiles to our class website",
      "Made a multiplayer quiz and Guess Who?, and remade BoxSiege in Godot",
      "Built Android apps with Kotlin and the Unity game TwinParkour",
      "Made an RFID and Wi-Fi smart lock with an ESP32 for my IoT final assignment",
    ],
  },
  {
    period: "2025",
    title: "Websites, Mods and Mobile Apps",
    org: "Personal projects and school",
    place: "Bogor",
    desc: "The year I started publishing my own work: React websites, Minecraft mods and my first mobile apps.",
    points: [
      "Published Minecraft mods on Modrinth and CurseForge, earning about $1 to $5 a month",
      "Built portfolio, game, team, product and class websites with React and TypeScript",
      "Made mobile apps with React Native, including our class app and a Werewolf game",
    ],
  },
  {
    period: "2024",
    title: "Industry Class and First Game",
    org: "School industry program",
    place: "Bogor",
    desc: "A one-week extra class taught by industry professionals, followed by my first real team project.",
    points: [
      "Built my first Laravel website and learned UI design in Figma",
      "Learned 2D game basics with Unity and C#",
      "Shipped the game BoxSiege with two teammates in about a month",
    ],
  },
];

export const education: Entry[] = [
  {
    period: "2024 to Present",
    title: "Software Engineering (RPL)",
    org: "Vocational High School of Informatics and Telecommunications Bogor",
    place: "Bogor",
    desc: "Vocational high school with a focus on software engineering, now in the final year.",
    points: [
      "Grade 10: Pascal, algorithms, flowcharts and websites with HTML, CSS and JavaScript",
      "Grade 11: ESP32 robotics, Java desktop apps, and Laravel with Filament, ending with a room booking site using Midtrans",
      "Grade 12: Android apps with Kotlin, Unity games, a class-wide full-stack project and the UKK competency exam",
    ],
  },
];

export const competitions = [
  { title: "Inception Vol. 2", org: "School website competition, Universitas Trisakti", year: "2026" },
  { title: "UKK Competency Exam", org: "School website with Laravel and Blade", year: "2026" },
  { title: "Grade 11 Final Projects", org: "A Java desktop app and a Laravel booking site", year: "2025" },
];

export const published = [
  { title: "Craftable Item", org: "Minecraft mod on Modrinth and CurseForge", year: "2025" },
  { title: "Breakable Block", org: "Minecraft mod on Modrinth and CurseForge", year: "2025" },
  { title: "Auto Use Totem", org: "Minecraft mod on Modrinth and CurseForge", year: "2025" },
];

/* ───────── Projects ───────── */

export type ArtKind = "landing" | "dashboard" | "kanban" | "shop" | "mobile" | "blog";

/** A gallery entry: just the image path, or an object when you also want a caption. */
export type GalleryItem = string | { src: string; caption?: string };

export type Project = {
  slug: string;
  title: string;
  year: string;
  kind: string;
  desc: string;
  overview: string;
  role: string;
  client?: string; // optional, shown in the project details only when set
  duration: string;
  team: string;
  stack: string[];
  highlights: string[];
  challenge: string;
  solution: string;
  results: { value: number; suffix: string; label: string }[];
  link?: string;
  links?: { label: string; href: string }[]; // optional: several live links, shown instead of the single link button
  repo?: string;
  image?: string;
  images?: string[]; // optional: 2 or more covers that fade into each other on the cards and in the modal
  gallery?: GalleryItem[];
  art: ArtKind;
  featured?: boolean;
};

export const projects: Project[] = [
  {
    image: "/projects/vyrezta-website.webp",
    slug: "vyrezta-website",
    title: "VYRÉZTA Fanbase",
    year: "2026",
    kind: "Website",
    desc: "A fanbase website for VYRÉZTA, the supporters of JKT48 member Kimmy, with a gallery, a theater show calendar and live stream status.",
    overview:
      "A rebuild of the VYRÉZTA fanbase website, made for the supporters of Kimmy (Victoria Kimberly) from JKT48. It is a single home for everything about VYRÉZTA and Kimmy: an introduction to the fanbase, a photo gallery, projects, merchandise, news and a schedule. Theater shows are added to a calendar automatically, and fans can see when Kimmy is live on IDN Live or Showroom. The site is built for JKT48 fans, so anyone can quickly learn what the fanbase offers.",
    role: "Full Stack",
    duration: "2 weeks",
    team: "Solo",
    stack: ["React", "JavaScript", "CSS", "Vite", "Supabase", "PostgreSQL", "Vercel"],
    highlights: [
      "Theater show schedule that goes straight into a calendar",
      "Live status for IDN Live and Showroom",
      "Photo gallery of Kimmy",
      "Pages for the fanbase, projects, news and merchandise",
      "Dark and light theme with a built in assistant chat",
      "Optimized to stay light with only the animations that matter",
    ],
    challenge:
      "Data was limited, and photos and videos of Kimmy were hard to collect. On top of that, a site with this many visuals and animations can easily become heavy, which is a problem for fans who open it on their phones.",
    solution:
      "I gathered the information, photos and videos from social media and from the original VYRÉZTA website. Then, with the help of AI, I optimized the site by removing animations that were not needed, while making sure it still looks good. Everything was built and deployed by myself on Vercel.",
    results: [
      { value: 6, suffix: "", label: "Content sections for fans" },
      { value: 2, suffix: "", label: "Live platforms tracked" },
      { value: 3, suffix: "", label: "Screen sizes designed" },
    ],
    link: "https://vyrezta.vercel.app",
    art: "blog",
    featured: true,
    gallery: [
      "/projects/vyrezta-website.webp",
      { src: "/projects/vyrezta/tablet.png", caption: "Tablet" },
      { src: "/projects/vyrezta/mobile.png", caption: "Mobile" },
    ],
  },
  {
    image: "/projects/badutzy-website.webp",
    slug: "badutzy-portfolio",
    title: "BadutZY Portfolio",
    year: "2026",
    kind: "Website",
    desc: "A just for fun pixel art portfolio that shows my projects, skills, PC setup and contact in one page.",
    overview:
      "My second portfolio, made just for fun in a sharp HD pixel art style that I like because it feels more unique and fun to look at. It is a single page personal website that explains the projects I have made and what I used to build them, along with my skills, my PC specs and how to contact me. It has Home, About, Skills, Project, Equipment, Wife and Contact sections, a dark and light theme, and a dock style navigation at the bottom. It is not meant to be a serious portfolio, and I hope that the few people who see it will find it fun.",
    role: "Full Stack",
    duration: "Over 1 month",
    team: "Solo",
    stack: ["React", "TypeScript", "CSS", "Tailwind CSS", "Vite", "Vercel"],
    highlights: [
      "Sharp HD pixel art style across the whole page",
      "Seven sections: Home, About, Skills, Project, Equipment, Wife and Contact",
      "Dock style navigation at the bottom of the screen",
      "Project section showing what I built and what I used",
      "Equipment section with my PC specs",
      "Dark and light theme, with a layout that adapts to desktop and mobile",
    ],
    challenge:
      "The hardest part was the layout across devices. Some elements were too big on mobile and some were cut off, so keeping everything balanced and symmetrical between desktop and mobile took a lot of adjusting.",
    solution:
      "I went through the page device by device and adjusted sizes and spacing until each section fit properly on both small and large screens, while keeping the pixel art look consistent.",
    results: [
      { value: 7, suffix: "", label: "Sections on one page" },
      { value: 2, suffix: "", label: "Themes, dark and light" },
      { value: 3, suffix: "", label: "Screen sizes designed" },
    ],
    link: "https://badutzy.vercel.app/",
    repo: "https://github.com/BadutZY/badutzy-portfolio",
    art: "landing",
    featured: true,
    gallery: [
      "/projects/badutzy-website.webp",
      { src: "/projects/badutzy/tablet.png", caption: "Tablet" },
      { src: "/projects/badutzy/mobile.png", caption: "Mobile" },
    ],
  },
  {
    image: "/projects/jkt48-stream.webp",
    slug: "jkt48-stream",
    title: "JKT48 Stream",
    year: "2026",
    kind: "Web App",
    desc: "A video platform for JKT48 fans that brings videos from several JKT48 channels, live status and the theater schedule into one place.",
    overview:
      "JKT48 Stream is made for JKT48 fans who are tired of jumping between apps and channels. It gathers videos from several official JKT48 channels (JKT48 Official, JKT48 TV, JKT48 LIVE and IDN App) into a single YouTube style website, so fans can watch everything in one place. It also shows who is live on IDN Live and Showroom, the theater schedule, and the birthdays of members that are coming up. Visitors can search for videos, members or songs, and keep their own watch history, saved videos and playlists. It is also a Progressive Web App (PWA), so it can be installed on a phone or computer and opened like a regular app.",
    role: "Full Stack",
    duration: "Over 3 months",
    team: "Solo",
    stack: ["React", "TypeScript", "CSS", "Tailwind CSS", "Vite", "Supabase", "Vercel"],
    highlights: [
      "Videos from 4 JKT48 channels in one place, using the official YouTube API",
      "Live status for IDN Live and Showroom, plus the theater schedule, from the JKT48 Connect API",
      "Search for videos, members and songs",
      "Upcoming member birthdays with a countdown ticker",
      "Watch history, saved videos and playlists kept in the browser",
      "Installable as a PWA, with a responsive layout, mobile bottom navigation and a dark and light theme",
    ],
    challenge:
      "A login system was not possible yet because of limited resources and a database that was not ready for it. On top of that, the JKT48 LIVE channel does not allow its videos to be embedded on other websites, so those videos cannot be played directly on the site.",
    solution:
      "Until a login system can be built, watch history, saved videos and playlists are stored in the browser with localStorage, so every visitor still has a personal experience without an account. For the JKT48 LIVE channel, the site clearly tells visitors about the embed restriction and sends them to YouTube to watch. The member birthdays are entered by hand and kept in the code.",
    results: [
      { value: 4, suffix: "", label: "Channels in one place" },
      { value: 2, suffix: "", label: "Live platforms tracked" },
      { value: 3, suffix: "", label: "Screen sizes designed" },
    ],
    link: "https://jkt48-stream.vercel.app/",
    repo: "https://github.com/JKT48-Stream/jkt48-stream-website",
    art: "dashboard",
    featured: true,
    gallery: [
      "/projects/jkt48-stream.webp",
      { src: "/projects/jkt48-stream/tablet.png", caption: "Tablet" },
      { src: "/projects/jkt48-stream/mobile.png", caption: "Mobile" },
    ],
  },
  {
    image: "/projects/class-website.webp",
    slug: "xii-rpl-2-website",
    title: "XII RPL 2 Class Website",
    year: "2026",
    kind: "Web App",
    desc: "A class website with student profiles, schedules, a gallery and a login system managed by an admin.",
    overview:
      "The official website of class XII RPL 2 (Software Engineering) at Vocational High School Infokom. It brings the class information together in one clean place: an introduction to the class, lessons, schedules, student profiles, a photo gallery, a video archive and a page to download the class mobile app. Only students and the homeroom teacher can log in, and every account is created by an admin, so outsiders cannot sign up and visitors can only browse. Some students have already started to log in and change their own profile photos, although not everyone uses it yet.",
    role: "Full Stack",
    duration: "Over 3 months",
    team: "Solo, with class data from a friend",
    stack: ["React", "TypeScript", "CSS", "Tailwind CSS", "Vite", "Supabase", "PostgreSQL", "Vercel"],
    highlights: [
      "Login for students and the homeroom teacher, with every account created by an admin",
      "Role based access: the admin manages all accounts, visitors can only view",
      "Students can change their own username and password",
      "Admin can edit a student's profile photo, full name, roll number, position, nickname and bio",
      "Pages for lessons, schedules, students, a gallery, videos and the mobile app download",
      "An admin account can also be a student account",
    ],
    challenge:
      "All of the class data had to be entered by hand before the website was useful, including the full schedule and every teacher's name. This took a long time and was tiring, and the data had to be correct because the whole class would see it.",
    solution:
      "I built the website with React, TypeScript, Supabase and PostgreSQL, using a role based system where the admin controls every account and profile. A friend named Mario provided the class data, which I entered carefully one by one. The next step is to make the admin side of the website and the class mobile app feel more consistent with each other.",
    results: [
      { value: 28, suffix: "", label: "Student profiles" },
      { value: 8, suffix: "", label: "Pages and sections" },
      { value: 3, suffix: "", label: "Screen sizes designed" },
    ],
    link: "https://rpl2.vercel.app/",
    repo: "https://github.com/BadutZY/xii-rpl-2-website",
    art: "kanban",
    gallery: [
      "/projects/class-website.webp",
      { src: "/projects/class/tablet.png", caption: "Tablet" },
      { src: "/projects/class/mobile.png", caption: "Mobile" },
    ],
  },
  {
    image: "/projects/fritzyforce-website.webp",
    slug: "fritzy-force-fanbase",
    title: "Fritzy Force Fanbase",
    year: "2025",
    kind: "Website",
    desc: "A practice fanbase website for Fritzy Force, the supporters of JKT48 member Fritzy Rosmerian, with a purple themed design.",
    overview:
      "A fanbase website for Fritzy Force, the supporters of JKT48 member Fritzy Rosmerian. I made it before VYRÉZTA Fanbase as practice, so it is not used by the real fanbase. It has Home, Profile, Timeline, Schedule, Content, Merchandise and About Us sections in a dark purple design. A live status feature used to be part of it, but its API has been turned off, so that part no longer works. Everything else still works, and the schedule has to be filled in by hand one entry at a time.",
    role: "Full Stack",
    duration: "3 to 4 weeks",
    team: "Solo",
    stack: ["React", "TypeScript", "CSS", "Tailwind CSS", "Vite", "Vercel"],
    highlights: [
      "Dark purple design with an arched photo frame on the home page",
      "Sections for profile, timeline, schedule, content, merchandise and about us",
      "A schedule that is filled in manually",
      "Content collected by hand from the fanbase's social media",
      "Animations optimized to stay as light as possible",
      "Responsive layout for desktop, tablet and mobile",
    ],
    challenge:
      "The fanbase did not have an official website yet, so I had to search through several of their social media accounts and learn about Fritzy myself to collect all the data. This took a long time and was tiring. The animations were also quite heavy and needed to be optimized.",
    solution:
      "I gathered the information by hand and organized it into clear sections, then reduced and simplified the animations until the site felt as light as possible while still looking good.",
    results: [
      { value: 7, suffix: "", label: "Main sections" },
      { value: 3, suffix: "", label: "Screen sizes designed" },
      { value: 4, suffix: "", label: "Weeks at most to build" },
    ],
    link: "https://fritzyforce.vercel.app/",
    repo: "https://github.com/BadutZY/website-fritzy-force",
    art: "mobile",
    gallery: [
      "/projects/fritzyforce-website.webp",
      { src: "/projects/fritzy-force/tablet.png", caption: "Tablet" },
      { src: "/projects/fritzy-force/mobile.png", caption: "Mobile" },
    ],
  },
  {
    image: "/projects/solar-system.webp",
    slug: "solar-system",
    title: "Solar System",
    year: "2026",
    kind: "Web 3D",
    desc: "An interactive 3D journey through the solar system, where scrolling moves from the Sun to each planet with facts, a gallery and a full 3D view in English and Indonesian.",
    overview:
      "Solar System is a 3D website about space, made because I wanted to try building 3D for the web and because I simply love outer space. The home page is a guided journey: as you scroll, the view moves from the Sun to every planet in turn, and each one comes with a short explanation and key data such as diameter, mass, gravity, temperature, distance from the Sun and rotation. The menu leads to more pages, including a gallery, an about page and a complete 3D view of the whole solar system with every orbit. In total there are 8 planets, 1 moon and the Sun. The website works in both English and Indonesian, and an ambient space sound sets the mood while exploring. It is built with Three.js and was finished in about a week, and I am quite happy with how it turned out.",
    role: "Full Stack",
    duration: "About 1 week",
    team: "Solo",
    stack: ["React", "JavaScript", "CSS", "Vite", "Three.js", "Vercel"],
    highlights: [
      "A scroll driven journey from the Sun through all 8 planets",
      "Short explanations and data for each planet: diameter, mass, gravity, temperature, distance from the Sun and rotation",
      "A full 3D view of the solar system with orbiting planets and a free look around",
      "Extra pages for a gallery and about, reached from the menu",
      "Two languages, English and Indonesian",
      "Ambient space sound, with a dark space theme and a starfield background",
    ],
    challenge:
      "The hardest part was the mobile version. On some phones the scrolling can act up, and sometimes a planet does not appear or is not centered properly on the screen. I have not found a solution that works every time.",
    solution:
      "I worked on it with the help of AI and adjusted the layout and the 3D scene several times. The planet now appears centered most of the time, but it is not completely fixed, and on rare occasions it can still disappear. Fixing this fully is the main thing left to improve.",
    results: [
      { value: 8, suffix: "", label: "Planets explored" },
      { value: 2, suffix: "", label: "Languages, English and Indonesian" },
      { value: 1, suffix: "", label: "Week to build" },
    ],
    link: "https://solarsystemweb.vercel.app/",
    repo: "https://github.com/BadutZY/solar-system-website",
    art: "landing",
    gallery: [
      "/projects/solar-system.webp",
      { src: "/projects/solar-system/tablet.png", caption: "Tablet" },
      { src: "/projects/solar-system/mobile.png", caption: "Mobile" },
    ],
  },
  {
    image: "/projects/boxsiege-website.webp",
    slug: "boxsiege-website",
    title: "BoxSiege Website",
    year: "2025",
    kind: "Website",
    desc: "The official download website for BoxSiege, a 2D shooting game made by my team, with game information, characters, weapons, a shop and a free download.",
    overview:
      "This is the official website of BoxSiege, the 2D shooting game made by our team, Equinox Interactive. To be clear, this is not the game itself. It is the website where people can learn about the game and download it for free. BoxSiege is a one versus one style shooter with two modes. Campaign is a solo mode where the player collects coins and spends them on weapon skins and character skins. Versus lets one to four players fight on the same screen, and it also supports team matches such as 1v1v2, 1v3, 2v2 and 1v1v1v1, each with its own advantages and drawbacks. The game has about 24 characters, 5 chapters of 50 levels each and 491 shop items. The website presents all of this in sections for Modes, Fighters, Arsenal, Arenas, Power-Ups, Campaign, Match Rules, Shop and Controls, with a download button always within reach. It has a dark and light theme and works on mobile. BoxSiege first started as a Unity and C# game, and I later rebuilt it in Godot. I wrote the code, Mario made the sprites, and Sauqi shared many ideas and helped with the code too. I built the website by myself in about a week for the whole team.",
    role: "Full Stack",
    duration: "About 1 week",
    team: "Solo for the website, within the 3 person Equinox Interactive team",
    stack: ["React", "TypeScript", "CSS", "Vite", "Vercel"],
    highlights: [
      "A download website for the game, with a hero, game badges and a free download button",
      "Sections for Modes, Fighters, Arsenal, Arenas, Power-Ups, Campaign, Match Rules, Shop and Controls",
      "Explains the two game modes: a solo Campaign and a Versus mode for 1 to 4 players with team matches",
      "Shows the game's content in numbers: about 24 characters, 5 chapters of 50 levels and 491 shop items",
      "Uses the same Badaboom font as the game, so the website feels like part of it",
      "Dark and light theme, with a layout that works on mobile",
    ],
    challenge:
      "The website itself was not hard to build. The most time consuming part was the amount of data and images, because every character, weapon, arena, power up and shop item had to be entered and shown one by one.",
    solution:
      "I entered the data and images in bulk and used AI to speed up the repetitive work, so the website could cover everything in the game. So far only about 2 to 5 people have tried the game. I would like to add online play in the future, but I do not know how to build a game server yet.",
    results: [
      { value: 24, suffix: "", label: "Characters in the game" },
      { value: 5, suffix: "", label: "Chapters of 50 levels" },
      { value: 491, suffix: "", label: "Shop items" },
    ],
    link: "https://boxsiege.vercel.app/",
    repo: "https://github.com/EquinoxInteractive/BoxSiegeWebsite",
    art: "landing",
    gallery: [
      "/projects/boxsiege-website.webp",
      { src: "/projects/boxsiege/tablet.png", caption: "Tablet" },
      { src: "/projects/boxsiege/mobile.png", caption: "Mobile" },
    ],
  },
  {
    image: "/projects/super-pixel-website.webp",
    slug: "super-pixel-bros-website",
    title: "Super Pixel Bros Website",
    year: "2026",
    kind: "Website",
    desc: "The download website for Super Pixel Bros, my pixel platformer made with Godot and inspired by Super Mario Bros.",
    overview:
      "The website for Super Pixel Bros, a pixel art platformer I made with Godot. It is inspired by the classic Super Mario Bros and rebuilt with a similar theme of running, jumping, stomping enemies and saving the kingdom. The game now has around 50 levels, along with skins and other accessories, and it is available for Windows, Linux, macOS and Android. This website is where people can download the game from GitHub Releases and learn about it first. It has sections for the features, worlds, power-ups, enemies, shop and controls, and the home page has a small playable scene where you can jump and collect coins. I do not expect much, I simply hope that some people will download the game and enjoy it.",
    role: "Full Stack",
    duration: "About 1 week",
    team: "Solo, as the only member of BadutZY Studio",
    stack: ["React", "JavaScript", "CSS", "Vite", "Vercel"],
    highlights: [
      "Download buttons for Windows, Linux, macOS and Android, served from GitHub Releases",
      "Sections for the features, worlds, power-ups, enemies, shop and controls",
      "A playable scene on the home page where you jump and collect coins",
      "A coin counter and a sound toggle in the header",
      "Pixel art style that matches the game",
      "Layout adjusted to fit both desktop and Android screens",
    ],
    challenge:
      "Because I built this website with the help of AI, there was almost nothing that was truly hard. The main work was adjusting the layout several times so that it looks right on both desktop and Android.",
    solution:
      "I kept the website simple and let GitHub Releases handle the downloads for every platform. Then I went through the layout again and again until it fit properly on desktop and Android screens.",
    results: [
      { value: 4, suffix: "", label: "Platforms supported" },
      { value: 7, suffix: "", label: "Sections on the website" },
      { value: 1, suffix: "", label: "Week to build" },
    ],
    link: "https://superpixelbros.vercel.app/",
    repo: "https://github.com/BadutZY-Studio/super-pixel-bros",
    art: "dashboard",
    gallery: [
      "/projects/super-pixel-website.webp",
      { src: "/projects/super-pixel/tablet.png", caption: "Tablet" },
      { src: "/projects/super-pixel/mobile.png", caption: "Mobile" },
    ],
  },
  {
    image: "/projects/badutzy-studio.webp",
    slug: "badutzy-studio",
    title: "BadutZY Studio",
    year: "2026",
    kind: "Website",
    desc: "The website of BadutZY Studio, my own one person game studio, showing the games I have made, my vision and the tech behind them.",
    overview:
      "BadutZY Studio is the name of my own game studio, and for now the whole team is just me. I made this website for anyone who is curious about the games I have built. It introduces the studio as a solo indie game studio, where the concept, design, programming, art direction and release are all handled by one developer, under the line \"One vision. Every pixel, every line of code.\" The website has sections for About, Vision, Games, Process, Tech Stack and Founder. The Games section lists what I have made so far: Trash Collector, built with Java, Super Pixel Bros, built with Godot, and TwinParkour, built with Unity, which has not been released yet. The Process section is only an example of how a game could go from an idea to a release, and the Founder section is my own profile with my social media. It uses a single dark purple theme with golden accents. I built it alone in about a week.",
    role: "Web Developer",
    duration: "About 1 week",
    team: "Solo, as the only member of BadutZY Studio",
    stack: ["React", "TypeScript", "CSS", "Tailwind CSS", "Vite", "Vercel"],
    highlights: [
      "A hero introducing a solo indie game studio, with buttons to the games and the studio story",
      "About and Vision sections explaining who is behind the studio and what it aims for",
      "A Games section with the released games and the upcoming one",
      "A Process section showing an example of how a game goes from idea to release",
      "A Tech Stack section covering the three engines I use: Java, Unity and Godot",
      "A Founder section with my profile and social media links",
    ],
    challenge:
      "The website was very heavy at first, with a lot going on in the page. Making it light enough to open smoothly was the hardest part, and on slower devices it may still feel a little heavy.",
    solution:
      "I asked AI to help me optimize the website and reduce what made it heavy, so it loads and scrolls more smoothly than before. I only share it through my GitHub for now, and I will update it whenever I release a new game.",
    results: [
      { value: 3, suffix: "", label: "Games in the studio" },
      { value: 3, suffix: "", label: "Engines used" },
      { value: 7, suffix: "", label: "Sections on the site" },
    ],
    link: "https://badutzy-studio.vercel.app/",
    repo: "https://github.com/BadutZY-Studio/badutzy-studio-website",
    art: "blog",
    gallery: [
      "/projects/badutzy-studio.webp",
      { src: "/projects/badutzy-studio/tablet.png", caption: "Tablet" },
      { src: "/projects/badutzy-studio/mobile.png", caption: "Mobile" },
    ],
  },
  {
    image: "/projects/equinox-website.webp",
    slug: "equinox",
    title: "Equinox Interactive Website",
    year: "2025",
    kind: "Website",
    desc: "The official website of Equinox Interactive, a three person game team, introducing who we are, our vision and the games we make.",
    overview:
      "Equinox Interactive is the name of the small team I formed with two friends, Sauqi and Mario, to make games together, and it is the team behind BoxSiege. This website introduces us to everyone: ordinary visitors, players and anyone who might want to collaborate. The home page opens with the slogan \"Small Team. Big Dreams.\" over a background taken from an earlier version of BoxSiege, with buttons that lead to our portfolio and contact. The About section tells our story, our vision and our mission. Meet the Team presents the three of us, Our Games shows what we have built, and Contact links to our social media on TikTok, X and Instagram. It comes with a dark and light theme that is remembered between visits, and a layout for both desktop and mobile. I built the website alone in about a week, while the team behind it is the three of us.",
    role: "Full Stack",
    duration: "About 1 week",
    team: "Solo for the website, within the 3 person Equinox Interactive team",
    stack: ["React", "TypeScript", "CSS", "Tailwind CSS", "Vite", "Vercel"],
    highlights: [
      "A hero with the slogan \"Small Team. Big Dreams.\" over a BoxSiege background",
      "About section with our story, our vision and our mission",
      "Meet the Team section for the three members of Equinox Interactive",
      "Our Games section showing what the team has made",
      "Contact section linking to TikTok, X and Instagram",
      "Dark and light theme that is saved, with a responsive layout for desktop and mobile",
    ],
    challenge:
      "The hardest part was the design. It took a lot of trying to make the layout feel right and balanced on both desktop and mobile.",
    solution:
      "I looked at other websites for references, then used AI to change and refine the design more quickly until it fit both screen sizes. This website was built entirely with the help of AI. It is now public, and we share it through our own social media accounts.",
    results: [
      { value: 3, suffix: "", label: "Team members" },
      { value: 5, suffix: "", label: "Main sections" },
      { value: 2, suffix: "", label: "Themes, dark and light" },
    ],
    link: "https://equinoxinteractive.vercel.app/",
    repo: "https://github.com/EquinoxInteractive/EquinoxInteractiveWebsite",
    art: "landing",
    gallery: [
      "/projects/equinox-website.webp",
      { src: "/projects/equinox/tablet.png", caption: "Tablet" },
      { src: "/projects/equinox/mobile.png", caption: "Mobile" },
    ],
  },
  {
    image: "/projects/trash-collector.webp",
    slug: "trash-collector-website",
    title: "Trash Collector Website",
    year: "2026",
    kind: "Website",
    desc: "The download website for Trash Collector, my first game made with Java, with info about its characters, world and trash.",
    overview:
      "The website for Trash Collector, a pixel art game I made with Java, which is the first game I have built with that language. In the game you explore a procedurally generated world, collect scattered trash, chain combos for more coins, and unlock sixteen characters to boost your collection speed. This website is where people can download the game, which is available for Windows for now, and learn about it before they play. Visitors can see the trash that is in the game, the world, the characters, the gameplay and the controls. The download comes from GitHub Releases, and the Report Bug button opens GitHub Issues. I do not expect much, I simply hope that some people will download the game and enjoy it.",
    role: "Full Stack",
    duration: "About 1 week",
    team: "Solo",
    stack: ["React", "TypeScript", "CSS", "Tailwind CSS", "Vite", "Vercel"],
    highlights: [
      "Download button for the Windows version, served from GitHub Releases",
      "Report Bug button that opens GitHub Issues",
      "Sections for the characters, world, trash, gameplay and controls",
      "A day and night toggle on the home page",
      "Pixel art style that matches the game",
      "Layout adjusted to fit both desktop and Android screens",
    ],
    challenge:
      "Because I built this website with the help of AI, there was almost nothing that was truly hard. The main work was adjusting the layout several times so that it looks right on both desktop and Android.",
    solution:
      "I kept the website simple and let GitHub handle the downloads and bug reports through Releases and Issues. Then I went through the layout again and again until it fit properly on desktop and Android screens.",
    results: [
      { value: 16, suffix: "", label: "Characters to unlock" },
      { value: 8, suffix: "", label: "Biomes to explore" },
      { value: 9, suffix: "", label: "Types of trash" },
    ],
    link: "https://trashcollector.vercel.app/",
    repo: "https://github.com/BadutZY-Studio/trash-collector-website",
    art: "mobile",
    gallery: [
      "/projects/trash-collector.webp",
      { src: "/projects/trash-collector/tablet.png", caption: "Tablet" },
      { src: "/projects/trash-collector/mobile.png", caption: "Mobile" },
    ],
  },
  {
    image: "/projects/jkt48-guess-who.webp",
    images: ["/projects/jkt48-guess-who.webp", "/projects/valo-guess-who.webp"],
    slug: "guess-who-online",
    title: "Guess Who Online: JKT48 and Valorant Edition",
    year: "2026",
    kind: "Web Game",
    desc: "An online two player Guess Who game with a JKT48 edition and a Valorant edition, played in real time with friends.",
    overview:
      "An online version of the classic Guess Who game, made for JKT48 fans and Valorant players like me. One player creates a room and shares the room code, and a friend joins with that code, so two people can play together even when they are far apart. Each player secretly picks one character for the other to guess, then opens and closes characters or items while playing, passes the turn with a button and tries to guess. A wrong guess means that player loses. There are two editions with the same gameplay: one with JKT48 members, and one with Valorant agents, abilities, weapons and maps. Players talk through Discord or WhatsApp while they play, and I enjoy playing it with my friends whenever we are bored.",
    role: "Full Stack",
    duration: "About 3 weeks",
    team: "Solo",
    stack: ["React", "TypeScript", "CSS", "Tailwind CSS", "Vite", "Supabase", "PostgreSQL", "Vercel"],
    highlights: [
      "Online rooms for two players, joined with a room code",
      "Each player secretly picks one character to be guessed",
      "Open and close characters or items to narrow down the answer",
      "Turn switching with a button, and a wrong guess loses the game",
      "Real time sync between both players with Supabase realtime",
      "Two editions with the same gameplay: JKT48 and Valorant",
    ],
    challenge:
      "Keeping two players in sync was the hardest part. Sometimes there was a delay between the players, and sometimes an action was not sent or did not match on the other side. On top of that, all the data for members, agents, abilities, weapons and maps had to be collected online and entered by hand.",
    solution:
      "I used Supabase realtime to share the room state between both players and kept improving the game logic until it was stable enough to play. Because both editions work the same way, only the characters and items are different, so the second edition could reuse the same gameplay.",
    results: [
      { value: 2, suffix: "", label: "Editions, JKT48 and Valorant" },
      { value: 2, suffix: "", label: "Players per room" },
      { value: 3, suffix: "", label: "Weeks to build both" },
    ],
    link: "https://jkt48guesswho.vercel.app/",
    links: [
      { label: "JKT48 edition", href: "https://jkt48guesswho.vercel.app/" },
      { label: "Valorant edition", href: "https://valorantguesswho.vercel.app/" },
    ],
    art: "dashboard",
    gallery: [
      { src: "/projects/jkt48-guess-who.webp", caption: "JKT48 edition, desktop" },
      { src: "/projects/jkt48-guess-who/tablet.png", caption: "JKT48 edition, tablet" },
      { src: "/projects/jkt48-guess-who/mobile.png", caption: "JKT48 edition, mobile" },
      { src: "/projects/valo-guess-who.webp", caption: "Valorant edition, desktop" },
      { src: "/projects/valo-guess-who/tablet.png", caption: "Valorant edition, tablet" },
      { src: "/projects/valo-guess-who/mobile.png", caption: "Valorant edition, mobile" },
    ],
  },
  {
    image: "/projects/quiz-materi.webp",
    slug: "quiz-materi",
    title: "Quiz Materi",
    year: "2026",
    kind: "Web Game",
    desc: "An educational quiz game for school subjects, with single player and online multiplayer modes, reading materials and four difficulty levels.",
    overview:
      "Quiz Materi is an educational quiz game made for a school group assignment, where our task was to create a game with an educational theme. I chose a quiz and built the whole website myself. Players pick one of five school subjects (Mathematics, Indonesian, English, History and Science) and can read the learning material first, so they know the topic before the questions begin. The quiz can be played alone or with friends: in multiplayer, a player enters a name, creates a room and shares the room code, and up to four players can join and answer the same questions. When everyone has finished, the final scores show who did best. Each subject has four difficulty levels (Easy, Normal, Hard and Very Hard) that unlock one by one, and every quiz can be played with a timer or without a time limit. No login is needed, since players only type in their name. The assignment has been presented in front of the class and tested by several of my friends.",
    role: "Full Stack",
    client: "School class project",
    duration: "About 1 week",
    team: "Solo for the website, within a class group assignment",
    stack: ["React", "JavaScript", "CSS", "Vite", "Supabase", "PostgreSQL", "Vercel"],
    highlights: [
      "Single player and online multiplayer modes in the same game",
      "Multiplayer rooms for up to 4 players, joined with a room code and no login",
      "Five subjects, each with learning material to read before the quiz",
      "Four difficulty levels that unlock one after another: Easy, Normal, Hard and Very Hard",
      "Multiple choice questions with two modes, timed or unlimited",
      "A shuffled question bank, and a final score with correct and wrong answers, plus a ranking in multiplayer",
    ],
    challenge:
      "The hardest part was finding a design that looked good and still suited a quiz, which took a while. Collecting enough questions was also tiring, because every difficulty level needed many of them. On top of that, the realtime part took the longest, since the players were sometimes out of sync.",
    solution:
      "I looked for references for the questions and learning material, and used AI to help write both. I kept the interface in a style that fits the quiz theme as much as I could. For the realtime part, I made several adjustments in Supabase, with help from AI as well, until the rooms became stable. The questions are stored in the code and shuffled every time a quiz starts, so only the developer can change them.",
    results: [
      { value: 5, suffix: "", label: "School subjects" },
      { value: 4, suffix: "", label: "Difficulty levels" },
      { value: 4, suffix: "", label: "Players per room" },
    ],
    link: "https://quiz-materi.vercel.app/",
    art: "blog",
    gallery: [
      "/projects/quiz-materi.webp",
      { src: "/projects/quiz-materi/tablet.png", caption: "Tablet" },
      { src: "/projects/quiz-materi/mobile.png", caption: "Mobile" },
    ],
  },
  {
    image: "/projects/chained-together.webp",
    slug: "chained-together-website",
    title: "Chained Together Website",
    year: "2025",
    kind: "Website",
    desc: "The online shop of our group's handmade keychains, with a product catalog, a loyalty card and a cart that checks out through WhatsApp.",
    overview:
      "Chained Together is the name of my group, and for a group project we made and sell our own handmade keychains, which can be personalized with letters and accessories. My part was to build this website, and I made it alone. It is made for buyers who want to look at our products or order them. Visitors can browse the products, see the gallery, learn about the loyalty card, and order with a shopping cart, which sends the checkout to WhatsApp. Every photo on the website shows our own real products, taken by us. The website works the way I wanted: buyers can see the products before they buy, and they can learn about and use the loyalty card.",
    role: "Full Stack",
    duration: "1 to 2 weeks",
    team: "Solo on the website, for my group Chained Together",
    stack: ["React", "TypeScript", "CSS", "Tailwind CSS", "Vite", "Vercel"],
    highlights: [
      "A catalog of our real keychains, with photos we took ourselves",
      "A shopping cart whose checkout opens WhatsApp to place the order",
      "A loyalty card section so buyers know how to use it",
      "A gallery of our products",
      "No database: the photos are stored locally or on GitHub",
      "Pages for home, about us, products and contact",
    ],
    challenge:
      "The hardest part was the design. On mobile the layout is sometimes still a little messy, and the website is a bit heavy because it has quite a lot of effects and has not been fully optimized yet.",
    solution:
      "I kept the website simple by using static files instead of a database, and sent the orders to WhatsApp so that buyers can order without any account or payment system. I also kept adjusting the layout for mobile, and there is still room to make the website lighter by reducing the effects.",
    results: [
      { value: 4, suffix: "", label: "Main pages" },
      { value: 0, suffix: "", label: "Databases needed" },
      { value: 2, suffix: "", label: "Weeks at most to build" },
    ],
    link: "https://chained-together.vercel.app/",
    repo: "https://github.com/Chained-Togetherr/chained-together",
    art: "kanban",
    gallery: [
      "/projects/chained-together.webp",
      { src: "/projects/chained-together/tablet.png", caption: "Tablet" },
      { src: "/projects/chained-together/mobile.png", caption: "Mobile" },
    ],
  },
  {
    image: "/projects/jkt48-website.webp",
    slug: "jkt48-website-remake",
    title: "JKT48 Website Remake",
    year: "2025",
    kind: "Website",
    desc: "A practice project that remakes the JKT48 website with a cleaner UI and UX, built with plain HTML, CSS and JavaScript.",
    overview:
      "A remake of the JKT48 website, created because the original felt lacking in UI and UX. I rebuilt it with roughly the same structure (Home, News, Schedule, Members, Shop and Theater) but with a cleaner and easier to use design. It is a UI only practice project and one of my earliest, built with plain HTML, CSS and JavaScript and no framework. The shop is only a demo where buying is pretend, and the Login and Register buttons are for display. It is not the official website and I do not expect anyone to use it.",
    role: "Full Stack",
    duration: "1 week",
    team: "Solo",
    stack: ["HTML", "CSS", "JavaScript"],
    highlights: [
      "Home page with a banner slider and news cards",
      "Pages for news, schedule, members, shop and theater",
      "Demo shop where the purchase is only for show",
      "Login and Register buttons for display only",
      "Responsive layout for desktop, tablet and mobile",
      "Built with plain HTML, CSS and JavaScript, no framework",
    ],
    challenge:
      "I was still learning when I built this, so I made it without any framework, using only native HTML, CSS and JavaScript. All of the content, such as news, members and schedules, had to be added one by one by hand, which was very tiring.",
    solution:
      "I kept the same structure as the original website from 2025 and earlier, and focused on a cleaner layout and a smoother experience. Since there is no backend or API, every piece of data is written straight into the code, which kept the project simple and let me concentrate on practicing the front end.",
    results: [
      { value: 6, suffix: "", label: "Main pages" },
      { value: 3, suffix: "", label: "Screen sizes designed" },
      { value: 0, suffix: "", label: "Frameworks used" },
    ],
    link: "https://jkt48-website.vercel.app/",
    repo: "https://github.com/BadutZY/JKT48-Website",
    art: "landing",
    gallery: [
      "/projects/jkt48-website.webp",
      { src: "/projects/jkt48/tablet.png", caption: "Tablet" },
      { src: "/projects/jkt48/mobile.png", caption: "Mobile" },
    ],
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

/* ───────── Skills ───────── */

/**
 * HOW TO ADD A SKILL (coloured logo, no percentages)
 * Add one line to the right group below:
 *   { name: "Vue", logo: "vue" }
 * - logo: the Devicon name (find it at https://devicon.dev). Shown in its original colours.
 * - logo: "/skills/my-logo.svg" uses your own file from public/skills/.
 * - mono: true for logos that are black by design (GitHub, Vercel, Next.js, Express): they turn white in dark theme.
 * - icon: optional line icon from components/ui/Icon.tsx, used when there is no logo (or it fails to load).
 * The Skills page, the home marquee and the hero ticker update automatically.
 */
export type Skill = { name: string; logo?: string; icon?: string; mono?: boolean };

export const skills: { group: string; icon: string; items: Skill[] }[] = [
  {
    group: "Frontend",
    icon: "monitor",
    items: [
      { name: "HTML", logo: "html5" },
      { name: "CSS", logo: "css3" },
      { name: "JavaScript", logo: "javascript" },
      { name: "TypeScript", logo: "typescript" },
      { name: "React", logo: "react" },
      { name: "Next.js", logo: "nextjs", mono: true },
      { name: "Vite", logo: "vitejs" },
      { name: "Tailwind CSS", logo: "tailwindcss" },
      { name: "Bootstrap", logo: "bootstrap" },
      { name: "Blade", icon: "braces" },
    ],
  },
  {
    group: "Backend and Database",
    icon: "server",
    items: [
      { name: "PHP", logo: "php" },
      { name: "Laravel", logo: "laravel" },
      { name: "Filament", icon: "layers" },
      { name: "Node.js", logo: "nodejs" },
      { name: "Prisma", logo: "prisma", mono: true },
      { name: "SQL", icon: "database" },
      { name: "MySQL", logo: "mysql" },
      { name: "PostgreSQL", logo: "postgresql" },
      { name: "Supabase", logo: "supabase" },
    ],
  },
  {
    group: "Mobile",
    icon: "smartphone",
    items: [
      { name: "Kotlin", logo: "kotlin" },
      { name: "XML", icon: "code" },
      { name: "React Native", logo: "react" },
      { name: "Expo", logo: "expo", mono: true, icon: "smartphone" },
    ],
  },
  {
    group: "Games and Hardware",
    icon: "cpu",
    items: [
      { name: "C#", logo: "csharp" },
      { name: "GDScript", logo: "godot" },
      { name: "C++", logo: "cplusplus" },
      { name: "ESP32", icon: "cpu" },
    ],
  },
  {
    group: "Minecraft Mod",
    icon: "layers",
    items: [
      { name: "Java", logo: "java" },
      { name: "Fabric", logo: "/skills/fabric.webp" },
      { name: "Forge", logo: "/skills/forge.webp" },
      { name: "NeoForge", logo: "/skills/neoforge.webp" },
    ],
  },
  {
    group: "Build and Deploy",
    icon: "git-branch",
    items: [
      { name: "Gradle", logo: "gradle" },
      { name: "NPM", logo: "npm" },
      { name: "PNPM", logo: "pnpm" },
      { name: "Git", logo: "git" },
      { name: "GitHub", logo: "github", mono: true },
      { name: "Figma", logo: "figma" },
      { name: "Vercel", logo: "vercel", mono: true },
    ],
  },
];

/** Plain list of skill names, used by the marquees. */
export const skillNames: string[] = skills.flatMap((g) => g.items.map((i) => i.name));

/** "My workspace" tiles. Same format as skills: { name, logo, mono? } (see the note above `Skill`). */
export const tools: Skill[] = [
  { name: "Visual Studio Code", logo: "vscode" },
  { name: "Visual Studio", logo: "visualstudio" },
  { name: "Android Studio", logo: "androidstudio" },
  { name: "IntelliJ IDEA", logo: "intellij" },
  { name: "Apache NetBeans", logo: "netbeans" },
  { name: "Unity", logo: "unity", mono: true },
  { name: "Godot", logo: "godot" },
  { name: "Arduino IDE", logo: "arduino" },
  { name: "XAMPP", logo: "xampp" },
  { name: "Figma", logo: "figma" },
  { name: "Git", logo: "git" },
  { name: "GitHub", logo: "github", mono: true },
];

/** Shown on the Skills page under "Recent focus". */
export const learning = ["Website development", "Game development", "Mod creation"];