import { NextResponse } from "next/server";
import { apiContext, jsonError } from "@/lib/context";
import { ProfileSchema } from "@/lib/profile";

/** Valide la synthèse (éventuellement corrigée par l'utilisateur): préalable à toute génération. */
export async function POST(req: Request) {
  const ctx = await apiContext();
  if (ctx instanceof NextResponse) return ctx;
  const { summary } = await req.json().catch(() => ({}));
  if (typeof summary !== "string" || summary.trim().length < 20) return jsonError("La synthèse est trop courte.");
  const { data: row } = await ctx.supabase.from("company_profiles").select("data").eq("org_id", ctx.org.id).single();
  const parsed = ProfileSchema.safeParse(row?.data);
  if (!parsed.success) return jsonError(`Profil incomplet: ${parsed.error.issues.map((i) => i.message).join(", ")}`);
  const { error } = await ctx.supabase.from("company_profiles")
    .update({ summary: summary.trim(), validated_at: new Date().toISOString() }).eq("org_id", ctx.org.id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
