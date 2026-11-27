import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "lenis/dist/lenis.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Intro from "@/components/layout/Intro";
import Cursor from "@/components/layout/Cursor";
import ScrollProgress from "@/components/layout/ScrollProgress";
import SmoothScroll from "@/components/layout/SmoothScroll";
import Providers from "@/components/layout/Providers";
import Spotlight from "@/components/layout/Spotlight";
import TransitionProvider from "@/components/layout/TransitionProvider";
import JsonLd from "@/components/seo/JsonLd";
import { siteGraph, siteMeta } from "@/lib/seo";
import "./globals.css";

const font = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font",
});

export const metadata: Metadata = siteMeta();

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

// Runs before render so the theme never flashes and the intro is not repeated within a session.
const boot = `try{var d=document.documentElement;d.dataset.theme=localStorage.getItem('theme')||'dark';if(sessionStorage.getItem('intro'))d.dataset.intro='skip'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={font.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
        <noscript>
          <style>{`.intro,.curtain{display:none!important}html:not([data-ready]){overflow:auto!important}.hl>span,.st-c{transform:none!important}.fade,.rv{opacity:1!important;transform:none!important;clip-path:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <JsonLd data={siteGraph()} />
        <SmoothScroll />
        <Providers>
        <Spotlight />
        <TransitionProvider>
          <Intro />
          <ScrollProgress />
          <Cursor />
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </TransitionProvider>
        </Providers>
      </body>
    </html>
  );
}