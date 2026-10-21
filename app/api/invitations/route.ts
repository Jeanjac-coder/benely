import { NextResponse } from "next/server";
import { checkQuota } from "@/lib/billing/server";
import { apiContext, jsonError } from "@/lib/context";

export async function POST(req: Request) {
  const ctx = await apiContext(["owner", "admin"]);
  if (ctx instanceof NextResponse) return ctx;
  const { email, role } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return jsonError("Adresse e-mail invalide.");
  if (role !== "admin" && role !== "member") return jsonError("Rôle invalide.");
  const quota = await checkQuota(ctx, "members");
  if (quota) return jsonError(quota, 402);
  const { data, error } = await ctx.supabase.from("invitations")
    .insert({ org_id: ctx.org.id, email: email.trim().toLowerCase(), role, invited_by: ctx.userId }).select("token").single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ link: `${new URL(req.url).origin}/invite/${data.token}` });
}
