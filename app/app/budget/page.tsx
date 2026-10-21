import Link from "next/link";
import { requireContext } from "@/lib/context";
import { latestStrategy } from "@/lib/repo";
import { BudgetEditor } from "./BudgetEditor";

export default async function BudgetPage() {
  const ctx = await requireContext();
  const current = await latestStrategy(ctx);
  if (!current) return <><h1>Budget</h1><div className="card"><Link href="/app/generate">Générer une stratégie</Link></div></>;
  const d = current.version.deliverables;
  return <BudgetEditor key={current.version.version} strategyId={current.strategy.id} meta={d.meta} media={d.media} />;
}
