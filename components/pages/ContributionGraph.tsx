"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Contributions, Day } from "@/lib/github";
import Counter from "@/components/ui/Counter";
import Icon from "@/components/ui/Icon";

const RANGES = [
  { id: 12, label: "12 months" },
  { id: 6, label: "6 months" },
  { id: 3, label: "3 months" },
] as const;
const DAY_MS = 86_400_000;
const ms = (d: string) => Date.parse(d + "T00:00:00Z");
const wd = (d: string) => new Date(ms(d)).getUTCDay();
const fmtLong = (d: string) => new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(ms(d));
const fmtShort = (d: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(ms(d));
const month = (d: string) => new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(ms(d));
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const plural = (n: number) => `${n.toLocaleString("en-US")} contribution${n === 1 ? "" : "s"}`;

/** GitHub-style contribution heatmap, drawn in the site's black and white with brightness as the intensity. */
export default function ContributionGraph({ data }: { data: Contributions }) {
  const [range, setRange] = useState<3 | 6 | 12>(12);
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [hl, setHl] = useState<number | null>(null);
  const [shown, setShown] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  // the visible slice of days for the chosen range
  const days = useMemo<Day[]>(() => {
    const all = data.days;
    if (range === 12) return all;
    const end = new Date(ms(all[all.length - 1].date));
    end.setUTCMonth(end.getUTCMonth() - range);
    const from = end.getTime();
    return all.filter((d) => ms(d.date) > from);
  }, [data, range]);

  // columns of 7 (Sunday first); blanks pad the first week
  const { weeks, labels } = useMemo(() => {
    const lead = wd(days[0].date);
    const cells: (Day | null)[] = [...Array<null>(lead).fill(null), ...days];
    const weeks: (Day | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    const labels: { w: number; text: string }[] = [];
    let last = -1;
    weeks.forEach((wk, w) => {
      const first = wk.find(Boolean) as Day;
      const m = new Date(ms(first.date)).getUTCMonth();
      if (m !== last) {
        // skip a label that would collide with the previous one
        if (!labels.length || w - labels[labels.length - 1].w >= 3) labels.push({ w, text: month(first.date) });
        last = m;
      }
    });
    return { weeks, labels };
  }, [days]);

  const stats = useMemo(() => {
    let total = 0, active = 0, longest = 0, run = 0, best: Day = days[0];
    const byDay = Array(7).fill(0) as number[];
    for (const d of days) {
      total += d.count;
      byDay[wd(d.date)] += d.count;
      if (d.count > 0) {
        active++;
        run++;
        if (run > longest) longest = run;
      } else run = 0;
      if (d.count > best.count) best = d;
    }
    // current streak counts back from the latest day (today may still be empty, so start from yesterday then)
    let current = 0;
    let k = days.length - 1;
    if (days[k].count === 0) k--;
    for (; k >= 0 && days[k].count > 0; k--) current++;
    const busiest = byDay.indexOf(Math.max(...byDay));
    return { total, active, longest, current, best, byDay, busiest, max: Math.max(...byDay, 1) };
  }, [days]);

  const flat = days; // index lookup for the hovered cell
  const selected = useMemo(() => {
    if (hover) return flat[hover.i];
    if (pinned) return flat.find((d) => d.date === pinned) ?? null;
    return null;
  }, [hover, pinned, flat]);

  // play the entrance once, when the graph scrolls into view
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setShown(true), io.disconnect()), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // start at the newest week on small screens
  useEffect(() => {
    const s = scroller.current;
    if (s) s.scrollLeft = s.scrollWidth;
  }, [range]);
  useEffect(() => setPinned(null), [range]);

  const onOver = (e: React.PointerEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-i]");
    if (!el) return;
    setHover({ i: Number(el.dataset.i), x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop });
  };
  const onClick = (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-i]");
    if (!el) return;
    const d = flat[Number(el.dataset.i)];
    setPinned((p) => (p === d.date ? null : d.date));
  };

  // tooltip position, kept inside the graph
  const tipW = 190;
  const wrapW = wrap.current?.offsetWidth ?? 0;
  const tipX = hover ? Math.min(Math.max(hover.x, tipW / 2), Math.max(tipW / 2, wrapW - tipW / 2)) : 0;
  const pct = selected ? Math.round((selected.count / Math.max(stats.best.count, 1)) * 100) : 0;
  const first = days[0].date, lastD = days[days.length - 1].date;

  return (
    <div ref={root} className={`gh${shown ? " in" : ""}`} data-range={range} data-hl={hl ?? undefined}>
      <div className="gh-top">
        <div>
          <p className="gh-count">
            <b>{stats.total.toLocaleString("en-US")}</b> contributions in the last {range === 12 ? "year" : `${range} months`}
          </p>
          <a className="gh-user" href={`https://github.com/${data.user}`} target="_blank" rel="noreferrer" data-cursor="GitHub">
            <Icon name="github" size={16} /> @{data.user} <Icon name="arrow-up-right" size={14} />
          </a>
        </div>
        <div className="chips" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <button key={r.id} type="button" className={`chip${range === r.id ? " on" : ""}`} onClick={() => setRange(r.id)} aria-pressed={range === r.id}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gh-panel">
        <div className="gh-scroll" ref={scroller}>
          <div className="gh-body" style={{ "--weeks": weeks.length } as React.CSSProperties}>
            <div className="gh-months" aria-hidden>
              {labels.map((l) => (
                <span key={l.w} style={{ gridColumn: l.w + 1 }}>
                  {l.text}
                </span>
              ))}
            </div>
            <div className="gh-row">
              <ul className="gh-days" aria-hidden>
                {WEEKDAYS.map((n, i) => (
                  <li key={n}>{i % 2 ? n : ""}</li>
                ))}
              </ul>
              <div ref={wrap} className="gh-wrap">
                <div
                  key={range}
                  className="gh-grid"
                  role="img"
                  aria-label={`${plural(stats.total)} on GitHub from ${fmtShort(first)} to ${fmtShort(lastD)}`}
                  onPointerOver={onOver}
                  onPointerLeave={() => setHover(null)}
                  onClick={onClick}
                >
                  {weeks.map((wk, w) =>
                    wk.map((d, r) => {
                      if (!d) return <i key={`${w}-${r}`} className="gh-c gh-blank" style={{ gridColumn: w + 1, gridRow: r + 1 }} />;
                      const i = flat.indexOf(d);
                      return (
                        <i
                          key={d.date}
                          className={`gh-c${pinned === d.date ? " pin" : ""}${hover?.i === i ? " hot" : ""}`}
                          data-i={i}
                          data-l={d.level}
                          style={{ gridColumn: w + 1, gridRow: r + 1, "--w": w } as React.CSSProperties}
                        />
                      );
                    }),
                  )}
                </div>
                {hover && (
                  <div className="gh-tip" style={{ left: tipX, top: hover.y }} aria-hidden>
                    <b>{plural(flat[hover.i].count)}</b>
                    <span>{fmtLong(flat[hover.i].date)}</span>
                    <i style={{ left: hover.x - tipX + tipW / 2 }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="gh-foot">
          <p className="gh-detail" aria-live="polite">
            {selected ? (
              <>
                <b>{plural(selected.count)}</b> on {fmtLong(selected.date)}
                <span className="gh-bar" aria-hidden>
                  <i style={{ width: `${pct}%` }} />
                </span>
              </>
            ) : (
              <span className="gh-hint">Hover a day to see it, click to pin it.</span>
            )}
          </p>
          <div className="gh-legend" onPointerLeave={() => setHl(null)}>
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((l) => (
              <button
                key={l}
                type="button"
                className="gh-c gh-key"
                data-l={l}
                aria-label={`Level ${l}`}
                aria-pressed={hl === l}
                onPointerEnter={() => setHl(l)}
                onFocus={() => setHl(l)}
                onBlur={() => setHl(null)}
                onClick={() => setHl((h) => (h === l ? null : l))}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      <ul className="gh-stats">
        <li>
          <Counter key={`t${stats.total}`} value={stats.total} className="gh-n" />
          <span className="gh-l">Contributions</span>
          <em>{stats.active ? `${(stats.total / stats.active).toFixed(1)} per active day` : "no activity yet"}</em>
        </li>
        <li>
          <Counter key={`a${stats.active}`} value={stats.active} className="gh-n" />
          <span className="gh-l">Active days</span>
          <em>{Math.round((stats.active / days.length) * 100)}% of the period</em>
        </li>
        <li>
          <Counter key={`l${stats.longest}`} value={stats.longest} suffix={stats.longest === 1 ? " day" : " days"} className="gh-n" />
          <span className="gh-l">Longest streak</span>
          <em>{stats.current > 0 ? `${stats.current} day${stats.current === 1 ? "" : "s"} running now` : "none running now"}</em>
        </li>
        <li>
          <Counter key={`b${stats.best.count}`} value={stats.best.count} className="gh-n" />
          <span className="gh-l">Best day</span>
          <em>{stats.best.count ? fmtShort(stats.best.date) : "-"}</em>
        </li>
        <li className="gh-wk">
          <div className="gh-bars" aria-hidden>
            {stats.byDay.map((v, i) => (
              <span key={i} className={i === stats.busiest ? "top" : ""} title={`${WEEKDAYS[i]}: ${plural(v)}`}>
                <i style={{ height: `${Math.max(6, (v / stats.max) * 100)}%` }} />
              </span>
            ))}
          </div>
          <span className="gh-l">Busiest day</span>
          <em>{stats.total ? `${WEEKDAYS[stats.busiest]} (${plural(stats.byDay[stats.busiest])})` : "-"}</em>
        </li>
      </ul>
      <p className="gh-note">{data.live ? "Synced from github.com, refreshed hourly." : "Showing a saved copy of my GitHub activity."}</p>
    </div>
  );
}
