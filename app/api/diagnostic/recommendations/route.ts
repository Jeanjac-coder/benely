import { NextResponse } from "next/server";
import { generateStructured } from "@/lib/ai/client";
import { fallbackRecommendations, RECO_SYSTEM, recommendationsPrompt, RecommendationsSchema, type Recommendations } from "@/lib/ai/recommendations";
import { apiContext, jsonError } from "@/lib/context";
import { logEvent } from "@/lib/events";
import { activeMethodology } from "@/lib/jobs";
import type { Maturity } from "@/lib/maturity";
import { recordUsage } from "@/lib/repo";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * 3 actions prioritaires générées à la fin du questionnaire, à partir des réponses, du score
 * et de la méthodologie Benely. Mises en cache jusqu'à la prochaine modification des réponses;
 * en cas d'indisponibilité de l'IA, des recommandations standard issues du score sont proposées.
 */
export async function POST() {
  const ctx = await apiContext();
  if (ctx instanceof NextResponse) return ctx;
  const { data: row } = await ctx.supabase.from("company_profiles").select("answers, maturity, recommendations").eq("org_id", ctx.org.id).maybeSingle();
  if (!row?.maturity) return jsonError("Terminez d'abord le questionnaire.");
  if (row.recommendations) return NextResponse.json(row.recommendations);
  const maturity = row.maturity as Maturity;

  let reco: Recommendations;
  if (!process.env.ANTHROPIC_API_KEY) {
    reco = fallbackRecommendations(maturity);
  } else {
    try {
      const { context, instruction } = recommendationsPrompt(row.answers ?? {}, maturity, await activeMethodology(ctx.org.id));
      const { data, usage } = await generateStructured(RecommendationsSchema, RECO_SYSTEM, context, instruction);
      await recordUsage(ctx, null, "recommendations", [usage]);
      reco = { ...data, actions: data.actions.slice(0, 3), source: "ia" };
      if (reco.actions.length < 3) reco = { ...reco, actions: [...reco.actions, ...fallbackRecommendations(maturity).actions].slice(0, 3) };
    } catch (e) {
      await logEvent("warning", "diagnostic", `Recommandations IA indisponibles: ${(e as Error).message}`, { orgId: ctx.org.id });
      reco = fallbackRecommendations(maturity);
    }
  }
  await ctx.supabase.from("company_profiles").update({ recommendations: reco, recommendations_at: new Date().toISOString() }).eq("org_id", ctx.org.id);
  return NextResponse.json(reco);
}
