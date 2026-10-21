import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Benely — Copilote marketing IA pour l'Afrique",
  description: "Diagnostic, stratégie, contenus et budget marketing générés par IA, adaptés aux marchés africains.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
