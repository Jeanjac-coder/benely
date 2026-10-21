import { NextResponse } from "next/server";
import { COUNTRIES } from "@/lib/africa";
import { jsonError, ORG_COOKIE } from "@/lib/context";
import { currentUser, supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const user = await currentUser(supabase);
  if (!user) return jsonError("Non authentifié.", 401);
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const country = typeof body?.country === "string" && COUNTRIES[body.country] ? body.country : null;
  if (!name || !country) return jsonError("Nom et pays requis.");
  const { data: id, error } = await supabase.rpc("create_organization", { org_name: name, org_country: country, org_currency: COUNTRIES[country].currency });
  if (error) return jsonError(error.message, 500);
  const res = NextResponse.json({ id });
  res.cookies.set(ORG_COOKIE, id as string, { path: "/", httpOnly: true, sameSite: "lax", secure: true });
  return res;
}
