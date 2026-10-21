import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell, type NavItem } from "@/components/AppShell";
import { requireAdmin } from "@/lib/admin";

const ITEMS: NavItem[] = [
  { href: "/admin", label: "Vue d'ensemble", icon: "home" },
  { href: "/admin/organizations", label: "Organisations", icon: "team" },
  { href: "/admin/users", label: "Utilisateurs", icon: "users" },
  { href: "/admin/plans", label: "Offres", icon: "tag" },
  { href: "/admin/payments", label: "Paiements", icon: "card" },
  { href: "/admin/ai", label: "Consommation IA", icon: "cpu" },
  { href: "/admin/prompts", label: "Prompts", icon: "text" },
  { href: "/admin/events", label: "Incidents", icon: "alert" },
  { href: "/admin/audit", label: "Audit", icon: "log" },
];

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return (
    <AppShell
      items={ITEMS}
      home="/admin"
      head={<span className="badge badge-hypothese">Admin</span>}
      foot={<div className="stack small"><span className="badge badge-hypothese" style={{ alignSelf: "flex-start" }}>Administration</span><span className="muted">{admin.email}</span><Link href="/app">← Retour à l'application</Link></div>}
    >
      <div style={{ maxWidth: 1200 }}>
        <p className="muted small">Accès limité aux métadonnées: les stratégies et profils des clients ne sont pas consultables depuis l'administration.</p>
        {children}
      </div>
    </AppShell>
  );
}
