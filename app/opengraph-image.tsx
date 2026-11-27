import { ImageResponse } from "next/og";
import { site } from "@/lib/data";

export const alt = `${site.name}, ${site.roles[0]} from ${site.geo.city}, ${site.geo.country}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#000000",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, color: "#a3a3a3" }}>
          {`${site.short} / ${site.geo.city.toUpperCase()}, ${site.geo.country.toUpperCase()}`}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 800, lineHeight: 1.05 }}>{site.name}</div>
          <div style={{ display: "flex", fontSize: 34, marginTop: 24, color: "#d4d4d4" }}>
            {site.roles.join("  /  ")}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#a3a3a3" }}>
          {`Websites, games and Minecraft mods  |  ${site.status}`}
        </div>
      </div>
    ),
    size,
  );
}