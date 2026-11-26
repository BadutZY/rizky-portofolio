"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/data";

/** Live local time for the site owner. */
export default function Clock({ withZone = true }: { withZone?: boolean }) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: site.timezone });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);
  return <span suppressHydrationWarning>{time || "--:--"}{withZone ? " WIB" : ""}</span>;
}
