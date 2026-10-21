import "server-only";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "./supabase/admin";
import { currentUser, supabaseServer } from "./supabase/server";

/** Super-administrateur de la plateforme (table platform_admins). Les autres reçoivent une 404. */
export async function requireAdmin(): Promise<{ userId: string; email: string }> {
  const supabase = supabaseServer();
  const user = await currentUser(supabase);
  if (!user) notFound();
  const { data: ok } = await supabase.rpc("is_platform_admin");
  if (!ok) notFound();
  return { userId: user.id, email: user.email };
}

export async function apiAdmin(): Promise<{ userId: string } | NextResponse> {
  const supabase = supabaseServer();
  const user = await currentUser(supabase);
  const { data: ok } = user ? await supabase.rpc("is_platform_admin") : { data: false };
  if (!user || !ok) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return { userId: user.id };
}

/** Journal des opérations sensibles réalisées depuis l'administration. */
export async function audit(actorId: string, action: string, target: string, details: unknown) {
  await supabaseAdmin().from("audit_log").insert({ actor_id: actorId, action, target, details });
}

export function monthStart(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}
