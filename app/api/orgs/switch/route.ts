import { NextResponse } from "next/server";
import { apiContext, jsonError, ORG_COOKIE } from "@/lib/context";

export async function POST(req: Request) {
  const ctx = await apiContext();
  if (ctx instanceof NextResponse) return ctx;
  const { orgId } = await req.json().catch(() => ({}));
  if (!ctx.orgs.some((o) => o.id === orgId)) return jsonError("Organisation inconnue.", 404);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ORG_COOKIE, orgId, { path: "/", httpOnly: true, sameSite: "lax", secure: true });
  return res;
}
