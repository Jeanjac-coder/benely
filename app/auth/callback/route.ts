import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Retour des liens e-mail Supabase (vérification d'adresse, réinitialisation de mot de passe). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/app";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/app";
  if (code) {
    const { error } = await supabaseServer().auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
  }
  return NextResponse.redirect(new URL("/auth/login?error=lien", url.origin));
}
