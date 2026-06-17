import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle } from "docx";
import type { CompromisVente, PartieCompromis } from "../schemas/redacteur/compromisVente.schema";
import { calcCompromis } from "../schemas/redacteur/compromisVente.schema";
import {
  E, fd, fdShort, dash, PT,
  bold, normal, run,
  title, centered, articleHeading, body, bodyText, spacer, divider,
  dataRow, headerRow, sigBlock,
  GREY, LINE, noBorders,
} from "./docxHelpers";

function partieLine(p: PartieCompromis): Paragraph {
  const name = [p.civilite, p.prenom?.toUpperCase(), p.nom?.toUpperCase()].filter(Boolean).join(" ");
  const isFem = p.civilite === "Mme" || p.civilite === "Madame";
  const ne = p.dateNaissance ? `, né${isFem ? "e" : ""} le ${fdShort(p.dateNaissance)}` : "";
  const lieu = p.lieuNaissance ? ` à ${p.lieuNaissance}` : "";
  const adresse = p.adresse ? `, demeurant ${p.adresse}${p.codePostal ? ` ${p.codePostal}` : ""}${p.ville ? ` ${p.ville}` : ""}` : "";
  const contact = [p.email ? `Email : ${p.email}` : "", p.tel ? `Tél. : ${p.tel}` : ""].filter(Boolean).join(" | ");
  const text = `${name || dash}, de nationalité ${p.nationalite || "française"}${ne}${lieu}${adresse}, ${p.etatCivil || "célibataire"}.${contact ? "\n" + contact : ""}`;
  return bodyText(text);
}

export async function generateCompromisDOCX(f: CompromisVente): Promise<Blob> {
  const c = calcCompromis(f);
  const vendeur0    = f.vendeurs[0];
  const acquereur0  = f.acquereurs[0];
  const nomVendeur  = vendeur0  ? `${vendeur0.prenom} ${vendeur0.nom}`   : dash;
  const nomAcq      = acquereur0 ? `${acquereur0.prenom} ${acquereur0.nom}` : dash;

  const children: (Paragraph | Table)[] = [
    // ── Header ─────────────────────────────────────────────────────────────────
    title("CASA CARAÏBES", PT(20)),
    centered("Agence Immobilière — Martinique", PT(9)),
    divider(),

    // ── Titre ──────────────────────────────────────────────────────────────────
    title("COMPROMIS DE VENTE", PT(20)),
    centered(`${f.lieu || "Fort-de-France"}, le ${fd(f.date)}`),
    spacer(60),

    // ── Résumé ─────────────────────────────────────────────────────────────────
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ children: [bold(`${nomVendeur} → ${nomAcq}`, PT(11))], alignment: AlignmentType.CENTER, spacing: { before: 80, after: 40 } }),
                new Paragraph({ children: [run(`${f.typeBien} — ${f.adresseBien || dash} — ${f.commune || dash}`, { italic: true, size: PT(9), color: GREY })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 40 } }),
                new Paragraph({ children: [bold(`Prix de vente : ${E(f.prixFAI)}`, PT(13))], alignment: AlignmentType.CENTER, spacing: { before: 40, after: 80 } }),
              ],
              borders: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE }, left: { style: BorderStyle.SINGLE, size: 4, color: LINE }, right: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
            }),
          ],
        }),
      ],
      borders: noBorders,
    }),
    spacer(100),

    // ── Préambule ──────────────────────────────────────────────────────────────
    articleHeading("ENTRE LES SOUSSIGNÉS"),

    // Vendeurs
    new Paragraph({ children: [bold("LE(S) VENDEUR(S) :", PT(9.5))], spacing: { before: 80, after: 40 } }),
    ...f.vendeurs.map(partieLine),

    // Acquéreurs
    new Paragraph({ children: [bold("L'(LES) ACQUÉREUR(S) :", PT(9.5))], spacing: { before: 80, after: 40 } }),
    ...f.acquereurs.map(partieLine),

    // ── Désignation du bien ────────────────────────────────────────────────────
    articleHeading("ARTICLE 1 — DÉSIGNATION DU BIEN"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        ...[
          ["Type de bien", f.typeBien],
          ["Adresse", [f.residence, f.adresseBien].filter(Boolean).join(", ")],
          ["Commune", `${f.commune}${f.codePostal ? ` (${f.codePostal})` : ""}`],
          ...(f.numLot ? [["Numéro(s) de lot", f.numLot]] : []),
          ...(f.surfaceCarrez > 0 ? [["Surface Carrez", `${f.surfaceCarrez} m²`]] : []),
          ...(f.surfaceTotale > 0 ? [["Surface totale", `${f.surfaceTotale} m²`]] : []),
          ["Occupation", f.occupation],
        ].map((r, i, arr) => dataRow(r[0] as string, r[1] as string || dash, i === arr.length - 1)),
      ],
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE }, left: { style: BorderStyle.SINGLE, size: 4, color: LINE }, right: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
    }),
    ...(f.descriptionSurfaces ? [body(bold("Description : "), normal(f.descriptionSurfaces))] : []),

    // ── Copropriété ────────────────────────────────────────────────────────────
    ...(f.nomCopro ? [
      articleHeading("ARTICLE 2 — COPROPRIÉTÉ"),
      ...[
        ["Nom de la copropriété", f.nomCopro],
        ...(f.nomSyndic ? [["Syndic", `${f.nomSyndic}${f.adresseSyndic ? ` — ${f.adresseSyndic}` : ""}`]] : []),
        ...(f.nbLotsCopro > 0 ? [["Nombre de lots", String(f.nbLotsCopro)]] : []),
        ...(f.anneeConstruction ? [["Année de construction", f.anneeConstruction]] : []),
      ].map((r, i, arr) => new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [dataRow(r[0] as string, r[1] as string || dash, i === arr.length - 1)],
        borders: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE }, left: { style: BorderStyle.SINGLE, size: 4, color: LINE }, right: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
      })),
    ] : []),

    // ── Prix et conditions financières ─────────────────────────────────────────
    articleHeading("ARTICLE 3 — PRIX ET CONDITIONS FINANCIÈRES"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["Désignation", "Montant"]),
        dataRow("Prix de vente FAI", E(f.prixFAI)),
        dataRow(`Honoraires Casa Caraïbes TTC (charge : ${f.chargeHonoraires})`, E(f.honorairesTTC)),
        dataRow("Prix net vendeur", E(c.prixNetVendeur)),
        dataRow(`Séquestre (${f.sequestrePct}% du prix)`, E(c.sequestre)),
        ...(f.fraisNotaireEstimes > 0 ? [dataRow("Frais de notaire estimés", E(f.fraisNotaireEstimes))] : []),
        dataRow("Indemnité d'immobilisation (clause pénale)", E(c.clausePenale), true),
      ],
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE }, left: { style: BorderStyle.SINGLE, size: 4, color: LINE }, right: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
    }),

    // ── Financement ────────────────────────────────────────────────────────────
    articleHeading("ARTICLE 4 — FINANCEMENT DE L'ACQUISITION"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        dataRow("Type de financement", f.typeFinancement),
        ...(f.apportPersonnel > 0 ? [dataRow("Apport personnel", E(f.apportPersonnel))] : []),
        ...(f.montantPret > 0 ? [dataRow("Montant du prêt", E(f.montantPret))] : []),
        ...(f.banqueSollicitee ? [dataRow("Banque sollicitée", f.banqueSollicitee)] : []),
        ...(f.montantPret > 0 ? [
          dataRow(`Taux maximum`, `${f.tauxMaxPret}%`),
          dataRow(`Durée du prêt`, `${f.dureePretMois} mois`),
        ] : []),
        dataRow("Délai de dépôt du dossier", `${f.delaiDepotDossierJours} jours`),
        dataRow("Délai d'obtention du prêt", `${f.delaiPretJours} jours`, true),
      ],
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE }, left: { style: BorderStyle.SINGLE, size: 4, color: LINE }, right: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
    }),

    // ── Conditions suspensives ─────────────────────────────────────────────────
    articleHeading("ARTICLE 5 — CONDITIONS SUSPENSIVES"),
    bodyText("La présente promesse de vente est consentie sous les conditions suspensives suivantes :"),
    ...(f.typeFinancement === "Prêt bancaire" ? [bodyText(`1. Obtention d'un prêt immobilier d'un montant de ${E(f.montantPret || 0)}, au taux maximum de ${f.tauxMaxPret}%, sur une durée de ${f.dureePretMois} mois, auprès de ${f.banqueSollicitee || "tout établissement bancaire"}, dans un délai de ${f.delaiPretJours} jours à compter de la signature du présent compromis.`)] : []),
    bodyText("Si les conditions suspensives ne se réalisent pas dans le délai imparti, le présent compromis sera résolu de plein droit, sans indemnité de part ni d'autre, et les sommes versées seront restituées à l'acquéreur."),

    // ── Diagnostics ────────────────────────────────────────────────────────────
    articleHeading("ARTICLE 6 — DIAGNOSTICS TECHNIQUES"),
    ...[
      ["Diagnostiqueur", f.diagnostiqueur || "à désigner"],
      ...(f.dateDDT ? [["Date des diagnostics", fdShort(f.dateDDT)]] : []),
      ...(f.classeDPE ? [["Classe DPE", f.classeDPE]] : []),
      ["État termites", f.etatTermites],
      ...(f.anomaliesElec ? [["Anomalies électriques", f.anomaliesElec]] : []),
    ].map((r, i, arr) => new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [dataRow(r[0] as string, r[1] as string || dash, i === arr.length - 1)],
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE }, left: { style: BorderStyle.SINGLE, size: 4, color: LINE }, right: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
    })),

    // ── Acte authentique ───────────────────────────────────────────────────────
    articleHeading("ARTICLE 7 — ACTE AUTHENTIQUE"),
    body(bold("Notaire désigné : "), normal(`${f.notaire || dash}${f.adresseNotaire ? ` — ${f.adresseNotaire}` : ""}`)),
    body(bold("Date limite de réitération : "), normal(f.dateReiterationMax ? fd(f.dateReiterationMax) : dash)),

    // ── Mandat ─────────────────────────────────────────────────────────────────
    ...(f.mandatRef ? [
      articleHeading("ARTICLE 8 — RÉFÉRENCE MANDAT"),
      bodyText(`Le présent compromis fait suite au mandat de vente n° ${f.mandatRef} confié à Casa Caraïbes.`),
    ] : []),

    // ── Mentions légales ───────────────────────────────────────────────────────
    spacer(80),
    new Paragraph({
      children: [run("Tout litige relatif au présent compromis sera soumis à la compétence des juridictions de Fort-de-France. La présente promesse synallagmatique de vente vaut vente au sens de l'article 1589 du Code civil.", { italic: true, size: PT(8.5), color: GREY })],
      spacing: { before: 60, after: 120 },
    }),

    // ── Signatures ─────────────────────────────────────────────────────────────
    divider(),
    spacer(60),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: sigBlock("LE(S) VENDEUR(S)", f.vendeurs.map(v => `${v.prenom} ${v.nom}`).join(" & ")),
              borders: { ...noBorders, right: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: sigBlock("L'(LES) ACQUÉREUR(S)", f.acquereurs.map(a => `${a.prenom} ${a.nom}`).join(" & ")),
              borders: noBorders,
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: sigBlock("CASA CARAÏBES", f.redacteur, `Fort-de-France, le ${fd(f.date)}`),
              borders: { ...noBorders, top: { style: BorderStyle.SINGLE, size: 4, color: LINE }, right: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun("")] })],
              borders: { ...noBorders, top: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
      ],
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE }, left: { style: BorderStyle.SINGLE, size: 4, color: LINE }, right: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
    }),
  ];

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1020, bottom: 850, left: 960, right: 960 } },
      },
      children,
    }],
  });

  return Packer.toBlob(doc);
}
