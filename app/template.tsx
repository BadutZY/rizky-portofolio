"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePageTransition } from "@/components/layout/TransitionProvider";

/** Re-runs on every route change and tells the transition that the new page is ready. */
export default function Template({ children }: { children: React.ReactNode }) {
  const { enter } = usePageTransition();
  const pathname = usePathname();

  useEffect(() => {
    enter(pathname);
  }, [pathname, enter]);

  return <div id="page">{children}</div>;
}
