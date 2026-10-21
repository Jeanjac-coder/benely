"use client";
import { useRouter } from "next/navigation";
import { api } from "@/components/client";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function OrgSwitcher({ orgs, current }: { orgs: { id: string; name: string }[]; current: string }) {
  const router = useRouter();
  async function logout() {
    await supabaseBrowser().auth.signOut();
    router.replace("/auth/login");
  }
  return (
    <div className="row small">
      {orgs.length > 1 ? (
        <select aria-label="Organisation active" style={{ width: "auto" }} value={current}
          onChange={async (e) => { await api("/api/orgs/switch", "POST", { orgId: e.target.value }); router.refresh(); }}>
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      ) : <span>{orgs[0]?.name}</span>}
      <button className="ghost" onClick={logout}>Déconnexion</button>
    </div>
  );
}
