import { instruction, SYSTEM, type JobInput } from "@/lib/ai/prompts";
import { STEP_LABELS, STEPS } from "@/lib/ai/schemas";
import { MODEL } from "@/lib/ai/client";
import { EMPTY_PROFILE } from "@/lib/profile";

const EXAMPLE: JobInput = {
  profile: { ...EMPTY_PROFILE, name: "Exemple", monthlyBudget: 150_000 },
  answers: {}, summary: "", period: { start: "2026-11-01", end: "2026-11-30" },
};

export default function Prompts() {
  return (
    <>
      <h1>Prompts</h1>
      <p className="muted small">Modèle: {MODEL}. Les prompts sont versionnés avec le code (lib/ai/prompts.ts): toute modification passe par une revue et un déploiement. Exemple rendu pour un budget de 150 000 FCFA sur novembre.</p>
      <div className="card"><h2>Prompt système</h2><p className="pre small">{SYSTEM}</p></div>
      {STEPS.map((s) => (
        <div key={s} className="card"><h2>{STEP_LABELS[s]}</h2><p className="pre small">{instruction(s, EXAMPLE, {})}</p></div>
      ))}
    </>
  );
}
