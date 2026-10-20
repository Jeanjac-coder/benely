import Link from "next/link";
import type { ReactNode } from "react";
import { requireContext } from "@/lib/context";
import { OrgSwitcher } from "./OrgSwitcher";

const LINKS = [
  ["/app", "Tableau de bord"], ["/app/profile", "Profil"], ["/app/generate", "Génération"], ["/app/strategy", "Stratégie"],
  ["/app/calendar", "Calendrier"], ["/app/budget", "Budget"], ["/app/performance", "Performances"], ["/app/team", "Équipe"],
] as const;

export default async function AppLayout({ children }: { children: ReactNode }) {
  const ctx = await requireContext();
  return (
    <>
      <header className="topbar">
        <Link href="/app" className="brand">Benely</Link>
        <nav className="nav" aria-label="Navigation principale">{LINKS.map(([href, text]) => <Link key={href} href={href}>{text}</Link>)}</nav>
        <OrgSwitcher orgs={ctx.orgs} current={ctx.org.id} />
      </header>
      <main>{children}</main>
    </>
  );
}
