"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/components/client";
import { Mascot } from "@/components/Mascot";
import { stepLabel, type Recommendations } from "@/lib/ai/recommendations";
import { diagnosticSummary } from "@/lib/diagnostic";
import { benchmarkText, DIMENSIONS, LEVEL_LABELS, type Benchmark, type Dimension, type Maturity } from "@/lib/maturity";
import type { Answers } from "@/lib/questionnaire";

const LEVEL_TEXT: Record<Maturity["level"], string> = {
  debutant: "Les fondations sont à poser: chaque action aura un effet rapide et visible.",
  intermediaire: "Les bases sont là. Il s'agit maintenant de structurer et d'accélérer.",
  avance: "Votre marketing est solide. Place à l'optimisation et à l'innovation.",
};

export function DiagnosticResults({ answers, maturity: m, benchmark, initialRecommendations, savedSummary, validatedAt, bookingUrl, onEdit }: {
  answers: Answers; maturity: Maturity; benchmark: Benchmark | null; initialRecommendations: Recommendations | null;
  savedSummary: string | null; validatedAt: string | null; bookingUrl: string | null; onEdit: () => void;
}) {
  const [reco, setReco] = useState(initialRecommendations);
  const [recoErr, setRecoErr] = useState("");
  const dims = Object.keys(DIMENSIONS) as Dimension[];

  useEffect(() => {
    if (reco) return;
    let live = true;
    api<Recommendations>("/api/diagnostic/recommendations", "POST")
      .then((r) => { if (live) setReco(r); })
      .catch((e) => { if (live) setRecoErr((e as Error).message); });
    return () => { live = false; };
  }, [reco]);

  return (
    <div className="dr">
      <section className="card dr-hero">
        <ScoreRing score={m.score} />
        <div className="dr-hero-text">
          <p className="eyebrow">Votre diagnostic marketing</p>
          <h1>Niveau {LEVEL_LABELS[m.level].toLowerCase()}</h1>
          <p className="lead">{LEVEL_TEXT[m.level]}</p>
          <div className="row">
            <a className="btn" href="/api/diagnostic/report" download>Télécharger le rapport PDF</a>
            <a className="btn btn-ghost" href="#rdv">Échanger avec un expert</a>
            <button className="ghost" onClick={onEdit}>Modifier mes réponses</button>
          </div>
        </div>
      </section>

      <div className="dr-grid">
        <section className="card">
          <h2>Votre maturité, dimension par dimension</h2>
          <ul className="dr-bars">
            {dims.map((d) => (
              <li key={d}>
                <div className="dr-bar-head"><span>{DIMENSIONS[d].label}</span><strong>{m.dimensions[d]}</strong></div>
                <div className="dr-bar" data-tone={m.dimensions[d] >= 60 ? "good" : m.dimensions[d] >= 35 ? "mid" : "low"}><span style={{ width: `${Math.max(3, m.dimensions[d])}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Comparaison avec votre secteur</h2>
          <BenchmarkGauge score={m.score} b={benchmark} />
          <p className="small muted">{benchmarkText(m.score, benchmark)}</p>
          <p className="small muted">Comparaison anonyme: seules des moyennes sont publiées, jamais les réponses d'une entreprise.</p>
        </section>
      </div>

      <div className="dr-grid">
        <section className="card dr-list dr-strengths">
          <h2>Vos forces</h2>
          {m.strengths.length ? <ul>{m.strengths.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="muted">Aucune dimension n'atteint encore 60/100: toutes les marges de progrès sont devant vous.</p>}
        </section>
        <section className="card dr-list dr-weak">
          <h2>Vos axes de progrès</h2>
          {m.weaknesses.length ? <ul>{m.weaknesses.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="muted">Aucune faiblesse majeure: bravo !</p>}
        </section>
      </div>

      <section className="card dr-actions" aria-busy={!reco}>
        <div className="row-top">
          <Mascot pose="point" height={72} motion="none" />
          <div className="grow">
            <h2>Vos 3 actions prioritaires</h2>
            <p className="muted small">{reco?.source === "regles" ? "Recommandations standard issues de votre score (service IA momentanément indisponible)." : "Proposées par l'IA Benely à partir de vos réponses et de la méthodologie Benely."}</p>
          </div>
        </div>
        {!reco && !recoErr && (
          <ol className="dr-action-list">{[0, 1, 2].map((i) => <li key={i} className="dr-action skeleton"><span /><span /><span /></li>)}</ol>
        )}
        {recoErr && <p className="err">{recoErr} <button className="ghost" onClick={() => { setRecoErr(""); setReco(null); }}>Réessayer</button></p>}
        {reco && (
          <>
            <ol className="dr-action-list">
              {reco.actions.map((a, i) => (
                <li key={i} className="dr-action">
                  <span className="dr-num">{i + 1}</span>
                  <h3>{a.title}</h3>
                  <p>{a.why}</p>
                  <ul className="small">{a.how.map((h) => <li key={h}>{h}</li>)}</ul>
                  <div className="dr-tags"><span>⏱ {a.horizon}</span><span>📈 {a.kpi}</span><span>{stepLabel(a.methodologyStep)}</span></div>
                </li>
              ))}
            </ol>
            <div className="dr-grid dr-sub">
              <div><h3>Opportunités</h3><ul>{reco.opportunities.map((o) => <li key={o}>{o}</li>)}</ul></div>
              <div><h3>Vos priorités des 30 prochains jours</h3><ul>{reco.shortTerm.map((o) => <li key={o}>{o}</li>)}</ul></div>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h2>Nos recommandations</h2>
        <ul className="dr-reco">{m.recommendations.map((r) => <li key={r}>{r}</li>)}</ul>
      </section>

      <Booking bookingUrl={bookingUrl} />
      <SummaryValidation answers={answers} savedSummary={savedSummary} validatedAt={validatedAt} />
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 54, c = 2 * Math.PI * r;
  return (
    <div className="dr-ring" role="img" aria-label={`Score de maturité: ${score} sur 100`}>
      <svg viewBox="0 0 128 128" width="148" height="148" aria-hidden="true">
        <circle cx="64" cy="64" r={r} className="dr-ring-track" />
        <circle cx="64" cy="64" r={r} className="dr-ring-value" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} transform="rotate(-90 64 64)" />
      </svg>
      <div className="dr-ring-label"><strong>{score}</strong><span>/100</span></div>
    </div>
  );
}

function BenchmarkGauge({ score, b }: { score: number; b: Benchmark | null }) {
  const avg = b?.sector_average ?? b?.all_average ?? null;
  return (
    <div className="dr-gauge" aria-hidden="true">
      <div className="dr-gauge-track">
        {b?.sector_p25 != null && b.sector_p75 != null && <span className="dr-gauge-band" style={{ left: `${b.sector_p25}%`, width: `${Math.max(1, b.sector_p75 - b.sector_p25)}%` }} />}
        {avg != null && <span className="dr-gauge-avg" style={{ left: `${avg}%` }}><em>Moyenne {avg}</em></span>}
        <span className="dr-gauge-you" style={{ left: `${score}%` }}><em>Vous {score}</em></span>
      </div>
      <div className="dr-gauge-scale"><span>0</span><span>50</span><span>100</span></div>
    </div>
  );
}

const SLOTS = [["matin", "Matin · 8h–12h"], ["midi", "Midi · 12h–14h"], ["apres-midi", "Après-midi · 14h–18h"], ["soir", "Soir · 18h–20h"]] as const;
const CHANNELS = [["whatsapp", "WhatsApp"], ["telephone", "Téléphone"], ["visio", "Visio"]] as const;

function Booking({ bookingUrl }: { bookingUrl: string | null }) {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const [f, setF] = useState({ date: tomorrow, slot: "matin", channel: "whatsapp", phone: "", topic: "" });
  const [state, setState] = useState<{ busy: boolean; ok: boolean; err: string }>({ busy: false, ok: false, err: "" });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ busy: true, ok: false, err: "" });
    try { await api("/api/consultations", "POST", f); setState({ busy: false, ok: true, err: "" }); }
    catch (x) { setState({ busy: false, ok: false, err: (x as Error).message }); }
  }
  return (
    <section className="card dr-booking" id="rdv">
      <div className="row-top">
        <Mascot pose="happy" height={80} motion="none" />
        <div className="grow">
          <h2>Un échange stratégique de 30 minutes, offert</h2>
          <p className="muted">Un consultant Benely relit votre diagnostic avec vous et vous aide à prioriser. Choisissez le moment qui vous arrange: nous vous confirmons le rendez-vous sous 24 h.</p>
        </div>
      </div>
      {bookingUrl && <p><a className="btn" href={bookingUrl} target="_blank" rel="noopener noreferrer">Choisir directement un créneau dans l'agenda →</a></p>}
      {state.ok ? (
        <p className="ok" role="status">Merci ! Votre demande est bien enregistrée. Nous revenons vers vous très vite pour confirmer le rendez-vous.</p>
      ) : (
        <form onSubmit={submit} className="dr-booking-form">
          <div className="grid">
            <div><label htmlFor="rdv-date">Date souhaitée</label><input id="rdv-date" type="date" min={tomorrow} required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
            <div><label htmlFor="rdv-slot">Créneau</label>
              <select id="rdv-slot" value={f.slot} onChange={(e) => setF({ ...f, slot: e.target.value })}>{SLOTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          </div>
          <fieldset><legend className="dq-label">Comment souhaitez-vous échanger ?</legend>
            <div className="dq-segment" role="radiogroup">
              {CHANNELS.map(([v, l]) => (
                <label key={v} className="dq-opt" data-on={f.channel === v || undefined}>
                  <input type="radio" name="rdv-channel" value={v} checked={f.channel === v} onChange={() => setF({ ...f, channel: v })} /><span className="dq-opt-text"><span>{l}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
          {f.channel !== "visio" && <><label htmlFor="rdv-phone">Numéro de téléphone</label><input id="rdv-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+225 07 00 00 00 00" required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></>}
          <label htmlFor="rdv-topic">De quoi aimeriez-vous parler ? <span className="muted">(facultatif)</span></label>
          <textarea id="rdv-topic" rows={2} maxLength={1000} value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} placeholder="Ex. Lancer notre nouvelle offre à Abidjan" />
          <button disabled={state.busy} style={{ marginTop: 14 }}>{state.busy ? "Envoi…" : "Demander mon rendez-vous"}</button>
          {state.err && <p className="err" role="alert">{state.err}</p>}
        </form>
      )}
    </section>
  );
}

function SummaryValidation({ answers, savedSummary, validatedAt }: { answers: Answers; savedSummary: string | null; validatedAt: string | null }) {
  const [summary, setSummary] = useState(savedSummary ?? diagnosticSummary(answers));
  const [validated, setValidated] = useState(Boolean(validatedAt));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function validate() {
    setBusy(true); setMsg(null);
    try {
      await api("/api/profile/validate", "POST", { summary });
      setValidated(true);
      setMsg({ ok: true, text: "Synthèse validée: votre stratégie complète peut être générée." });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card">
      <h2>Étape suivante: votre stratégie complète</h2>
      <p className="muted">Relisez la synthèse de votre entreprise et corrigez-la si besoin: c'est elle que l'IA utilisera pour construire votre audit détaillé, votre plan d'action et vos contenus.</p>
      <details open={!validated}>
        <summary className="small">Afficher la synthèse</summary>
        <label htmlFor="summary">Synthèse</label>
        <textarea id="summary" rows={12} value={summary} onChange={(e) => { setSummary(e.target.value); setValidated(false); }} />
      </details>
      <div className="row" style={{ marginTop: 14 }}>
        <button disabled={busy || validated} onClick={validate}>{validated ? "Synthèse validée ✓" : "Valider la synthèse"}</button>
        {validated && <Link className="btn" href="/app/generate">Générer ma stratégie →</Link>}
      </div>
      {msg && <p className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
    </section>
  );
}
