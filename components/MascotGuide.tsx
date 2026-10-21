"use client";
import { useEffect, useState } from "react";
import { Mascot, type Pose } from "./Mascot";

const LINES: { pose: Pose; text: string }[] = [
  { pose: "wave", text: "Akwaba ! Moi c'est BEN, votre copilote marketing." },
  { pose: "point", text: "En 6 étapes, je construis votre stratégie avec vous." },
  { pose: "think", text: "WhatsApp, Instagram, Facebook ou TikTok ? Je trouve le bon mix." },
  { pose: "happy", text: "Essai gratuit, sans carte bancaire. On démarre ?" },
  { pose: "surprised", text: "Déjà ? Vos publications du mois sont prêtes !" },
];

/** Mascotte interactive: change de pose et de bulle au clic (et toutes les 6 s). */
export function MascotGuide({ height = 210 }: { height?: number }) {
  const [i, setI] = useState(0);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const t = setInterval(() => setI((x) => (x + 1) % LINES.length), 6000);
    return () => clearInterval(t);
  }, []);
  const line = LINES[i];
  return (
    <button
      type="button"
      className="guide"
      onClick={() => { setI((x) => (x + 1) % LINES.length); setBump((b) => b + 1); }}
      aria-label="Parler avec BEN"
    >
      <span key={`b${i}`} className="bubble" role="status">{line.text}</span>
      <span key={`m${i}-${bump}`} className="guide-body">
        <Mascot pose={line.pose} height={height} motion="float" />
      </span>
    </button>
  );
}
