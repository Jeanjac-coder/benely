import { monthStart } from "@/lib/admin";
import { estimateCostUsd, USD_TO_XOF } from "@/lib/ai/pricing";
import { effectiveStatus, STATUS_LABELS, type Subscription } from "@/lib/billing/plans";
import { formatMoney } from "@/lib/money";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminHome() {
  const db = supabaseAdmin();
  const since = monthStart();
  const day = new Date(Date.now() - 86_400_000).toISOString();
  const [{ count: orgs }, { data: subs }, { data: plans }, { data: paid }, { data: usage }, { count: errors }, { data: users }] = await Promise.all([
    db.from("organizations").select("*", { count: "exact", head: true }),
    db.from("subscriptions").select("plan_id, status, current_period_start, current_period_end, cancel_at_period_end"),
    db.from("plans").select("id, price_monthly"),
    db.from("payments").select("amount").eq("status", "accepted").gte("confirmed_at", since),
    db.from("ai_usage").select("model, input_tokens, output_tokens").gte("created_at", since),
    db.from("app_events").select("*", { count: "exact", head: true }).eq("level", "error").gte("created_at", day),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const byStatus: Record<string, number> = {};
  for (const s of subs ?? []) { const st = effectiveStatus(s as Subscription); byStatus[st] = (byStatus[st] ?? 0) + 1; }
  const price = new Map((plans ?? []).map((p) => [p.id, p.price_monthly ?? 0]));
  const mrr = (subs ?? []).filter((s) => effectiveStatus(s as Subscription) === "active").reduce((t, s) => t + (price.get(s.plan_id) ?? 0), 0);
  const revenue = (paid ?? []).reduce((t, p) => t + p.amount, 0);
  const aiUsd = (usage ?? []).reduce((t, u) => t + estimateCostUsd(u.model, u.input_tokens, u.output_tokens), 0);

  return (
    <>
      <h1>Vue d'ensemble</h1>
      <div className="kpis">
        <div className="kpi">Organisations<b>{orgs ?? 0}</b></div>
        <div className="kpi">Utilisateurs<b>{users?.users.length ?? 0}</b></div>
        <div className="kpi">Revenu mensuel récurrent<b>{formatMoney(mrr, "XOF")}</b></div>
        <div className="kpi">Encaissé ce mois<b>{formatMoney(revenue, "XOF")}</b></div>
        <div className="kpi">Coût IA ce mois<b>{aiUsd.toFixed(2)} $</b><span className="small muted">≈ {formatMoney(Math.round(aiUsd * USD_TO_XOF), "XOF")}</span></div>
        <div className="kpi">Erreurs (24 h)<b className={errors ? "err" : "ok"}>{errors ?? 0}</b></div>
      </div>
      <div className="card">
        <h2>Abonnements</h2>
        <ul>{Object.entries(byStatus).map(([k, v]) => <li key={k}>{STATUS_LABELS[k as keyof typeof STATUS_LABELS]}: {v}</li>)}</ul>
        <p className="small muted">Conversion essai → payant: {subs?.length ? `${Math.round(((byStatus.active ?? 0) + (byStatus.past_due ?? 0)) / subs.length * 100)} %` : "—"} des organisations.</p>
      </div>
    </>
  );
}
