import { NextResponse } from "next/server";
import { checkCoherence } from "@/lib/ai/coherence";
import { toAiError } from "@/lib/ai/client";
import { assemble, nextStep, runStep, type JobOutputs } from "@/lib/ai/pipeline";
import type { JobInput } from "@/lib/ai/prompts";
import { apiContext, jsonError } from "@/lib/context";
import { logEvent } from "@/lib/events";
import { recordUsage, saveVersion } from "@/lib/repo";

export const maxDuration = 300;
const STALE_MS = 6 * 60_000;

/**
 * Exécute l'étape suivante d'une génération. Le client rappelle cette route jusqu'à la fin:
 * chaque appel reste court, la progression est persistée, et une étape en échec se relance à l'identique.
 */
export async function POST(_: Request, { params }: { params: { id: string } }) {
  const ctx = await apiContext();
  if (ctx instanceof NextResponse) return ctx;

  // Réservation: une seule exécution à la fois par génération (sauf exécution bloquée depuis longtemps).
  const staleBefore = new Date(Date.now() - STALE_MS).toISOString();
  const { data: job } = await ctx.supabase.from("generation_jobs")
    .update({ status: "running", error: null, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .or(`status.in.(queued,failed),and(status.eq.running,updated_at.lt.${staleBefore})`)
    .select("id, input, outputs").maybeSingle();
  if (!job) {
    const { data: current } = await ctx.supabase.from("generation_jobs").select("status").eq("id", params.id).maybeSingle();
    if (!current) return jsonError("Génération introuvable.", 404);
    return NextResponse.json({ status: current.status, busy: current.status === "running" });
  }

  const input = job.input as JobInput;
  let outputs = job.outputs as JobOutputs;
  const step = nextStep(outputs);
  try {
    if (step) {
      await ctx.supabase.from("generation_jobs").update({ current_step: step }).eq("id", job.id);
      const r = await runStep(step, input, outputs);
      outputs = r.outputs;
      await recordUsage(ctx, job.id, step, r.usage);
    }
    if (nextStep(outputs)) {
      await ctx.supabase.from("generation_jobs").update({ status: "queued", outputs, current_step: nextStep(outputs), updated_at: new Date().toISOString() }).eq("id", job.id);
      return NextResponse.json({ status: "queued", step: nextStep(outputs) });
    }
    // Toutes les étapes sont faites: contrôle de cohérence puis sauvegarde en version 1.
    const deliverables = assemble(input, outputs);
    const issues = checkCoherence(deliverables);
    const { data: strategy, error } = await ctx.supabase.from("strategies")
      .insert({ org_id: ctx.org.id, title: `Stratégie ${input.profile.name} — ${input.period.start}`, created_by: ctx.userId }).select("id").single();
    if (error) throw new Error(error.message);
    await saveVersion(ctx, strategy.id, deliverables, issues, "generation", null);
    await ctx.supabase.from("generation_jobs").update({ status: "succeeded", outputs, strategy_id: strategy.id, current_step: null, updated_at: new Date().toISOString() }).eq("id", job.id);
    return NextResponse.json({ status: "succeeded", strategyId: strategy.id });
  } catch (e) {
    const err = toAiError(e);
    await logEvent("error", "generation", `Étape ${step ?? "finale"}: ${err.message}`, { orgId: ctx.org.id, details: { job: job.id, error: e } });
    await ctx.supabase.from("generation_jobs").update({ status: "failed", outputs, error: err.message, updated_at: new Date().toISOString() }).eq("id", job.id);
    return NextResponse.json({ status: "failed", step, error: err.message, retryable: err.retryable }, { status: 502 });
  }
}
