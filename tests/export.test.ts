import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { deflateSync } from "node:zlib";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { buildDoc, fileName, readLogo } from "../lib/export/model.ts";
import { renderDocx } from "../lib/export/docx.ts";
import { renderPdf } from "../lib/export/pdf.ts";
import { renderXlsx } from "../lib/export/xlsx.ts";
import { sample } from "./fixtures.ts";

/** PNG RVB valide de 2×1 pixels. */
function png(): Uint8Array {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(2, 0); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.from([0, 10, 110, 69, 255, 255, 255]);
  return Uint8Array.from(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
}
const PNG = png();

function doc(steps?: Parameters<typeof buildDoc>[2]) {
  const d = sample();
  d.content.entries[0].text = "Jus de bissap frais, livré à Cocody en 30 min — payez par Wave ou Orange Money ✓";
  return buildDoc(d, { company: "Kôkô Jus Abidjan", version: 3, logo: readLogo(PNG), generatedAt: new Date("2026-10-21") }, steps);
}

test("logo: dimensions PNG lues, formats non gérés refusés", () => {
  assert.deepEqual({ ...readLogo(PNG)!, data: undefined }, { data: undefined, type: "png", width: 2, height: 1 });
  assert.equal(readLogo(new TextEncoder().encode("GIF89a........................")), null);
  assert.equal(fileName("Kôkô Jus / Abidjan", "pdf", new Date("2026-10-21")), "Benely-Koko-Jus-Abidjan-2026-10-21.pdf");
});

test("T09: PDF complet et lisible (accents, sections, calendrier, pagination)", async () => {
  const buf = await renderPdf(doc(), { compress: false });
  const dir = mkdtempSync(path.join(tmpdir(), "benely-"));
  const file = path.join(dir, "out.pdf");
  writeFileSync(file, buf);
  const text = execFileSync("pdftotext", ["-layout", file, "-"]).toString();
  for (const s of ["Kôkô Jus Abidjan", "Stratégie marketing et communication", "Audit marketing", "Étude de marché", "Plateforme de marque", "Calendrier éditorial", "bissap", "Wave", "page 2/"]) {
    assert.ok(text.includes(s), `texte manquant dans le PDF: ${s}`);
  }
  const pages = Number(/Pages:\s+(\d+)/.exec(execFileSync("pdfinfo", [file]).toString())![1]);
  assert.ok(pages >= 7, `au moins une page par section + couverture (${pages})`);
});

test("T09: DOCX complet, à l'unité", async () => {
  const zip = await JSZip.loadAsync(await renderDocx(doc()));
  const xml = await zip.file("word/document.xml")!.async("string");
  for (const s of ["Kôkô Jus Abidjan", "Objectifs SMART", "Calendrier éditorial", "bissap"]) assert.ok(xml.includes(s), s);
  assert.ok(Object.keys(zip.files).some((f) => f.startsWith("word/media/")), "logo intégré");
  const one = await JSZip.loadAsync(await renderDocx(doc(["branding"])));
  const xml1 = await one.file("word/document.xml")!.async("string");
  assert.ok(xml1.includes("Plateforme de marque") && !xml1.includes("Objectifs SMART"));
});

test("T09: XLSX avec une feuille par livrable et le calendrier en tableau", async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load((await renderXlsx(doc())) as unknown as ExcelJS.Buffer);
  assert.deepEqual(wb.worksheets.map((w) => w.name), ["Couverture", "Audit marketing", "Étude de marché et concurrence", "Stratégie et objectifs", "Plateforme de marque", "Plan média et campagnes", "Stratégie de contenu et calendr"]);
  const cal = wb.worksheets[6];
  const values = cal.getSheetValues().flat().map(String);
  assert.ok(values.includes("2026-11-05") && values.includes("TikTok"));
  assert.equal(wb.getWorksheet("Couverture")!.getImages().length, 1);
});

test("facture PDF: numéro, montant en FCFA, mentions du vendeur", async () => {
  const { renderInvoice, sellerFromEnv } = await import("../lib/export/invoice.ts");
  const buf = await renderInvoice({
    number: "BEN-2026-000042", issuedAt: "2026-10-21T10:00:00Z", billedTo: "Kôkô Jus", billedEmail: "awa@koko.ci", planName: "Business",
    periodStart: "2026-10-21T10:00:00Z", periodEnd: "2026-11-21T10:00:00Z", amount: 19900, currency: "XOF", method: "OMCIV2", transactionId: "BENTX1",
  }, sellerFromEnv({ BENELY_LEGAL_NAME: "Benely SAS", BENELY_LEGAL_IDS: "RCCM CI-ABJ-2026-B-0000" }));
  const file = path.join(mkdtempSync(path.join(tmpdir(), "benely-")), "f.pdf");
  writeFileSync(file, buf);
  const text = execFileSync("pdftotext", [file, "-"]).toString().replace(/\s+/g, " ");
  for (const s of ["Benely SAS", "RCCM CI-ABJ-2026-B-0000", "Facture BEN-2026-000042", "Kôkô Jus", "19 900 FCFA", "Business", "OMCIV2"]) assert.ok(text.includes(s), s);
});
