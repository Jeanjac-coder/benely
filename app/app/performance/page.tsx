import Link from "next/link";
import { requireContext } from "@/lib/context";
import { latestStrategy } from "@/lib/repo";
import { PerformanceView } from "./PerformanceView";

export default async function PerformancePage() {
  const ctx = await requireContext();
  const current = await latestStrategy(ctx);
  if (!current) return <><h1>Performances</h1><div className="card"><Link href="/app/generate">Générer une stratégie</Link></div></>;
  const { data: entries } = await ctx.supabase.from("performance_entries")
    .select("channel, period_start, spend, conversions").eq("strategy_id", current.strategy.id);
  const d = current.version.deliverables;
  return <PerformanceView strategyId={current.strategy.id} meta={d.meta} channels={d.media.channels}
    entries={(entries ?? []).map((e) => ({ ...e, spend: Number(e.spend) }))} />;
}
