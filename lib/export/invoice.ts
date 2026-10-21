import path from "node:path";
import PDFDocument from "pdfkit";
import { formatMoney } from "../money.ts";

export interface InvoiceData {
  number: string;
  issuedAt: string;
  billedTo: string;
  billedEmail: string;
  planName: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  currency: string;
  method: string | null;
  transactionId: string;
}

/** Mentions du vendeur, à renseigner par l'exploitant (variables d'environnement). */
export function sellerFromEnv(env: Record<string, string | undefined> = process.env) {
  return {
    name: env.BENELY_LEGAL_NAME || "Benely",
    lines: [env.BENELY_LEGAL_ADDRESS, env.BENELY_LEGAL_IDS, env.BENELY_LEGAL_CONTACT].filter(Boolean) as string[],
    vatNote: env.BENELY_VAT_NOTE || "Montant TTC.",
  };
}

const day = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export function renderInvoice(inv: InvoiceData, seller = sellerFromEnv()): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 56, info: { Title: `Facture ${inv.number}`, Author: seller.name } });
  doc.registerFont("body", path.join(process.cwd(), "assets/fonts/DejaVuSans.ttf"));
  doc.registerFont("bold", path.join(process.cwd(), "assets/fonts/DejaVuSans-Bold.ttf"));
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => { doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject); });

  doc.font("bold").fontSize(20).fillColor("#0f11f4").text(seller.name);
  doc.font("body").fontSize(9).fillColor("#5B6788");
  for (const l of seller.lines) doc.text(l);
  doc.moveDown(2).font("bold").fontSize(16).fillColor("#0a1238").text(`Facture ${inv.number}`);
  doc.font("body").fontSize(10).text(`Date d'émission: ${day(inv.issuedAt)}`);
  doc.moveDown().font("bold").text("Facturé à");
  doc.font("body").text(inv.billedTo);
  if (inv.billedEmail) doc.text(inv.billedEmail);

  doc.moveDown(2);
  const x = 56, w = doc.page.width - 112;
  const y = doc.y;
  doc.rect(x, y, w, 20).fill("#e7e8fe");
  doc.fillColor("#0a1238").font("bold").fontSize(10).text("Désignation", x + 6, y + 5).text("Montant", x + w - 126, y + 5, { width: 120, align: "right" });
  doc.font("body").text(`Abonnement Benely ${inv.planName}\nPériode du ${day(inv.periodStart)} au ${day(inv.periodEnd)}`, x + 6, y + 28, { width: w - 140 })
    .text(formatMoney(inv.amount, inv.currency), x + w - 126, y + 28, { width: 120, align: "right" });
  doc.moveTo(x, y + 62).lineTo(x + w, y + 62).strokeColor("#d9d8d0").stroke();
  doc.font("bold").text("Total", x + 6, y + 72).text(formatMoney(inv.amount, inv.currency), x + w - 126, y + 72, { width: 120, align: "right" });
  doc.font("body").fontSize(9).fillColor("#5B6788").text(seller.vatNote, x + 6, y + 92);

  doc.moveDown(3).fontSize(10).fillColor("#0a1238")
    .text(`Payée${inv.method ? ` par ${inv.method}` : ""} — transaction ${inv.transactionId}.`, x);
  doc.end();
  return done;
}
