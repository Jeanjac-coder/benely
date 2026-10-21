import { requireContext } from "@/lib/context";
import { InviteForm } from "./InviteForm";

const ROLES: Record<string, string> = { owner: "Propriétaire", admin: "Administrateur", member: "Collaborateur" };

export default async function TeamPage() {
  const ctx = await requireContext();
  const canManage = ctx.role === "owner" || ctx.role === "admin";
  const [{ data: members }, { data: invites }, { data: profiles }] = await Promise.all([
    ctx.supabase.from("memberships").select("user_id, role, email, created_at").eq("org_id", ctx.org.id).order("created_at"),
    canManage
      ? ctx.supabase.from("invitations").select("email, role, accepted_at, expires_at").eq("org_id", ctx.org.id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as { email: string; role: string; accepted_at: string | null; expires_at: string }[] }),
    ctx.supabase.from("profiles").select("id, first_name, last_name"),
  ]);
  const nameOf = (id: string) => { const p = profiles?.find((x) => x.id === id); return p ? `${p.first_name} ${p.last_name}`.trim() : ""; };
  return (
    <>
      <h1>Équipe — {ctx.org.name}</h1>
      <div className="card">
        <h2>Membres</h2>
        <ul>{(members ?? []).map((m) => <li key={m.user_id}><b>{nameOf(m.user_id) || m.email || "—"}</b>{nameOf(m.user_id) && m.email ? <span className="muted"> · {m.email}</span> : null}{m.user_id === ctx.userId ? " (vous)" : ""} — {ROLES[m.role]}</li>)}</ul>
      </div>
      {canManage && (
        <div className="card">
          <h2>Invitations</h2>
          <InviteForm />
          <ul>{(invites ?? []).map((i, k) => <li key={k}>{i.email} — {ROLES[i.role]} — {i.accepted_at ? "acceptée" : new Date(i.expires_at) < new Date() ? "expirée" : "en attente"}</li>)}</ul>
        </div>
      )}
    </>
  );
}
