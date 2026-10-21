"use client";
import { useRouter } from "next/navigation";
import { api } from "@/components/client";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function OrgSwitcher({ orgs, current, plan, compact = false }: { orgs: { id: string; name: string }[]; current: string; plan?: string; compact?: boolean }) {
  const router = useRouter();
  async function logout() {
    await supabaseBrowser().auth.signOut();
    router.replace("/auth/login");
  }
  const select = orgs.length > 1 ? (
    <select aria-label="Organisation active" value={current}
      onChange={async (e) => { await api("/api/orgs/switch", "POST", { orgId: e.target.value }); router.refresh(); }}>
      {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  ) : <span className="org-name">{orgs[0]?.name}</span>;
  if (compact) return <div className="row small">{select}<button className="ghost" onClick={logout}>Quitter</button></div>;
  return (
    <div className="org-switch">
      <span className="muted small">Organisation</span>
      {select}
      {plan && <span className="badge badge-fait" style={{ alignSelf: "flex-start" }}>{plan}</span>}
      <button className="ghost" onClick={logout}>Se déconnecter</button>
    </div>
  );
}
