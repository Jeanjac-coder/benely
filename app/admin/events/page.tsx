import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

const LEVELS = ["error", "warning", "info"] as const;

export default async function Events({ searchParams }: { searchParams: { level?: string; category?: string } }) {
  let q = supabaseAdmin().from("app_events").select("id, level, category, message, org_id, details, created_at, organizations(name)").order("created_at", { ascending: false }).limit(200);
  if (searchParams.level && (LEVELS as readonly string[]).includes(searchParams.level)) q = q.eq("level", searchParams.level);
  if (searchParams.category) q = q.eq("category", searchParams.category);
  const { data } = await q;
  return (
    <>
      <h1>Incidents et journaux techniques</h1>
      <p className="row small">Filtrer: <Link href="/admin/events">tout</Link>{LEVELS.map((l) => <Link key={l} href={`/admin/events?level=${l}`}>{l}</Link>)}</p>
      <div className="table-wrap"><table>
        <thead><tr><th>Date</th><th>Niveau</th><th>Catégorie</th><th>Message</th><th>Organisation</th><th>Détails</th></tr></thead>
        <tbody>{(data ?? []).map((e) => (
          <tr key={e.id}>
            <td>{new Date(e.created_at).toLocaleString("fr-FR")}</td>
            <td className={`issue-${e.level}`}>{e.level}</td>
            <td><Link href={`/admin/events?category=${e.category}`}>{e.category}</Link></td>
            <td>{e.message}</td>
            <td>{(e.organizations as unknown as { name: string } | null)?.name ?? "—"}</td>
            <td><details><summary className="small">voir</summary><pre className="small" style={{ whiteSpace: "pre-wrap", maxWidth: 420 }}>{JSON.stringify(e.details, null, 2)}</pre></details></td>
          </tr>
        ))}</tbody>
      </table></div>
    </>
  );
}
