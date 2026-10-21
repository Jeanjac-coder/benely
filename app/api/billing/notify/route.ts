import { NextResponse } from "next/server";
import { settlePayment } from "@/lib/billing/server";

/**
 * Notification du prestataire. Son contenu ne sert qu'à identifier la transaction:
 * le statut est toujours revérifié auprès du prestataire avant toute activation.
 */
export async function POST(req: Request) {
  const type = req.headers.get("content-type") ?? "";
  let tx: string | null = null;
  if (type.includes("application/json")) tx = (await req.json().catch(() => ({})))?.cpm_trans_id ?? null;
  else tx = ((await req.formData().catch(() => null))?.get("cpm_trans_id") as string | null) ?? null;
  if (tx && /^[A-Za-z0-9]{6,64}$/.test(tx)) {
    try {
      await settlePayment(tx);
    } catch (e) {
      // 500: le prestataire renverra la notification; la tâche planifiée revérifie aussi les paiements en attente.
      console.error("notification de paiement non traitée", tx, e);
      return new NextResponse("Erreur", { status: 500 });
    }
  }
  return new NextResponse("OK", { status: 200 });
}

// Le prestataire teste la disponibilité de l'URL en GET.
export function GET() {
  return new NextResponse("OK", { status: 200 });
}
