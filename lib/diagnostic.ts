import { COUNTRIES, countryContext } from "./africa.ts";
import { EMPTY_PROFILE, SIZES, type Profile } from "./profile.ts";
import { buildSummary, followUps, type AnswerValue, type Answers, str } from "./questionnaire.ts";

// Questionnaire de diagnostic stratégique: sections guidées, réponses structurées.
// Les réponses alimentent le profil (lib/profile.ts) utilisé par la génération, et le score de maturité.

export type QuestionType = "text" | "textarea" | "number" | "select" | "radio" | "segment" | "cards" | "multi" | "scale";
export interface Option { value: string; label: string; emoji?: string; hint?: string }

export interface DQuestion {
  id: string;
  type: QuestionType;
  label: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  /** Options fixes, ou calculées à partir des réponses (ex. zones du pays choisi). */
  options?: Option[] | ((a: Answers) => Option[]);
  /** Option exclusive d'une multi-sélection (« Aucun »). */
  exclusive?: string;
  /** Libellés des extrémités d'une échelle 1 à 5. */
  scale?: [string, string];
  showIf?: (a: Answers) => boolean;
}

export interface Section {
  id: string;
  title: string;
  /** Ce que BEN dit en ouvrant la section: le parcours se lit comme une conversation. */
  intro: string;
  pose: "wave" | "point" | "think" | "happy" | "surprised";
  questions: DQuestion[];
}

const opts = (...labels: string[]): Option[] => labels.map((l) => ({ value: l, label: l }));

export const SECTORS = ["Commerce", "Distribution", "Industrie", "E-commerce", "Services", "Immobilier", "Santé", "Éducation", "Finance", "Technologie", "Agroalimentaire", "Autre"];
const SECTOR_EMOJI: Record<string, string> = {
  Commerce: "🛍️", Distribution: "🚚", Industrie: "🏭", "E-commerce": "🛒", Services: "🤝", Immobilier: "🏢", Santé: "🩺",
  Éducation: "🎓", Finance: "💳", Technologie: "💻", Agroalimentaire: "🌾", Autre: "✳️",
};

export const BUDGET_RANGES: { value: string; label: string; amount: number }[] = [
  { value: "lt100", label: "Moins de 100 000 FCFA", amount: 75_000 },
  { value: "100-250", label: "100 000 à 250 000 FCFA", amount: 175_000 },
  { value: "250-500", label: "250 000 à 500 000 FCFA", amount: 375_000 },
  { value: "500-1000", label: "500 000 à 1 million FCFA", amount: 750_000 },
  { value: "gt1000", label: "Plus de 1 million FCFA", amount: 1_500_000 },
];

const TEAM: Record<string, { label: string; size: number }> = {
  "0": { label: "Personne", size: 0 }, "1": { label: "1 personne", size: 1 }, "2-3": { label: "2 à 3", size: 2 },
  "4-10": { label: "4 à 10", size: 5 }, "10+": { label: "Plus de 10", size: 12 },
};

export const DIGITAL_CHANNELS = ["Site web", "Facebook", "Instagram", "TikTok", "LinkedIn", "Google Ads", "Emailing", "WhatsApp Business"];

export const SECTIONS: Section[] = [
  {
    id: "entreprise", title: "Votre entreprise", pose: "wave",
    intro: "Akwaba ! Je suis BEN. Commençons par faire connaissance avec votre entreprise: cela prend moins de deux minutes.",
    questions: [
      { id: "company_name", type: "text", label: "Quel est le nom de votre entreprise ?", placeholder: "Ex. Kôkô Jus", required: true },
      { id: "sector", type: "cards", label: "Dans quel secteur d'activité évolue votre entreprise ?", required: true, options: SECTORS.map((s) => ({ value: s, label: s, emoji: SECTOR_EMOJI[s] })) },
      { id: "sector_other", type: "text", label: "Précisez votre secteur", placeholder: "Ex. Restauration, Mode, BTP…", required: true, showIf: (a) => a.sector === "Autre" },
      { id: "country", type: "select", label: "Dans quel pays êtes-vous principalement implanté ?", required: true, options: Object.entries(COUNTRIES).map(([code, c]) => ({ value: code, label: c.name })) },
      { id: "size", type: "cards", label: "Quelle est la taille de votre structure ?", required: true, options: [
        { value: "solo", label: SIZES.solo, emoji: "🧑🏾‍💼" }, { value: "startup", label: SIZES.startup, emoji: "🚀" }, { value: "pme", label: SIZES.pme, emoji: "🏪" },
        { value: "grande", label: SIZES.grande, emoji: "🏢" }, { value: "agence", label: SIZES.agence, emoji: "🎯" },
      ] },
      { id: "market", type: "segment", label: "À qui vendez-vous principalement ?", required: true, options: [
        { value: "b2c", label: "Particuliers" }, { value: "b2b", label: "Entreprises" }, { value: "b2b2c", label: "Les deux" },
      ] },
      { id: "zones", type: "multi", label: "Dans quelles zones commercialisez-vous ?", options: (a) => opts(...countryContext(str(a.country) || "CI").zones) },
      { id: "products", type: "textarea", label: "En une ou deux phrases, que proposez-vous à vos clients ?", placeholder: "Ex. Jus de fruits locaux pressés à froid, livrés à domicile", required: true },
      { id: "clientele", type: "text", label: "Qui sont vos clients principaux ?", placeholder: "Ex. Jeunes actifs, restaurants, PME…", required: true },
      { id: "languages", type: "multi", label: "Dans quelles langues communiquez-vous ?", options: (a) => opts(...new Set([...countryContext(str(a.country) || "CI").languages, "Anglais"])) },
    ],
  },
  {
    id: "maturite", title: "Diagnostic marketing", pose: "think",
    intro: "Faisons le point sur votre marketing actuel. Il n'y a pas de bonne ou de mauvaise réponse: c'est votre point de départ.",
    questions: [
      { id: "strategy_formalized", type: "radio", label: "Disposez-vous actuellement d'une stratégie marketing formalisée ?", required: true, options: opts("Oui", "Non", "En cours de structuration") },
      { id: "results_tracking", type: "radio", label: "À quelle fréquence analysez-vous les résultats de vos actions marketing ?", required: true, options: opts("Jamais", "Ponctuellement", "Chaque mois", "Chaque semaine") },
      { id: "customer_knowledge", type: "scale", label: "Dans quelle mesure connaissez-vous les attentes et habitudes de vos clients ?", scale: ["Très peu", "Parfaitement"], required: true },
    ],
  },
  {
    id: "digital", title: "Diagnostic digital", pose: "point",
    intro: "Passons à votre présence en ligne: c'est souvent là que se trouvent les gains les plus rapides.",
    questions: [
      { id: "digital_channels", type: "multi", label: "Quels canaux digitaux utilisez-vous aujourd'hui ?", options: opts(...DIGITAL_CHANNELS, "Aucun"), exclusive: "Aucun", required: true },
      { id: "website", type: "segment", label: "Où en est votre site web ?", options: opts("Pas de site", "Site vitrine", "Site e-commerce") },
      { id: "posting_frequency", type: "radio", label: "À quelle fréquence publiez-vous sur vos réseaux sociaux ?", options: opts("Rarement ou jamais", "Quelques fois par mois", "Chaque semaine", "Presque chaque jour") },
      { id: "analytics_tools", type: "multi", label: "Quels outils de suivi utilisez-vous ?", options: opts("Statistiques des réseaux sociaux", "Google Analytics", "Meta Business Suite", "CRM", "Aucun"), exclusive: "Aucun" },
    ],
  },
  {
    id: "marque", title: "Identité de marque", pose: "happy",
    intro: "Votre marque, c'est ce que vos clients retiennent de vous. Voyons ce qui est déjà en place.",
    questions: [
      { id: "brand_elements", type: "multi", label: "Quels éléments de votre marque sont déjà définis par écrit ?", options: opts("Vision", "Mission", "Valeurs", "Proposition de valeur", "Charte graphique", "Ton de communication", "Aucun"), exclusive: "Aucun" },
      { id: "value_proposition", type: "textarea", label: "Pourquoi un client vous choisit-il plutôt qu'un concurrent ?", hint: "Facultatif, une phrase suffit.", placeholder: "Ex. Des jus 100 % naturels livrés en moins d'une heure" },
      { id: "brand_consistency", type: "scale", label: "Votre image (logo, couleurs, ton) est-elle cohérente sur tous vos supports ?", scale: ["Pas du tout", "Totalement"] },
    ],
  },
  {
    id: "concurrence", title: "Concurrence", pose: "think",
    intro: "Comprendre vos concurrents permet de mieux vous en distinguer.",
    questions: [
      { id: "competitors", type: "text", label: "Qui sont vos principaux concurrents ?", hint: "Facultatif. Séparez les noms par des virgules.", placeholder: "Ex. Marque A, Marque B" },
      { id: "price_position", type: "segment", label: "Par rapport à eux, vos prix sont…", options: opts("Plus bas", "Alignés", "Plus élevés", "Premium") },
      { id: "differentiators", type: "multi", label: "Qu'est-ce qui vous différencie ?", options: opts("Prix", "Qualité", "Service client", "Rapidité", "Innovation", "Proximité", "Notoriété de la marque", "Pas encore clairement"), exclusive: "Pas encore clairement" },
      { id: "competitive_watch", type: "radio", label: "Suivez-vous l'activité de vos concurrents ?", options: opts("Jamais", "De temps en temps", "Régulièrement") },
    ],
  },
  {
    id: "parcours", title: "Parcours client", pose: "point",
    intro: "Suivons le chemin de vos clients, de la découverte à la fidélité.",
    questions: [
      { id: "acquisition_sources", type: "multi", label: "Comment vos nouveaux clients vous découvrent-ils ?", required: true, options: opts("Bouche-à-oreille", "Réseaux sociaux", "Recherche Google", "Publicité en ligne", "Partenaires", "Prospection commerciale", "Salons et événements", "Point de vente") },
      { id: "sales_channels", type: "multi", label: "Où vos clients achètent-ils ?", required: true, options: opts("Boutique", "WhatsApp", "Site e-commerce", "Distributeurs", "Force de vente", "Marketplaces", "Téléphone") },
      { id: "sales_process", type: "radio", label: "Votre processus de vente est-il formalisé ?", options: opts("Non", "En partie", "Oui, avec un suivi des prospects (CRM ou tableur)") },
      { id: "loyalty", type: "multi", label: "Que faites-vous pour fidéliser vos clients ?", options: opts("Programme de fidélité", "Relances WhatsApp ou SMS", "Offres réservées aux clients", "Service après-vente", "Rien de particulier"), exclusive: "Rien de particulier" },
    ],
  },
  {
    id: "communication", title: "Communication actuelle", pose: "happy",
    intro: "Regardons comment vous communiquez aujourd'hui.",
    questions: [
      { id: "comm_supports", type: "multi", label: "Quels supports utilisez-vous ?", options: opts("Publications sur les réseaux", "Statuts WhatsApp", "Affiches et flyers", "Emailing", "Presse", "Événements", "Influenceurs", "SMS") },
      { id: "comm_frequency", type: "radio", label: "À quelle fréquence communiquez-vous ?", options: opts("Rarement", "Chaque mois", "Chaque semaine", "Plusieurs fois par semaine") },
      { id: "comm_performance", type: "scale", label: "Comment jugez-vous les résultats de votre communication ?", scale: ["Décevants", "Excellents"] },
      { id: "content_owner", type: "segment", label: "Qui crée vos contenus ?", options: opts("Moi-même", "Mon équipe", "Une agence", "Un freelance") },
    ],
  },
  {
    id: "ia", title: "Innovation et IA", pose: "surprised",
    intro: "Dernier regard sur vos outils: l'IA et l'automatisation peuvent vous faire gagner beaucoup de temps.",
    questions: [
      { id: "ai_usage", type: "radio", label: "Utilisez-vous déjà l'intelligence artificielle dans votre activité ?", options: opts("Jamais", "Occasionnellement", "Régulièrement") },
      { id: "automations", type: "multi", label: "Quelles tâches sont déjà automatisées ?", options: opts("Réponses WhatsApp automatiques", "Emails automatiques", "Suivi client (CRM)", "Paiement en ligne", "Aucune"), exclusive: "Aucune" },
      { id: "ai_interest", type: "scale", label: "Quel est votre intérêt pour des outils d'IA dédiés au marketing ?", scale: ["Faible", "Très fort"] },
    ],
  },
  {
    id: "objectifs", title: "Objectifs business", pose: "point",
    intro: "Parlons de vos ambitions: tout le plan sera construit autour d'elles.",
    questions: [
      { id: "objectives", type: "multi", label: "Quels sont vos objectifs prioritaires sur les 12 prochains mois ?", required: true, options: opts("Générer plus de prospects", "Augmenter les ventes", "Renforcer la notoriété", "Fidéliser les clients", "Lancer un nouveau produit", "Recruter", "Développer un nouveau marché") },
      { id: "objective_main", type: "select", label: "Lequel est le plus important ?", options: (a) => opts(...((a.objectives as string[] | undefined) ?? [])), showIf: (a) => Array.isArray(a.objectives) && a.objectives.length > 1 },
      { id: "objective_detail", type: "text", label: "Avez-vous un objectif chiffré ?", hint: "Facultatif.", placeholder: "Ex. +30 % de ventes d'ici décembre" },
    ],
  },
  {
    id: "budget", title: "Budget et ressources", pose: "think",
    intro: "Pour proposer un plan réaliste, j'ai besoin de connaître vos moyens. Ces informations restent confidentielles.",
    questions: [
      { id: "budget_range", type: "select", label: "Quel budget marketing mensuel êtes-vous prêt à investir ?", required: true, options: BUDGET_RANGES.map((b) => ({ value: b.value, label: b.label })) },
      { id: "budget_exact", type: "number", label: "Montant exact, si vous le connaissez (FCFA par mois)", hint: "Facultatif: sinon, nous retenons le milieu de la fourchette." },
      { id: "team", type: "segment", label: "Combien de personnes travaillent sur le marketing ?", required: true, options: Object.entries(TEAM).map(([value, t]) => ({ value, label: t.label })) },
      { id: "resources", type: "multi", label: "Sur quelles ressources pouvez-vous compter ?", options: opts("Agence", "Freelance", "Graphiste", "Vidéaste", "Community manager", "Aucune"), exclusive: "Aucune" },
    ],
  },
  {
    id: "accompagnement", title: "Accompagnement souhaité", pose: "happy",
    intro: "Enfin, dites-moi comment vous aimeriez être accompagné.",
    questions: [
      { id: "support_level", type: "cards", label: "Quel type d'accompagnement recherchez-vous ?", required: true, options: [
        { value: "Audit uniquement", label: "Audit uniquement", emoji: "🔎", hint: "Un état des lieux clair" },
        { value: "Conseil stratégique", label: "Conseil stratégique", emoji: "🧭", hint: "Un plan et des priorités" },
        { value: "Exécution opérationnelle", label: "Exécution opérationnelle", emoji: "⚙️", hint: "Des actions prêtes à lancer" },
        { value: "Accompagnement complet 360°", label: "Accompagnement 360°", emoji: "🌍", hint: "De la stratégie aux résultats" },
        { value: "Je ne sais pas encore", label: "Je ne sais pas encore", emoji: "💬", hint: "On en parle ensemble" },
      ] },
    ],
  },
];

/** Section adaptative: les précisions qui dépendent des réponses (B2B, vente en ligne, zones…). */
export function followUpSection(a: Answers): Section | null {
  const qs = followUps(toProfile(a));
  if (qs.length === 0) return null;
  return {
    id: "precisions", title: "Quelques précisions", pose: "point",
    intro: "Merci ! Quelques précisions selon vos réponses, puis je calcule votre diagnostic. Répondez à celles que vous pouvez.",
    questions: qs.map((q) => ({ id: q.id, label: q.label, hint: q.hint, type: q.type === "choice" ? "radio" : "text", options: q.options ? opts(...q.options) : undefined })),
  };
}

/** Sections dans l'ordre du parcours (la section adaptative s'insère avant les résultats). */
export function allSections(a: Answers): Section[] {
  const extra = followUpSection(a);
  return extra ? [...SECTIONS, extra] : SECTIONS;
}

export const optionsOf = (q: DQuestion, a: Answers): Option[] => (typeof q.options === "function" ? q.options(a) : q.options ?? []);
export const visible = (q: DQuestion, a: Answers) => !q.showIf || q.showIf(a);

const filled = (v: AnswerValue | undefined) => (Array.isArray(v) ? v.length > 0 : typeof v === "number" ? Number.isFinite(v) : Boolean(v && String(v).trim()));

/** Questions obligatoires sans réponse dans une section. */
export function missingRequired(s: Section, a: Answers): DQuestion[] {
  return s.questions.filter((q) => q.required && visible(q, a) && !filled(a[q.id]));
}

const list = (v: AnswerValue | undefined, none?: string) => (Array.isArray(v) ? v.filter((x) => x !== none) : []);

/** Budget mensuel retenu: montant exact s'il est donné, sinon le milieu de la fourchette. */
export function budgetOf(a: Answers): number {
  const exact = Number(a.budget_exact);
  if (Number.isFinite(exact) && exact > 0) return exact;
  return BUDGET_RANGES.find((b) => b.value === a.budget_range)?.amount ?? 0;
}

/** Traduit les réponses guidées en profil d'entreprise (format attendu par la génération). */
export function toProfile(a: Answers, base: Profile = EMPTY_PROFILE): Profile {
  const country = str(a.country) || base.country;
  const objectives = list(a.objectives);
  const main = str(a.objective_main);
  const resources = [
    ...list(a.resources, "Aucune").map((r) => `Ressource: ${r}`),
    ...list(a.automations, "Aucune").map((r) => `Automatisation: ${r}`),
    a.content_owner ? `Contenus créés par: ${str(a.content_owner)}` : "",
  ].filter(Boolean).join("; ");
  return {
    ...base,
    name: str(a.company_name) || base.name,
    sector: a.sector === "Autre" ? str(a.sector_other) || "Autre" : str(a.sector) || base.sector,
    country,
    currency: COUNTRIES[country]?.currency ?? base.currency,
    zones: list(a.zones),
    products: str(a.products) || base.products,
    size: (str(a.size) as Profile["size"]) || base.size,
    market: (str(a.market) as Profile["market"]) || base.market,
    clientele: str(a.clientele) || base.clientele,
    competitors: str(a.competitors),
    channels: list(a.digital_channels, "Aucun"),
    salesChannels: list(a.sales_channels),
    objectives: [main ? `Priorité: ${main}` : "", objectives.join(", "), str(a.objective_detail)].filter(Boolean).join(". ") || base.objectives,
    monthlyBudget: budgetOf(a) || base.monthlyBudget,
    teamSize: TEAM[str(a.team)]?.size ?? base.teamSize,
    resources: resources || base.resources,
    languages: list(a.languages).length ? list(a.languages) : base.languages,
  };
}

/** Préremplit le questionnaire à partir d'un profil enregistré avec l'ancien formulaire. */
export function answersFromProfile(p: Profile, a: Answers): Answers {
  const known = SECTORS.includes(p.sector);
  const prefill: Answers = {
    company_name: p.name, country: p.country, size: p.size, market: p.market, zones: p.zones, products: p.products,
    clientele: p.clientele, languages: p.languages, competitors: p.competitors, sales_channels: p.salesChannels,
    digital_channels: p.channels.filter((c) => DIGITAL_CHANNELS.includes(c)),
    ...(p.sector ? { sector: known ? p.sector : "Autre", ...(known ? {} : { sector_other: p.sector }) } : {}),
    ...(p.monthlyBudget ? { budget_exact: p.monthlyBudget } : {}),
    ...(p.objectives ? { objective_detail: p.objectives } : {}),
  };
  // Les réponses déjà données au nouveau questionnaire priment.
  return Object.fromEntries(Object.entries({ ...prefill, ...a }).filter(([, v]) => filled(v)));
}

/** Nettoie des réponses reçues du navigateur: types attendus et tailles bornées. */
export function sanitizeAnswers(raw: unknown): Answers {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Answers = {};
  for (const [k, v] of Object.entries(raw).slice(0, 150)) {
    if (!/^[a-z0-9_]{1,60}$/.test(k)) continue;
    if (typeof v === "string") out[k] = v.slice(0, 2000);
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (Array.isArray(v)) out[k] = v.filter((x): x is string => typeof x === "string").slice(0, 30).map((x) => x.slice(0, 200));
  }
  return out;
}

/** Libellé lisible d'une réponse (pour la synthèse et le rapport). */
export function answerText(q: DQuestion, a: Answers): string {
  const v = a[q.id];
  const labelOf = (x: string) => optionsOf(q, a).find((o) => o.value === x)?.label ?? x;
  if (Array.isArray(v)) return v.map(labelOf).join(", ");
  if (q.type === "scale" && typeof v === "number") return `${v}/5`;
  return v === undefined || v === "" ? "" : labelOf(String(v));
}

/** Réponses du diagnostic, section par section, pour la synthèse transmise à l'IA. */
export function diagnosticDigest(a: Answers): string {
  return SECTIONS.filter((s) => s.id !== "entreprise").map((s) => {
    const lines = s.questions.filter((q) => visible(q, a) && answerText(q, a)).map((q) => `- ${q.label} ${answerText(q, a)}`);
    return lines.length ? `${s.title}:\n${lines.join("\n")}` : "";
  }).filter(Boolean).join("\n\n");
}

/** Synthèse proposée à la validation: profil, précisions et réponses du diagnostic. */
export function diagnosticSummary(a: Answers, base?: Profile): string {
  const digest = diagnosticDigest(a);
  return [buildSummary(toProfile(a, base), a), digest ? `\nDiagnostic déclaré:\n${digest}` : ""].join("\n").trim();
}
