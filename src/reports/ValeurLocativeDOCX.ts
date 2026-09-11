import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType } from "docx";
import type { ValeurLocative } from "../schemas/valeurLocative.schema";
import { loyerAnnuel, syntheseRevenus } from "../schemas/valeurLocative.schema";
import {
  E, fd, PT, bold, normal, run,
  title, subtitle, centered, articleHeading, bodyText, bullet, spacer, divider,
  dataRow, PRIMARY, WHITE, GREY, LINE, TB, noBorders,
} from "./docxHelpers";

const fmtM2 = (n: number) =>
  n ? `${String(n).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0")} m²` : "—";

export async function generateValeurLocativeDOCX(e: ValeurLocative): Promise<Blob> {
  const { TextRun } = await import("docx");
  const annuel = loyerAnnuel(e.loyerMensuelHc);
  const pieces = e.pieces.filter((p) => p.nom);
  const ext = e.exterieurs.filter((p) => p.nom);
  const eqs = e.equipements.filter((p) => p.label);
  const atouts = e.atouts.filter(Boolean);
  const totalPieces = pieces.reduce((acc, p) => acc + (p.surface || 0), 0);

  const th = (cols: string[], widths: number[]) =>
    new TableRow({
      children: cols.map((text, i) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: PT(9), color: WHITE })] })],
          shading: { fill: PRIMARY, type: ShadingType.SOLID, color: PRIMARY },
          borders: noBorders,
          width: { size: widths[i] ?? 33, type: WidthType.PERCENTAGE },
        }),
      ),
    });

  const td = (vals: string[], widths: number[], alt = false) =>
    new TableRow({
      children: vals.map((text, i) =>
        new TableCell({
          children: [new Paragraph({ children: [normal(text, PT(9))], spacing: { before: 40, after: 40 } })],
          shading: alt ? { fill: "F7F7F5", type: ShadingType.SOLID, color: "F7F7F5" } : undefined,
          borders: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE }, top: noBorders.top, left: noBorders.left, right: noBorders.right },
          width: { size: widths[i] ?? 33, type: WidthType.PERCENTAGE },
        }),
      ),
    });

  const paras: (Paragraph | Table)[] = [
    title("CASA CARAÏBES", PT(16)),
    centered("Agence Immobilière — Martinique", PT(9)),
    divider(),
    title("ESTIMATION DE VALEUR LOCATIVE", PT(18)),
    ...(e.titreBien ? [subtitle(e.titreBien)] : []),
    centered(e.regimeLocatif, PT(10)),
    centered(`${e.codePostal} ${e.commune}${e.commune ? " — Martinique" : ""}`.trim(), PT(10)),
    ...((e.sectionCadastrale || e.parcelle)
      ? [centered([e.sectionCadastrale && `Section cadastrale ${e.sectionCadastrale}`, e.parcelle && `Parcelle ${e.parcelle}`].filter(Boolean).join(" — "), PT(9))]
      : []),
    ...(e.mentionCouverture ? [centered(e.mentionCouverture, PT(9))] : []),
    spacer(80),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: [
        new TableCell({
          children: [
            new Paragraph({ children: [run("MANDANT", { bold: true, size: PT(8), color: GREY })], spacing: { after: 60 } }),
            new Paragraph({ children: [bold(e.mandantNom || "—", PT(11))] }),
            ...(e.mandantVille ? [new Paragraph({ children: [run(e.mandantVille, { size: PT(9), color: GREY })] })] : []),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: { ...noBorders, right: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
        }),
        new TableCell({
          children: [
            new Paragraph({ children: [run("AGENCE MANDATAIRE", { bold: true, size: PT(8), color: GREY })], spacing: { after: 60 } }),
            new Paragraph({ children: [bold(e.agenceNom, PT(11))] }),
            new Paragraph({ children: [run(e.agenceMention, { size: PT(9), color: GREY })] }),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: noBorders,
        }),
      ] })],
      borders: TB,
    }),
    centered(`Document établi le : ${fd(e.dateDocument)}`, PT(9)),
    articleHeading("1. RÉFÉRENCES DE L'AGENCE"),
    ...e.referencesAgence.split("\n").filter(Boolean).map((p) => bodyText(p)),
    articleHeading("2. DÉSIGNATION DU BIEN"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        dataRow("Adresse", [e.adresse, `${e.codePostal} ${e.commune}`].filter(Boolean).join(", ")),
        dataRow("Référence cadastrale", [e.sectionCadastrale && `Section ${e.sectionCadastrale}`, e.parcelle && `Parcelle n° ${e.parcelle}`].filter(Boolean).join(" — ") || "—"),
        dataRow("Superficie du terrain", `${fmtM2(e.superficieTerrain)}${e.zonagePlu ? ` — Zonage PLU : ${e.zonagePlu}` : ""}`),
        dataRow("Nature du bien", e.natureBien || "—"),
        dataRow("Surface de plancher (SHON)", fmtM2(e.surfaceShon)),
        dataRow("Emprise au sol (construction)", fmtM2(e.empriseSol), true),
      ],
      borders: TB,
    }),
    articleHeading("3. DESCRIPTION DU BIEN"),
    ...e.descriptionBien.split("\n").filter(Boolean).map((p) => bodyText(p)),
  ];

  if (pieces.length) {
    paras.push(subtitle("3.1  Composition"));
    paras.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        th(["Pièce", "Surface", "Détail"], [34, 18, 48]),
        ...pieces.map((p, i) => td([p.nom, p.surface ? fmtM2(p.surface) : "", p.detail], [34, 18, 48], i % 2 === 1)),
        td(["Total habitable (SHON)", fmtM2(e.surfaceShon || totalPieces), ""], [34, 18, 48]),
      ],
      borders: TB,
    }));
  }
  if (ext.length) {
    paras.push(spacer(60));
    paras.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        th(["Extérieurs", "Surface", "Détail"], [34, 18, 48]),
        ...ext.map((p, i) => td([p.nom, p.surface ? fmtM2(p.surface) : "", p.detail], [34, 18, 48], i % 2 === 1)),
      ],
      borders: TB,
    }));
  }
  if (e.noteSurfaces) paras.push(new Paragraph({ children: [run(e.noteSurfaces, { italic: true, size: PT(8), color: GREY })], spacing: { before: 80, after: 80 } }));
  if (eqs.length) {
    paras.push(subtitle("3.2  Équipements et prestations"));
    paras.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: eqs.map((eq, i, arr) => dataRow(eq.label, eq.valeur, i === arr.length - 1)),
      borders: TB,
    }));
  }
  paras.push(articleHeading("4. LOCALISATION ET ENVIRONNEMENT"));
  paras.push(...e.localisation.split("\n").filter(Boolean).map((p) => bodyText(p)));
  if (atouts.length) {
    paras.push(bodyText("Atouts du bien :"));
    paras.push(...atouts.map((a) => bullet(a)));
  }
  paras.push(articleHeading("5. ESTIMATION DE LA VALEUR LOCATIVE"));
  paras.push(...e.analyseMarche.split("\n").filter(Boolean).map((p) => bodyText(p)));
  paras.push(bodyText("Au regard de l'ensemble des éléments recueillis, l'agence estime la valeur locative mensuelle du bien comme suit :"));
  paras.push(new Paragraph({ children: [new TextRun({ text: "VALEUR LOCATIVE MENSUELLE ESTIMÉE", bold: true, size: PT(9), color: PRIMARY })], alignment: AlignmentType.CENTER, spacing: { before: 160, after: 60 } }));
  paras.push(new Paragraph({ children: [new TextRun({ text: `${E(e.loyerMensuelHc)} / mois HC`, bold: true, size: PT(16), color: PRIMARY })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }));
  paras.push(new Paragraph({ children: [normal(syntheseRevenus(e.regimeLocatif, E(annuel)), PT(10))], alignment: AlignmentType.CENTER, spacing: { after: 60 } }));
  if (e.syntheseLoyer) {
    paras.push(new Paragraph({ children: [run(e.syntheseLoyer, { italic: true, size: PT(9), color: GREY })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }));
  }
  if (e.vigilance) {
    paras.push(subtitle("Points de vigilance et décote appliquée"));
    paras.push(...e.vigilance.split("\n").filter(Boolean).map((p) => bodyText(p)));
  }
  if (e.mentionPrevisionnelle) paras.push(bodyText(e.mentionPrevisionnelle));
  paras.push(articleHeading("6. SIGNATURES"));
  if (e.disclaimer) paras.push(bodyText(e.disclaimer));
  paras.push(centered(`Fait à ${e.lieuSignature}, le ${fd(e.dateSignature || e.dateDocument)}`, PT(10)));
  paras.push(spacer(80));
  paras.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [new TableCell({
      children: [
        new Paragraph({ children: [run("AGENCE MANDATAIRE", { bold: true, size: PT(8), color: GREY })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [bold(e.agenceNom, PT(11))], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 200 } }),
        new Paragraph({ children: [run("Signature", { italic: true, size: PT(8), color: GREY })], alignment: AlignmentType.CENTER }),
      ],
      borders: TB,
    })] })],
    borders: noBorders,
  }));
  const doc = new Document({ sections: [{ properties: { page: { margin: { top: 1134, bottom: 907, left: 1020, right: 1020 } } }, children: paras }] });
  return Packer.toBlob(doc);
}
