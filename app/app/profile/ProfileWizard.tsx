"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/components/client";
import { Mascot } from "@/components/Mascot";
import type { Recommendations } from "@/lib/ai/recommendations";
import { allSections, missingRequired, visible } from "@/lib/diagnostic";
import type { Benchmark, Maturity } from "@/lib/maturity";
import type { AnswerValue, Answers } from "@/lib/questionnaire";
import { DiagnosticResults } from "./DiagnosticResults";
import { QuestionField } from "./QuestionField";

export interface WizardProps {
  initialAnswers: Answers;
  savedSummary: string | null;
  validatedAt: string | null;
  maturity: Maturity | null;
  benchmark: Benchmark | null;
  recommendations: Recommendations | null;
  bookingUrl: string | null;
}

type Phase = "welcome" | "questions" | "results";

export function ProfileWizard(props: WizardProps) {
  const [answers, setAnswers] = useState<Answers>(props.initialAnswers);
  const [phase, setPhase] = useState<Phase>(props.maturity ? "results" : "welcome");
  const [idx, setIdx] = useState(0);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [result, setResult] = useState({ maturity: props.maturity, benchmark: props.benchmark, recommendations: props.recommendations, summary: props.savedSummary, validatedAt: props.validatedAt });
  const sections = useMemo(() => allSections(answers), [answers]);
  const section = sections[Math.min(idx, sections.length - 1)];
  const dirty = useRef(false);
  const top = useRef<HTMLDivElement>(null);

  // Sauvegarde automatique (brouillon) une seconde après la dernière réponse.
  useEffect(() => {
    if (!dirty.current) return;
    setSaved("saving");
    const t = setTimeout(() => {
      api("/api/profile", "PUT", { answers }).then(() => setSaved("saved")).catch(() => setSaved("idle"));
    }, 1000);
    return () => clearTimeout(t);
  }, [answers]);

  const set = (id: string, v: AnswerValue | undefined) => {
    dirty.current = true;
    setInvalid((x) => x.filter((i) => i !== id));
    setAnswers((a) => {
      const next = { ...a };
      if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) delete next[id]; else next[id] = v;
      return next;
    });
  };

  const scrollTop = () => requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

  async function next() {
    const missing = missingRequired(section, answers);
    if (missing.length) {
      setInvalid(missing.map((q) => q.id));
      setErr(missing.length === 1 ? "Il manque une réponse pour continuer." : `Il manque ${missing.length} réponses pour continuer.`);
      document.getElementById(missing[0].id)?.focus() ?? document.querySelector<HTMLElement>(`[name="${missing[0].id}"]`)?.focus();
      return;
    }
    setErr(""); setInvalid([]);
    if (idx < sections.length - 1) { setIdx(idx + 1); scrollTop(); return; }
    setBusy(true);
    try {
      const r = await api<{ maturity: Maturity; benchmark: Benchmark | null }>("/api/profile", "PUT", { answers, complete: true });
      dirty.current = false;
      setResult({ maturity: r.maturity, benchmark: r.benchmark, recommendations: null, summary: null, validatedAt: null });
      setPhase("results");
      scrollTop();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function back() {
    setErr(""); setInvalid([]);
    if (idx === 0) setPhase("welcome"); else setIdx(idx - 1);
    scrollTop();
  }

  if (phase === "results" && result.maturity) {
    return (
      <div ref={top}>
        <DiagnosticResults
          answers={answers}
          maturity={result.maturity}
          benchmark={result.benchmark}
          initialRecommendations={result.recommendations}
          savedSummary={result.summary}
          validatedAt={result.validatedAt}
          bookingUrl={props.bookingUrl}
          onEdit={() => { setPhase("questions"); setIdx(0); scrollTop(); }}
        />
      </div>
    );
  }

  if (phase === "welcome") {
    return (
      <div className="dq" ref={top}>
        <section className="dq-welcome card">
          <Mascot pose="wave" height={150} eager />
          <div>
            <p className="eyebrow">Diagnostic stratégique · 8 à 10 minutes</p>
            <h1>Faisons le point sur votre marketing</h1>
            <p className="lead">Répondez à quelques questions guidées, sans jargon. À la fin, vous recevez immédiatement votre <strong>score de maturité sur 100</strong>, vos <strong>3 actions prioritaires</strong>, une comparaison avec votre secteur et un <strong>rapport PDF</strong> personnalisé.</p>
            <ul className="dq-promises">
              <li>Vos réponses sont enregistrées automatiquement: vous pouvez reprendre plus tard.</li>
              <li>Elles restent confidentielles et ne servent qu'à votre diagnostic.</li>
              <li>Pas de bonne ou de mauvaise réponse: c'est votre point de départ.</li>
            </ul>
            <div className="row">
              <button className="btn-lg" onClick={() => { setPhase("questions"); scrollTop(); }}>{Object.keys(answers).length > 3 ? "Reprendre le diagnostic" : "Commencer le diagnostic"} →</button>
              {result.maturity && <button className="ghost" onClick={() => setPhase("results")}>Voir mes résultats</button>}
            </div>
          </div>
        </section>
      </div>
    );
  }

  const progress = Math.round(((idx + 1) / sections.length) * 100);
  const questions = section.questions.filter((q) => visible(q, answers));
  return (
    <div className="dq" ref={top}>
      <div className="dq-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Progression du diagnostic">
        <div className="dq-progress-head">
          <span>Étape {idx + 1} sur {sections.length} · <strong>{section.title}</strong></span>
          <span className="muted small" aria-live="polite">{saved === "saving" ? "Enregistrement…" : saved === "saved" ? "Enregistré ✓" : ""}</span>
        </div>
        <div className="dq-bar"><span style={{ width: `${progress}%` }} /></div>
        <ol className="dq-steps" aria-hidden="true">
          {sections.map((s, i) => <li key={s.id} data-state={i === idx ? "current" : i < idx ? "done" : "todo"} title={s.title} />)}
        </ol>
      </div>

      <form key={section.id} className="dq-section" onSubmit={(e) => { e.preventDefault(); next(); }} noValidate>
        <div className="dq-ben">
          <Mascot pose={section.pose} height={84} motion="sway" eager />
          <p className="dq-bubble">{section.intro}</p>
        </div>
        <div className="card dq-card">
          {questions.map((q) => (
            <QuestionField key={q.id} q={q} answers={answers} invalid={invalid.includes(q.id)} onChange={(v) => set(q.id, v)} />
          ))}
        </div>
        {err && <p className="err dq-err" role="alert">{err}</p>}
        <div className="dq-nav">
          <button type="button" className="ghost" onClick={back}>← Retour</button>
          <button disabled={busy}>
            {busy ? <><span className="spinner" /> Calcul de votre diagnostic…</> : idx === sections.length - 1 ? "Voir mon diagnostic" : "Continuer →"}
          </button>
        </div>
      </form>
    </div>
  );
}
