import type { AnswerValue, Answers } from "./questionnaire.ts";

// Score de maturité marketing (0 à 100), calculé de façon déterministe à partir du questionnaire.
// Règles explicites et pondérations documentées: l'équipe peut les auditer et les ajuster.

export const DIMENSIONS = {
  strategie: { label: "Stratégie et pilotage", weight: 20 },
  digital: { label: "Présence digitale", weight: 20 },
  marque: { label: "Identité de marque", weight: 15 },
  concurrence: { label: "Positionnement concurrentiel", weight: 10 },
  client: { label: "Parcours client", weight: 15 },
  communication: { label: "Communication", weight: 10 },
  innovation: { label: "Innovation et IA", weight: 10 },
} as const;
export type Dimension = keyof typeof DIMENSIONS;

export interface Maturity {
  score: number;
  level: "debutant" | "intermediaire" | "avance";
  dimensions: Record<Dimension, number>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export const LEVEL_LABELS: Record<Maturity["level"], string> = { debutant: "Débutant", intermediaire: "Intermédiaire", avance: "Avancé" };

const pick = (v: AnswerValue | undefined, table: Record<string, number>) => (typeof v === "string" && v in table ? table[v] : null);
const count = (v: AnswerValue | undefined, none: string, max: number) => (Array.isArray(v) ? Math.min(1, v.filter((x) => x !== none).length / max) * 100 : null);
const scale = (v: AnswerValue | undefined) => (typeof v === "number" && v >= 1 && v <= 5 ? ((v - 1) / 4) * 100 : null);
/** Moyenne des critères renseignés (une question sans réponse ne pénalise pas, sauf si aucune n'est renseignée). */
const avg = (...xs: (number | null)[]) => { const v = xs.filter((x): x is number => x !== null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0; };

export function dimensionScores(a: Answers): Record<Dimension, number> {
  return {
    strategie: avg(
      pick(a.strategy_formalized, { Oui: 100, "En cours de structuration": 50, Non: 0 }),
      pick(a.results_tracking, { Jamais: 0, Ponctuellement: 35, "Chaque mois": 75, "Chaque semaine": 100 }),
      scale(a.customer_knowledge),
    ),
    digital: avg(
      count(a.digital_channels, "Aucun", 4),
      pick(a.website, { "Pas de site": 0, "Site vitrine": 60, "Site e-commerce": 100 }),
      pick(a.posting_frequency, { "Rarement ou jamais": 0, "Quelques fois par mois": 40, "Chaque semaine": 75, "Presque chaque jour": 100 }),
      count(a.analytics_tools, "Aucun", 2),
    ),
    marque: avg(count(a.brand_elements, "Aucun", 5), scale(a.brand_consistency), typeof a.value_proposition === "string" && a.value_proposition.trim() ? 100 : null),
    concurrence: avg(
      count(a.differentiators, "Pas encore clairement", 2),
      pick(a.competitive_watch, { Jamais: 0, "De temps en temps": 50, Régulièrement: 100 }),
      typeof a.competitors === "string" ? (a.competitors.trim() ? 100 : 0) : null,
    ),
    client: avg(
      count(a.acquisition_sources, "", 3),
      pick(a.sales_process, { Non: 0, "En partie": 50, "Oui, avec un suivi des prospects (CRM ou tableur)": 100 }),
      count(a.loyalty, "Rien de particulier", 2),
    ),
    communication: avg(
      count(a.comm_supports, "", 3),
      pick(a.comm_frequency, { Rarement: 0, "Chaque mois": 40, "Chaque semaine": 75, "Plusieurs fois par semaine": 100 }),
      scale(a.comm_performance),
    ),
    innovation: avg(
      pick(a.ai_usage, { Jamais: 0, Occasionnellement: 50, Régulièrement: 100 }),
      count(a.automations, "Aucune", 2),
      scale(a.ai_interest),
    ),
  };
}

// Recommandation type par dimension faible (alignée sur les étapes de la méthodologie Benely).
const ADVICE: Record<Dimension, string> = {
  strategie: "Formaliser une stratégie écrite: 3 à 5 enjeux prioritaires, des objectifs SMART et un point mensuel sur les résultats.",
  digital: "Structurer votre présence digitale sur 2 ou 3 canaux où se trouvent vos clients, avec un rythme de publication régulier et des statistiques suivies.",
  marque: "Définir votre plateforme de marque (mission, valeurs, proposition de valeur, ton) et l'appliquer de façon cohérente sur tous vos supports.",
  concurrence: "Clarifier ce qui vous distingue de vos concurrents et mettre en place une veille simple de leurs offres et de leur communication.",
  client: "Cartographier le parcours de vos clients, suivre vos prospects dans un outil simple et lancer une action de fidélisation (relances, offres clients).",
  communication: "Construire un calendrier éditorial avec 3 à 5 thèmes récurrents et mesurer les résultats de chaque publication.",
  innovation: "Automatiser les tâches répétitives (réponses WhatsApp, relances, suivi client) et tester un outil d'IA pour produire vos contenus plus vite.",
};

export function computeMaturity(a: Answers): Maturity {
  const dimensions = dimensionScores(a);
  const entries = (Object.keys(DIMENSIONS) as Dimension[]).map((d) => ({ d, v: dimensions[d] }));
  const totalWeight = entries.reduce((s, e) => s + DIMENSIONS[e.d].weight, 0);
  const score = Math.round(entries.reduce((s, e) => s + e.v * DIMENSIONS[e.d].weight, 0) / totalWeight);
  const sorted = [...entries].sort((x, y) => y.v - x.v);
  const strengths = sorted.filter((e) => e.v >= 60).slice(0, 3).map((e) => DIMENSIONS[e.d].label);
  const weak = [...entries].sort((x, y) => x.v - y.v).filter((e) => e.v < 50).slice(0, 3);
  return {
    score,
    level: score >= 70 ? "avance" : score >= 40 ? "intermediaire" : "debutant",
    dimensions: Object.fromEntries(entries.map((e) => [e.d, Math.round(e.v)])) as Record<Dimension, number>,
    strengths,
    weaknesses: weak.map((e) => DIMENSIONS[e.d].label),
    recommendations: (weak.length ? weak : sorted.slice(-2)).map((e) => ADVICE[e.d]),
  };
}

// Benchmark sectoriel anonymisé (fonction SQL sector_benchmark: agrégats à partir de 5 entreprises).
export interface Benchmark {
  sector: string | null;
  sector_companies: number;
  sector_average: number | null;
  sector_p25: number | null;
  sector_p75: number | null;
  all_companies: number;
  all_average: number | null;
}

/** Phrase de comparaison sectorielle (rien n'est affiché sous le seuil d'anonymat). */
export function benchmarkText(score: number, b: Benchmark | null): string {
  if (b?.sector_average != null) {
    const gap = score - b.sector_average;
    const pos = gap >= 5 ? "au-dessus de" : gap <= -5 ? "en dessous de" : "dans";
    return `Votre score (${score}/100) se situe ${pos} la moyenne des entreprises du secteur ${b.sector} sur Benely (${b.sector_average}/100, ${b.sector_companies} entreprises; la moitié d'entre elles entre ${b.sector_p25} et ${b.sector_p75}).`;
  }
  if (b?.all_average != null) {
    return `Pas encore assez d'entreprises de votre secteur pour une comparaison anonyme. Moyenne de toutes les entreprises Benely: ${b.all_average}/100 (${b.all_companies} entreprises).`;
  }
  return "Le benchmark sectoriel s'affichera dès que suffisamment d'entreprises comparables auront réalisé leur diagnostic (5 au minimum, pour garantir l'anonymat).";
}
