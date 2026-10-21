import Link from "next/link";
import type { ReactNode } from "react";
import { daysLeft, effectiveStatus } from "@/lib/billing/plans";
import { requireContext } from "@/lib/context";
import { OrgSwitcher } from "./OrgSwitcher";

const LINKS = [
  ["/app", "Tableau de bord"], ["/app/profile", "Profil"], ["/app/generate", "Génération"], ["/app/strategy", "Stratégie"],
  ["/app/calendar", "Calendrier"], ["/app/budget", "Budget"], ["/app/performance", "Performances"], ["/app/team", "Équipe"], ["/app/billing", "Abonnement"], ["/app/settings", "Paramètres"],
] as const;

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
  return (
    <>
      <header className="topbar">
        <Link href="/app" className="brand">Benely</Link>
        <nav className="nav" aria-label="Navigation principale">
          {LINKS.map(([href, text]) => <Link key={href} href={href}>{text}</Link>)}
          {isAdmin && <Link href="/admin">Administration</Link>}
        </nav>
        <OrgSwitcher orgs={ctx.orgs} current={ctx.org.id} />
      </header>
      {banner && <div className="banner" role="status">{banner} <Link href="/app/billing">Gérer l'abonnement</Link></div>}
      <main>{children}</main>
    </>
  );
}
