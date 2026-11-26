"use client";

import Link, { type LinkProps } from "next/link";
import { forwardRef } from "react";
import { usePageTransition } from "./TransitionProvider";

type Props = LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    href: string;
  };

/** next/link that plays the page curtain before changing route. Modified clicks keep native behavior. */
const TransitionLink = forwardRef<HTMLAnchorElement, Props>(function TransitionLink({ href, onClick, target, ...rest }, ref) {
  const { navigate } = usePageTransition();
  return (
    <Link
      ref={ref}
      href={href}
      target={target}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (target && target !== "_self") return;
        if (/^(https?:|mailto:|tel:)/.test(href)) return;
        e.preventDefault();
        navigate(href);
      }}
      {...rest}
    />
  );
});

export default TransitionLink;
