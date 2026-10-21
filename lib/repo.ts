import type { Deliverables } from "./ai/schemas";
import { upgradeDeliverables } from "./ai/upgrade";
import type { Issue } from "./ai/coherence";
import type { OrgContext } from "./context";

export interface StrategyVersion {
  id: string;
  version: number;
  deliverables: Deliverables;
  issues: Issue[];
  source: "generation" | "edit" | "regeneration" | "budget";
  note: string | null;
  created_at: string;
}

export async function latestStrategy(ctx: OrgContext) {
  const { data: strategy } = await ctx.supabase
    .from("strategies").select("id, title, current_version, created_at")
    .eq("org_id", ctx.org.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!strategy) return null;
  const { data: version } = await ctx.supabase
    .from("strategy_versions").select("id, version, deliverables, issues, source, note, created_at")
    .eq("strategy_id", strategy.id).eq("version", strategy.current_version).maybeSingle();
  // Les versions antérieures à la méthodologie sont complétées pour rester lisibles et modifiables.
  return version ? { strategy, version: { ...version, deliverables: upgradeDeliverables(version.deliverables) } as StrategyVersion } : null;
}

/**
 * Enregistre une nouvelle version et la rend courante.
 * La contrainte unique (strategy_id, version) protège contre deux sauvegardes concurrentes.
 */
export async function saveVersion(ctx: OrgContext, strategyId: string, deliverables: Deliverables, issues: Issue[], source: StrategyVersion["source"], note: string | null) {
  const { data: s, error: e1 } = await ctx.supabase.from("strategies").select("current_version").eq("id", strategyId).single();
  if (e1 || !s) throw new Error("Stratégie introuvable.");
  const version = s.current_version + 1;
  const { error: e2 } = await ctx.supabase.from("strategy_versions").insert({
    strategy_id: strategyId, org_id: ctx.org.id, version, deliverables, issues, source, note, created_by: ctx.userId,
  });
  if (e2) throw new Error(e2.code === "23505" ? "Une autre modification vient d'être enregistrée. Rechargez la page." : e2.message);
  const { error: e3 } = await ctx.supabase.from("strategies").update({ current_version: version }).eq("id", strategyId);
  if (e3) throw new Error(e3.message);
  return version;
}

export async function recordUsage(ctx: OrgContext, jobId: string | null, step: string, usage: { model: string; inputTokens: number; outputTokens: number }[]) {
  if (usage.length === 0) return;
  await ctx.supabase.from("ai_usage").insert(usage.map((u) => ({
    org_id: ctx.org.id, job_id: jobId, step, model: u.model, input_tokens: u.inputTokens, output_tokens: u.outputTokens,
  })));
}
