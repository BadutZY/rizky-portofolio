import Reveal from "@/components/ui/Reveal";
import SplitText from "@/components/ui/SplitText";
import TransitionLink from "@/components/layout/TransitionLink";
import Icon from "@/components/ui/Icon";

export default function SectionHead({
  index,
  title,
  sub,
  href,
  cta,
}: {
  index: string;
  title: string;
  sub?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="shead">
      <div>
        <Reveal variant="fade">
          <p className="eyebrow">
            <span>{index}</span> <i className="eyebrow-line" /> <span>{title}</span>
          </p>
        </Reveal>
        <h2 className="sec-title">
          <SplitText text={sub ?? title} as="span" />
        </h2>
      </div>
      {href && (
        <Reveal variant="fade">
          <TransitionLink href={href} className="link-arrow">
            {cta ?? "View all"} <Icon name="arrow-right" size={18} />
          </TransitionLink>
        </Reveal>
      )}
    </div>
  );
}
