import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata = { title: "Benely — Copilote Marketing & Communication", description: "Stratégie marketing pilotée par IA pour les entreprises africaines." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="nav">
          <strong>Benely</strong>
          <nav>
            <Link href="/">Stratégie</Link>
            <Link href="/performance">Performance</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
