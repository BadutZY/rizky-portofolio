"use client";

import { useState } from "react";
import Icon from "./Icon";
import type { Skill } from "@/lib/data";

/** Full-colour brand logos from the Devicon set (https://devicon.dev). `logo` is the Devicon name. */
const devicon = (name: string) => `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${name}/${name}-original.svg`;

/**
 * Shows a skill's coloured logo.
 * - `logo: "react"`            -> Devicon logo (original colours)
 * - `logo: "/skills/vue.svg"`  -> your own file from /public (or any full URL)
 * - `mono: true`               -> logo is black by design (GitHub, Vercel...): it is inverted to white in dark theme
 * If there is no logo, or it fails to load, the line icon from Icon.tsx is shown instead.
 */
export default function SkillIcon({ skill, size = 34 }: { skill: Skill; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (!skill.logo || failed) return <Icon name={skill.icon ?? "code"} size={size - 6} />;

  const src = skill.logo.startsWith("/") || skill.logo.startsWith("http") ? skill.logo : devicon(skill.logo);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`sk-logo${skill.mono ? " sk-logo-mono" : ""}`}
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}