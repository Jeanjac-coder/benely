import { stepLabel, type Recommendations } from "../ai/recommendations.ts";
import { answerText, SECTIONS, toProfile, visible } from "../diagnostic.ts";
import { benchmarkText, DIMENSIONS, LEVEL_LABELS, type Benchmark, type Dimension, type Maturity } from "../maturity.ts";
import type { Answers } from "../questionnaire.ts";
import type { ExportDoc, Logo, Section } from "./model.ts";

export type { Benchmark };

/** Rapport de diagnostic personnalisé (PDF): synthèse, opportunités, plan d'action et priorités. */
export function buildDiagnosticDoc(a: Answers, m: Maturity, reco: Recommendations, bench: Benchmark | null, opts: { company: string; logo: Logo | null; date?: Date }): ExportDoc {
  const p = toProfile(a);
  const dims = Object.keys(DIMENSIONS) as Dimension[];
  const sections: Section[] = [
    {
      id: "synthese", title: "1. Synthèse du diagnostic",
      blocks: [
        { kind: "p", label: "Score de maturité marketing", text: `${m.score}/100 — niveau ${LEVEL_LABELS[m.level]}.` },
        { kind: "table", label: "Détail par dimension", columns: ["Dimension", "Score", "Pondération"], rows: dims.map((d) => [DIMENSIONS[d].label, `${m.dimensions[d]}/100`, `${DIMENSIONS[d].weight} %`]) },
        { kind: "list", label: "Forces", items: m.strengths.length ? m.strengths : ["Aucune dimension n'atteint encore 60/100: toutes les marges de progrès sont devant vous."] },
        { kind: "list", label: "Points à renforcer", items: m.weaknesses },
        { kind: "p", label: "Benchmark sectoriel", text: benchmarkText(m.score, bench) },
      ],
    },
    {
      id: "opportunites", title: "2. Opportunités de croissance",
      blocks: [{ kind: "list", items: reco.opportunities }, { kind: "list", label: "Recommandations par dimension", items: m.recommendations }],
    },
    {
      id: "plan", title: "3. Plan d'action recommandé",
      blocks: reco.actions.flatMap((x, i) => [
        { kind: "h" as const, text: `Action ${i + 1} — ${x.title}` },
        { kind: "p" as const, label: "Pourquoi", text: x.why },
        { kind: "list" as const, label: "Comment", items: x.how },
        { kind: "p" as const, label: "Échéance · indicateur · étape de la méthodologie", text: `${x.horizon} · ${x.kpi} · ${stepLabel(x.methodologyStep)}` },
      ]),
    },
    { id: "priorites", title: "4. Priorités à court terme (30 jours)", blocks: [{ kind: "list", items: reco.shortTerm }] },
    {
      id: "reponses", title: "5. Vos réponses",
      blocks: SECTIONS.map((s) => ({
        kind: "table" as const, label: s.title, columns: ["Question", "Réponse"],
        rows: s.questions.filter((q) => visible(q, a) && answerText(q, a)).map((q) => [q.label, answerText(q, a)]),
      })).filter((b) => b.rows.length > 0),
    },
  ];
  return {
    title: "Diagnostic marketing",
    company: opts.company || p.name,
    subtitle: `${p.sector || "Secteur non précisé"} · score de maturité ${m.score}/100${reco.source === "regles" ? " · recommandations standard" : ""}`,
    generatedAt: (opts.date ?? new Date()).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    logo: opts.logo,
    sections,
  };
}
