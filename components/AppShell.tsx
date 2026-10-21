"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export type NavItem = { href: string; label: string; icon: IconName };

/** Coquille commune: barre latérale sur ordinateur, barre supérieure et menu déroulant sur mobile. */
export function AppShell({ items, home, foot, banner, children }: {
  items: NavItem[]; home: string; foot?: ReactNode; banner?: ReactNode; children: ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  // Lien actif: la correspondance la plus longue (« /app » ne reste pas actif sur « /app/budget »).
  const active = items.filter((i) => path === i.href || path.startsWith(`${i.href}/`)).sort((a, b) => b.href.length - a.href.length)[0];
  return (
    <div className="shell">
      <aside className="sidebar" data-open={open}>
        <div className="sidebar-head">
          <Logo href={home} />
          <div className="head-actions">
            <ThemeToggle />
            <button type="button" className="icon-btn menu-btn" aria-expanded={open} aria-controls="app-nav" aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setOpen((o) => !o)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h10" />}
              </svg>
            </button>
          </div>
        </div>
        <nav id="app-nav" aria-label="Navigation principale">
          {items.map((i) => (
            <Link key={i.href} href={i.href} aria-current={i.href === active?.href ? "page" : undefined}>
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
