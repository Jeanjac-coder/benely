import { NextResponse } from "next/server";
import { settlePayment, SIMULATION } from "@/lib/billing/server";
import { apiContext, jsonError } from "@/lib/context";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Développement uniquement: enregistre la décision du paiement simulé puis le vérifie comme un vrai. */
export async function POST(req: Request) {
  if (!SIMULATION) return jsonError("Indisponible.", 404);
  const ctx = await apiContext(["owner", "admin"]);
  if (ctx instanceof NextResponse) return ctx;
  const { tx, decision } = await req.json().catch(() => ({}));
  if (decision !== "accept" && decision !== "refuse") return jsonError("Décision invalide.");
  const { data: p } = await ctx.supabase.from("payments").select("id").eq("transaction_id", tx).maybeSingle();
  if (!p) return jsonError("Paiement introuvable.", 404);
  await supabaseAdmin().from("payments").update({ provider_data: { simulated: decision } }).eq("id", p.id).eq("status", "pending");
  return NextResponse.json({ status: await settlePayment(tx) });
}
