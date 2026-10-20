"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "@/components/client";
import type { Deliverables } from "@/lib/ai/schemas";
import { formatMoney } from "@/lib/money";
import { optimize } from "@/lib/optimizer";

type Entry = { channel: string; period_start: string; spend: number; conversions: number };
const STATUS: Record<string, string> = { ahead: "Au-dessus", on_track: "Dans la cible", behind: "En retard", no_data: "Pas de données" };
const firstOfMonth = (s: string) => `${s.slice(0, 7)}-01`;

export function PerformanceView({ strategyId, meta, channels, entries }: { strategyId: string; meta: Deliverables["meta"]; channels: Deliverables["media"]["channels"]; entries: Entry[] }) {
  const router = useRouter();
  const [month, setMonth] = useState(firstOfMonth(meta.period.start));
  const forMonth = (m: string) => channels.map((c) => {
    const e = entries.find((x) => x.channel === c.channel && x.period_start === m);
    return { channel: c.channel, spend: e?.spend ?? 0, conversions: e?.conversions ?? 0 };
  });
  const [rows, setRows] = useState(() => forMonth(month));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const result = useMemo(() => optimize(channels, rows.filter((r) => r.spend > 0 || r.conversions > 0), meta.monthlyBudget), [channels, rows, meta.monthlyBudget]);

  async function save() {
    setMsg(null);
    try {
      await api("/api/performance", "PUT", { strategyId, periodStart: month, entries: rows });
      setMsg({ ok: true, text: "Résultats enregistrés." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
  }

  return (
    <>
      <h1>Performances</h1>
      <p className="muted">V1: saisie manuelle mensuelle. Les connexions automatiques aux plateformes publicitaires arriveront en V2.</p>
      <div className="card">
        <label htmlFor="month">Mois</label>
        <input id="month" type="month" style={{ maxWidth: 220 }} value={month.slice(0, 7)}
          onChange={(e) => { const m = `${e.target.value}-01`; setMonth(m); setRows(forMonth(m)); }} />
        <div className="table-wrap" style={{ marginTop: 12 }}><table>
          <thead><tr><th>Canal</th><th>Dépense ({meta.currency})</th><th>Résultats</th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={r.channel}><td>{r.channel}</td>
              <td><input type="number" min={0} aria-label={`Dépense ${r.channel}`} value={r.spend} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, spend: e.target.valueAsNumber || 0 } : x)))} /></td>
              <td><input type="number" min={0} aria-label={`Résultats ${r.channel}`} value={r.conversions} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, conversions: e.target.valueAsNumber || 0 } : x)))} /></td></tr>
          ))}</tbody>
        </table></div>
        <button onClick={save} style={{ marginTop: 12 }}>Enregistrer</button>
        {msg && <p className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
      </div>
      {result.alerts.length > 0 && <div className="card"><h2>Alertes</h2><ul>{result.alerts.map((a, i) => <li key={i} className="issue-warning">{a}</li>)}</ul></div>}
      <div className="card">
        <h2>Écarts par canal</h2>
        <div className="table-wrap"><table>
          <thead><tr><th>Canal</th><th>Objectif</th><th>Réel</th><th>Coût par résultat</th><th>Statut</th></tr></thead>
          <tbody>{result.analysis.map((a) => (
            <tr key={a.channel}><td>{a.channel}</td><td>{a.target}</td><td>{a.actual}</td>
              <td>{a.actualCpa === null ? "—" : formatMoney(a.actualCpa, meta.currency)}</td><td>{STATUS[a.status]}</td></tr>
          ))}</tbody>
        </table></div>
      </div>
      <div className="card">
        <h2>Réallocation suggérée</h2>
        {result.adjustments.length === 0 ? <p className="muted">Aucun ajustement suggéré pour ce mois.</p> :
          <ul>{result.adjustments.map((j, i) => <li key={i}><b>{j.channel}</b>: {(j.fromShare * 100).toFixed(1)} % → {(j.toShare * 100).toFixed(1)} % — {j.reason}</li>)}</ul>}
        <p className="muted small">Suggestion à appliquer depuis la page Budget. La variation est plafonnée à 15 % de la part d'un canal par cycle.</p>
      </div>
    </>
  );
}
