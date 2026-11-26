import snapshot from "./github-snapshot.json";
import { site } from "./data";

export type Day = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };
export type Contributions = {
  user: string;
  total: number;
  days: Day[];
  /** true when fetched from github.com just now, false when the bundled snapshot is used instead */
  live: boolean;
};

/** Parse the public contribution calendar that github.com serves for any profile (no token needed). */
function parse(html: string): Day[] {
  const tips = new Map<string, string>();
  for (const m of html.matchAll(/<tool-tip[^>]*?\sfor="([^"]+)"[^>]*>\s*([^<]*?)\s*</g)) tips.set(m[1], m[2]);
  const days: Day[] = [];
  for (const m of html.matchAll(/<td[^>]*?data-date="([^"]+)"[^>]*?id="([^"]+)"[^>]*?data-level="(\d)"/g)) {
    const n = /^(\d+) contribution/.exec(tips.get(m[2]) ?? "");
    days.push({ date: m[1], count: n ? parseInt(n[1], 10) : 0, level: Math.min(4, parseInt(m[3], 10)) as Day["level"] });
  }
  return days.sort((a, b) => (a.date < b.date ? -1 : 1));
}

function fromSnapshot(): Contributions {
  const days = (snapshot.days as [string, number, number][]).map(([date, count, level]) => ({ date, count, level: level as Day["level"] }));
  return { user: snapshot.user, total: days.reduce((a, d) => a + d.count, 0), days, live: false };
}

/**
 * The last year of contributions for site.github. Refreshed at most once an hour (Next.js revalidation).
 * If GitHub cannot be reached, the saved snapshot in lib/github-snapshot.json is used so the page never breaks.
 */
export async function getContributions(): Promise<Contributions> {
  try {
    const res = await fetch(`https://github.com/users/${site.github}/contributions`, {
      next: { revalidate: 3600 },
      headers: { "user-agent": "Mozilla/5.0 (portfolio contribution graph)", accept: "text/html" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const days = parse(await res.text());
    if (days.length < 300) throw new Error("unexpected markup");
    return { user: site.github, total: days.reduce((a, d) => a + d.count, 0), days, live: true };
  } catch {
    return fromSnapshot();
  }
}
