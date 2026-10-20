"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/components/client";
import { STEP_LABELS, STEPS, type Step } from "@/lib/ai/schemas";
import { PeriodPicker } from "@/components/PeriodPicker";
import { presetPeriod, today } from "@/lib/calendar";

type Pending = { id: string; status: string; error: string | null; completed: Step[] } | null;
type RunResult = { status: string; step?: Step; strategyId?: string; error?: string; busy?: boolean };

export function Generator({ pending }: { pending: Pending }) {
  const router = useRouter();
  const [period, setPeriod] = useState(presetPeriod("30j", today()));
  const [jobId, setJobId] = useState(pending?.id ?? null);
  const [done, setDone] = useState<Step[]>(pending?.completed ?? []);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(pending?.error ?? "");

  async function loop(id: string) {
    setRunning(true); setError("");
    try {
      for (;;) {
        // Une expiration côté serveur renvoie une page HTML: on la traduit en échec relançable.
        const r: RunResult = await fetch(`/api/jobs/${id}/run`, { method: "POST" })
          .then((x) => x.json())
          .catch(() => ({ status: "failed", error: "La connexion au serveur a été interrompue. Relancez l'étape." }));
        if (r.status === "succeeded") { router.push("/app/strategy"); router.refresh(); return; }
        if (r.status === "failed") throw new Error(r.error || "La génération a échoué.");
        if (r.busy) await new Promise((res) => setTimeout(res, 4000));
        const s = await api<{ completed: Step[] }>(`/api/jobs/${id}`, "GET");
        setDone(s.completed);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  async function start() {
    setError("");
    try {
      const { id } = await api<{ id: string }>("/api/jobs", "POST", { period });
      setJobId(id); setDone([]);
      await loop(id);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const current = STEPS.find((s) => !done.includes(s));
  return (
    <>
      <h1>Génération de la stratégie</h1>
      {!jobId && (
        <div className="card">
          <p>La génération enchaîne six étapes et prend généralement quelques minutes. Vous pouvez quitter la page: la progression est conservée.</p>
          <PeriodPicker value={period} onChange={setPeriod} />
          <button onClick={start} disabled={running} style={{ marginTop: 14 }}>Lancer la génération</button>
        </div>
      )}
      {jobId && (
        <div className="card" aria-live="polite">
          <ol className="progress">
            {STEPS.map((s) => (
              <li key={s}>{done.includes(s) ? "✓" : s === current && running ? "⏳" : "○"} {STEP_LABELS[s]}</li>
            ))}
            <li>{running && !current ? "⏳" : "○"} Contrôle de cohérence et sauvegarde</li>
          </ol>
          {!running && (
            <div className="row">
              <button onClick={() => loop(jobId)}>{error ? "Relancer l'étape" : "Reprendre"}</button>
              <button className="ghost" onClick={() => { setJobId(null); setError(""); }}>Nouvelle génération</button>
            </div>
          )}
        </div>
      )}
      {error && <p className="err" role="alert">{error}</p>}
    </>
  );
}
