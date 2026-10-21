import { NextResponse } from "next/server";
import { apiContext, jsonError } from "@/lib/context";
import { renderInvoice } from "@/lib/export/invoice";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const ctx = await apiContext(["owner", "admin"]);
  if (ctx instanceof NextResponse) return ctx;
  const { data: inv } = await ctx.supabase.from("invoices")
    .select("number, issued_at, billed_to, amount, currency, period_start, period_end, plans(name), payments(method, transaction_id, created_by)")
    .eq("id", params.id).maybeSingle();
  if (!inv) return jsonError("Facture introuvable.", 404);
  const plan = inv.plans as unknown as { name: string } | null;
  const pay = inv.payments as unknown as { method: string | null; transaction_id: string; created_by: string } | null;
  // E-mail de la personne qui a payé (et non de celle qui télécharge la facture).
  const { data: payer } = pay
    ? await ctx.supabase.from("memberships").select("email").eq("org_id", ctx.org.id).eq("user_id", pay.created_by).maybeSingle()
    : { data: null };
  const pdf = await renderInvoice({
    number: inv.number, issuedAt: inv.issued_at, billedTo: inv.billed_to, billedEmail: payer?.email ?? "", planName: plan?.name ?? "",
    periodStart: inv.period_start, periodEnd: inv.period_end, amount: inv.amount, currency: inv.currency,
    method: pay?.method ?? null, transactionId: pay?.transaction_id ?? "",
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="Facture-${inv.number}.pdf"`, "Cache-Control": "private, no-store" },
  });
}
