"use client";
import { useEffect, useState } from "react";
import { COUNTRIES } from "@/lib/africa";
import { loadState, saveState } from "@/lib/storage";
import type { CompanyProfile, Strategy } from "@/lib/types";

const empty: CompanyProfile = {
  name: "", sector: "", country: "Côte d'Ivoire", size: "pme", offer: "", objective: "",
  monthlyBudget: 1000, channelsInUse: [], languages: [], competitors: "",
};

const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function Home() {
  const [profile, setProfile] = useState<CompanyProfile>(empty);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const s = loadState();
    if (s) { setProfile(s.profile); setStrategy(s.strategy); }
  }, []);

  const set = <K extends keyof CompanyProfile>(k: K, v: CompanyProfile[K]) => setProfile((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/strategy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur inconnue");
      setStrategy(data.strategy);
      saveState({ profile, strategy: data.strategy });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1>Votre département marketing IA</h1>
      <form onSubmit={submit} className="card">
        <div className="grid">
          <div><label>Entreprise</label><input required value={profile.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div><label>Secteur d'activité</label><input required value={profile.sector} onChange={(e) => set("sector", e.target.value)} /></div>
          <div><label>Pays</label>
            <select value={profile.country} onChange={(e) => set("country", e.target.value)}>
              {Object.keys(COUNTRIES).map((c) => <option key={c}>{c}</option>)}
            </select></div>
          <div><label>Taille</label>
            <select value={profile.size} onChange={(e) => set("size", e.target.value as CompanyProfile["size"])}>
              <option value="startup">Startup</option><option value="pme">PME</option><option value="grande">Grande entreprise</option>
            </select></div>
          <div><label>Budget marketing mensuel (USD)</label><input type="number" min={1} required value={profile.monthlyBudget} onChange={(e) => set("monthlyBudget", Number(e.target.value))} /></div>
          <div><label>Langues (séparées par des virgules)</label><input value={profile.languages.join(", ")} onChange={(e) => set("languages", list(e.target.value))} /></div>
        </div>
        <label>Offre (produits / services)</label><textarea required rows={2} value={profile.offer} onChange={(e) => set("offer", e.target.value)} />
        <label>Objectif commercial</label><textarea required rows={2} value={profile.objective} onChange={(e) => set("objective", e.target.value)} />
        <label>Canaux déjà utilisés (virgules)</label><input value={profile.channelsInUse.join(", ")} onChange={(e) => set("channelsInUse", list(e.target.value))} />
        <label>Concurrents connus</label><input value={profile.competitors} onChange={(e) => set("competitors", e.target.value)} />
        <button disabled={loading}>{loading ? "Génération en cours…" : "Générer ma stratégie"}</button>
        {error && <p className="err">{error}</p>}
      </form>
      {strategy && <StrategyView s={strategy} budget={profile.monthlyBudget} />}
    </>
  );
}

function List({ items }: { items: string[] }) {
  return <ul>{items.map((i, k) => <li key={k}>{i}</li>)}</ul>;
}

function StrategyView({ s, budget }: { s: Strategy; budget: number }) {
  return (
    <>
      <section className="card"><h2>Étude de marché</h2><p>{s.marketStudy}</p></section>
      <section className="card"><h2>SWOT</h2>
        <div className="grid">
          <div><h3>Forces</h3><List items={s.swot.strengths} /></div>
          <div><h3>Faiblesses</h3><List items={s.swot.weaknesses} /></div>
          <div><h3>Opportunités</h3><List items={s.swot.opportunities} /></div>
          <div><h3>Menaces</h3><List items={s.swot.threats} /></div>
        </div></section>
      <section className="card"><h2>Concurrence</h2>
        <table><thead><tr><th>Concurrent</th><th>Positionnement</th><th>Point faible</th></tr></thead>
          <tbody>{s.competitors.map((c, k) => <tr key={k}><td>{c.name}</td><td>{c.positioning}</td><td>{c.weakness}</td></tr>)}</tbody></table></section>
      <section className="card"><h2>Personas</h2>
        {s.personas.map((p, k) => <p key={k}><strong>{p.name}</strong> — {p.description}<br /><span className="muted">Besoins: {p.needs} · Canaux: {p.channels.join(", ")}</span></p>)}</section>
      <section className="card"><h2>Segmentation et positionnement</h2><p>{s.segmentation}</p><p><strong>{s.positioning}</strong></p></section>
      <section className="card"><h2>Marque</h2><p><strong>{s.brand.promise}</strong></p><p>Ton: {s.brand.tone}</p><p>Valeurs: {s.brand.values.join(", ")}</p></section>
      <section className="card"><h2>Canaux et budget</h2>
        <table><thead><tr><th>Canal</th><th>Part</th><th>USD/mois</th><th>Rôle</th><th>Objectif</th></tr></thead>
          <tbody>{s.channels.map((c, k) => <tr key={k}><td>{c.channel}</td><td>{(c.budgetShare * 100).toFixed(0)}%</td><td>{(c.budgetShare * budget).toFixed(0)}</td><td>{c.role}</td><td>{c.targetValue} ({c.targetKpi})</td></tr>)}</tbody></table></section>
      <section className="card"><h2>Stratégie de contenu</h2><p>{s.contentStrategy}</p>
        <table><tbody>{s.editorialCalendar.map((w) => <tr key={w.week}><td>Sem. {w.week}</td><td>{w.theme}</td><td>{w.formats.join(", ")}</td></tr>)}</tbody></table></section>
      <section className="card"><h2>Tunnel de conversion</h2>
        <table><tbody>{s.funnel.map((f, k) => <tr key={k}><td>{f.stage}</td><td>{f.action}</td><td className="muted">{f.kpi}</td></tr>)}</tbody></table></section>
      <section className="card"><h2>KPIs</h2>
        <table><tbody>{s.kpis.map((k, i) => <tr key={i}><td>{k.name}</td><td>{k.target} {k.unit}</td></tr>)}</tbody></table></section>
      <section className="card"><h2>Plan d'exécution</h2>
        {s.executionPlan.map((p, k) => <div key={k}><h3>{p.period}</h3><List items={p.actions} /></div>)}</section>
    </>
  );
}
