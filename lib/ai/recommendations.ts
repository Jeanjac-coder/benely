import { z } from "zod";
import { diagnosticDigest, toProfile } from "../diagnostic.ts";
import { DIMENSIONS, type Dimension, type Maturity } from "../maturity.ts";
import { METHODOLOGY_STEPS, METHODOLOGY_STEP_LABELS, type Methodology } from "../methodology.ts";
import type { Answers } from "../questionnaire.ts";
import { buildSummary } from "../questionnaire.ts";

// Recommandations instantanées à l'issue du questionnaire: 3 actions prioritaires,
// les opportunités et les priorités à court terme, alignées sur la méthodologie Benely.

const Action = z.object({
  title: z.string().describe("Action courte et concrète, à l'infinitif"),
  why: z.string().describe("Pourquoi cette action est prioritaire, en lien avec le diagnostic"),
  how: z.array(z.string()).describe("2 à 4 étapes pour la mettre en œuvre"),
  horizon: z.enum(["30 jours", "60 jours", "90 jours"]),
  kpi: z.string().describe("Indicateur pour mesurer le résultat"),
  methodologyStep: z.enum(METHODOLOGY_STEPS),
});

export const RecommendationsSchema = z.object({
  actions: z.array(Action).describe("Exactement 3 actions, de la plus prioritaire à la moins prioritaire"),
  opportunities: z.array(z.string()).describe("2 à 4 opportunités de croissance identifiées"),
  shortTerm: z.array(z.string()).describe("3 à 5 priorités pour les 30 prochains jours"),
});
export type Recommendations = z.infer<typeof RecommendationsSchema> & { source: "ia" | "regles" };

export const RECO_SYSTEM = `Tu es le consultant marketing senior de Benely, spécialiste des entreprises d'Afrique francophone.
À partir d'un questionnaire de diagnostic et d'un score de maturité calculé, tu proposes les 3 actions qui auront le plus d'impact pour cette entreprise, maintenant.
- Appuie-toi sur la méthodologie Benely fournie: chaque action est rattachée à l'une de ses étapes.
- Sois concret, réaliste au regard du budget et de l'équipe déclarés, adapté au pays (WhatsApp, mobile money, réseaux sociaux locaux).
- N'invente aucun chiffre de marché: ne cite que les éléments du questionnaire.
- Rédige en français clair, avec un ton rassurant et professionnel. Vouvoie l'entreprise.`;

export function recommendationsPrompt(a: Answers, m: Maturity, methodology: Methodology | null): { context: string; instruction: string } {
  const dims = (Object.keys(DIMENSIONS) as Dimension[]).map((d) => `- ${DIMENSIONS[d].label}: ${m.dimensions[d]}/100`).join("\n");
  const context = [
    methodology ? `# Méthodologie Benely (v${methodology.version}) — ${methodology.title}\n${methodology.content}` : "# Méthodologie Benely\nNon disponible: applique les étapes standard (audit, objectifs, cible, positionnement, choix stratégiques, plan d'action, budget, mise en œuvre, mesure, optimisation).",
    `# Profil\n${buildSummary(toProfile(a), a)}`,
    `# Réponses au diagnostic\n${diagnosticDigest(a)}`,
    `# Score de maturité calculé: ${m.score}/100\n${dims}\nForces: ${m.strengths.join(", ") || "aucune nette"}\nFaiblesses: ${m.weaknesses.join(", ") || "aucune majeure"}`,
  ].join("\n\n");
  return { context, instruction: "Propose exactement 3 actions prioritaires, puis les opportunités et les priorités des 30 prochains jours." };
}

const FALLBACK: Record<Dimension, Omit<z.infer<typeof Action>, "horizon">> = {
  strategie: { title: "Formaliser votre stratégie marketing sur une page", why: "Sans cap écrit, les actions restent dispersées et difficiles à évaluer.", how: ["Lister 3 à 5 enjeux prioritaires", "Fixer un objectif SMART par enjeu", "Planifier un point mensuel sur les résultats"], kpi: "Objectifs SMART suivis chaque mois", methodologyStep: "objectifs" },
  digital: { title: "Structurer votre présence sur 2 ou 3 canaux clés", why: "Vos clients vous cherchent en ligne: une présence régulière rassure et génère des contacts.", how: ["Choisir les canaux où se trouvent vos clients", "Publier selon un rythme fixe", "Suivre les statistiques chaque semaine"], kpi: "Contacts entrants issus du digital", methodologyStep: "choix_strategiques" },
  marque: { title: "Clarifier votre plateforme de marque", why: "Une marque claire facilite la préférence et justifie vos prix.", how: ["Écrire mission, valeurs et proposition de valeur", "Définir un ton de communication", "L'appliquer à tous vos supports"], kpi: "Cohérence des supports (auto-évaluation)", methodologyStep: "positionnement" },
  concurrence: { title: "Affirmer ce qui vous distingue", why: "Sans différence perçue, le client compare uniquement les prix.", how: ["Comparer 3 concurrents (offre, prix, communication)", "Choisir 1 ou 2 différences fortes", "Les mettre en avant dans chaque message"], kpi: "Part des clients citant votre différence", methodologyStep: "diagnostic_audit" },
  client: { title: "Organiser le suivi de vos prospects et clients", why: "Chaque prospect non relancé est une vente perdue.", how: ["Noter chaque prospect dans un tableur ou un CRM", "Relancer sous 48 h via WhatsApp", "Lancer une offre réservée aux clients fidèles"], kpi: "Taux de conversion des prospects", methodologyStep: "plan_action" },
  communication: { title: "Mettre en place un calendrier éditorial", why: "Une communication régulière entretient la relation et la notoriété.", how: ["Définir 3 à 5 thèmes récurrents", "Planifier un mois de publications", "Mesurer les résultats de chaque publication"], kpi: "Engagement moyen par publication", methodologyStep: "mise_en_oeuvre" },
  innovation: { title: "Automatiser vos tâches répétitives", why: "Le temps gagné peut être consacré à vos clients.", how: ["Activer les réponses automatiques WhatsApp Business", "Utiliser l'IA pour préparer vos contenus", "Automatiser les relances clients"], kpi: "Heures gagnées par semaine", methodologyStep: "optimisation" },
};

/** Recommandations déterministes (sans IA): utilisées si le service IA est indisponible. */
export function fallbackRecommendations(m: Maturity): Recommendations {
  const order = (Object.keys(DIMENSIONS) as Dimension[])
    .sort((x, y) => m.dimensions[x] - m.dimensions[y] || DIMENSIONS[y].weight - DIMENSIONS[x].weight)
    .slice(0, 3);
  const horizons = ["30 jours", "60 jours", "90 jours"] as const;
  return {
    source: "regles",
    actions: order.map((d, i) => ({ ...FALLBACK[d], horizon: horizons[i] })),
    opportunities: m.strengths.length
      ? m.strengths.map((s) => `Capitaliser sur votre point fort: ${s.toLowerCase()}.`)
      : ["Chaque progrès sur les fondamentaux aura un effet rapide et visible sur vos résultats."],
    shortTerm: order.map((d) => FALLBACK[d].how[0]),
  };
}

export const stepLabel = (s: string) => METHODOLOGY_STEP_LABELS[s as keyof typeof METHODOLOGY_STEP_LABELS] ?? s;
