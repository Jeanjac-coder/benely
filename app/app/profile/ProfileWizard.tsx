"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/components/client";
import { ListInput } from "@/components/ListInput";
import { COUNTRIES, countryContext } from "@/lib/africa";
import { CURRENCIES } from "@/lib/money";
import { MARKETS, ProfileSchema, SIZES, type Profile } from "@/lib/profile";
import { buildSummary, followUps, missingData, type Answers } from "@/lib/questionnaire";

const CHANNEL_SUGGESTIONS = ["WhatsApp Business", "Facebook", "Instagram", "TikTok", "LinkedIn", "Site web", "Radio", "Affichage", "SMS"];
const SALES_SUGGESTIONS = ["Boutique", "WhatsApp", "Site e-commerce", "Distributeurs", "Force de vente", "Marketplaces"];

export function ProfileWizard({ initial, initialAnswers, savedSummary, validatedAt }: { initial: Profile; initialAnswers: Answers; savedSummary: string | null; validatedAt: string | null }) {
  const [p, setP] = useState(initial);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [step, setStep] = useState<1 | 2 | 3>(validatedAt ? 3 : 1);
  const [summary, setSummary] = useState(savedSummary ?? "");
  const [validated, setValidated] = useState(Boolean(validatedAt));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const questions = useMemo(() => followUps(p), [p]);
  const ctx = countryContext(p.country);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => { setP((x) => ({ ...x, [k]: v })); setValidated(false); };

  async function save(next: 1 | 2 | 3) {
    setBusy(true); setMsg(null);
    try {
      if (next === 2) {
        const r = ProfileSchema.safeParse(p);
        if (!r.success) throw new Error(r.error.issues.map((i) => i.message).join(", "));
      }
      await api("/api/profile", "PUT", { data: p, answers });
      if (next === 3) setSummary(buildSummary(p, answers));
      setValidated(false);
      setStep(next);
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function validate() {
    setBusy(true); setMsg(null);
    try {
      await api("/api/profile/validate", "POST", { summary });
      setValidated(true);
      setMsg({ ok: true, text: "Synthèse validée." });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Profil et diagnostic</h1>
      <ol className="stepper" aria-label="Étapes">
        {["Profil de l'entreprise", "Questions complémentaires", "Synthèse à valider"].map((label, i) => (
          <li key={label} data-state={i + 1 === step ? "current" : i + 1 < step ? "done" : "todo"} aria-current={i + 1 === step ? "step" : undefined}>
            <span>{i + 1 < step ? "✓" : i + 1}</span>{label}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <form className="card" onSubmit={(e) => { e.preventDefault(); save(2); }}>
          <div className="grid">
            <div><label htmlFor="name">Nom</label><input id="name" required value={p.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div><label htmlFor="sector">Secteur d'activité</label><input id="sector" required value={p.sector} onChange={(e) => set("sector", e.target.value)} /></div>
            <div><label htmlFor="country">Pays</label>
              <select id="country" value={p.country} onChange={(e) => { set("country", e.target.value); set("currency", COUNTRIES[e.target.value].currency); set("zones", []); }}>
                {Object.entries(COUNTRIES).map(([code, c]) => <option key={code} value={code}>{c.name}</option>)}
              </select></div>
            <div><label htmlFor="size">Taille</label>
              <select id="size" value={p.size} onChange={(e) => set("size", e.target.value as Profile["size"])}>
                {Object.entries(SIZES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div><label htmlFor="market">Marché</label>
              <select id="market" value={p.market} onChange={(e) => set("market", e.target.value as Profile["market"])}>
                {Object.entries(MARKETS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div><label htmlFor="zones">Zones commerciales</label>
              <select id="zones" multiple value={p.zones} onChange={(e) => set("zones", [...e.target.selectedOptions].map((o) => o.value))} size={4}>
                {ctx.zones.map((z) => <option key={z}>{z}</option>)}
              </select></div>
            <div><label htmlFor="budget">Budget marketing mensuel</label><input id="budget" type="number" min={1} required value={p.monthlyBudget || ""} onChange={(e) => set("monthlyBudget", e.target.valueAsNumber || 0)} /></div>
            <div><label htmlFor="currency">Devise</label>
              <select id="currency" value={p.currency} onChange={(e) => set("currency", e.target.value)}>
                {Object.entries(CURRENCIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div><label htmlFor="team">Personnes dédiées au marketing</label><input id="team" type="number" min={0} value={p.teamSize} onChange={(e) => set("teamSize", e.target.valueAsNumber || 0)} /></div>
            <div><label htmlFor="languages">Langues de communication</label><ListInput id="languages" value={p.languages} placeholder={ctx.languages.join(", ")} onChange={(v) => set("languages", v)} /></div>
          </div>
          <label htmlFor="products">Produits et services</label><textarea id="products" required rows={2} value={p.products} onChange={(e) => set("products", e.target.value)} />
          <label htmlFor="clientele">Clientèle actuelle et visée</label><textarea id="clientele" required rows={2} value={p.clientele} onChange={(e) => set("clientele", e.target.value)} />
          <label htmlFor="objectives">Objectifs commerciaux et marketing</label><textarea id="objectives" required rows={2} value={p.objectives} onChange={(e) => set("objectives", e.target.value)} />
          <label htmlFor="competitors">Concurrents connus</label><input id="competitors" value={p.competitors} onChange={(e) => set("competitors", e.target.value)} />
          <label htmlFor="channels">Canaux marketing utilisés (séparés par des virgules)</label><ListInput id="channels" value={p.channels} onChange={(v) => set("channels", v)} />
          <p className="muted small">Suggestions: {CHANNEL_SUGGESTIONS.join(", ")}</p>
          <label htmlFor="sales">Canaux de vente (séparés par des virgules)</label><ListInput id="sales" value={p.salesChannels} onChange={(v) => set("salesChannels", v)} />
          <p className="muted small">Suggestions: {SALES_SUGGESTIONS.join(", ")}</p>
          <label htmlFor="resources">Ressources disponibles (compétences, prestataires, outils, contenus existants)</label><textarea id="resources" rows={2} value={p.resources} onChange={(e) => set("resources", e.target.value)} />
          <button disabled={busy} style={{ marginTop: 14 }}>Continuer</button>
          {msg && <p className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
        </form>
      )}

      {step === 2 && (
        <form className="card" onSubmit={(e) => { e.preventDefault(); save(3); }}>
          <p className="muted">Ces questions dépendent de vos réponses. Répondez à celles que vous pouvez: les autres seront traitées comme données manquantes.</p>
          {questions.map((q) => (
            <div key={q.id}>
              <label htmlFor={q.id}>{q.label}</label>
              {q.type === "choice" ? (
                <select id={q.id} value={answers[q.id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}>
                  <option value="">—</option>{q.options!.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : <input id={q.id} placeholder={q.hint} value={answers[q.id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} />}
            </div>
          ))}
          <div className="row" style={{ marginTop: 14 }}>
            <button type="button" className="ghost" onClick={() => setStep(1)}>Retour</button>
            <button disabled={busy}>Voir la synthèse</button>
          </div>
          {msg && <p className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
        </form>
      )}

      {step === 3 && (
        <div className="card">
          <p className="muted">Relisez et corrigez la synthèse: c'est elle que l'IA utilisera comme référence.</p>
          <label htmlFor="summary">Synthèse</label>
          <textarea id="summary" rows={14} value={summary} onChange={(e) => { setSummary(e.target.value); setValidated(false); }} />
          {missingData(p, answers).length > 0 && (
            <p className="small issue-info">Données manquantes: {missingData(p, answers).join(" · ")}</p>
          )}
          <div className="row" style={{ marginTop: 14 }}>
            <button type="button" className="ghost" onClick={() => setStep(1)}>Modifier le profil</button>
            <button type="button" className="ghost" onClick={() => setStep(2)}>Questions</button>
            <button disabled={busy || validated} onClick={validate}>{validated ? "Synthèse validée" : "Valider la synthèse"}</button>
            {validated && <Link href="/app/generate">Générer la stratégie →</Link>}
          </div>
          {msg && <p className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
        </div>
      )}
    </>
  );
}
