import { NextResponse } from "next/server";
import { apiContext, jsonError } from "@/lib/context";
import { readLogo } from "@/lib/export/model";

const MAX_BYTES = 1_000_000;

/** Logo de l'organisation (PNG ou JPEG, 1 Mo max), utilisé dans les exports. */
export async function POST(req: Request) {
  const ctx = await apiContext(["owner", "admin"]);
  if (ctx instanceof NextResponse) return ctx;
  const file = (await req.formData().catch(() => null))?.get("logo");
  if (!(file instanceof File)) return jsonError("Fichier manquant.");
  if (file.size > MAX_BYTES) return jsonError("Le logo ne doit pas dépasser 1 Mo.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const logo = readLogo(bytes);
  if (!logo) return jsonError("Format non pris en charge: utilisez un PNG ou un JPEG.");
  const path = `${ctx.org.id}/logo.${logo.type}`;
  const { error } = await ctx.supabase.storage.from("logos").upload(path, bytes, { upsert: true, contentType: logo.type === "png" ? "image/png" : "image/jpeg" });
  if (error) return jsonError(error.message, 500);
  const { error: e2 } = await ctx.supabase.from("organizations").update({ logo_path: path }).eq("id", ctx.org.id);
  if (e2) return jsonError(e2.message, 500);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const ctx = await apiContext(["owner", "admin"]);
  if (ctx instanceof NextResponse) return ctx;
  await ctx.supabase.from("organizations").update({ logo_path: null }).eq("id", ctx.org.id);
  return NextResponse.json({ ok: true });
}
