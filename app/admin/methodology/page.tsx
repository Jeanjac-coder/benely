import { METHODOLOGY_STEP_LABELS, METHODOLOGY_STEPS } from "@/lib/methodology";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MethodologyForm } from "./MethodologyForm";

export default async function MethodologyPage() {
  const { data } = await supabaseAdmin().from("methodology_documents")
    .select("version, title, content, active, source_filename, created_at").order("version", { ascending: false });
  const versions = data ?? [];
  const active = versions.find((v) => v.active);
  return (
    <>
      <h1>Méthodologie</h1>
      <p className="muted small">
        Document de référence de Benely. La version active est injectée dans chaque génération: elle prime sur toute autre méthode,
        sert de grille d'audit systématique ({METHODOLOGY_STEPS.length} étapes) et est enregistrée avec chaque stratégie produite.
      </p>
      <div className="card">
        <h2>Version active {active ? `: v${active.version}` : ""}</h2>
        {active ? (
          <>
            <p><b>{active.title}</b> <span className="muted small">· {active.source_filename ?? "saisie manuelle"} · {new Date(active.created_at).toLocaleDateString("fr-FR")} · {active.content.length.toLocaleString("fr-FR")} caractères</span></p>
            <details><summary>Lire le document</summary><p className="pre small" style={{ marginTop: 12 }}>{active.content}</p></details>
          </>
        ) : <p className="err">Aucune méthodologie active: les générations se font sans document de référence.</p>}
      </div>
      <div className="card">
        <h2>Grille d'audit appliquée à chaque utilisateur</h2>
        <ol>{METHODOLOGY_STEPS.map((s) => <li key={s}>{METHODOLOGY_STEP_LABELS[s].replace(/^\d+\.\s*/, "")}</li>)}</ol>
        <p className="muted small">Pour chaque étape: statut (conforme, partiel, absent, inconnu), constat et recommandation. Une étape non évaluée est signalée comme erreur dans le contrôle de cohérence.</p>
      </div>
      <MethodologyForm
        versions={versions.map((v) => ({ version: v.version, title: v.title, active: v.active, created_at: v.created_at }))}
        current={active ? { title: active.title, content: active.content } : null}
      />
    </>
  );
}
