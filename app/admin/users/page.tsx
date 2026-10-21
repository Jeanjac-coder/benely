import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function Users() {
  const db = supabaseAdmin();
  const [{ data }, { data: members }, { data: admins }] = await Promise.all([
    db.auth.admin.listUsers({ perPage: 1000 }),
    db.from("memberships").select("user_id, role, organizations(name)"),
    db.from("platform_admins").select("user_id"),
  ]);
  const adminIds = new Set((admins ?? []).map((a) => a.user_id));
  return (
    <>
      <h1>Utilisateurs</h1>
      <div className="table-wrap"><table>
        <thead><tr><th>E-mail</th><th>Vérifié</th><th>Inscription</th><th>Dernière connexion</th><th>Organisations</th></tr></thead>
        <tbody>{(data?.users ?? []).map((u) => (
          <tr key={u.id}>
            <td>{u.email}{adminIds.has(u.id) && <span className="badge" style={{ marginLeft: 6 }}>admin</span>}</td>
            <td>{u.email_confirmed_at ? "Oui" : "Non"}</td>
            <td>{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
            <td>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("fr-FR") : "—"}</td>
            <td className="small">{(members ?? []).filter((m) => m.user_id === u.id).map((m) => `${(m.organizations as unknown as { name: string } | null)?.name} (${m.role})`).join(", ") || "—"}</td>
          </tr>
        ))}</tbody>
      </table></div>
    </>
  );
}
