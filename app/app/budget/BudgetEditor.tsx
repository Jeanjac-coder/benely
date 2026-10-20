"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/components/client";
import type { Deliverables } from "@/lib/ai/schemas";
import { amounts, setShare } from "@/lib/budget";
import { formatMoney } from "@/lib/money";

export function BudgetEditor({ strategyId, meta, media }: { strategyId: string; meta: Deliverables["meta"]; media: Deliverables["media"] }) {
  const router = useRouter();
  const [monthly, setMonthly] = useState(meta.monthlyBudget);
  const [channels, setChannels] = useState(media.channels);
  const [locked, setLocked] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const ratio = meta.monthlyBudget > 0 ? monthly / meta.monthlyBudget : 1;
  const changed = monthly !== meta.monthlyBudget || channels.some((c, i) => Math.abs(c.budgetShare - media.channels[i].budgetShare) > 1e-6);

  async function save() {
    setBusy(true); setMsg(null);
    try {
      await api(`/api/strategies/${strategyId}/budget`, "PUT", { monthlyBudget: monthly, shares: Object.fromEntries(channels.map((c) => [c.channel, c.budgetShare])) });
      setMsg({ ok: true, text: "Budget enregistré dans une nouvelle version. Régénérez le plan média pour actualiser les recommandations." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Budget</h1>
      <div className="card">
        <label htmlFor="monthly">Budget marketing mensuel ({meta.currency === "XOF" || meta.currency === "XAF" ? "FCFA" : meta.currency})</label>
        <input id="monthly" type="number" min={1} value={monthly} onChange={(e) => setMonthly(e.target.valueAsNumber || 0)} style={{ maxWidth: 260 }} />
        <div className="table-wrap" style={{ marginTop: 12 }}><table>
          <thead><tr><th>Canal</th><th>Part</th><th>Montant mensuel</th><th>Objectif mensuel</th><th>Verrouiller</th></tr></thead>
          <tbody>{channels.map((c, i) => (
            <tr key={c.channel}>
              <td>{c.channel}<br /><span className="muted small">{c.role}</span></td>
              <td style={{ minWidth: 180 }}>
                <input type="range" min={0} max={100} step={1} aria-label={`Part ${c.channel}`} value={Math.round(c.budgetShare * 100)} disabled={locked.has(i)}
                  onChange={(e) => setChannels((cs) => setShare(cs, i, e.target.valueAsNumber / 100, locked))} />
                {(c.budgetShare * 100).toFixed(0)} %
              </td>
              <td>{formatMoney(amounts([c], monthly)[0].amount, meta.currency)}</td>
              <td>{c.monthlyTarget.toLocaleString("fr-FR")} {c.kpi}</td>
              <td><input type="checkbox" style={{ width: "auto" }} aria-label={`Verrouiller ${c.channel}`} checked={locked.has(i)}
                onChange={(e) => setLocked((s) => { const n = new Set(s); if (e.target.checked) n.add(i); else n.delete(i); return n; })} /></td>
            </tr>
          ))}</tbody>
        </table></div>
        <p className="muted small">Modifier une part redistribue l'écart sur les canaux non verrouillés, au prorata. Les objectifs affichés sont ceux du plan initial.</p>
      </div>
      <div className="card">
        <h2>Campagnes</h2>
        <ul>{media.campaigns.map((c) => <li key={c.name}><b>{c.name}</b>: {formatMoney(Math.round(c.budget * ratio), meta.currency)}{ratio !== 1 && <span className="muted small"> (avant: {formatMoney(c.budget, meta.currency)})</span>}</li>)}</ul>
        <p className="muted small">Les budgets de campagne suivent le budget mensuel au prorata.</p>
      </div>
      <button onClick={save} disabled={busy || !changed || !(monthly > 0)}>{busy ? "Enregistrement…" : "Enregistrer le budget"}</button>
      {msg && <p className={msg.ok ? "ok" : "err"} role="status">{msg.text}</p>}
    </>
  );
}
