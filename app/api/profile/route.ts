import { NextResponse } from "next/server";
import { apiContext, jsonError } from "@/lib/context";
import { withDefaults } from "@/lib/profile";

/** Enregistre un brouillon de profil. Toute modification invalide la synthèse validée. */
export async function PUT(req: Request) {
  const ctx = await apiContext();
  if (ctx instanceof NextResponse) return ctx;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.data !== "object") return jsonError("Profil invalide.");
  const answers = Object.fromEntries(Object.entries(body.answers ?? {}).filter(([, v]) => typeof v === "string"));
  const { error } = await ctx.supabase.from("company_profiles").upsert({
    org_id: ctx.org.id, data: withDefaults(body.data), answers, validated_at: null, updated_at: new Date().toISOString(),
  });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
