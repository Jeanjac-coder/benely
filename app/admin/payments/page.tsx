import { formatMoney } from "@/lib/money";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function Payments() {
  const { data } = await supabaseAdmin().from("payments")
    .select("transaction_id, plan_id, amount, currency, status, provider, method, failure_reason, created_at, confirmed_at, organizations(name)")
    .order("created_at", { ascending: false }).limit(200);
  return (
    <>
      <h1>Paiements</h1>
      <div className="table-wrap"><table>
        <thead><tr><th>Date</th><th>Organisation</th><th>Offre</th><th>Montant</th><th>Prestataire · moyen</th><th>Statut</th><th>Transaction</th></tr></thead>
        <tbody>{(data ?? []).map((p) => (
          <tr key={p.transaction_id}>
            <td>{new Date(p.created_at).toLocaleString("fr-FR")}</td>
            <td>{(p.organizations as unknown as { name: string } | null)?.name}</td>
            <td>{p.plan_id}</td><td>{formatMoney(p.amount, p.currency)}</td>
            <td>{p.provider}{p.method ? ` · ${p.method}` : ""}</td>
            <td className={p.status === "accepted" ? "ok" : p.status === "pending" ? "" : "err"}>{p.status}{p.failure_reason ? ` — ${p.failure_reason}` : ""}</td>
            <td className="small">{p.transaction_id}</td>
          </tr>
        ))}</tbody>
      </table></div>
    </>
  );
}
