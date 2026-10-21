import type { ReactNode } from "react";
import { Logo } from "./Logo";

/** Mise en page des pages d'accès: panneau de marque Electra et formulaire. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="auth">
      <section className="auth-brand">
        <div className="grid-bg" />
        <Logo variant="white" height={32} />
        <div className="mobile-hide">
          <h2>Votre direction marketing, propulsée par l'IA.</h2>
          <ul style={{ marginTop: 24 }}>
            <li>Stratégie complète en six étapes</li>
            <li>Budgets en FCFA, paiement Mobile Money</li>
            <li>Calendrier éditorial prêt à publier</li>
            <li>14 jours d'essai gratuit</li>
          </ul>
        </div>
        <p className="mobile-hide small" style={{ color: "#c9cbff", margin: 0 }}>Côte d'Ivoire · Sénégal · Cameroun · Burkina Faso · Mali · Bénin · Togo</p>
      </section>
      <section className="auth-form">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="muted" style={{ marginTop: -6 }}>{subtitle}</p>}
          {children}
        </div>
      </section>
    </div>
  );
}
