import Icon from "@/components/ui/Icon";
import GlitchTitle from "@/components/ui/GlitchTitle";
import PageBackdrop, { type BackdropVariant } from "@/components/ui/PageBackdrop";
import TransitionLink from "@/components/layout/TransitionLink";

/** Shared header for inner pages: breadcrumb, big animated title, lead text, optional meta chips. */
export default function PageHero({
  index,
  title,
  lead,
  crumb,
  meta,
  bg,
}: {
  index: string;
  title: string;
  lead?: string;
  crumb?: { label: string; href?: string }[];
  meta?: { icon: string; text: string }[];
  /** interactive background for the header area (see components/ui/PageBackdrop.tsx) */
  bg?: BackdropVariant;
}) {
  const trail = crumb ?? [{ label: title }];
  return (
    <section className="phero">
      {bg && <PageBackdrop variant={bg} />}
      <div className="wrap">
        <nav className="crumb fade" aria-label="Breadcrumb" style={{ "--d": "0.1s" } as React.CSSProperties}>
          <TransitionLink href="/">
            <Icon name="home" size={14} /> Home
          </TransitionLink>
          {trail.map((c) => (
            <span key={c.label} className="crumb-item">
              <Icon name="chevron-down" size={12} className="crumb-sep" />
              {c.href ? <TransitionLink href={c.href}>{c.label}</TransitionLink> : <span aria-current="page">{c.label}</span>}
            </span>
          ))}
        </nav>
        <div className="phero-row">
          <h1 className="phero-title" aria-label={title}>
            <GlitchTitle text={title} stagger={30} delay={150} />
          </h1>
          {index && (
            <span className="phero-idx fade" aria-hidden style={{ "--d": "0.5s" } as React.CSSProperties}>
              {index}
            </span>
          )}
        </div>
        {lead && (
          <p className="phero-lead fade" style={{ "--d": "0.55s" } as React.CSSProperties}>
            {lead}
          </p>
        )}
        {meta && (
          <ul className="phero-meta fade" style={{ "--d": "0.65s" } as React.CSSProperties}>
            {meta.map((m) => (
              <li key={m.text}>
                <Icon name={m.icon} size={16} /> {m.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
