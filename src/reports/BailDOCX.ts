import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";
import type { Bail } from "../schemas/bail.schema";
import { articlesBail, loyerCc, titreBail, sousTitreLegal } from "../schemas/bail.schema";
import { E, fd, PT, bold, normal, run, title, subtitle, centered, articleHeading, bodyText, spacer, divider, dataRow, GREY, LINE, TB, noBorders } from "./docxHelpers";

function nom(p: { civilite: string; prenom: string; nom: string }) {
  return [p.civilite, p.prenom, p.nom].filter(Boolean).join(" ") || "—";
}

export async function generateBailDOCX(e: Bail): Promise<Blob> {
  const { TextRun } = await import("docx");
  const bailleur = e.bailleurs[0];
  const preneur = e.preneurs[0];
  const arts = articlesBail(e);
  const children: (Paragraph | Table)[] = [
    title("CASA CARAÏBES", PT(16)),
    centered("Agence Immobilière — Martinique", PT(9)),
    divider(),
    title(titreBail(e.typeBail), PT(16)),
    centered(sousTitreLegal(e.typeBail), PT(9)),
    ...(e.numero ? [subtitle(`N° ${e.numero}`)] : []),
    centered([e.adresseBien, `${e.codePostal} ${e.commune}`].filter(Boolean).join(" — "), PT(10)),
    spacer(80),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: [
        new TableCell({
          children: [
            new Paragraph({ children: [run("BAILLEUR", { bold: true, size: PT(8), color: GREY })] }),
            new Paragraph({ children: [bold(bailleur ? nom(bailleur) : "—", PT(11))] }),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: { ...noBorders, right: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
        }),
        new TableCell({
          children: [
            new Paragraph({ children: [run("PRENEUR", { bold: true, size: PT(8), color: GREY })] }),
            new Paragraph({ children: [bold(preneur ? nom(preneur) : "—", PT(11))] }),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: noBorders,
        }),
      ] })],
      borders: TB,
    }),
    centered(`Établi à ${e.lieuSignature}, le ${fd(e.dateDocument)}`, PT(9)),
    articleHeading("DÉSIGNATION"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        dataRow("Type", e.typeBien),
        dataRow("Adresse", [e.adresseBien, `${e.codePostal} ${e.commune}`].filter(Boolean).join(", ")),
        dataRow("Période", `${fd(e.dateDebut)} → ${fd(e.dateFin)} (${e.dureeMois} mois)`),
        dataRow("Loyer HC", E(e.loyerHc)),
        dataRow("Loyer CC", E(loyerCc(e))),
        dataRow("Dépôt de garantie", E(e.depotGarantie)),
        dataRow("Charges", `${E(e.charges)} (${e.typeCharges || "provision"})`),
        ...((e.dpeClasse || e.gesClasse) ? [dataRow("DPE / GES", [e.dpeClasse && `Énergie ${e.dpeClasse}`, e.gesClasse && `GES ${e.gesClasse}`].filter(Boolean).join(" — "), true)] : [dataRow("DPE / GES", "Annexé", true)]),
      ],
      borders: TB,
    }),
  ];
  for (const a of arts) {
    children.push(articleHeading(a.titre));
    children.push(bodyText(a.corps));
  }
  if (e.observations) children.push(bodyText(e.observations));
  children.push(spacer(80));
  children.push(centered("Signatures", PT(10)));
  children.push(new Paragraph({ children: [new TextRun({ text: `Le bailleur : ${bailleur ? nom(bailleur) : "—"}`, size: PT(10) })], alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 } }));
  children.push(new Paragraph({ children: [new TextRun({ text: `Le preneur : ${preneur ? nom(preneur) : "—"}`, size: PT(10) })], alignment: AlignmentType.CENTER, spacing: { before: 200 } }));
  children.push(new Paragraph({ children: [run(e.agenceNom + " — " + e.agenceMention, { italic: true, size: PT(8), color: GREY })], alignment: AlignmentType.CENTER, spacing: { before: 200 } }));

  const doc = new Document({ sections: [{ properties: { page: { margin: { top: 1134, bottom: 907, left: 1020, right: 1020 } } }, children }] });
  return Packer.toBlob(doc);
}
