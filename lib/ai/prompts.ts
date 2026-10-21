import { countryContext } from "../africa.ts";
import { periodDays, targetEntryCount } from "../calendar.ts";
import { formatMoney } from "../money.ts";
import type { Profile } from "../profile.ts";
import { missingData, type Answers } from "../questionnaire.ts";
import type { Period, Step, StepOutputs } from "./schemas.ts";
import { METHODOLOGY_STEP_LABELS, METHODOLOGY_STEPS, type Methodology } from "../methodology.ts";

export interface JobInput {
  profile: Profile;
  answers: Answers;
  summary: string;
  period: Period;
  /** Méthodologie Benely active au lancement de la génération (figée pour toutes les étapes). */
  methodology?: Methodology | null;
}

export const SYSTEM = `Tu es le copilote stratégique Marketing & Communication de Benely, une plateforme destinée aux entreprises africaines (PME, startups, grandes entreprises, agences).
Tu travailles comme un directeur marketing senior qui connaît les marchés d'Afrique de l'Ouest et centrale.

Principes:
- Pars des réalités locales: usage dominant du mobile, WhatsApp Business, réseaux sociaux, mobile money, radio, diversité linguistique, pouvoir d'achat, écarts entre capitale et autres villes.
- Sois concret et exploitable: actions datées, responsables, formats précis, montants dans la devise de l'entreprise.
- Distingue toujours les faits (vérifiables et sourcés), les estimations (ordres de grandeur raisonnés) et les hypothèses (à valider). N'invente ni chiffre précis, ni source, ni concurrent: si tu ne sais pas, qualifie en hypothèse ou signale la donnée manquante.
- Les prévisions sont des estimations, jamais des résultats garantis.
- Reste cohérent avec les livrables déjà produits, fournis dans la demande.
- Rédige en français clair, sans jargon inutile.

Méthodologie Benely:
- Le document « Méthodologie Benely » fourni dans la demande est ta référence principale. Toutes tes recommandations, évaluations et plans d'action s'appuient sur ses principes, ses étapes et ses outils, dans son ordre (audit, objectifs, cible, positionnement, choix stratégiques, plan d'action, budget, mise en œuvre, mesure, optimisation).
- Il prime sur toute autre méthode, y compris les fiches d'experts: celles-ci ne servent qu'à enrichir son application.
- Applique-le en l'adaptant aux réalités locales (canaux, réglementation et moyens de paiement du pays), sans en sauter d'étape ni en contredire les règles (par exemple: 3 à 5 enjeux prioritaires, objectifs SMART répartis sur le parcours client, 2 à 4 personas, 3 à 5 piliers éditoriaux, réserve test-and-learn).`;

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
    ...(input.methodology
      ? ["", `## Méthodologie Benely (référence principale, version ${input.methodology.version}: « ${input.methodology.title} »)`, input.methodology.content]
      : []),
  ].join("\n");
}

const prior = (outputs: Partial<StepOutputs>, keys: Step[]) =>
  keys.filter((k) => outputs[k]).map((k) => `## Livrable déjà produit: ${k}\n${JSON.stringify(outputs[k])}`).join("\n\n");

export function instruction(step: Step, input: JobInput, outputs: Partial<StepOutputs>, research?: string): string {
  const { period, profile } = input;
  switch (step) {
    case "diagnostic":
      return `Réalise l'audit marketing de l'entreprise en appliquant l'étape « 1. Diagnostic et audit » de la méthodologie Benely: rassemble les faits avant de juger.
- Audit interne (internalAudit): offre, ressources, performance historique, identité de marque. Si une information manque, dis-le plutôt que de l'inventer.
- Audit externe: analyse PESTEL (pestel), avec exactement un élément par facteur (politique, économique, social, technologique, écologique, légal), appliquée au pays et au secteur.
- Synthèse: forces et faiblesses internes, puis 3 à 5 enjeux prioritaires hiérarchisés (keyChallenges), jamais plus.
- Grille d'audit méthodologique (methodologyAudit): pour chacune des dix étapes de la méthodologie (${METHODOLOGY_STEPS.map((s) => METHODOLOGY_STEP_LABELS[s]).join(", ")}), une ligne et une seule, dans cet ordre: statut de la pratique actuelle de l'entreprise (conforme, partiel, absent, ou inconnu si le profil ne permet pas d'en juger), constat factuel, et recommandation conforme à la méthodologie.
Liste dans missingData les informations qui manquent pour affiner la stratégie, et dans assumptions les hypothèses que tu poses pour avancer.`;
    case "market":
      return `${prior(outputs, ["diagnostic"])}

${research ? `## Notes de recherche web (avec sources)\n${research}\n\n` : ""}Réalise l'étude de marché et l'analyse concurrentielle (audit externe de l'étape 1 de la méthodologie): vue d'ensemble, taille du marché, tendances et signaux faibles, comportements des consommateurs locaux, concurrents directs et indirects documentés selon les critères de la méthodologie (positionnement, prix, canaux, part de voix, forces et faiblesses perçues), puis SWOT croisant interne et externe.
Chaque affirmation porte sa nature (fait / estimation / hypothese). ${research ? "Un fait doit citer une source des notes ci-dessus avec sa date." : "Aucune recherche web n'a été fournie: n'emploie la nature « fait » que pour des informations notoires et indique la source; sinon utilise estimation ou hypothese."}
Pour les concurrents, n'utilise que ceux fournis par l'entreprise ou présents dans les sources; sinon décris des catégories d'alternatives en nature « hypothese».`;
    case "strategy":
      return `${prior(outputs, ["diagnostic", "market"])}

Construis la stratégie en appliquant les étapes 2, 3 et 5 de la méthodologie. Les objectifs marketing découlent des objectifs business de l'entreprise et des enjeux de l'audit.
Objectifs: 3 à 5 objectifs SMART (cible chiffrée, unité, échéance au format AAAA-MM-JJ entre ${period.start} et 12 mois après), segmentation avec segments prioritaires, 2 à 4 personas locaux crédibles (langues, canaux), positionnement, stratégie marketing, stratégie digitale, stratégie de communication, et plan d'action par période avec responsable et KPI.
Chaque objectif indique son étape du parcours client (funnelStage, modèle RACE); couvre si possible les quatre étapes (notoriété, acquisition, conversion, fidélisation) plutôt que tout concentrer sur la conversion.
Cible: segmentation (démographique, comportementale, psychographique, géographique), 2 à 4 personas avec identité, besoins, freins, habitudes média, déclencheur d'achat (trigger) et citation type (quote), puis 1 à 2 insights consommateurs (des vérités humaines non évidentes, pas des observations).
Stratégies marketing, digitale et de communication: raisonne avec le mix 7P et la combinaison owned / earned / paid.
Dimensionne les ambitions au budget et à l'équipe disponibles.`;
    case "branding":
      return `${prior(outputs, ["diagnostic", "strategy"])}

Construis la plateforme de marque selon l'étape 4 de la méthodologie: positionnement au format « Pour [cible], [marque] est la [catégorie] qui [bénéfice différenciant], parce que [preuve] » (positioningStatement), différenciant, pertinent et crédible; big idea déclinable sur tous les canaux (bigIdea); puis promesse, mission, vision, valeurs, personnalité, ton, messages clés par audience (personas et segments définis), 3 à 5 propositions de signature, et règles à faire / à éviter (y compris sensibilités culturelles locales).`;
    case "media":
      return `${prior(outputs, ["diagnostic", "strategy", "branding"])}

Construis le plan média selon les étapes 5, 6, 7 et 9 de la méthodologie: 3 à 6 canaux choisis selon l'atteinte de la cible, le potentiel de retour et l'étape du parcours visée, chacun classé owned, earned ou paid (category), avec leur part du budget mensuel (somme = 1), leur rôle, un KPI et une valeur mensuelle visée réaliste pour ${formatMoney(profile.monthlyBudget, profile.currency)} par mois.
Conçois 1 à 4 campagnes démarrant entre ${period.start} et ${period.end}: objectif, cible, canaux (parmi ceux du plan), message, créations recommandées, durée, budget en ${profile.currency}, KPI estimés. Le total des budgets de campagne ne doit pas dépasser le budget disponible sur la période.
Décris le tunnel de conversion (de la découverte au paiement, y compris mobile money et WhatsApp si pertinent). Explique dans budgetLogic l'arbitrage notoriété / performance (60/40 ou 70/30 selon la maturité de la marque, justifié), la réserve test-and-learn de 10 à 15 % et le ROI prévisionnel par levier.
Organise les campagnes par phases (teasing, lancement, amplification, bilan) quand c'est pertinent, et liste dans trackingChecklist ce qui doit être installé et testé avant le lancement.
Rédige un avertissement rappelant que les prévisions sont des estimations.`;
    case "content":
      return `${prior(outputs, ["strategy", "branding", "media"])}

Construis la stratégie de contenu selon les étapes 5 et 6 de la méthodologie: 3 à 5 piliers éditoriaux alignés sur les attentes de la cible et l'expertise de la marque (part de chaque pilier, somme = 1), puis le calendrier éditorial du ${period.start} au ${period.end}, avec environ ${targetEntryCount(period)} publications.
Chaque publication: date (AAAA-MM-JJ dans la période), plateforme (uniquement parmi les canaux du plan média), objectif, thème, format, texte prêt à publier (280 caractères maximum, dans la langue et le ton de la marque), appel à l'action, KPI.
Varie les formats, respecte les temps forts locaux de la période et alterne les piliers.`;
  }
}
