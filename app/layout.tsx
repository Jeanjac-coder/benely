import localFont from "next/font/local";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Sora (SIL Open Font License, voir fonts/Sora-OFL.txt), fichier variable 100–800.
const sora = localFont({
  variable: "--font-sora",
  display: "swap",
  src: [{ path: "./fonts/Sora-Variable.woff2", weight: "100 800", style: "normal" }],
});

export const metadata: Metadata = {
  title: { default: "Benely — Copilote marketing IA pour l'Afrique", template: "%s · Benely" },
  description: "Diagnostic, stratégie, contenus et budget marketing générés par IA, adaptés aux marchés africains.",
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#0F11F4" }, { media: "(prefers-color-scheme: dark)", color: "#02031F" }],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={sora.variable} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
      <body>{children}</body>
    </html>
  );
}
