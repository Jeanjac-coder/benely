import { NextResponse } from "next/server";
import { fallbackRecommendations, type Recommendations } from "@/lib/ai/recommendations";
import { apiContext, jsonError } from "@/lib/context";
import { logEvent } from "@/lib/events";
import { buildDiagnosticDoc, type Benchmark } from "@/lib/export/diagnostic";
import { loadLogo } from "@/lib/export/load";
import { fileName } from "@/lib/export/model";
import { renderPdf } from "@/lib/export/pdf";
import type { Maturity } from "@/lib/maturity";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Rapport PDF personnalisé du diagnostic: synthèse, opportunités, plan d'action et priorités. */
export async function GET() {
  const ctx = await apiContext();
  if (ctx instanceof NextResponse) return ctx;
  const { data: row } = await ctx.supabase.from("company_profiles").select("answers, maturity, recommendations").eq("org_id", ctx.org.id).maybeSingle();
  if (!row?.maturity) return jsonError("Terminez d'abord le questionnaire.", 404);
  const maturity = row.maturity as Maturity;
  try {
    const { data: bench } = await ctx.supabase.rpc("sector_benchmark", { org: ctx.org.id }).maybeSingle();
    const reco = (row.recommendations as Recommendations | null) ?? fallbackRecommendations(maturity);
    const doc = buildDiagnosticDoc(row.answers ?? {}, maturity, reco, (bench as Benchmark | null) ?? null, { company: ctx.org.name, logo: await loadLogo(ctx) });
    const body = await renderPdf(doc);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName(ctx.org.name, "pdf").replace(/\.pdf$/, "-diagnostic.pdf")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    await logEvent("error", "export", "Rapport de diagnostic impossible", { orgId: ctx.org.id, details: { error: (e as Error).message } });
    return jsonError("Le rapport n'a pas pu être généré. Réessayez dans un instant.", 500);
  }
}
