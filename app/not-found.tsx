import Icon from "@/components/ui/Icon";
import TransitionLink from "@/components/layout/TransitionLink";

export default function NotFound() {
  return (
    <section className="nf">
      <p className="nf-big" aria-hidden>
        <span>4</span>
        <span className="nf-o">0</span>
        <span>4</span>
      </p>
      <h1 className="fade" style={{ "--d": "0.3s" } as React.CSSProperties}>
        This page wandered off.
      </h1>
      <p className="nf-sub fade" style={{ "--d": "0.4s" } as React.CSSProperties}>
        The link may be broken or the page may have moved. Let's get you back on track.
      </p>
      <div className="fade" style={{ "--d": "0.5s" } as React.CSSProperties}>
        <TransitionLink className="btn btn-solid" href="/">
          <Icon name="arrow-left" size={18} /> Back to home
        </TransitionLink>
      </div>
    </section>
  );
}
