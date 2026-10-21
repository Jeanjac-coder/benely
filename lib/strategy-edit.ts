import { normalizeShares, scaleBudgets } from "./budget.ts";
import type { Deliverables } from "./ai/schemas.ts";

/**
 * Applique un nouveau budget mensuel et de nouvelles parts par canal.
 * Les budgets de campagnes suivent le budget mensuel au prorata.
 */
export function applyBudget(d: Deliverables, monthlyBudget: number, shares: Record<string, number>): Deliverables {
  const channels = normalizeShares(d.media.channels.map((c) => ({ ...c, budgetShare: shares[c.channel] ?? c.budgetShare })));
  return {
    ...d,
    meta: { ...d.meta, monthlyBudget },
    media: { ...d.media, channels, campaigns: scaleBudgets(d.media.campaigns, d.meta.monthlyBudget, monthlyBudget) },
  };
}
