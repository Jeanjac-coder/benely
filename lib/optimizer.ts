export interface ChannelPlan { channel: string; budgetShare: number; monthlyTarget: number }
export interface ChannelActual { channel: string; spend: number; conversions: number }

export interface ChannelAnalysis {
  channel: string;
  plannedSpend: number;
  actualSpend: number;
  target: number;
  actual: number;
  plannedCpa: number | null;
  actualCpa: number | null;
  attainment: number; // actual / target
  status: "ahead" | "on_track" | "behind" | "no_data";
}

export interface Adjustment {
  channel: string;
  fromShare: number;
  toShare: number;
  reason: string;
}

export interface OptimizationResult {
  analysis: ChannelAnalysis[];
  adjustments: Adjustment[];
  alerts: string[];
}

const MAX_SHIFT = 0.15; // plafond de variation par cycle pour éviter les décisions brutales

/**
 * Compare les résultats réels (saisis manuellement en V1) au plan et propose une réallocation budgétaire.
 * Règle: le budget migre des canaux au CPA le plus dégradé vers ceux au CPA le plus
 * performant, dans la limite de MAX_SHIFT de la part initiale; la somme reste égale à 1.
 */
export function optimize(plan: ChannelPlan[], actuals: ChannelActual[], monthlyBudget: number): OptimizationResult {
  const analysis: ChannelAnalysis[] = plan.map((p) => {
    const a = actuals.find((x) => x.channel === p.channel);
    const plannedSpend = p.budgetShare * monthlyBudget;
    const plannedCpa = p.monthlyTarget > 0 ? plannedSpend / p.monthlyTarget : null;
    if (!a || a.spend <= 0) {
      return { channel: p.channel, plannedSpend, actualSpend: 0, target: p.monthlyTarget, actual: a?.conversions ?? 0, plannedCpa, actualCpa: null, attainment: 0, status: "no_data" as const };
    }
    const actualCpa = a.conversions > 0 ? a.spend / a.conversions : null;
    const attainment = p.monthlyTarget > 0 ? a.conversions / p.monthlyTarget : 0;
    const status = attainment >= 1.1 ? "ahead" : attainment >= 0.8 ? "on_track" : "behind";
    return { channel: p.channel, plannedSpend, actualSpend: a.spend, target: p.monthlyTarget, actual: a.conversions, plannedCpa, actualCpa, attainment, status };
  });

  const alerts: string[] = [];
  const total = actuals.reduce((s, a) => s + a.spend, 0);
  if (total > monthlyBudget * 1.05) alerts.push(`Dépassement budgétaire: ${Math.round(total)} dépensés pour ${Math.round(monthlyBudget)} prévus.`);
  for (const a of analysis) {
    if (a.status === "behind") alerts.push(`${a.channel}: ${(a.attainment * 100).toFixed(0)}% de l'objectif — écart à corriger.`);
    if (a.status === "no_data") alerts.push(`${a.channel}: aucune donnée de dépense saisie.`);
  }

  // Efficacité = conversions par unité dépensée; seuls les canaux avec données sont comparés.
  const measured = analysis.filter((a) => a.status !== "no_data");
  const efficiency = (a: ChannelAnalysis) => (a.actualSpend > 0 ? a.actual / a.actualSpend : 0);
  const costPerResult = (a: ChannelAnalysis) => (a.actualCpa === null ? "aucun résultat" : `coût de ${Math.round(a.actualCpa)}`);
  const sorted = [...measured].sort((x, y) => efficiency(y) - efficiency(x));
  const adjustments: Adjustment[] = [];
  const shares = new Map(plan.map((p) => [p.channel, p.budgetShare]));

  if (sorted.length >= 2) {
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (best.channel !== worst.channel && efficiency(best) > efficiency(worst) * 1.25) {
      const worstShare = shares.get(worst.channel)!;
      const shift = Math.min(worstShare * MAX_SHIFT, worstShare);
      shares.set(worst.channel, worstShare - shift);
      shares.set(best.channel, shares.get(best.channel)! + shift);
      adjustments.push({ channel: worst.channel, fromShare: worstShare, toShare: worstShare - shift, reason: `Rendement le plus faible (${costPerResult(worst)} par résultat).` });
      adjustments.push({ channel: best.channel, fromShare: best.plannedSpend / monthlyBudget, toShare: shares.get(best.channel)!, reason: `Rendement le plus fort (${costPerResult(best)} par résultat).` });
    }
  }

  return { analysis, adjustments, alerts };
}
