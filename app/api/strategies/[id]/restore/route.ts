import { NextResponse } from "next/server";
import { checkCoherence } from "@/lib/ai/coherence";
import { apiContext, jsonError } from "@/lib/context";
import { saveVersion, type StrategyVersion } from "@/lib/repo";

/** Restaure une version antérieure en la recopiant comme nouvelle version. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await apiContext();
  if (ctx instanceof NextResponse) return ctx;
  const { version } = await req.json().catch(() => ({}));
  const { data } = await ctx.supabase.from("strategy_versions").select("deliverables").eq("strategy_id", params.id).eq("version", version).maybeSingle();
  if (!data) return jsonError("Version introuvable.", 404);
  const d = data.deliverables as StrategyVersion["deliverables"];
  try {
    return NextResponse.json({ version: await saveVersion(ctx, params.id, d, checkCoherence(d), "edit", `Restauration de la version ${version}`) });
  } catch (e) {
    return jsonError((e as Error).message, 409);
  }
}
