import ExcelJS from "exceljs";
import type { ExportDoc } from "./model.ts";

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECECFF" } };
const sheetName = (s: string) => s.replace(/[\[\]:*?/\\]/g, " ").slice(0, 31);

export async function renderXlsx(d: ExportDoc): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Benely";
  wb.created = new Date();

  const cover = wb.addWorksheet("Couverture");
  cover.getColumn(1).width = 90;
  let row = 1;
  if (d.logo) {
    const id = wb.addImage({ buffer: Buffer.from(d.logo.data) as unknown as ExcelJS.Buffer, extension: d.logo.type === "jpg" ? "jpeg" : "png" });
    const h = 80, w = Math.min(220, (d.logo.width / d.logo.height) * h);
    cover.addImage(id, { tl: { col: 0, row: 0 }, ext: { width: w, height: h } });
    cover.getRow(1).height = 64;
    row = 3;
  }
  cover.getCell(row, 1).value = d.company;
  cover.getCell(row, 1).font = { bold: true, size: 18 };
  cover.getCell(row + 1, 1).value = d.title;
  cover.getCell(row + 1, 1).font = { size: 14, color: { argb: "FF1010FF" } };
  cover.getCell(row + 2, 1).value = d.subtitle;
  cover.getCell(row + 3, 1).value = `Document généré le ${d.generatedAt}`;
  cover.getCell(row + 5, 1).value = "Les estimations et prévisions ne constituent pas des résultats garantis.";
  cover.getCell(row + 5, 1).font = { italic: true };

  for (const s of d.sections) {
    const ws = wb.addWorksheet(sheetName(s.title));
    const maxCols = Math.max(2, ...s.blocks.map((b) => (b.kind === "table" ? b.columns.length : 1)));
    const widths = Array.from({ length: maxCols }, () => 14);
    const add = (values: string[], style?: Partial<ExcelJS.Style>) => {
      const r = ws.addRow(values);
      r.alignment = { wrapText: true, vertical: "top" };
      if (style?.font) r.font = style.font;
      return r;
    };
    add([s.title], { font: { bold: true, size: 14, color: { argb: "FF1010FF" } } });
    add([]);
    for (const b of s.blocks) {
      const label = b.kind === "h" ? b.text : b.label;
      if (label) add([label], { font: { bold: true } });
      if (b.kind === "p") { add([b.text]); widths[0] = Math.max(widths[0], 80); }
      if (b.kind === "list") for (const it of b.items) add([`• ${it}`]);
      if (b.kind === "table") {
        const header = add(b.columns, { font: { bold: true } });
        header.eachCell((c) => { c.fill = HEADER_FILL; });
        for (const r of b.rows) add(b.columns.map((_, i) => r[i] ?? ""));
        b.columns.forEach((c, i) => {
          const longest = Math.max(c.length, ...b.rows.map((r) => Math.min(r[i]?.length ?? 0, 60)));
          widths[i] = Math.max(widths[i], Math.min(60, longest + 2));
        });
      }
      add([]);
    }
    widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}
