import { monthStart } from "@/lib/admin";
import { estimateCostUsd, USD_TO_XOF } from "@/lib/ai/pricing";
import { effectiveStatus, STATUS_LABELS, type Subscription } from "@/lib/billing/plans";
import { formatMoney } from "@/lib/money";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SubscriptionEditor } from "./SubscriptionEditor";

export default async function Organizations() {
  const db = supabaseAdmin();
  const [{ data: orgs }, { data: subs }, { data: members }, { data: usage }, { data: plans }] = await Promise.all([
    db.from("organizations").select("id, name, country, created_at").order("created_at", { ascending: false }),
    db.from("subscriptions").select("org_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end"),
    db.from("memberships").select("org_id"),
    db.from("ai_usage").select("org_id, model, input_tokens, output_tokens").gte("created_at", monthStart()),
    db.from("plans").select("id, name, price_monthly").order("sort"),
  ]);
  const sub = new Map((subs ?? []).map((s) => [s.org_id, s]));
  const price = new Map((plans ?? []).map((p) => [p.id, p.price_monthly ?? 0]));
  const count = (id: string) => (members ?? []).filter((m) => m.org_id === id).length;
  const cost = (id: string) => (usage ?? []).filter((u) => u.org_id === id).reduce((t, u) => t + estimateCostUsd(u.model, u.input_tokens, u.output_tokens), 0);
  return (
    <>
      <h1>Organisations</h1>
      <div className="table-wrap"><table>
        <thead><tr><th>Organisation</th><th>Pays</th><th>Membres</th><th>Offre · statut</th><th>Échéance</th><th>Coût IA (mois)</th><th>Marge estimée</th><th>Modifier</th></tr></thead>
        <tbody>{(orgs ?? []).map((o) => {
          const s = sub.get(o.id);
          const c = cost(o.id);
          return (
            <tr key={o.id}>
              <td>{o.name}<br /><span className="small muted">{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString("fr-FR")}</span></td>
              <td>{o.country}</td><td>{count(o.id)}</td>
              <td>{s ? `${s.plan_id} · ${STATUS_LABELS[effectiveStatus(s as Subscription)]}` : "—"}</td>
              <td>{s ? new Date(s.current_period_end).toLocaleDateString("fr-FR") : "—"}</td>
              <td>{c.toFixed(2)} $</td>
              <td>{s ? formatMoney((price.get(s.plan_id) ?? 0) - Math.round(c * USD_TO_XOF), "XOF") : "—"}</td>
              <td>{s && <SubscriptionEditor orgId={o.id} planId={s.plan_id} status={s.status} periodEnd={s.current_period_end.slice(0, 10)} plans={(plans ?? []).map((p) => p.id)} />}</td>
            </tr>
          );
        })}</tbody>
      </table></div>
    </>
  );
}
