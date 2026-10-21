import path from "node:path";
import PDFDocument from "pdfkit";
import type { Block, ExportDoc } from "./model.ts";

const FONT = path.join(process.cwd(), "assets/fonts/DejaVuSans.ttf");
const BOLD = path.join(process.cwd(), "assets/fonts/DejaVuSans-Bold.ttf");
const ACCENT = "#0a6e45";
const MUTED = "#66665f";

/** Les sections contenant un tableau large passent en paysage. */
const wide = (blocks: Block[]) => blocks.some((b) => b.kind === "table" && b.columns.length >= 6);

export function renderPdf(d: ExportDoc, opts: { compress?: boolean } = {}): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true, compress: opts.compress ?? true, info: { Title: `${d.title} — ${d.company}`, Author: "Benely" } });
  doc.registerFont("body", FONT);
  doc.registerFont("bold", BOLD);
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => { doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject); });

  // Couverture
  let y = 140;
  if (d.logo) {
    const h = 80, w = Math.min(220, (d.logo.width / d.logo.height) * h);
    doc.image(Buffer.from(d.logo.data), 50, 80, { fit: [w, h] });
    y = 200;
  }
  doc.font("bold").fontSize(26).fillColor("#1b1b19").text(d.company, 50, y, { width: doc.page.width - 100 });
  doc.moveDown(0.5).font("body").fontSize(18).fillColor(ACCENT).text(d.title);
  doc.moveDown(0.5).fontSize(11).fillColor(MUTED).text(d.subtitle).text(`Document généré le ${d.generatedAt}`);
  doc.moveDown(2).fontSize(9).text("Les estimations et prévisions de ce document ne constituent pas des résultats garantis. Les affirmations sont qualifiées de fait, estimation ou hypothèse.", { width: 400 });

  for (const s of d.sections) {
    doc.addPage({ size: "A4", margin: 50, layout: wide(s.blocks) ? "landscape" : "portrait" });
    doc.font("bold").fontSize(18).fillColor(ACCENT).text(s.title);
    doc.moveDown(0.6);
    for (const b of s.blocks) block(doc, b);
  }

  // Pied de page sur toutes les pages sauf la couverture
  const range = doc.bufferedPageRange();
  for (let i = 1; i < range.count; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.font("body").fontSize(8).fillColor(MUTED)
      .text(`${d.company} · ${d.title} · Benely · page ${i + 1}/${range.count}`, 50, doc.page.height - 30, { width: doc.page.width - 100, align: "center" });
    doc.page.margins.bottom = bottom;
  }
  doc.end();
  return done;
}

function ensureSpace(doc: PDFKit.PDFDocument, h: number) {
  if (doc.y + h > doc.page.height - doc.page.margins.bottom) doc.addPage({ size: "A4", margin: 50, layout: doc.page.width > doc.page.height ? "landscape" : "portrait" });
}

function label(doc: PDFKit.PDFDocument, text?: string) {
  if (!text) return;
  ensureSpace(doc, 40);
  doc.font("bold").fontSize(11).fillColor("#1b1b19").text(text, doc.page.margins.left);
  doc.moveDown(0.2);
}

function block(doc: PDFKit.PDFDocument, b: Block) {
  const x = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  if (b.kind === "h") {
    ensureSpace(doc, 50);
    doc.moveDown(0.4).font("bold").fontSize(13).fillColor(ACCENT).text(b.text, x, doc.y, { width });
    doc.moveDown(0.3);
  } else if (b.kind === "p") {
    label(doc, b.label);
    doc.font("body").fontSize(10).fillColor("#1b1b19").text(b.text, x, doc.y, { width, lineGap: 2 });
    doc.moveDown(0.6);
  } else if (b.kind === "list") {
    label(doc, b.label);
    doc.font("body").fontSize(10).fillColor("#1b1b19").list(b.items, x + 8, doc.y, { width: width - 8, bulletRadius: 1.8, lineGap: 2, textIndent: 10 });
    doc.moveDown(0.6);
  } else {
    label(doc, b.label);
    table(doc, b.columns, b.rows);
    doc.moveDown(0.8);
  }
}

function table(doc: PDFKit.PDFDocument, columns: string[], rows: string[][]) {
  const x0 = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  // Largeur des colonnes proportionnelle à la longueur moyenne du contenu, bornée,
  // et jamais plus étroite que le mot le plus long de l'en-tête.
  const weights = columns.map((c, i) => {
    const avg = rows.reduce((s, r) => s + (r[i]?.length ?? 0), c.length) / (rows.length + 1);
    const longestWord = Math.max(...c.split(/\s+/).map((w) => w.length)) + 2;
    return Math.min(60, Math.max(8, longestWord, avg));
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map((w) => (w / total) * width);
  const pad = 3;
  const size = columns.length >= 6 ? 7.5 : 8.5;

  const drawRow = (cells: string[], header: boolean) => {
    doc.font(header ? "bold" : "body").fontSize(size);
    const h = Math.max(...cells.map((c, i) => doc.heightOfString(c || "—", { width: widths[i] - 2 * pad }))) + 2 * pad;
    if (doc.y + h > doc.page.height - doc.page.margins.bottom) {
      doc.addPage({ size: "A4", margin: 50, layout: doc.page.width > doc.page.height ? "landscape" : "portrait" });
      if (!header) drawRow(columns, true);
      doc.font(header ? "bold" : "body").fontSize(size);
    }
    const y = doc.y;
    if (header) doc.rect(x0, y, width, h).fill("#e9f2ed");
    let x = x0;
    cells.forEach((c, i) => {
      doc.fillColor("#1b1b19").text(c || "—", x + pad, y + pad, { width: widths[i] - 2 * pad });
      x += widths[i];
    });
    doc.moveTo(x0, y + h).lineTo(x0 + width, y + h).lineWidth(0.4).strokeColor("#d9d8d0").stroke();
    doc.x = x0;
    doc.y = y + h;
  };

  drawRow(columns, true);
  for (const r of rows) drawRow(r, false);
}
