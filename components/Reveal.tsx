"use client";
import { useEffect } from "react";

/**
 * Fait apparaître au défilement les éléments marqués [data-reveal].
 * Sans JavaScript (ou avec « réduire les animations »), tout reste visible.
 */
export function Reveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const fold = window.innerHeight;
    // Ce qui est déjà à l'écran n'est pas masqué (pas de clignotement au chargement).
    for (const n of nodes) if (n.getBoundingClientRect().top < fold) n.dataset.shown = "";
    root.classList.add("reveal-ready");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { (e.target as HTMLElement).dataset.shown = ""; io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    for (const n of nodes) if (!("shown" in n.dataset)) io.observe(n);
    return () => { io.disconnect(); root.classList.remove("reveal-ready"); };
  }, []);
  return null;
}
