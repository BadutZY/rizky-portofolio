import Reveal from "@/components/ui/Reveal";

type Fact = { k: string; v: string };

function FactCard({ f, i }: { f: Fact; i: number }) {
  return (
    <div className="fact">
      <span className="fact-n">{String(i + 1).padStart(2, "0")}</span>
      <span className="fact-k">{f.k}</span>
      <b className="fact-v">{f.v}</b>
    </div>
  );
}

/** Quick facts as simple cards: staggered entrance and a plain hover (border and background). */
export default function FactGrid({ facts }: { facts: Fact[] }) {
  return (
    <ul className="facts2">
      {facts.map((f, i) => (
        <Reveal as="li" key={f.k} delay={i * 70}>
          <FactCard f={f} i={i} />
        </Reveal>
      ))}
    </ul>
  );
}