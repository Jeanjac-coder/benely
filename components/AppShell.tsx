"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { Logo } from "./Logo";

export type NavItem = { href: string; label: string; icon: IconName };

/** Coquille commune: barre latérale (en haut sur mobile) et zone de contenu. */
export function AppShell({ items, home, head, foot, banner, children }: {
  items: NavItem[]; home: string; head?: ReactNode; foot?: ReactNode; banner?: ReactNode; children: ReactNode;
}) {
  const path = usePathname();
  // Lien actif: la correspondance la plus longue (« /app » ne reste pas actif sur « /app/budget »).
  const active = items.filter((i) => path === i.href || path.startsWith(`${i.href}/`)).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-head">
          <Logo href={home} />
          <div className="org-mobile">{head}</div>
        </div>
        <nav aria-label="Navigation principale">
          {items.map((i) => (
            <Link key={i.href} href={i.href} aria-current={i.href === active ? "page" : undefined}>
              <Icon name={i.icon} />{i.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">{foot}</div>
      </aside>
      <div className="content">
        {banner}
        <main>{children}</main>
      </div>
    </div>
  );
}
