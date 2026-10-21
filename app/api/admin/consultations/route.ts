import { NextResponse } from "next/server";
import { apiAdmin, audit } from "@/lib/admin";
import { jsonError } from "@/lib/context";
import { supabaseAdmin } from "@/lib/supabase/admin";

const STATUSES = ["nouvelle", "confirmee", "realisee", "annulee"];

/** Suivi d'une demande d'échange stratégique (confirmée, réalisée, annulée). */
export async function PATCH(req: Request) {
  const admin = await apiAdmin();
  if (admin instanceof NextResponse) return admin;
  const b = await req.json().catch(() => ({}));
  if (typeof b.id !== "string" || !STATUSES.includes(b.status)) return jsonError("Demande ou statut invalide.");
  const { error } = await supabaseAdmin().from("consultation_requests").update({ status: b.status }).eq("id", b.id);
  if (error) return jsonError(error.message, 500);
  await audit(admin.userId, "consultation.status", b.id, { status: b.status });
  return NextResponse.json({ ok: true });
}
