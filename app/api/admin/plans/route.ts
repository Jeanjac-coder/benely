import { NextResponse } from "next/server";
import { apiAdmin, audit } from "@/lib/admin";
import { QUOTA_LABELS } from "@/lib/billing/plans";
import { jsonError } from "@/lib/context";
import { supabaseAdmin } from "@/lib/supabase/admin";

const validQuota = (v: unknown) => v === null || (typeof v === "number" && Number.isInteger(v) && v >= 0);

export async function PUT(req: Request) {
  const admin = await apiAdmin();
  if (admin instanceof NextResponse) return admin;
  const b = await req.json().catch(() => ({}));
  const quotas = b.quotas ?? {};
  if (typeof b.id !== "string" || typeof b.name !== "string" || !b.name.trim() || typeof b.public !== "boolean") return jsonError("Requête invalide.");
  if (b.price_monthly !== null && !(Number.isInteger(b.price_monthly) && b.price_monthly > 0 && b.price_monthly % 5 === 0)) return jsonError("Prix invalide: entier positif multiple de 5, ou vide pour « sur devis ».");
  if (!Object.keys(QUOTA_LABELS).every((k) => validQuota(quotas[k]))) return jsonError("Quotas invalides.");
  const db = supabaseAdmin();
  const { data: before } = await db.from("plans").select("*").eq("id", b.id).maybeSingle();
  if (!before) return jsonError("Offre introuvable.", 404);
  const after = { name: b.name.trim(), price_monthly: b.price_monthly, public: b.public, quotas: Object.fromEntries(Object.keys(QUOTA_LABELS).map((k) => [k, quotas[k]])), updated_at: new Date().toISOString() };
  const { error } = await db.from("plans").update(after).eq("id", b.id);
  if (error) return jsonError(error.message);
  await audit(admin.userId, "plan.update", b.id, { before, after });
  return NextResponse.json({ ok: true });
}
