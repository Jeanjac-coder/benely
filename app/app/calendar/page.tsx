import Link from "next/link";
import { requireContext } from "@/lib/context";
import { latestStrategy } from "@/lib/repo";
import { CalendarView } from "./CalendarView";

export default async function CalendarPage() {
  const ctx = await requireContext();
  const current = await latestStrategy(ctx);
  if (!current) return <><h1>Calendrier éditorial</h1><div className="card"><Link href="/app/generate">Générer une stratégie</Link></div></>;
  const d = current.version.deliverables;
  return <CalendarView strategyId={current.strategy.id} period={d.meta.period} content={d.content} />;
}
