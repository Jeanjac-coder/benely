"use client";
import { useEffect, useState } from "react";
import { optimize, type OptimizationResult } from "@/lib/optimizer";
import { loadState, type SavedState } from "@/lib/storage";
import type { ChannelActual } from "@/lib/types";

const label: Record<string, string> = { ahead: "Au-dessus", on_track: "Dans la cible", behind: "En retard", no_data: "Pas de données" };

export default function Performance() {
  const [state, setState] = useState<SavedState | null>(null);
  const [actuals, setActuals] = useState<ChannelActual[]>([]);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  useEffect(() => {
    const s = loadState();
    setState(s);
    if (s) setActuals(s.strategy.channels.map((c) => ({ channel: c.channel, spend: 0, conversions: 0 })));
  }, []);

  if (!state) return <p className="card">Générez d'abord une stratégie depuis l'onglet Stratégie.</p>;

  const update = (i: number, k: "spend" | "conversions", v: number) =>
    setActuals((a) => a.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  return (
    <>
      <h1>Suivi de performance</h1>
      <div className="card">
        <table>
          <thead><tr><th>Canal</th><th>Dépense (USD)</th><th>Conversions</th></tr></thead>
          <tbody>{actuals.map((a, i) => (
            <tr key={a.channel}><td>{a.channel}</td>
              <td><input type="number" min={0} value={a.spend} onChange={(e) => update(i, "spend", Number(e.target.value))} /></td>
              <td><input type="number" min={0} value={a.conversions} onChange={(e) => update(i, "conversions", Number(e.target.value))} /></td></tr>))}</tbody>
        </table>
        <button onClick={() => setResult(optimize(state.strategy.channels, actuals, state.profile.monthlyBudget))}>Analyser et ajuster</button>
      </div>
      {result && (
        <>
          {result.alerts.length > 0 && <div className="card"><h2>Alertes</h2><ul>{result.alerts.map((a, i) => <li key={i}>{a}</li>)}</ul></div>}
          <div className="card"><h2>Écarts par canal</h2>
            <table><thead><tr><th>Canal</th><th>Objectif</th><th>Réel</th><th>CPA réel</th><th>Statut</th></tr></thead>
              <tbody>{result.analysis.map((a) => <tr key={a.channel}><td>{a.channel}</td><td>{a.target}</td><td>{a.actual}</td>
                <td>{a.actualCpa ? a.actualCpa.toFixed(2) : "—"}</td><td><span className="tag">{label[a.status]}</span></td></tr>)}</tbody></table></div>
          <div className="card"><h2>Réallocation recommandée</h2>
            {result.adjustments.length === 0 ? <p className="muted">Aucun ajustement nécessaire pour ce cycle.</p> :
              <ul>{result.adjustments.map((j, i) => <li key={i}><strong>{j.channel}</strong>: {(j.fromShare * 100).toFixed(1)}% → {(j.toShare * 100).toFixed(1)}% — {j.reason}</li>)}</ul>}</div>
        </>
      )}
    </>
  );
}
