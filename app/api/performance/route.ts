import { NextResponse } from "next/server";
import { parseDay } from "@/lib/calendar";
import { apiContext, jsonError } from "@/lib/context";

/** V1: saisie manuelle des performances par canal et par mois. */
export async function PUT(req: Request) {
  const ctx = await apiContext();
  if (ctx instanceof NextResponse) return ctx;
  const body = await req.json().catch(() => null);
  if (!body?.strategyId || !parseDay(body.periodStart ?? "") || !Array.isArray(body.entries)) return jsonError("Saisie invalide.");
  const rows = body.entries
    .filter((e: { channel?: unknown }) => typeof e.channel === "string")
    .map((e: { channel: string; spend: unknown; conversions: unknown }) => ({
      org_id: ctx.org.id, strategy_id: body.strategyId, channel: e.channel, period_start: body.periodStart,
      spend: Math.max(0, Number(e.spend) || 0), conversions: Math.max(0, Math.round(Number(e.conversions) || 0)), created_by: ctx.userId,
    }));
  const { error } = await ctx.supabase.from("performance_entries").upsert(rows, { onConflict: "strategy_id,channel,period_start" });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
