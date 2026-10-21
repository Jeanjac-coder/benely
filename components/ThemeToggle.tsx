"use client";
import { useEffect, useState } from "react";
import { THEME_KEY } from "@/lib/theme";

function currentlyDark() {
  const t = document.documentElement.dataset.theme;
  return t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Bascule clair / sombre, mémorisée sur cet appareil. */
export function ThemeToggle({ className = "icon-btn" }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => setDark(currentlyDark()), []);
  function toggle() {
    const next = !currentlyDark();
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem(THEME_KEY, next ? "dark" : "light"); } catch { /* stockage indisponible */ }
    setDark(next);
  }
  return (
    <button type="button" className={className} onClick={toggle} aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"} title={dark ? "Mode clair" : "Mode sombre"}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {dark
          ? <><circle cx="12" cy="12" r="4.2" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>
          : <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />}
      </svg>
    </button>
  );
}
