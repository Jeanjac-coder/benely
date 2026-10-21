import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { Mascot } from "./Mascot";
import { Socials } from "./Socials";
import { ThemeToggle } from "./ThemeToggle";

/** Pages d'accès: bandeau de marque (« BIENVENUE », BEN) et formulaire dans une carte en verre. */
export function AuthLayout({ title, subtitle, children, welcome = "Bienvenue" }: { title: string; subtitle?: string; children: ReactNode; welcome?: string }) {
  return (
    <div className="auth">
      <section className="auth-brand">
        <div className="grid-bg" />
        <div className="top">
          <Logo variant="white" height={30} />
          <ThemeToggle className="icon-btn btn-glass" />
        </div>
        <p className="welcome"><span>Akwaba sur Benely</span>{welcome.toUpperCase()}</p>
        <div className="desktop-only">
          <h2>Votre direction marketing, propulsée par l'IA.</h2>
          <ul style={{ marginTop: 20 }}>
            <li>Stratégie complète en six étapes</li>
            <li>Budgets en FCFA, paiement Mobile Money</li>
            <li>Calendrier éditorial prêt à publier</li>
            <li>14 jours d'essai gratuit</li>
          </ul>
        </div>
        <div className="desktop-only"><Socials /></div>
        <span className="say" aria-hidden="true">Moi c'est BEN, on démarre ?</span>
        <Mascot pose="wave" height={150} motion="float" className="auth-mascot" />
      </section>
      <section className="auth-form">
        <div className="auth-card">
          <h1>{title}</h1>
          {subtitle && <p className="muted" style={{ marginTop: -6 }}>{subtitle}</p>}
          {children}
        </div>
      </section>
    </div>
  );
}
