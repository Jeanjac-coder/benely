import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell, type NavItem } from "@/components/AppShell";
import { daysLeft, effectiveStatus, STATUS_LABELS } from "@/lib/billing/plans";
import { requireContext } from "@/lib/context";
import { OrgSwitcher } from "./OrgSwitcher";

const ITEMS: NavItem[] = [
  { href: "/app", label: "Tableau de bord", icon: "home" },
  { href: "/app/profile", label: "Profil", icon: "profile" },
  { href: "/app/generate", label: "Génération", icon: "spark" },
  { href: "/app/strategy", label: "Stratégie", icon: "strategy" },
  { href: "/app/calendar", label: "Calendrier", icon: "calendar" },
  { href: "/app/budget", label: "Budget", icon: "wallet" },
  { href: "/app/performance", label: "Performances", icon: "chart" },
  { href: "/app/team", label: "Équipe", icon: "team" },
  { href: "/app/billing", label: "Abonnement", icon: "card" },
  { href: "/app/settings", label: "Paramètres", icon: "settings" },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const ctx = await requireContext();
  const [{ data: sub }, { data: isAdmin }] = await Promise.all([
    ctx.supabase.from("subscriptions").select("plan_id, status, current_period_start, current_period_end, cancel_at_period_end").eq("org_id", ctx.org.id).maybeSingle(),
    ctx.supabase.rpc("is_platform_admin"),
  ]);
  const status = sub ? effectiveStatus(sub) : null;
  const left = sub ? daysLeft(sub) : 0;
  const banner =
    status === "expired" || status === "canceled" ? "Votre abonnement a expiré: les générations et exports sont suspendus."
    : status === "past_due" ? "Votre abonnement est échu: renouvelez-le pour conserver l'accès."
    : (status === "trialing" || (status === "active" && !sub?.cancel_at_period_end)) && left <= 5 ? `${status === "trialing" ? "Votre essai" : "Votre abonnement"} se termine dans ${Math.max(0, left)} jour(s).`
    : null;
  const items = isAdmin ? [...ITEMS, { href: "/admin", label: "Administration", icon: "shield" as const }] : ITEMS;
  const plan = sub && status ? `${sub.plan_id === "trial" ? "Essai" : sub.plan_id} · ${STATUS_LABELS[status]}` : undefined;
  return (
    <AppShell
      items={items}
      home="/app"
      foot={<OrgSwitcher orgs={ctx.orgs} current={ctx.org.id} plan={plan} user={{ name: `${ctx.firstName} ${ctx.lastName}`.trim(), email: ctx.email }} />}
      banner={banner && <div className="banner" role="status">{banner} <Link href="/app/billing">Gérer l'abonnement</Link></div>}
    >
      {children}
    </AppShell>
  );
}
