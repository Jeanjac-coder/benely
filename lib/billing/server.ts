import "server-only";
import type { OrgContext } from "../context";
import { logEvent } from "../events";
import { supabaseAdmin } from "../supabase/admin";
import { cinetpay } from "./cinetpay";
import { canUse, effectiveStatus, quotaError, quotaWindowStart, USAGE_KIND, type Plan, type QuotaKind, type Subscription } from "./plans";
import { ProviderError, type CheckResult, type PaymentProvider } from "./provider";

export const SIMULATION = process.env.BILLING_PROVIDER === "simulation" && process.env.NODE_ENV !== "production";

/** Prestataire de test: la décision est enregistrée par la page de simulation. Jamais actif en production. */
const simulation: PaymentProvider = {
  name: "simulation",
  async init(p) {
    return { paymentUrl: `${new URL(p.returnUrl).origin}/app/billing/simulate?tx=${p.transactionId}` };
  },
  async check(tx): Promise<CheckResult> {
    const { data } = await supabaseAdmin().from("payments").select("amount, currency, provider_data").eq("transaction_id", tx).single();
    const decision = (data?.provider_data as { simulated?: string } | null)?.simulated;
    const status = decision === "accept" ? "accepted" : decision === "refuse" ? "refused" : "pending";
    return { status, method: "SIMULATION", reason: status === "refused" ? "Refus simulé" : null, raw: { amount: data?.amount, currency: data?.currency, simulated: decision } };
  },
};

export function paymentProvider(): PaymentProvider {
  if (SIMULATION) return simulation;
  const key = process.env.CINETPAY_API_KEY, site = process.env.CINETPAY_SITE_ID;
  if (!key || !site) throw new ProviderError("Paiement non configuré (CINETPAY_API_KEY, CINETPAY_SITE_ID).");
  return cinetpay(key, site);
}

export interface BillingState {
  plan: Plan;
  subscription: Subscription;
  status: ReturnType<typeof effectiveStatus>;
  usable: boolean;
  usage: Record<QuotaKind, number>;
}

export async function billingState(ctx: OrgContext): Promise<BillingState> {
  const { data: sub } = await ctx.supabase.from("subscriptions")
    .select("plan_id, status, current_period_start, current_period_end, cancel_at_period_end").eq("org_id", ctx.org.id).single();
  if (!sub) throw new Error("Abonnement introuvable.");
  const { data: plan } = await ctx.supabase.from("plans").select("*").eq("id", sub.plan_id).single();
  const since = quotaWindowStart(sub).toISOString();
  const [{ data: events }, { count: members }, { count: invites }] = await Promise.all([
    ctx.supabase.from("usage_events").select("kind").eq("org_id", ctx.org.id).gte("created_at", since),
    ctx.supabase.from("memberships").select("*", { count: "exact", head: true }).eq("org_id", ctx.org.id),
    ctx.supabase.from("invitations").select("*", { count: "exact", head: true }).eq("org_id", ctx.org.id).is("accepted_at", null).gt("expires_at", new Date().toISOString()),
  ]);
  const count = (k: string) => (events ?? []).filter((e) => e.kind === k).length;
  return {
    plan: plan as Plan,
    subscription: sub as Subscription,
    status: effectiveStatus(sub as Subscription),
    usable: canUse(sub as Subscription),
    usage: {
      generations: count("generation"), regenerations: count("regeneration"), exports: count("export"),
      // Les invitations en attente comptent: elles deviendront des membres.
      members: (members ?? 0) + (invites ?? 0),
    },
  };
}

/** Vérifie l'abonnement et le quota restant. Renvoie un message d'erreur ou null. */
export async function checkQuota(ctx: OrgContext, kind: QuotaKind): Promise<string | null> {
  const state = await billingState(ctx);
  if (!state.usable) return "Votre abonnement a expiré. Renouvelez-le depuis la page Abonnement pour continuer.";
  return quotaError(kind, state.plan.quotas[kind], state.usage[kind]);
}

/** Décompte une unité consommée, une fois l'action réussie (les membres se comptent directement). */
export async function recordQuotaUse(ctx: OrgContext, kind: Exclude<QuotaKind, "members">) {
  await ctx.supabase.from("usage_events").insert({ org_id: ctx.org.id, kind: USAGE_KIND[kind], user_id: ctx.userId });
}

/**
 * Vérifie un paiement auprès du prestataire et applique le résultat. Seule voie d'activation:
 * appelée par la notification du prestataire et par la page de retour, jamais sur la seule foi du navigateur.
 */
export async function settlePayment(transactionId: string): Promise<"accepted" | "refused" | "cancelled" | "pending" | "unknown"> {
  const db = supabaseAdmin();
  const { data: p } = await db.from("payments").select("id, org_id, amount, currency, status").eq("transaction_id", transactionId).maybeSingle();
  if (!p) {
    await logEvent("warning", "payment", "Notification pour une transaction inconnue", { details: { transactionId } });
    return "unknown";
  }
  if (p.status !== "pending") return p.status === "accepted" ? "accepted" : p.status === "refused" ? "refused" : "cancelled";

  let r: CheckResult;
  try {
    r = await paymentProvider().check(transactionId);
  } catch (e) {
    await logEvent("error", "payment", "Vérification du paiement impossible", { orgId: p.org_id, details: { transactionId, error: e } });
    return "pending";
  }
  const raw = r.raw as { data?: { amount?: unknown; currency?: unknown }; amount?: unknown; currency?: unknown };
  const paidAmount = Number(raw?.data?.amount ?? raw?.amount);
  const paidCurrency = String(raw?.data?.currency ?? raw?.currency ?? p.currency);

  if (r.status === "accepted") {
    // Un montant ou une devise qui ne correspondent pas à l'offre n'activent rien.
    if (paidAmount !== p.amount || paidCurrency !== p.currency) {
      await db.rpc("fail_payment", { tx: transactionId, new_status: "error", reason: "Montant ou devise non conformes", data: r.raw });
      await logEvent("error", "payment", "Montant payé non conforme", { orgId: p.org_id, details: { transactionId, expected: [p.amount, p.currency], paid: [paidAmount, paidCurrency] } });
      return "refused";
    }
    const { error } = await db.rpc("confirm_payment", { tx: transactionId, pay_method: r.method ?? "", data: r.raw });
    if (error) {
      await logEvent("error", "payment", "Activation de l'abonnement impossible", { orgId: p.org_id, details: { transactionId, error: error.message } });
      return "pending";
    }
    await logEvent("info", "payment", "Paiement confirmé, abonnement activé", { orgId: p.org_id, details: { transactionId, method: r.method } });
    return "accepted";
  }
  if (r.status === "refused" || r.status === "cancelled") {
    await db.rpc("fail_payment", { tx: transactionId, new_status: r.status, reason: r.reason ?? "", data: r.raw });
    await logEvent("warning", "payment", r.status === "refused" ? "Paiement refusé" : "Paiement annulé", { orgId: p.org_id, details: { transactionId, reason: r.reason } });
  }
  return r.status;
}
