import { NextResponse } from "next/server";
import { jsonError, ORG_COOKIE } from "@/lib/context";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Non authentifié.", 401);
  const { token } = await req.json().catch(() => ({}));
  const { data: orgId, error } = await supabase.rpc("accept_invitation", { invite_token: token });
  if (error) return jsonError(error.message);
  const res = NextResponse.json({ orgId });
  res.cookies.set(ORG_COOKIE, orgId as string, { path: "/", httpOnly: true, sameSite: "lax", secure: true });
  return res;
}
