import localFont from "next/font/local";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const inter = localFont({
  variable: "--font-inter",
  display: "swap",
  src: [
    { path: "./fonts/Inter-Regular.otf", weight: "400" },
    { path: "./fonts/Inter-Medium.otf", weight: "500" },
    { path: "./fonts/Inter-SemiBold.otf", weight: "600" },
    { path: "./fonts/Inter-Bold.otf", weight: "700" },
  ],
});

const interDisplay = localFont({
  variable: "--font-inter-display",
  display: "swap",
  src: [
    { path: "./fonts/InterDisplay-Bold.otf", weight: "700" },
    { path: "./fonts/InterDisplay-ExtraBold.otf", weight: "800" },
  ],
});

export const metadata: Metadata = {
  title: { default: "Benely — Copilote marketing IA pour l'Afrique", template: "%s · Benely" },
  description: "Diagnostic, stratégie, contenus et budget marketing générés par IA, adaptés aux marchés africains.",
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#29309B" }, { media: "(prefers-color-scheme: dark)", color: "#070B24" }],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${interDisplay.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
      <body>{children}</body>
    </html>
  );
}
