import { monthStart } from "@/lib/admin";
import { estimateCostUsd, USD_TO_XOF } from "@/lib/ai/pricing";
import { formatMoney } from "@/lib/money";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AiUsage() {
  const { data } = await supabaseAdmin().from("ai_usage")
    .select("org_id, step, model, input_tokens, output_tokens, organizations(name)").gte("created_at", monthStart());
  type Row = { name: string; calls: number; input: number; output: number; usd: number };
  const byOrg = new Map<string, Row>();
  const byStep = new Map<string, Row>();
  for (const u of data ?? []) {
    const usd = estimateCostUsd(u.model, u.input_tokens, u.output_tokens);
    const step = u.step.replace(/^regenerate:/, "régénération ");
    for (const [map, key, name] of [[byOrg, u.org_id, (u.organizations as unknown as { name: string } | null)?.name ?? u.org_id], [byStep, step, step]] as const) {
      const r = map.get(key) ?? { name, calls: 0, input: 0, output: 0, usd: 0 };
      r.calls++; r.input += u.input_tokens; r.output += u.output_tokens; r.usd += usd;
      map.set(key, r);
    }
  }
  const table = (rows: Row[], first: string) => (
    <div className="table-wrap"><table>
      <thead><tr><th>{first}</th><th>Appels</th><th>Jetons entrée</th><th>Jetons sortie</th><th>Coût estimé</th></tr></thead>
      <tbody>{rows.sort((a, b) => b.usd - a.usd).map((r) => (
        <tr key={r.name}><td>{r.name}</td><td>{r.calls}</td><td>{r.input.toLocaleString("fr-FR")}</td><td>{r.output.toLocaleString("fr-FR")}</td>
          <td>{r.usd.toFixed(2)} $ ≈ {formatMoney(Math.round(r.usd * USD_TO_XOF), "XOF")}</td></tr>
      ))}</tbody>
    </table></div>
  );
  return (
    <>
      <h1>Consommation IA — mois en cours</h1>
      <p className="muted small">Coûts estimés à partir des tarifs publics et d'un taux de {USD_TO_XOF} FCFA pour 1 $ (variable USD_TO_XOF).</p>
      <div className="card"><h2>Par organisation</h2>{table([...byOrg.values()], "Organisation")}</div>
      <div className="card"><h2>Par étape</h2>{table([...byStep.values()], "Étape")}</div>
    </>
  );
}
