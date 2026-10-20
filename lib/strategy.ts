import Anthropic from "@anthropic-ai/sdk";
import { COUNTRIES } from "./africa";
import type { CompanyProfile, Strategy } from "./types";

const SCHEMA_HINT = `{
  "marketStudy": string,
  "swot": {"strengths": string[], "weaknesses": string[], "opportunities": string[], "threats": string[]},
  "competitors": [{"name": string, "positioning": string, "weakness": string}],
  "personas": [{"name": string, "description": string, "needs": string, "channels": string[]}],
  "segmentation": string,
  "positioning": string,
  "brand": {"promise": string, "tone": string, "values": string[]},
  "channels": [{"channel": string, "budgetShare": number, "role": string, "targetKpi": string, "targetValue": number}],
  "contentStrategy": string,
  "editorialCalendar": [{"week": number, "theme": string, "formats": string[]}],
  "funnel": [{"stage": string, "action": string, "kpi": string}],
  "kpis": [{"name": string, "target": number, "unit": string}],
  "executionPlan": [{"period": string, "actions": string[]}]
}`;

export function buildPrompt(p: CompanyProfile): string {
  const ctx = COUNTRIES[p.country] ?? COUNTRIES.Autre;
  return `Tu es un directeur marketing senior spécialisé sur les marchés africains.
Produis une stratégie Marketing & Communication complète, concrète et exploitable pour l'entreprise ci-dessous.

ENTREPRISE
- Nom: ${p.name}
- Secteur: ${p.sector}
- Pays: ${p.country}
- Taille: ${p.size}
- Offre: ${p.offer}
- Objectif commercial: ${p.objective}
- Budget marketing mensuel: ${p.monthlyBudget} USD
- Canaux déjà utilisés: ${p.channelsInUse.join(", ") || "aucun"}
- Langues de communication: ${p.languages.join(", ") || "à recommander"}
- Concurrents connus: ${p.competitors || "à identifier"}

CONTEXTE LOCAL (${p.country})
- Langues courantes: ${ctx.languages.join(", ")}
- Paiements: ${ctx.payments}
- Canaux dominants: ${ctx.channels}
- Notes: ${ctx.notes}

RÈGLES
- Approche mobile-first, adaptée au pouvoir d'achat local et au mobile money.
- Les budgetShare des canaux somment à 1.
- targetValue = nombre de conversions (leads ou ventes) mensuelles attendues par canal, réaliste vu le budget.
- 8 semaines de calendrier éditorial; 4 à 6 canaux; 3 personas; 5 à 8 KPIs.
- Signale clairement les hypothèses lorsque les données manquent; n'invente pas de statistiques précises.
- Réponds en français.

Réponds UNIQUEMENT avec un objet JSON valide respectant ce schéma:
${SCHEMA_HINT}`;
}

export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Réponse du modèle sans JSON");
  return JSON.parse(text.slice(start, end + 1));
}

/** Normalise les parts de budget pour qu'elles somment à 1. */
export function normalize(s: Strategy): Strategy {
  const total = s.channels.reduce((t, c) => t + (c.budgetShare || 0), 0);
  if (total <= 0) throw new Error("Parts de budget invalides");
  return { ...s, channels: s.channels.map((c) => ({ ...c, budgetShare: c.budgetShare / total })) };
}

export async function generateStrategy(profile: CompanyProfile): Promise<Strategy> {
  const client = new Anthropic();
  const res = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
    max_tokens: 8000,
    messages: [{ role: "user", content: buildPrompt(profile) }],
  });
  const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  return normalize(extractJson(text) as Strategy);
}
