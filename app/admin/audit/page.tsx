import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function Audit() {
  const db = supabaseAdmin();
  const [{ data }, { data: users }] = await Promise.all([
    db.from("audit_log").select("id, actor_id, action, target, details, created_at").order("created_at", { ascending: false }).limit(200),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const email = new Map((users?.users ?? []).map((u) => [u.id, u.email]));
  return (
    <>
      <h1>Journal d'audit</h1>
      <div className="table-wrap"><table>
        <thead><tr><th>Date</th><th>Auteur</th><th>Action</th><th>Cible</th><th>Détails</th></tr></thead>
        <tbody>{(data ?? []).map((a) => (
          <tr key={a.id}>
            <td>{new Date(a.created_at).toLocaleString("fr-FR")}</td><td>{a.actor_id ? email.get(a.actor_id) ?? a.actor_id : "—"}</td>
            <td>{a.action}</td><td className="small">{a.target}</td>
            <td><details><summary className="small">voir</summary><pre className="small" style={{ whiteSpace: "pre-wrap", maxWidth: 480 }}>{JSON.stringify(a.details, null, 2)}</pre></details></td>
          </tr>
        ))}</tbody>
      </table></div>
    </>
  );
}
