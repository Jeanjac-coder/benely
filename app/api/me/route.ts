import { NextResponse } from "next/server";
import { jsonError } from "@/lib/context";
import { currentUser, supabaseServer } from "@/lib/supabase/server";

/** Met à jour le prénom et le nom de l'utilisateur connecté (table profiles, protégée par RLS). */
export async function PUT(req: Request) {
  const supabase = supabaseServer();
  const user = await currentUser(supabase);
  if (!user) return jsonError("Non authentifié.", 401);
  const body = await req.json().catch(() => ({}));
  const first = typeof body.firstName === "string" ? body.firstName.trim().slice(0, 80) : "";
  const last = typeof body.lastName === "string" ? body.lastName.trim().slice(0, 80) : "";
  if (!first || !last) return jsonError("Prénom et nom requis.");
  const { error } = await supabase.from("profiles")
    .upsert({ id: user.id, first_name: first, last_name: last, updated_at: new Date().toISOString() });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
