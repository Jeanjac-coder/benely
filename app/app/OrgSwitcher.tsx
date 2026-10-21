"use client";
import { useRouter } from "next/navigation";
import { api } from "@/components/client";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function OrgSwitcher({ orgs, current, plan, user }: { orgs: { id: string; name: string }[]; current: string; plan?: string; user: { name: string; email: string } }) {
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
  const initials = (user.name || user.email).split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="org-switch">
      <div className="user-chip">
        <span className="avatar" aria-hidden="true">{initials}</span>
        <span className="grow" style={{ minWidth: 0 }}>
          <span className="org-name" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name || "Mon compte"}</span>
          <span className="muted small" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</span>
        </span>
      </div>
      <span className="muted small">Organisation</span>
      {select}
      {plan && <span className="badge badge-fait" style={{ alignSelf: "flex-start" }}>{plan}</span>}
      <button className="ghost" onClick={logout}>Se déconnecter</button>
    </div>
  );
}
