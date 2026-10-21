export interface Allocation { channel: string; budgetShare: number }

const EPS = 1e-9;

/** Remet les parts à l'échelle pour qu'elles somment à 1 (parts négatives ramenées à 0). */
export function normalizeShares<T extends Allocation>(channels: T[]): T[] {
  const clean = channels.map((c) => ({ ...c, budgetShare: Math.max(0, Number.isFinite(c.budgetShare) ? c.budgetShare : 0) }));
  const total = clean.reduce((s, c) => s + c.budgetShare, 0);
  if (total <= EPS) return clean.map((c) => ({ ...c, budgetShare: 1 / clean.length }));
  return clean.map((c) => ({ ...c, budgetShare: c.budgetShare / total }));
}

/**
 * Fixe la part d'un canal et répartit l'écart sur les autres canaux non verrouillés,
 * proportionnellement à leur part actuelle. La somme reste égale à 1.
 */
export function setShare<T extends Allocation>(channels: T[], index: number, share: number, locked: ReadonlySet<number> = new Set()): T[] {
  const lockedTotal = channels.reduce((s, c, i) => (i !== index && locked.has(i) ? s + c.budgetShare : s), 0);
  const free = channels.map((_, i) => i).filter((i) => i !== index && !locked.has(i));
  const maxShare = free.length === 0 ? channels[index].budgetShare : 1 - lockedTotal;
  const target = Math.min(Math.max(0, share), Math.max(0, maxShare));
  const remaining = 1 - lockedTotal - target;
  const freeTotal = free.reduce((s, i) => s + channels[i].budgetShare, 0);
  return channels.map((c, i) => {
    if (i === index) return { ...c, budgetShare: target };
    if (!free.includes(i)) return c;
    const weight = freeTotal > EPS ? c.budgetShare / freeTotal : 1 / free.length;
    return { ...c, budgetShare: remaining * weight };
  });
}

export function amounts(channels: Allocation[], monthlyBudget: number): { channel: string; amount: number }[] {
  return channels.map((c) => ({ channel: c.channel, amount: Math.round(c.budgetShare * monthlyBudget) }));
}

/** Ajuste les budgets de campagnes au prorata d'un nouveau budget mensuel. */
export function scaleBudgets<T extends { budget: number }>(items: T[], oldMonthly: number, newMonthly: number): T[] {
  if (oldMonthly <= 0) return items;
  const ratio = newMonthly / oldMonthly;
  return items.map((c) => ({ ...c, budget: Math.round(c.budget * ratio) }));
}
