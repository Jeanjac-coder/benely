import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin";

const LINKS = [
  ["/admin", "Vue d'ensemble"], ["/admin/organizations", "Organisations"], ["/admin/users", "Utilisateurs"], ["/admin/plans", "Offres"],
  ["/admin/payments", "Paiements"], ["/admin/ai", "Consommation IA"], ["/admin/prompts", "Prompts"], ["/admin/events", "Incidents"], ["/admin/audit", "Audit"],
] as const;

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return (
    <>
      <header className="topbar">
        <Link href="/admin" className="brand">Benely · Administration</Link>
        <nav className="nav" aria-label="Administration">{LINKS.map(([href, text]) => <Link key={href} href={href}>{text}</Link>)}</nav>
        <span className="small muted">{admin.email} · <Link href="/app">Application</Link></span>
      </header>
      <main style={{ maxWidth: 1200 }}>
        <p className="muted small">Accès limité aux métadonnées: les stratégies et profils des clients ne sont pas consultables depuis l'administration.</p>
        {children}
      </main>
    </>
  );
}
