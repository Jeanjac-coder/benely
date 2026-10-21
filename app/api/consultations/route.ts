import { NextResponse } from "next/server";
import { apiContext, jsonError } from "@/lib/context";
import { logEvent } from "@/lib/events";

const SLOTS = ["matin", "midi", "apres-midi", "soir"];
const CHANNELS = ["visio", "telephone", "whatsapp"];

/** Demande d'un échange stratégique de 30 minutes avec un consultant Benely. */
export async function POST(req: Request) {
  const ctx = await apiContext();
  if (ctx instanceof NextResponse) return ctx;
  const b = await req.json().catch(() => ({}));
  const date = typeof b.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : null;
  const today = new Date().toISOString().slice(0, 10);
  if (!date || date < today) return jsonError("Choisissez une date à venir.");
  if (!SLOTS.includes(b.slot) || !CHANNELS.includes(b.channel)) return jsonError("Créneau ou canal invalide.");
  const phone = typeof b.phone === "string" ? b.phone.trim().slice(0, 40) : "";
  if (b.channel !== "visio" && phone.replace(/\D/g, "").length < 8) return jsonError("Indiquez un numéro de téléphone pour être rappelé.");
  const { error } = await ctx.supabase.from("consultation_requests").insert({
    org_id: ctx.org.id, user_id: ctx.userId, preferred_date: date, preferred_slot: b.slot, channel: b.channel,
    phone: phone || null, topic: typeof b.topic === "string" ? b.topic.trim().slice(0, 1000) || null : null,
  });
  if (error) return jsonError(error.message, 500);
  await logEvent("info", "consultation", "Nouvelle demande d'échange stratégique", { orgId: ctx.org.id, details: { date, slot: b.slot, channel: b.channel } });
  return NextResponse.json({ ok: true });
}
