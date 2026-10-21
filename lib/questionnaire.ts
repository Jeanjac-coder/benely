import { countryContext } from "./africa.ts";
import { formatMoney } from "./money.ts";
import { MARKETS, SIZES, type Profile } from "./profile.ts";

export interface Question {
  id: string;
  label: string;
  hint?: string;
  type: "text" | "choice";
  options?: string[];
}

/** Réponse: texte, choix, multi-sélection ou note. */
export type AnswerValue = string | string[] | number;
export type Answers = Record<string, AnswerValue>;

/** Réponse ramenée à un texte (les listes sont jointes par des virgules). */
export const str = (v: AnswerValue | undefined): string => (Array.isArray(v) ? v.join(", ") : v === undefined || v === null ? "" : String(v)).trim();

const has = (list: string[], ...needles: string[]) =>
  list.some((x) => needles.some((n) => x.toLowerCase().includes(n)));

/**
 * Questions complémentaires déclenchées par les réponses du profil.
 * Les règles sont volontairement explicites pour rester auditables par l'équipe marketing.
 */
export function followUps(p: Profile): Question[] {
  const q: Question[] = [];
  if (p.market !== "b2c") {
    q.push({ id: "b2b_cycle", label: "Quelle est la durée moyenne de votre cycle de vente ?", type: "choice", options: ["Moins d'un mois", "1 à 3 mois", "3 à 6 mois", "Plus de 6 mois"] });
    q.push({ id: "b2b_decideurs", label: "Qui décide de l'achat chez vos clients (fonction, niveau) ?", type: "text" });
  }
  if (p.market !== "b2b") {
    q.push({ id: "b2c_panier", label: "Quel est le panier moyen d'un client ?", hint: `En ${p.currency}`, type: "text" });
    q.push({ id: "b2c_frequence", label: "À quelle fréquence un client rachète-t-il ?", type: "choice", options: ["Une seule fois", "Mensuelle", "Hebdomadaire", "Quotidienne"] });
  }
  if (has(p.salesChannels, "en ligne", "e-commerce", "site", "whatsapp")) {
    q.push({ id: "vente_paiement", label: "Quels moyens de paiement acceptez-vous en ligne ?", hint: countryContext(p.country).payments, type: "text" });
    q.push({ id: "vente_livraison", label: "Comment livrez-vous et dans quelles zones ?", type: "text" });
  }
  if (has(p.salesChannels, "boutique", "magasin", "point de vente", "distributeur")) {
    q.push({ id: "pdv", label: "Combien de points de vente ou distributeurs, et où ?", type: "text" });
  }
  if (!p.competitors.trim()) {
    q.push({ id: "alternatives", label: "Sans concurrent identifié: vers quoi se tournent vos clients aujourd'hui à la place de votre offre ?", type: "text" });
  }
  if (p.channels.length === 0) {
    q.push({ id: "presence", label: "Avez-vous déjà une présence en ligne (page, compte, site) même inactive ?", type: "text" });
  }
  if (p.teamSize <= 1) {
    q.push({ id: "temps", label: "Combien d'heures par semaine pouvez-vous consacrer au marketing ?", type: "choice", options: ["Moins de 2 h", "2 à 5 h", "5 à 10 h", "Plus de 10 h"] });
  }
  if (p.size === "grande" || p.size === "agence") {
    q.push({ id: "gouvernance", label: "Quelles validations internes une campagne doit-elle obtenir avant diffusion ?", type: "text" });
  }
  if (p.zones.length > 1 || p.zones.includes("National")) {
    q.push({ id: "zones_priorite", label: "Quelle zone est prioritaire pour les 3 prochains mois, et pourquoi ?", type: "text" });
  }
  if (/notori|visibil|image/i.test(p.objectives)) {
    q.push({ id: "notoriete_mesure", label: "Comment mesurez-vous la notoriété aujourd'hui (abonnés, mentions, sondage) ?", type: "text" });
  }
  if (/vente|chiffre|ca\b|client/i.test(p.objectives)) {
    q.push({ id: "ventes_actuelles", label: "Quel volume de ventes ou de nouveaux clients réalisez-vous par mois actuellement ?", type: "text" });
  }
  q.push({ id: "contraintes", label: "Y a-t-il des contraintes à respecter (réglementation, saisonnalité, interdits culturels, image) ?", type: "text" });
  return q;
}

/** Champs utiles absents: affichés à l'utilisateur et transmis à l'IA comme données manquantes. */
export function missingData(p: Profile, answers: Answers): string[] {
  const missing: string[] = [];
  if (!p.competitors.trim() && !str(answers.alternatives)) missing.push("Concurrents ou alternatives");
  if (p.zones.length === 0) missing.push("Zones commerciales ciblées");
  if (p.salesChannels.length === 0) missing.push("Canaux de vente");
  if (!p.resources.trim()) missing.push("Ressources marketing disponibles");
  for (const q of followUps(p)) if (!str(answers[q.id])) missing.push(q.label);
  return missing;
}

/** Synthèse lisible, proposée à l'utilisateur pour correction avant génération. */
export function buildSummary(p: Profile, answers: Answers): string {
  const ctx = countryContext(p.country);
  const lines = [
    `${p.name} est une ${SIZES[p.size].toLowerCase()} du secteur « ${p.sector} » basée en ${ctx.name}${p.zones.length ? ` (zones: ${p.zones.join(", ")})` : ""}.`,
    `Offre: ${p.products}.`,
    `Marché: ${MARKETS[p.market]}. Clientèle: ${p.clientele}.`,
    `Objectifs: ${p.objectives}.`,
    `Budget marketing: ${formatMoney(p.monthlyBudget, p.currency)} par mois. Équipe marketing: ${p.teamSize} personne(s). ${p.resources}`.trim(),
    `Canaux actuels: ${p.channels.join(", ") || "aucun"}. Canaux de vente: ${p.salesChannels.join(", ") || "non précisés"}.`,
    `Concurrents: ${p.competitors || "non identifiés"}. Langues: ${p.languages.join(", ")}.`,
  ];
  const qa = followUps(p).filter((q) => str(answers[q.id])).map((q) => `- ${q.label} ${str(answers[q.id])}`);
  if (qa.length) lines.push("", "Précisions:", ...qa);
  return lines.join("\n");
}
