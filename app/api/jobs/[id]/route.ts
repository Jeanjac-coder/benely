import { NextResponse } from "next/server";
import { apiContext, jsonError } from "@/lib/context";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const ctx = await apiContext();
  if (ctx instanceof NextResponse) return ctx;
  const { data } = await ctx.supabase.from("generation_jobs")
    .select("id, status, current_step, error, outputs, strategy_id").eq("id", params.id).maybeSingle();
  if (!data) return jsonError("Génération introuvable.", 404);
  return NextResponse.json({ ...data, completed: Object.keys(data.outputs ?? {}).filter((k) => !k.startsWith("_")), outputs: undefined });
}
