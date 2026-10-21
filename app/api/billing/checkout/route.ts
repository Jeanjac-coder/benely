import { NextResponse } from "next/server";
import { paymentProvider } from "@/lib/billing/server";
import { newTransactionId, ProviderError } from "@/lib/billing/provider";
import { apiContext, jsonError } from "@/lib/context";
import { logEvent } from "@/lib/events";

/** Crée un paiement en attente et renvoie l'URL de paiement (Mobile Money ou carte). */
export async function POST(req: Request) {
  const ctx = await apiContext(["owner", "admin"]);
  if (ctx instanceof NextResponse) return ctx;
  const { planId } = await req.json().catch(() => ({}));
  const { data: plan } = await ctx.supabase.from("plans").select("id, name, price_monthly, currency, public").eq("id", planId).maybeSingle();
  if (!plan || !plan.public) return jsonError("Offre inconnue.");
  if (!plan.price_monthly) return jsonError("Cette offre est sur devis: contactez-nous.");

  const transactionId = newTransactionId();
  const { error } = await ctx.supabase.from("payments").insert({
    org_id: ctx.org.id, plan_id: plan.id, transaction_id: transactionId, amount: plan.price_monthly, currency: plan.currency,
    provider: paymentProviderName(), created_by: ctx.userId,
  });
  if (error) return jsonError(error.message, 500);

  const origin = new URL(req.url).origin;
  try {
    const { paymentUrl } = await paymentProvider().init({
      transactionId, amount: plan.price_monthly, currency: plan.currency,
      description: `Abonnement Benely ${plan.name} - ${ctx.org.name}`,
      returnUrl: `${origin}/app/billing/return?tx=${transactionId}`,
      notifyUrl: `${origin}/api/billing/notify`,
      customer: { name: ctx.org.name, email: ctx.email },
    });
    return NextResponse.json({ paymentUrl });
  } catch (e) {
    await logEvent("error", "payment", "Initialisation du paiement impossible", { orgId: ctx.org.id, details: { transactionId, error: e } });
    return jsonError(e instanceof ProviderError ? e.message : "Le service de paiement est indisponible. Réessayez plus tard.", 502);
  }
}

function paymentProviderName() {
  try { return paymentProvider().name; } catch { return "cinetpay"; }
}
