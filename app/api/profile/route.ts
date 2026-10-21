import { NextResponse } from "next/server";
import { apiContext, jsonError } from "@/lib/context";
import { sanitizeAnswers, toProfile } from "@/lib/diagnostic";
import { computeMaturity } from "@/lib/maturity";
import { withDefaults } from "@/lib/profile";
import { str } from "@/lib/questionnaire";

/**
 * Enregistre les réponses du questionnaire (sauvegarde automatique) et le profil qui en découle.
 * `complete: true` à la fin du parcours: calcule le score de maturité et renvoie le benchmark.
 * Toute modification invalide la synthèse validée et les recommandations.
 */
export async function PUT(req: Request) {
  const ctx = await apiContext();
  if (ctx instanceof NextResponse) return ctx;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.answers !== "object") return jsonError("Réponses invalides.");
  const answers = sanitizeAnswers(body.answers);
  const { data: row } = await ctx.supabase.from("company_profiles").select("data").eq("org_id", ctx.org.id).maybeSingle();
  const base = withDefaults({ name: ctx.org.name, country: ctx.org.country, currency: ctx.org.currency, ...(row?.data ?? {}) });
  const maturity = body.complete === true ? computeMaturity(answers) : null;
  const { error } = await ctx.supabase.from("company_profiles").upsert({
    org_id: ctx.org.id, data: toProfile(answers, base), answers, validated_at: null, updated_at: new Date().toISOString(),
    ...(maturity ? { maturity, maturity_score: maturity.score, benchmark_sector: str(answers.sector) || null, recommendations: null, recommendations_at: null } : {}),
  });
  if (error) return jsonError(error.message, 500);
  if (!maturity) return NextResponse.json({ ok: true });
  const { data: bench } = await ctx.supabase.rpc("sector_benchmark", { org: ctx.org.id }).maybeSingle();
  return NextResponse.json({ ok: true, maturity, benchmark: bench ?? null });
}
