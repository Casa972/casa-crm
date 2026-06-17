/**
 * Helpers partagés pour la génération de documents .docx via la lib `docx`.
 */
import {
  Paragraph, TextRun, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, ShadingType,
  VerticalAlign,
} from "docx";

export const PRIMARY = "1A3A52";
export const GREY    = "6B6B67";
export const LINE    = "E4E4E0";
export const WHITE   = "FFFFFF";

// ── Taille de police (en demi-points : 20 = 10pt, 18 = 9pt) ──────────────────
export const PT = (pt: number) => pt * 2;

// ── TextRun helpers ────────────────────────────────────────────────────────────
export const run = (text: string, opts: { bold?: boolean; italic?: boolean; size?: number; color?: string } = {}) =>
  new TextRun({ text, bold: opts.bold, italics: opts.italic, size: opts.size ?? PT(9.5), color: opts.color });

export const bold   = (t: string, size?: number) => run(t, { bold: true, size: size ?? PT(9.5) });
export const italic = (t: string) => run(t, { italic: true });
export const normal = (t: string, size?: number) => run(t, { size: size ?? PT(9.5) });

// ── Paragraphes ───────────────────────────────────────────────────────────────
export const title = (text: string, size = PT(18)) =>
  new Paragraph({
    children: [new TextRun({ text, size, bold: true, color: "1A1A18" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 80 },
  });

export const subtitle = (text: string, size = PT(10)) =>
  new Paragraph({
    children: [new TextRun({ text, size, bold: true, color: PRIMARY })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 },
  });

export const centered = (text: string, size = PT(9), color = GREY) =>
  new Paragraph({
    children: [new TextRun({ text, size, italics: true, color })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 40, after: 100 },
  });

export const articleHeading = (text: string) =>
  new Paragraph({
    children: [new TextRun({ text, bold: true, size: PT(10.5), color: PRIMARY })],
    spacing: { before: 220, after: 100 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: PRIMARY, space: 80 } },
  });

export const body = (...runs: TextRun[]) =>
  new Paragraph({
    children: runs,
    spacing: { before: 60, after: 80 },
    alignment: AlignmentType.JUSTIFIED,
  });

export const bodyText = (text: string) => body(normal(text));

export const bullet = (text: string) =>
  new Paragraph({
    children: [normal(`• ${text}`)],
    spacing: { before: 40, after: 40 },
    indent: { left: 360 },
  });

export const spacer = (before = 120) =>
  new Paragraph({ children: [new TextRun("")], spacing: { before } });

export const divider = () =>
  new Paragraph({
    children: [],
    spacing: { before: 100, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 0 } },
  });

// ── Tables ────────────────────────────────────────────────────────────────────
export const noBorders = {
  top:    { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left:   { style: BorderStyle.NONE, size: 0 },
  right:  { style: BorderStyle.NONE, size: 0 },
};

/** Bordure de tableau externe uniquement (pas de bordures internes — gérées au niveau des cellules) */
export const TB = {
  top:    { style: BorderStyle.SINGLE, size: 4, color: LINE },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE },
  left:   { style: BorderStyle.SINGLE, size: 4, color: LINE },
  right:  { style: BorderStyle.SINGLE, size: 4, color: LINE },
};

export const cellBorder = {
  top:    { style: BorderStyle.SINGLE, size: 4, color: LINE },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE },
  left:   { style: BorderStyle.SINGLE, size: 4, color: LINE },
  right:  { style: BorderStyle.SINGLE, size: 4, color: LINE },
};

/** Ligne de tableau 2 colonnes : label (gris) — valeur (noir gras) */
export function dataRow(label: string, value: string, isLast = false): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [run(label, { color: GREY, size: PT(9) })], spacing: { before: 60, after: 60 } })],
        borders: isLast
          ? { ...noBorders, top: { style: BorderStyle.SINGLE, size: 3, color: LINE } }
          : { ...noBorders, bottom: { style: BorderStyle.SINGLE, size: 3, color: LINE } },
        width: { size: 55, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ children: [bold(value, PT(9.5))], alignment: AlignmentType.RIGHT, spacing: { before: 60, after: 60 } })],
        borders: isLast
          ? { ...noBorders, top: { style: BorderStyle.SINGLE, size: 3, color: LINE } }
          : { ...noBorders, bottom: { style: BorderStyle.SINGLE, size: 3, color: LINE } },
        width: { size: 45, type: WidthType.PERCENTAGE },
      }),
    ],
  });
}

/** En-tête de tableau fond bleu */
export function headerRow(cols: string[]): TableRow {
  const w = Math.floor(100 / cols.length);
  return new TableRow({
    children: cols.map((text, i) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: PT(9), color: WHITE })], alignment: i > 0 ? AlignmentType.RIGHT : AlignmentType.LEFT })],
        shading: { fill: PRIMARY, type: ShadingType.SOLID, color: PRIMARY },
        borders: noBorders,
        width: { size: w, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
      }),
    ),
  });
}

// ── Formatters ────────────────────────────────────────────────────────────────
export const E = (n: number) => {
  const s = String(Math.round(n || 0));
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0") + " €";
};

export const fd = (d: string) =>
  d ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "……………………";

export const fdShort = (d: string) =>
  d ? new Date(d + "T12:00").toLocaleDateString("fr-FR") : "……………";

export const dash = "……………………………………";

// ── Section signatures ────────────────────────────────────────────────────────
export function sigBlock(who: string, name: string, sub?: string): Paragraph[] {
  return [
    new Paragraph({
      children: [new TextRun({ text: who, bold: true, size: PT(9.5), color: "1A1A18" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: name, bold: true, size: PT(10) })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 20 },
    }),
    ...(sub ? [new Paragraph({ children: [run(sub, { italic: true, size: PT(8.5), color: GREY })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 } })] : []),
    new Paragraph({
      children: [run("Lu et approuvé — Signature :", { italic: true, size: PT(8.5), color: GREY })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 0 },
    }),
    new Paragraph({ children: [new TextRun("")], spacing: { before: 800, after: 0 } }),
  ];
}
