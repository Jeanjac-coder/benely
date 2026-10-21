import { NextResponse } from "next/server";
import { checkCoherence } from "@/lib/ai/coherence";
import { toAiError } from "@/lib/ai/client";
import { runStep } from "@/lib/ai/pipeline";
import { STEPS, type Deliverables, type Step } from "@/lib/ai/schemas";
import { validatePeriod } from "@/lib/calendar";
import { apiContext, jsonError } from "@/lib/context";
import { checkQuota, recordQuotaUse } from "@/lib/billing/server";
import { logEvent } from "@/lib/events";
import { loadJobInput } from "@/lib/jobs";
import { latestStrategy, recordUsage, saveVersion } from "@/lib/repo";

export const maxDuration = 300;

/**
 * Régénère un livrable en gardant les autres comme contexte. Pour le calendrier,
 * une nouvelle période peut être fournie (7 jours, 30 jours, 3 mois ou libre).
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await apiContext();
  if (ctx instanceof NextResponse) return ctx;
  const body = await req.json().catch(() => ({}));
  const step = body.step as Step;
  if (!STEPS.includes(step)) return jsonError("Livrable inconnu.");
  const current = await latestStrategy(ctx);
  if (!current || current.strategy.id !== params.id) return jsonError("Stratégie introuvable.", 404);
  const d = current.version.deliverables;
  const period = step === "content" && body.period ? { start: body.period.start, end: body.period.end } : d.meta.period;
  const invalid = validatePeriod(period);
  if (invalid) return jsonError(invalid);
  const input = await loadJobInput(ctx, period);
  if (typeof input === "string") return jsonError(input);
  const quota = await checkQuota(ctx, "regenerations");
  if (quota) return jsonError(quota, 402);
  // Le budget de la stratégie (éventuellement modifié) prime sur celui du profil.
  input.profile = { ...input.profile, monthlyBudget: d.meta.monthlyBudget };

  const { meta, ...outputs } = d;
  const others = Object.fromEntries(Object.entries(outputs).filter(([k]) => k !== step));
  try {
    const r = await runStep(step, input, { ...others, _sources: meta.sources });
    await recordUsage(ctx, null, `regenerate:${step}`, r.usage);
    const next: Deliverables = { ...d, [step]: r.outputs[step], meta: { ...meta, period, sources: r.outputs._sources ?? meta.sources, methodologyVersion: input.methodology?.version ?? meta.methodologyVersion ?? null } };
    const version = await saveVersion(ctx, params.id, next, checkCoherence(next), "regeneration", `Régénération: ${step}`);
    await recordQuotaUse(ctx, "regenerations");
    return NextResponse.json({ version });
  } catch (e) {
    const err = toAiError(e);
    await logEvent("error", "generation", `Régénération ${step}: ${err.message}`, { orgId: ctx.org.id, details: { error: e } });
    return NextResponse.json({ error: err.message, retryable: err.retryable }, { status: 502 });
  }
}
