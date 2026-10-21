import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Plan } from "@/lib/billing/plans";
import { PlanEditor } from "./PlanEditor";

export default async function Plans() {
  const { data } = await supabaseAdmin().from("plans").select("*").order("sort");
  return (
    <>
      <h1>Offres et quotas</h1>
      <p className="muted small">Quotas par période d'abonnement; laisser vide pour illimité. Un changement de prix s'applique aux prochains paiements (montant multiple de 5 pour CinetPay).</p>
      <div className="grid">{(data as Plan[] ?? []).map((p) => <div key={p.id} className="card"><PlanEditor plan={p} /></div>)}</div>
    </>
  );
}
