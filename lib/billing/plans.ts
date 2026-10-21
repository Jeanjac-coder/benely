export type QuotaKind = "generations" | "regenerations" | "exports" | "members";
export type Quotas = Record<QuotaKind, number | null>;
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";

export interface Plan {
  id: string;
  name: string;
  price_monthly: number | null;
  currency: string;
  quotas: Quotas;
  public: boolean;
  sort: number;
}

export interface Subscription {
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export const GRACE_DAYS = 3;
const DAY = 86_400_000;

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: "Essai", active: "Actif", past_due: "Paiement en retard", canceled: "Résilié", expired: "Expiré",
};

export const USAGE_KIND: Record<Exclude<QuotaKind, "members">, "generation" | "regeneration" | "export"> = {
  generations: "generation", regenerations: "regeneration", exports: "export",
};

export const QUOTA_LABELS: Record<QuotaKind, string> = {
  generations: "Générations de stratégie", regenerations: "Régénérations de livrables", exports: "Exports", members: "Collaborateurs",
};

/**
 * Statut réel à un instant donné, indépendamment du passage de la tâche planifiée
 * (qui met la base à jour mais peut avoir du retard).
 */
export function effectiveStatus(s: Subscription, now = new Date()): SubscriptionStatus {
  const end = new Date(s.current_period_end).getTime();
  const t = now.getTime();
  if (s.status === "expired" || s.status === "canceled") return s.status;
  if (t <= end) return s.status;
  if (s.status === "trialing") return "expired";
  if (s.cancel_at_period_end) return "canceled";
  return t <= end + GRACE_DAYS * DAY ? "past_due" : "expired";
}

/** Les fonctions payantes restent accessibles pendant l'essai, l'abonnement et le délai de grâce. */
export function canUse(s: Subscription, now = new Date()): boolean {
  const st = effectiveStatus(s, now);
  return st === "trialing" || st === "active" || st === "past_due";
}

/**
 * Début de la fenêtre de comptage des quotas: le mois glissant, borné au début de la période.
 * Un renouvellement anticipé prolonge la période sans remettre les compteurs à zéro.
 */
export function quotaWindowStart(s: Subscription, now = new Date()): Date {
  const start = new Date(s.current_period_start).getTime();
  const monthAgo = new Date(now);
  monthAgo.setUTCMonth(monthAgo.getUTCMonth() - 1);
  return new Date(Math.max(start, monthAgo.getTime()));
}

export function quotaError(kind: QuotaKind, limit: number | null, used: number): string | null {
  if (limit === null || used < limit) return null;
  return `Quota atteint: ${QUOTA_LABELS[kind].toLowerCase()} (${used}/${limit}) pour la période. Passez à une offre supérieure depuis la page Abonnement.`;
}

export function daysLeft(s: Subscription, now = new Date()): number {
  return Math.ceil((new Date(s.current_period_end).getTime() - now.getTime()) / DAY);
}
