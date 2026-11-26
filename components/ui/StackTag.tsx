"use client";

import SkillIcon from "./SkillIcon";
import { skills, tools, type Skill } from "@/lib/data";

/** Looks a tech name up in the Skills page data so project tags reuse the exact same logos. */
const lookup = new Map<string, Skill>();
for (const t of tools) lookup.set(t.name.toLowerCase(), t);
for (const g of skills) for (const s of g.items) lookup.set(s.name.toLowerCase(), s);

/** One tech stack chip: the logo from Skills (when the name exists there) followed by the name. */
export default function StackTag({ name }: { name: string }) {
  const skill = lookup.get(name.toLowerCase());
  return (
    <li>
      {skill ? <SkillIcon skill={skill} size={18} /> : null}
      {name}
    </li>
  );
}
