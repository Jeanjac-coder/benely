import { NextResponse } from "next/server";
import { validatePeriod } from "@/lib/calendar";
import { apiContext, jsonError } from "@/lib/context";
import { checkQuota, recordQuotaUse } from "@/lib/billing/server";
import { loadJobInput } from "@/lib/jobs";

export async function POST(req: Request) {
  const ctx = await apiContext();
  if (ctx instanceof NextResponse) return ctx;
  const { period } = await req.json().catch(() => ({}));
  const invalid = period ? validatePeriod(period) : "Période requise.";
  if (invalid) return jsonError(invalid);
  const input = await loadJobInput(ctx, { start: period.start, end: period.end });
  if (typeof input === "string") return jsonError(input);
  const quota = await checkQuota(ctx, "generations");
  if (quota) return jsonError(quota, 402);
  const { data, error } = await ctx.supabase.from("generation_jobs")
    .insert({ org_id: ctx.org.id, input, created_by: ctx.userId }).select("id").single();
  if (error) return jsonError(error.message, 500);
  // Une génération compte une fois, à sa création; ses relances après erreur ne recomptent pas.
  await recordQuotaUse(ctx, "generations");
  return NextResponse.json({ id: data.id });
}
