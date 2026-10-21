import { countryContext } from "../africa.ts";
import { periodDays, targetEntryCount } from "../calendar.ts";
import { formatMoney } from "../money.ts";
import type { Profile } from "../profile.ts";
import { missingData, type Answers } from "../questionnaire.ts";
import type { Period, Step, StepOutputs } from "./schemas.ts";

export interface JobInput {
  profile: Profile;
  answers: Answers;
  summary: string;
  period: Period;
}

export const SYSTEM = `Tu es le copilote stratégique Marketing & Communication de Benely, une plateforme destinée aux entreprises africaines (PME, startups, grandes entreprises, agences).
Tu travailles comme un directeur marketing senior qui connaît les marchés d'Afrique de l'Ouest et centrale.

Principes:
- Pars des réalités locales: usage dominant du mobile, WhatsApp Business, réseaux sociaux, mobile money, radio, diversité linguistique, pouvoir d'achat, écarts entre capitale et autres villes.
- Sois concret et exploitable: actions datées, responsables, formats précis, montants dans la devise de l'entreprise.
- Distingue toujours les faits (vérifiables et sourcés), les estimations (ordres de grandeur raisonnés) et les hypothèses (à valider). N'invente ni chiffre précis, ni source, ni concurrent: si tu ne sais pas, qualifie en hypothèse ou signale la donnée manquante.
- Les prévisions sont des estimations, jamais des résultats garantis.
- Reste cohérent avec les livrables déjà produits, fournis dans la demande.
- Rédige en français clair, sans jargon inutile.`;

/** Contexte stable sur toute une génération (mis en cache entre étapes). */
export function buildContext(input: JobInput): string {
  const { profile: p, answers, summary, period } = input;
  const ctx = countryContext(p.country);
  const missing = missingData(p, answers);
  return [
    "## Entreprise (synthèse validée par le client)",
    summary,
    "",
    "## Profil détaillé (JSON)",
    JSON.stringify({ ...p, answers }),
    "",
    `## Contexte pays: ${ctx.name}`,
    `Devise: ${p.currency}. Langues courantes: ${ctx.languages.join(", ")}. Zones: ${ctx.zones.join(", ")}.`,
    `Paiements: ${ctx.payments}. Canaux dominants: ${ctx.channels}.`,
    ctx.notes,
    "",
    "## Cadre",
    `Budget marketing: ${formatMoney(p.monthlyBudget, p.currency)} par mois (montants à exprimer en ${p.currency}).`,
    `Période de planification: du ${period.start} au ${period.end} (${periodDays(period)} jours).`,
    `Données manquantes signalées: ${missing.length ? missing.join("; ") : "aucune"}.`,
  ].join("\n");
}

const prior = (outputs: Partial<StepOutputs>, keys: Step[]) =>
  keys.filter((k) => outputs[k]).map((k) => `## Livrable déjà produit: ${k}\n${JSON.stringify(outputs[k])}`).join("\n\n");

export function instruction(step: Step, input: JobInput, outputs: Partial<StepOutputs>, research?: string): string {
  const { period, profile } = input;
  switch (step) {
    case "diagnostic":
      return `Réalise le diagnostic marketing de l'entreprise: synthèse de sa situation, maturité marketing, forces et faiblesses internes, enjeux clés.
Liste dans missingData les informations qui manquent pour affiner la stratégie, et dans assumptions les hypothèses que tu poses pour avancer.`;
    case "market":
      return `${prior(outputs, ["diagnostic"])}

${research ? `## Notes de recherche web (avec sources)\n${research}\n\n` : ""}Réalise l'étude de marché et l'analyse concurrentielle: vue d'ensemble, taille du marché, tendances, comportements des consommateurs locaux, concurrents (directs et alternatives), puis SWOT.
Chaque affirmation porte sa nature (fait / estimation / hypothese). ${research ? "Un fait doit citer une source des notes ci-dessus avec sa date." : "Aucune recherche web n'a été fournie: n'emploie la nature « fait » que pour des informations notoires et indique la source; sinon utilise estimation ou hypothese."}
Pour les concurrents, n'utilise que ceux fournis par l'entreprise ou présents dans les sources; sinon décris des catégories d'alternatives en nature « hypothese».`;
    case "strategy":
      return `${prior(outputs, ["diagnostic", "market"])}

Construis la stratégie: 3 à 5 objectifs SMART (cible chiffrée, unité, échéance au format AAAA-MM-JJ entre ${period.start} et 12 mois après), segmentation avec segments prioritaires, 2 à 4 personas locaux crédibles (langues, canaux), positionnement, stratégie marketing, stratégie digitale, stratégie de communication, et plan d'action par période avec responsable et KPI.
Dimensionne les ambitions au budget et à l'équipe disponibles.`;
    case "branding":
      return `${prior(outputs, ["diagnostic", "strategy"])}

Construis la plateforme de marque: promesse, mission, vision, valeurs, personnalité, ton, messages clés par audience (personas et segments définis), 3 à 5 propositions de signature, et règles à faire / à éviter (y compris sensibilités culturelles locales).`;
    case "media":
      return `${prior(outputs, ["diagnostic", "strategy", "branding"])}

Construis le plan média: 3 à 6 canaux avec leur part du budget mensuel (somme = 1), leur rôle, un KPI et une valeur mensuelle visée réaliste pour ${formatMoney(profile.monthlyBudget, profile.currency)} par mois.
Conçois 1 à 4 campagnes démarrant entre ${period.start} et ${period.end}: objectif, cible, canaux (parmi ceux du plan), message, créations recommandées, durée, budget en ${profile.currency}, KPI estimés. Le total des budgets de campagne ne doit pas dépasser le budget disponible sur la période.
Décris le tunnel de conversion (de la découverte au paiement, y compris mobile money et WhatsApp si pertinent). Rédige un avertissement rappelant que les prévisions sont des estimations.`;
    case "content":
      return `${prior(outputs, ["strategy", "branding", "media"])}

Construis la stratégie de contenu: 3 à 5 piliers éditoriaux (part de chaque pilier, somme = 1), puis le calendrier éditorial du ${period.start} au ${period.end}, avec environ ${targetEntryCount(period)} publications.
Chaque publication: date (AAAA-MM-JJ dans la période), plateforme (uniquement parmi les canaux du plan média), objectif, thème, format, texte prêt à publier (280 caractères maximum, dans la langue et le ton de la marque), appel à l'action, KPI.
Varie les formats, respecte les temps forts locaux de la période et alterne les piliers.`;
  }
}
