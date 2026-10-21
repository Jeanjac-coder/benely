import { NextResponse } from "next/server";
import { apiContext, jsonError } from "@/lib/context";
import { logEvent } from "@/lib/events";

/** Résiliation en fin de période (value: true) ou reprise (value: false). */
export async function POST(req: Request) {
  const ctx = await apiContext(["owner"]);
  if (ctx instanceof NextResponse) return ctx;
  const { value } = await req.json().catch(() => ({}));
  if (typeof value !== "boolean") return jsonError("Requête invalide.");
  const { error } = await ctx.supabase.rpc("set_cancel_at_period_end", { org: ctx.org.id, value });
  if (error) return jsonError(error.message);
  await logEvent("info", "billing", value ? "Résiliation programmée" : "Résiliation annulée", { orgId: ctx.org.id });
  return NextResponse.json({ ok: true });
}
