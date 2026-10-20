import Link from "next/link";
import { requireContext } from "@/lib/context";
import { latestStrategy } from "@/lib/repo";
import { StrategyEditor } from "./StrategyEditor";

export default async function StrategyPage() {
  const ctx = await requireContext();
  const current = await latestStrategy(ctx);
  if (!current) return <><h1>Stratégie</h1><div className="card"><p>Aucune stratégie pour l'instant.</p><Link href="/app/generate">Générer une stratégie</Link></div></>;
  const { data: versions } = await ctx.supabase.from("strategy_versions")
    .select("version, source, note, created_at").eq("strategy_id", current.strategy.id).order("version", { ascending: false });
  return <StrategyEditor key={current.version.version} strategyId={current.strategy.id} title={current.strategy.title} version={current.version} versions={versions ?? []} />;
}
