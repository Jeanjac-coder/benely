import { NextResponse } from "next/server";
import { apiAdmin, audit } from "@/lib/admin";
import { jsonError } from "@/lib/context";
import { supabaseAdmin } from "@/lib/supabase/admin";

const STATUSES = ["trialing", "active", "past_due", "canceled", "expired"];

export async function PUT(req: Request) {
  const admin = await apiAdmin();
  if (admin instanceof NextResponse) return admin;
  const b = await req.json().catch(() => ({}));
  if (typeof b.orgId !== "string" || typeof b.planId !== "string" || !STATUSES.includes(b.status) || !/^\d{4}-\d{2}-\d{2}$/.test(b.periodEnd ?? "")) return jsonError("Requête invalide.");
  if (typeof b.reason !== "string" || !b.reason.trim()) return jsonError("Motif obligatoire.");
  const db = supabaseAdmin();
  const { data: before } = await db.from("subscriptions").select("*").eq("org_id", b.orgId).maybeSingle();
  if (!before) return jsonError("Abonnement introuvable.", 404);
  const after = { plan_id: b.planId, status: b.status, current_period_end: `${b.periodEnd}T23:59:59Z`, updated_at: new Date().toISOString() };
  const { error } = await db.from("subscriptions").update(after).eq("org_id", b.orgId);
  if (error) return jsonError(error.message);
  await audit(admin.userId, "subscription.update", b.orgId, { before, after, reason: b.reason.trim() });
  return NextResponse.json({ ok: true });
}
