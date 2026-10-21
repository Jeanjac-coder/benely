import { test } from "node:test";
import assert from "node:assert/strict";
import { fallbackRecommendations, RecommendationsSchema } from "../lib/ai/recommendations.ts";
import { answersFromProfile, budgetOf, diagnosticSummary, missingRequired, sanitizeAnswers, SECTIONS, toProfile, allSections } from "../lib/diagnostic.ts";
import { buildDiagnosticDoc } from "../lib/export/diagnostic.ts";
import { renderPdf } from "../lib/export/pdf.ts";
import { benchmarkText, computeMaturity } from "../lib/maturity.ts";
import { EMPTY_PROFILE, ProfileSchema } from "../lib/profile.ts";
import type { Answers } from "../lib/questionnaire.ts";

const base: Answers = {
  company_name: "Kôkô Jus", sector: "Agroalimentaire", country: "CI", size: "pme", market: "b2c", zones: ["Grand Abidjan"],
  products: "Jus de fruits locaux", clientele: "Jeunes actifs", languages: ["Français", "Nouchi"],
  objectives: ["Augmenter les ventes", "Renforcer la notoriété"], objective_main: "Augmenter les ventes",
  budget_range: "100-250", team: "1", digital_channels: ["Facebook", "WhatsApp Business"], sales_channels: ["WhatsApp", "Boutique"],
  acquisition_sources: ["Bouche-à-oreille"], support_level: "Conseil stratégique",
};

const expert: Answers = {
  ...base,
  strategy_formalized: "Oui", results_tracking: "Chaque semaine", customer_knowledge: 5,
  digital_channels: ["Site web", "Facebook", "Instagram", "TikTok", "WhatsApp Business"], website: "Site e-commerce", posting_frequency: "Presque chaque jour", analytics_tools: ["Google Analytics", "CRM"],
  brand_elements: ["Vision", "Mission", "Valeurs", "Proposition de valeur", "Charte graphique"], brand_consistency: 5, value_proposition: "100 % naturel",
  competitors: "A, B", differentiators: ["Qualité", "Rapidité"], competitive_watch: "Régulièrement",
  acquisition_sources: ["Réseaux sociaux", "Recherche Google", "Partenaires"], sales_process: "Oui, avec un suivi des prospects (CRM ou tableur)", loyalty: ["Programme de fidélité", "Offres réservées aux clients"],
  comm_supports: ["Publications sur les réseaux", "Emailing", "Influenceurs"], comm_frequency: "Plusieurs fois par semaine", comm_performance: 5,
  ai_usage: "Régulièrement", automations: ["Emails automatiques", "Suivi client (CRM)"], ai_interest: 5,
};

const beginner: Answers = {
  ...base,
  strategy_formalized: "Non", results_tracking: "Jamais", customer_knowledge: 1,
  digital_channels: ["Aucun"], website: "Pas de site", posting_frequency: "Rarement ou jamais", analytics_tools: ["Aucun"],
  brand_elements: ["Aucun"], brand_consistency: 1, competitors: "", differentiators: ["Pas encore clairement"], competitive_watch: "Jamais",
  sales_process: "Non", loyalty: ["Rien de particulier"], comm_supports: [], comm_frequency: "Rarement", comm_performance: 1,
  ai_usage: "Jamais", automations: ["Aucune"], ai_interest: 1,
};

test("score de maturité: 100 pour une pratique complète, 0 pour une absence totale", () => {
  const top = computeMaturity(expert), low = computeMaturity(beginner);
  assert.equal(top.score, 100);
  assert.equal(top.level, "avance");
  assert.equal(top.weaknesses.length, 0);
  assert.ok(top.recommendations.length > 0, "toujours au moins une piste");
  assert.ok(low.score <= 5, `score débutant ${low.score}`);
  assert.equal(low.level, "debutant");
  assert.equal(low.weaknesses.length, 3);
  assert.equal(low.recommendations.length, 3);
});

test("score de maturité: niveau intermédiaire, forces et faiblesses cohérentes", () => {
  const m = computeMaturity({ ...beginner, strategy_formalized: "Oui", results_tracking: "Chaque mois", customer_knowledge: 4, ...{ digital_channels: expert.digital_channels, website: "Site vitrine", posting_frequency: "Chaque semaine", analytics_tools: ["Meta Business Suite"] }, brand_elements: expert.brand_elements, brand_consistency: 4 });
  assert.ok(m.score >= 40 && m.score < 70, `score ${m.score}`);
  assert.equal(m.level, "intermediaire");
  assert.ok(m.strengths.includes("Stratégie et pilotage"));
  assert.ok(m.weaknesses.includes("Innovation et IA"));
});

test("les réponses guidées produisent un profil valide pour la génération", () => {
  const p = toProfile(base);
  assert.ok(ProfileSchema.safeParse(p).success, JSON.stringify(ProfileSchema.safeParse(p).error?.issues));
  assert.equal(p.monthlyBudget, 175_000);
  assert.equal(p.teamSize, 1);
  assert.match(p.objectives, /Priorité: Augmenter les ventes/);
  assert.equal(toProfile({ ...beginner }).channels.length, 0, "« Aucun » n'est pas un canal");
  assert.equal(toProfile({ ...base, sector: "Autre", sector_other: "Restauration" }).sector, "Restauration");
  assert.equal(budgetOf({ budget_range: "lt100", budget_exact: 60_000 }), 60_000);
});

test("champs obligatoires et section adaptative", () => {
  const first = SECTIONS[0];
  assert.deepEqual(missingRequired(first, base), []);
  assert.deepEqual(missingRequired(first, { ...base, sector: "Autre" }).map((q) => q.id), ["sector_other"]);
  assert.ok(allSections(base).some((s) => s.id === "precisions"), "précisions B2C / WhatsApp");
});

test("un profil de l'ancien formulaire préremplit le questionnaire", () => {
  const a = answersFromProfile({ ...EMPTY_PROFILE, name: "X", sector: "Restauration", monthlyBudget: 200_000, channels: ["Facebook", "Radio"] }, { team: "1" });
  assert.equal(a.sector, "Autre");
  assert.equal(a.sector_other, "Restauration");
  assert.deepEqual(a.digital_channels, ["Facebook"]);
  assert.equal(a.team, "1");
});

test("la synthèse reprend le profil et les réponses du diagnostic", () => {
  const s = diagnosticSummary(expert);
  assert.match(s, /Kôkô Jus/);
  assert.match(s, /Diagnostic déclaré/);
  assert.match(s, /stratégie marketing formalisée \? Oui/);
});

test("recommandations de secours: 3 actions ciblant les dimensions les plus faibles", () => {
  const r = fallbackRecommendations(computeMaturity(beginner));
  assert.equal(r.source, "regles");
  assert.equal(r.actions.length, 3);
  assert.deepEqual(r.actions.map((a) => a.horizon), ["30 jours", "60 jours", "90 jours"]);
  assert.ok(RecommendationsSchema.safeParse(r).success);
  const top = fallbackRecommendations(computeMaturity(expert));
  assert.equal(top.actions.length, 3);
});

test("benchmark: rien n'est publié sous le seuil d'anonymat", () => {
  assert.match(benchmarkText(50, null), /5 au minimum/);
  const below = { sector: "Commerce", sector_companies: 3, sector_average: null, sector_p25: null, sector_p75: null, all_companies: 12, all_average: 48 };
  assert.match(benchmarkText(50, below), /Moyenne de toutes les entreprises Benely: 48/);
  assert.match(benchmarkText(70, { ...below, sector_companies: 6, sector_average: 55, sector_p25: 40, sector_p75: 68 }), /au-dessus de la moyenne/);
});

test("les réponses reçues du navigateur sont nettoyées", () => {
  const a = sanitizeAnswers({ company_name: "X".repeat(5000), "bad key": "x", objectives: ["a", 3, "b"], customer_knowledge: 4, nope: { x: 1 }, n: Number.NaN });
  assert.equal((a.company_name as string).length, 2000);
  assert.deepEqual(a.objectives, ["a", "b"]);
  assert.equal(a.customer_knowledge, 4);
  assert.ok(!("bad key" in a) && !("nope" in a) && !("n" in a));
  assert.deepEqual(sanitizeAnswers(["x"]), {});
});

test("le rapport PDF du diagnostic se génère", async () => {
  const m = computeMaturity(expert);
  const doc = buildDiagnosticDoc(expert, m, fallbackRecommendations(m), null, { company: "Kôkô Jus", logo: null, date: new Date("2026-10-21") });
  assert.deepEqual(doc.sections.map((s) => s.id), ["synthese", "opportunites", "plan", "priorites", "reponses"]);
  const pdf = await renderPdf(doc);
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
});
