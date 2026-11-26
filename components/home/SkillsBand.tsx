import { skillNames } from "@/lib/data";
import Marquee from "@/components/ui/Marquee";

/** Decorative closing marquee under the skills summary. */
export default function SkillsBand() {
  const a = skillNames;
  const b = [...a].reverse();
  return (
    <section className="band" aria-hidden>
      <div className="band-rows">
        <Marquee items={a} outline size="xl" duration={50} />
        <Marquee items={b} direction={-1} size="xl" duration={60} />
      </div>
    </section>
  );
}
