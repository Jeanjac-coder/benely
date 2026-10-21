import {
  AlignmentType, BorderStyle, Document, Footer, HeadingLevel, ImageRun, Packer, PageNumber, PageOrientation, Paragraph, ShadingType,
  Table, TableCell, TableRow, TextRun, WidthType, type ISectionOptions,
} from "docx";
import type { Block, ExportDoc } from "./model.ts";

const ACCENT = "0A6E45";
const wide = (blocks: Block[]) => blocks.some((b) => b.kind === "table" && b.columns.length >= 6);
const lines = (text: string, bold = false) => text.split("\n").map((t, i) => new TextRun({ text: t, bold, break: i > 0 ? 1 : 0 }));

function blockToDocx(b: Block): (Paragraph | Table)[] {
  const head = b.kind !== "h" && b.label ? [new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(b.label)] })] : [];
  if (b.kind === "h") return [new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(b.text)] })];
  if (b.kind === "p") return [...head, new Paragraph({ children: lines(b.text), spacing: { after: 160 } })];
  if (b.kind === "list") return [...head, ...b.items.map((t) => new Paragraph({ bullet: { level: 0 }, children: [new TextRun(t)] }))];
  const border = { style: BorderStyle.SINGLE, size: 2, color: "D9D8D0" };
  const cell = (text: string, header: boolean) => new TableCell({
    children: [new Paragraph({ children: lines(text || "—", header) })],
    shading: header ? { type: ShadingType.CLEAR, color: "auto", fill: "E9F2ED" } : undefined,
    borders: { top: border, bottom: border, left: border, right: border },
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
  });
  return [
    ...head,
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ tableHeader: true, children: b.columns.map((c) => cell(c, true)) }),
        ...b.rows.map((r) => new TableRow({ children: b.columns.map((_, i) => cell(r[i] ?? "", false)) })),
      ],
    }),
    new Paragraph({ text: "" }),
  ];
}

export async function renderDocx(d: ExportDoc): Promise<Buffer> {
  const footer = new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `${d.company} · ${d.title} · Benely · page `, size: 16, color: "66665F" }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "66665F" })],
    })],
  });

  const cover: (Paragraph | Table)[] = [];
  if (d.logo) {
    const h = 80, w = Math.min(220, Math.round((d.logo.width / d.logo.height) * h));
    cover.push(new Paragraph({ children: [new ImageRun({ type: d.logo.type, data: d.logo.data, transformation: { width: w, height: h } })], spacing: { after: 400 } }));
  }
  cover.push(
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(d.company)] }),
    new Paragraph({ children: [new TextRun({ text: d.title, size: 36, color: ACCENT })], spacing: { after: 200 } }),
    new Paragraph({ children: [new TextRun({ text: d.subtitle, color: "66665F" })] }),
    new Paragraph({ children: [new TextRun({ text: `Document généré le ${d.generatedAt}`, color: "66665F" })], spacing: { after: 400 } }),
    new Paragraph({ children: [new TextRun({ text: "Les estimations et prévisions de ce document ne constituent pas des résultats garantis. Les affirmations sont qualifiées de fait, estimation ou hypothèse.", size: 18, italics: true })] }),
  );

  const sections: ISectionOptions[] = [
    { children: cover },
    ...d.sections.map((s): ISectionOptions => ({
      properties: wide(s.blocks) ? { page: { size: { orientation: PageOrientation.LANDSCAPE } } } : {},
      footers: { default: footer },
      children: [new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(s.title)] }), ...s.blocks.flatMap(blockToDocx)],
    })),
  ];

  const doc = new Document({
    creator: "Benely",
    title: `${d.title} — ${d.company}`,
    styles: {
      default: { document: { run: { font: "Calibri", size: 21 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", run: { size: 32, bold: true, color: ACCENT }, paragraph: { spacing: { after: 200 } } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", run: { size: 26, bold: true, color: ACCENT }, paragraph: { spacing: { before: 240, after: 120 } } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", run: { size: 22, bold: true }, paragraph: { spacing: { before: 160, after: 80 } } },
      ],
    },
    sections,
  });
  return Packer.toBuffer(doc);
}
