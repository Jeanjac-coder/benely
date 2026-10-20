"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/components/client";
import { PeriodPicker } from "@/components/PeriodPicker";
import type { Deliverables, Period } from "@/lib/ai/schemas";

export function CalendarView({ strategyId, period, content }: { strategyId: string; period: Period; content: Deliverables["content"] }) {
  const router = useRouter();
  const [next, setNext] = useState(period);
  const [platform, setPlatform] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const platforms = [...new Set(content.entries.map((e) => e.platform))];
  const entries = content.entries.filter((e) => !platform || e.platform === platform).sort((a, b) => a.date.localeCompare(b.date));

  async function regenerate() {
    setBusy(true); setError("");
    try {
      await api(`/api/strategies/${strategyId}/regenerate`, "POST", { step: "content", period: next });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Calendrier éditorial</h1>
      <p className="muted">Du {period.start} au {period.end} · {content.entries.length} publications · modifiable depuis l'onglet « Contenu » de la stratégie.</p>
      <div className="card">
        <h2>Piliers</h2>
        <ul>{content.pillars.map((p) => <li key={p.name}><b>{p.name}</b> ({Math.round(p.share * 100)} %) — {p.description}</li>)}</ul>
      </div>
      <div className="card">
        <label htmlFor="platform">Filtrer par plateforme</label>
        <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)} style={{ maxWidth: 280 }}>
          <option value="">Toutes</option>{platforms.map((p) => <option key={p}>{p}</option>)}
        </select>
        <div className="table-wrap" style={{ marginTop: 12 }}><table>
          <thead><tr><th>Date</th><th>Plateforme</th><th>Thème · format</th><th>Texte</th><th>Appel à l'action</th><th>Objectif · KPI</th></tr></thead>
          <tbody>{entries.map((e, i) => (
            <tr key={i}><td>{e.date}</td><td>{e.platform}</td><td>{e.theme}<br /><span className="muted small">{e.format}</span></td>
              <td className="pre">{e.text}</td><td>{e.cta}</td><td>{e.objective}<br /><span className="muted small">{e.kpi}</span></td></tr>
          ))}</tbody>
        </table></div>
      </div>
      <div className="card">
        <h2>Régénérer le calendrier</h2>
        <PeriodPicker value={next} onChange={setNext} />
        <button onClick={regenerate} disabled={busy} style={{ marginTop: 14 }}>{busy ? "Génération en cours…" : "Régénérer sur cette période"}</button>
        {error && <p className="err" role="alert">{error}</p>}
      </div>
    </>
  );
}
