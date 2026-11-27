"use client";

import { Suspense, useEffect, useState } from "react";
import { NeutralToneMapping } from "three";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF, useTexture } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import Band from "./Band";

const MODEL = "/assets/3d/card.glb";
const art = (theme: string) => ({ card: `/assets/images/card_${theme}.webp`, tag: `/assets/images/tag_${theme}.webp` });

/**
 * Interactive 3D lanyard badge: drag, throw and swing the card. Built on React Three Fiber and Rapier physics,
 * adapted from the MIT licensed "Interactive 3D Event Badge" by Daffa Haidar Nabil Zufar (see README).
 * The card is light on the dark theme and dark on the light theme, and swaps live when the theme changes.
 */
export default function Badge3D({ active }: { active: boolean }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const read = () => setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  const a = art(theme);

  return (
    <Canvas
      camera={{ position: [0, 0, 10.5], fov: 25 }}
      dpr={[1, typeof navigator !== "undefined" && navigator.hardwareConcurrency <= 4 ? 1 : 1.75]}
      frameloop={active ? "always" : "never"}
      gl={{ toneMapping: NeutralToneMapping, antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={Math.PI} />
      <Suspense fallback={null}>
        <Physics gravity={[0, -40, 0]} timeStep={1 / 60} interpolate paused={!active}>
          <Band key={theme} cardUrl={a.card} tagUrl={a.tag} active={active} />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL);
useTexture.preload(art("light").card);