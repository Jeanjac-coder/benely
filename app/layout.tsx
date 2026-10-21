import localFont from "next/font/local";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Geist (Google Fonts, SIL Open Font License, voir fonts/Geist-OFL.txt), fichier variable 100–900 embarqué.
const geist = localFont({
  variable: "--font-geist",
  display: "swap",
  src: [{ path: "./fonts/Geist-Variable.woff2", weight: "100 900", style: "normal" }],
});

export const metadata: Metadata = {
  title: { default: "Benely — Copilote marketing IA pour l'Afrique", template: "%s · Benely" },
  description: "Audit, stratégie, contenus et plan média générés par IA pour les entreprises d'Afrique francophone. Essai gratuit 14 jours.",
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#204ECF" }, { media: "(prefers-color-scheme: dark)", color: "#050B20" }],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={geist.variable} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
      <body>
        {children}
        {/* Filigrane discret, ton sur ton, sur toutes les pages. */}
        <div className="watermark" aria-hidden="true">BENELY</div>
      </body>
    </html>
  );
}
