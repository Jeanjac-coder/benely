import { NextResponse } from "next/server";
import { checkCoherence } from "@/lib/ai/coherence";
import { apiContext, jsonError } from "@/lib/context";
import { latestStrategy, saveVersion } from "@/lib/repo";
import { applyBudget } from "@/lib/strategy-edit";

/** T07: modification du budget, recalcul des allocations et des budgets de campagnes. */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const ctx = await apiContext();
  if (ctx instanceof NextResponse) return ctx;
  const body = await req.json().catch(() => null);
  const monthlyBudget = Number(body?.monthlyBudget);
  if (!(monthlyBudget > 0)) return jsonError("Budget mensuel invalide.");
  const shares = Object.fromEntries(Object.entries(body?.shares ?? {}).filter(([, v]) => typeof v === "number" && v >= 0)) as Record<string, number>;
  const current = await latestStrategy(ctx);
  if (!current || current.strategy.id !== params.id) return jsonError("Stratégie introuvable.", 404);
  const d = applyBudget(current.version.deliverables, monthlyBudget, shares);
  try {
    return NextResponse.json({ version: await saveVersion(ctx, params.id, d, checkCoherence(d), "budget", "Budget modifié") });
  } catch (e) {
    return jsonError((e as Error).message, 409);
  }
}
