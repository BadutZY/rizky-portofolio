import { site } from "@/lib/data";

/** Generated monochrome portrait placeholder. Set site.photo in lib/data.ts to show a real photo. */
export default function Portrait() {
  const initials = site.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="portrait">
      {site.photo ? (
        <img src={site.photo} alt={site.name} />
      ) : (
        <svg viewBox="0 0 400 480" aria-hidden>
          <defs>
            <pattern id="halftone" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="7" cy="7" r="2" fill="currentColor" fillOpacity=".22" />
            </pattern>
            <path id="ringpath" d="M200 240 m-150 0 a150 150 0 1 1 300 0 a150 150 0 1 1 -300 0" />
          </defs>
          <rect width="400" height="480" fill="url(#halftone)" />
          <g className="art-spin" style={{ transformOrigin: "200px 240px" }}>
            <text fontSize="15" letterSpacing="6" fill="currentColor" fillOpacity=".7">
              <textPath href="#ringpath">{`${site.roles.join(" - ").toUpperCase()} - `.repeat(2)}</textPath>
            </text>
          </g>
          <circle cx="200" cy="240" r="108" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5" />
          <text x="200" y="272" textAnchor="middle" fontSize="92" fontWeight="700" fill="currentColor" letterSpacing="-4">
            {initials}
          </text>
        </svg>
      )}
      <span className="portrait-tag">
        <i /> {site.available ? site.status : "Not available"}
      </span>
    </div>
  );
}
