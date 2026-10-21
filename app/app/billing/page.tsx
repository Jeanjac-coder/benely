import { billingState } from "@/lib/billing/server";
import { daysLeft, QUOTA_LABELS, STATUS_LABELS, type Plan, type QuotaKind } from "@/lib/billing/plans";
import { requireContext } from "@/lib/context";
import { formatMoney } from "@/lib/money";
import { BillingActions } from "./BillingActions";

const STATUS: Record<string, string> = { pending: "En attente", accepted: "Payé", refused: "Refusé", cancelled: "Annulé", error: "Erreur" };

export default async function BillingPage() {
  const ctx = await requireContext();
  const canPay = ctx.role === "owner" || ctx.role === "admin";
  const [state, { data: plans }, { data: payments }, { data: invoices }] = await Promise.all([
    billingState(ctx),
    ctx.supabase.from("plans").select("*").eq("public", true).order("sort"),
    ctx.supabase.from("payments").select("transaction_id, plan_id, amount, currency, status, method, failure_reason, created_at").eq("org_id", ctx.org.id).order("created_at", { ascending: false }).limit(20),
    ctx.supabase.from("invoices").select("id, number, amount, currency, issued_at").eq("org_id", ctx.org.id).order("issued_at", { ascending: false }),
  ]);
  const s = state.subscription;
  const left = daysLeft(s);

  return (
    <>
      <h1>Abonnement</h1>
      <div className="card">
        <h2>{state.plan.name} — {STATUS_LABELS[state.status]}</h2>
        <p>
          {state.status === "trialing" && `Essai jusqu'au ${new Date(s.current_period_end).toLocaleDateString("fr-FR")} (${Math.max(0, left)} jour(s) restant(s)).`}
          {state.status === "active" && (s.cancel_at_period_end
            ? `Résilié: l'accès prend fin le ${new Date(s.current_period_end).toLocaleDateString("fr-FR")}.`
            : `Période en cours jusqu'au ${new Date(s.current_period_end).toLocaleDateString("fr-FR")}. Le Mobile Money ne permet pas le prélèvement automatique: renouvelez avant l'échéance.`)}
          {state.status === "past_due" && "La période est échue: renouvelez sous 3 jours pour conserver l'accès."}
          {(state.status === "expired" || state.status === "canceled") && "L'accès aux générations et exports est suspendu. Vos données sont conservées."}
        </p>
        <div className="table-wrap"><table>
          <thead><tr><th>Quota de la période</th><th>Utilisé</th><th>Inclus</th></tr></thead>
          <tbody>{(Object.keys(QUOTA_LABELS) as QuotaKind[]).map((k) => (
            <tr key={k}><td>{QUOTA_LABELS[k]}</td><td>{state.usage[k]}</td><td>{state.plan.quotas[k] ?? "Illimité"}</td></tr>
          ))}</tbody>
        </table></div>
      </div>

      <h2>Offres</h2>
      <div className="grid">
        {(plans as Plan[] ?? []).map((p) => (
          <div key={p.id} className="card">
            <h3>{p.name}{p.id === s.plan_id && state.status === "active" ? " (actuelle)" : ""}</h3>
            <p><b>{p.price_monthly ? `${formatMoney(p.price_monthly, p.currency)} / mois` : "Sur devis"}</b></p>
            <ul className="small">{(Object.keys(QUOTA_LABELS) as QuotaKind[]).map((k) => <li key={k}>{QUOTA_LABELS[k]}: {p.quotas[k] ?? "illimité"}</li>)}</ul>
            {canPay && <BillingActions planId={p.id} priced={!!p.price_monthly} renew={p.id === s.plan_id && state.status !== "trialing"} />}
          </div>
        ))}
      </div>
      {!canPay && <p className="muted">Seuls le propriétaire et les administrateurs peuvent gérer l'abonnement.</p>}
      {ctx.role === "owner" && (state.status === "active" || state.status === "past_due") && (
        <div className="card"><BillingActions cancel={s.cancel_at_period_end} /></div>
      )}

      {canPay && (
        <>
          <div className="card">
            <h2>Paiements</h2>
            {(payments ?? []).length === 0 ? <p className="muted">Aucun paiement.</p> : (
              <div className="table-wrap"><table>
                <thead><tr><th>Date</th><th>Offre</th><th>Montant</th><th>Moyen</th><th>Statut</th></tr></thead>
                <tbody>{payments!.map((p) => (
                  <tr key={p.transaction_id}><td>{new Date(p.created_at).toLocaleString("fr-FR")}</td><td>{p.plan_id}</td><td>{formatMoney(p.amount, p.currency)}</td>
                    <td>{p.method ?? "—"}</td><td>{STATUS[p.status]}{p.failure_reason ? ` — ${p.failure_reason}` : ""}</td></tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
          <div className="card">
            <h2>Factures</h2>
            {(invoices ?? []).length === 0 ? <p className="muted">Aucune facture.</p> :
              <ul>{invoices!.map((i) => <li key={i.id}><a href={`/api/billing/invoices/${i.id}`}>{i.number}</a> — {formatMoney(i.amount, i.currency)} — {new Date(i.issued_at).toLocaleDateString("fr-FR")}</li>)}</ul>}
          </div>
        </>
      )}
    </>
  );
}
