"use client";
import { useEffect, useRef, useState } from "react";
import { Mascot, type Pose } from "./Mascot";

// Poses successives pendant la descente, du hero au pied de page.
const POSES: Pose[] = ["wave", "point", "think", "happy", "surprised", "point", "happy"];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/**
 * BEN quitte le hero et accompagne la lecture jusqu'au pied de page: trajectoire en 3D
 * (rotation, inclinaison selon la vitesse, ombre), pose qui change par étape, puis atterrissage
 * dans le pied de page (`.footer-ben`). Désactivé avec « réduire les animations » et sur petit écran.
 */
export function BenJourney() {
  const ref = useRef<HTMLDivElement>(null);
  const [pose, setPose] = useState<Pose>("wave");
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const wide = window.matchMedia("(min-width: 900px)");
    const hero = document.querySelector<HTMLElement>(".hero");
    const footer = document.querySelector<HTMLElement>(".footer");
    const dock = document.querySelector<HTMLElement>(".footer-ben");
    if (!hero || !footer) return;
    setOn(true);
    for (const p of POSES) { const img = new Image(); img.src = `/mascot/${p}.webp`; }

    let frame = 0, lastY = window.scrollY, tilt = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const y = window.scrollY, vh = window.innerHeight;
      const start = hero.offsetTop + hero.offsetHeight * 0.55;
      // Fin du voyage: quand le pied de page entre à l'écran (ou en bas de page si celle-ci est courte).
      const end = Math.min(footer.offsetTop - vh * 0.6, document.documentElement.scrollHeight - vh - 8);
      const p = clamp((y - start) / Math.max(1, end - start));
      const landed = y >= end;
      dock?.classList.toggle("is-landed", landed || !wide.matches);
      const flying = wide.matches && y > start && !landed;
      // Vitesse de défilement → inclinaison, amortie pour rester fluide.
      tilt = tilt * 0.85 + clamp((y - lastY) * 0.6, -18, 18) * 0.15;
      lastY = y;
      const swing = Math.sin(p * Math.PI * 4);
      const x = -40 - (1 + swing) * 22;              // va-et-vient le long du bord droit
      const top = vh * (0.16 + p * 0.5);
      const rotY = swing * 32;                        // BEN pivote sur lui-même
      const rotZ = -tilt + Math.cos(p * Math.PI * 6) * 6;
      const scale = 0.9 + Math.sin(p * Math.PI) * 0.18;
      el.style.opacity = flying ? "1" : "0";
      el.style.transform = `translate3d(${x}px, ${flying ? top : top - 120}px, 0) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${flying ? scale : 0.6})`;
      el.style.setProperty("--shadow", String(0.25 + (1 - Math.abs(swing)) * 0.2));
      setPose(POSES[Math.min(POSES.length - 1, Math.floor(p * POSES.length))]);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  if (!on) return null;
  return (
    <div className="ben-journey" aria-hidden="true">
      <div ref={ref} className="ben-journey-body">
        <Mascot key={pose} pose={pose} height={120} motion="none" eager className="ben-journey-img" />
        <span className="ben-journey-shadow" />
      </div>
    </div>
  );
}
