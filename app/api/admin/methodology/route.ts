import { NextResponse } from "next/server";
import { apiAdmin, audit } from "@/lib/admin";
import { jsonError } from "@/lib/context";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Active une version (une seule active à la fois: on désactive d'abord les autres). */
async function activate(version: number) {
  const db = supabaseAdmin();
  const { error: e1 } = await db.from("methodology_documents").update({ active: false }).eq("active", true).neq("version", version);
  if (e1) throw new Error(e1.message);
  const { error: e2 } = await db.from("methodology_documents").update({ active: true }).eq("version", version);
  if (e2) throw new Error(e2.message);
}

/** Publie une nouvelle version de la méthodologie (Markdown) et la rend active. */
export async function POST(req: Request) {
  const admin = await apiAdmin();
  if (admin instanceof NextResponse) return admin;
  const b = await req.json().catch(() => ({}));
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const content = typeof b.content === "string" ? b.content.trim() : "";
  if (!title || content.length < 200) return jsonError("Titre et contenu (200 caractères minimum) requis.");
  if (content.length > 200_000) return jsonError("Document trop long (200 000 caractères maximum).");
  const db = supabaseAdmin();
  const { data: last } = await db.from("methodology_documents").select("version").order("version", { ascending: false }).limit(1).maybeSingle();
  const version = (last?.version ?? 0) + 1;
  const { error } = await db.from("methodology_documents").insert({ version, title, content, source_filename: typeof b.filename === "string" ? b.filename : null, created_by: admin.userId });
  if (error) return jsonError(error.message);
  try { await activate(version); } catch (e) { return jsonError((e as Error).message, 500); }
  await audit(admin.userId, "methodology.publish", `v${version}`, { title, length: content.length });
  return NextResponse.json({ version });
}

/** Réactive une version existante. */
export async function PUT(req: Request) {
  const admin = await apiAdmin();
  if (admin instanceof NextResponse) return admin;
  const b = await req.json().catch(() => ({}));
  if (!Number.isInteger(b.version)) return jsonError("Version invalide.");
  const { data } = await supabaseAdmin().from("methodology_documents").select("version").eq("version", b.version).maybeSingle();
  if (!data) return jsonError("Version introuvable.", 404);
  try { await activate(b.version); } catch (e) { return jsonError((e as Error).message, 500); }
  await audit(admin.userId, "methodology.activate", `v${b.version}`, {});
  return NextResponse.json({ ok: true });
}
