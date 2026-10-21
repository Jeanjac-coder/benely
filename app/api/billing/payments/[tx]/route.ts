import { NextResponse } from "next/server";
import { settlePayment } from "@/lib/billing/server";
import { apiContext, jsonError } from "@/lib/context";

/** État d'un paiement pour la page de retour; revérifie auprès du prestataire s'il est encore en attente. */
export async function GET(_: Request, { params }: { params: { tx: string } }) {
  const ctx = await apiContext(["owner", "admin"]);
  if (ctx instanceof NextResponse) return ctx;
  // Lecture via le client utilisateur: la RLS garantit que le paiement appartient à son organisation.
  const { data: p } = await ctx.supabase.from("payments").select("status").eq("transaction_id", params.tx).maybeSingle();
  if (!p) return jsonError("Paiement introuvable.", 404);
  if (p.status === "pending") await settlePayment(params.tx);
  const { data } = await ctx.supabase.from("payments").select("status, failure_reason, plan_id, amount, currency").eq("transaction_id", params.tx).single();
  return NextResponse.json(data);
}
