import { NextResponse } from "next/server";
import { settlePayment } from "@/lib/billing/server";
import { logEvent } from "@/lib/events";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Tâche planifiée (voir vercel.json): met à jour les statuts d'abonnement et revérifie
 * les paiements restés en attente (notification perdue).
 */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const db = supabaseAdmin();
  const { data: changed, error } = await db.rpc("refresh_subscription_statuses");
  if (error) await logEvent("error", "billing", "Mise à jour des abonnements impossible", { details: { error: error.message } });
  const since = new Date(Date.now() - 2 * 86_400_000).toISOString();
  const before = new Date(Date.now() - 10 * 60_000).toISOString();
  const { data: pending } = await db.from("payments").select("transaction_id").eq("status", "pending").gte("created_at", since).lte("created_at", before).limit(50);
  for (const p of pending ?? []) await settlePayment(p.transaction_id);
  return NextResponse.json({ subscriptionsUpdated: changed ?? 0, paymentsChecked: pending?.length ?? 0 });
}
