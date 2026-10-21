import type { Deliverables } from "../lib/ai/schemas.ts";

/** Livrables complets et cohérents, base des tests. */
export function sample(): Deliverables {
  return {
    meta: { monthlyBudget: 200_000, currency: "XOF", period: { start: "2026-11-01", end: "2026-11-30" }, sources: [] },
    diagnostic: { summary: "s", maturity: "debutant", strengths: [], weaknesses: [], keyChallenges: [], missingData: [], assumptions: [] },
    market: {
      overview: "o",
      marketSize: { statement: "m", nature: "estimation", source: null, sourceDate: null },
      trends: [{ statement: "t", nature: "fait", source: "INS", sourceDate: "2025" }],
      consumerBehavior: [],
      competitors: [{ name: "C", positioning: "p", strengths: [], weaknesses: [], nature: "fait" }],
      swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
    },
    strategy: {
      smartObjectives: [{ objective: "o", metric: "ventes", target: 100, unit: "ventes", deadline: "2026-12-31", rationale: "r" }],
      segments: [], personas: [{ name: "Awa", age: "28", occupation: "o", description: "d", needs: [], frictions: [], channels: [], languages: [] }],
      positioning: "p", marketingStrategy: "m", digitalStrategy: "d", communicationStrategy: "c", actionPlan: [],
    },
    branding: { promise: "p", mission: "m", vision: "v", values: [], personality: [], tone: "t", keyMessages: [], taglines: [], dos: [], donts: [] },
    media: {
      channels: [
        { channel: "WhatsApp Business", budgetShare: 0.6, role: "r", kpi: "leads", monthlyTarget: 40 },
        { channel: "TikTok", budgetShare: 0.4, role: "r", kpi: "vues", monthlyTarget: 10_000 },
      ],
      campaigns: [{ name: "Lancement", objective: "o", target: "t", channels: ["WhatsApp"], message: "m", creatives: [], startDate: "2026-11-03", durationDays: 14, budget: 150_000, kpis: [] }],
      funnel: [], forecastDisclaimer: "Estimations",
    },
    content: {
      pillars: [],
      entries: [{ date: "2026-11-05", platform: "TikTok", objective: "o", theme: "t", format: "vidéo", text: "x", cta: "c", kpi: "k" }],
    },
  };
}
