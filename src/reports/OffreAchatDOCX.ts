import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import type { OffreAchat, PartieOffre } from "../schemas/redacteur/offreAchat.schema";
import {
  E, fd, fdShort, dash, PT,
  bold, normal, run,
  title, subtitle, centered, articleHeading, body, bodyText, bullet, spacer, divider,
  dataRow, sigBlock,
  GREY, LINE, noBorders, TB,
} from "./docxHelpers";

// ── Nombre en lettres ─────────────────────────────────────────────────────────
const UNITES  = ["","un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"];
const DIZAINES = ["","","vingt","trente","quarante","cinquante","soixante","soixante","quatre-vingt","quatre-vingt"];

function cent(n: number): string {
  if (n === 0) return "";
  if (n < 20) return UNITES[n] ?? "";
  const d = Math.floor(n / 10), u = n % 10, diz = DIZAINES[d] ?? "";
  if (d === 7 || d === 9) { const s = UNITES[10 + u] ?? ""; return d === 9 && u === 0 ? "quatre-vingt-dix" : `${diz}-${s}`; }
  if (d === 8) return u === 0 ? "quatre-vingts" : `quatre-vingt-${UNITES[u] ?? ""}`;
  return u === 0 ? diz : u === 1 ? `${diz}-et-un` : `${diz}-${UNITES[u] ?? ""}`;
}

function nombreEnLettres(n: number): string {
  if (!n || n <= 0) return "zéro euro";
  const mil = Math.floor(n / 1000), rest = n % 1000;
  let res = "";
  if (mil === 1) res = "mille";
  else if (mil > 1) {
    const c = Math.floor(mil / 100), rm = mil % 100;
    if (c === 1 && rm === 0) res = "cent mille";
    else if (c > 1 && rm === 0) res = `${cent(c)} cents mille`;
    else if (c === 0) res = `${cent(rm)} mille`;
    else res = `${cent(c)} cent ${cent(rm)} mille`;
  }
  if (rest > 0) {
    const c = Math.floor(rest / 100), r2 = rest % 100;
    const cStr = c === 1 ? (r2 === 0 ? "cent" : "cent") : c > 1 ? (r2 === 0 ? `${cent(c)} cents` : `${cent(c)} cent`) : "";
    const uStr = r2 > 0 ? cent(r2) : "";
    res = [res, [cStr, uStr].filter(Boolean).join(" ")].filter(Boolean).join(" ");
  }
  return (res || "zéro") + " euros";
}

function acquereurLine(a: PartieOffre): Paragraph {
  const name = [a.civilite, a.prenom, a.nom].filter(Boolean).join(" ");
  const isFem = a.civilite === "Mme" || a.civilite === "Madame";
  const ne = a.dateNaissance ? `, né${isFem ? "e" : ""} le ${fdShort(a.dateNaissance)}${a.lieuNaissance ? ` à ${a.lieuNaissance}` : ""}` : "";
  const adresse = a.adresse ? `, demeurant ${a.adresse}${a.codePostal ? ` ${a.codePostal}` : ""}${a.ville ? ` ${a.ville}` : ""}` : "";
  return bodyText(`${name || dash}, de nationalité ${a.nationalite || "française"}${ne}${adresse}, ${a.etatCivil || "célibataire"}.`);
}

export async function generateOffreDOCX(f: OffreAchat): Promise<Blob> {
  const bienRows: Array<[string, string]> = [
    ["Type de bien", f.typeBien],
    ["Adresse", f.adresseBien],
    ["Commune", `${f.commune}${f.codePostal ? ` (${f.codePostal})` : ""}`],
    ...(f.descriptionBien ? [["Description", f.descriptionBien] as [string, string]] : []),
    ...(f.nomVendeur ? [["Vendeur", f.nomVendeur] as [string, string]] : []),
    ...(f.mandatRef ? [["Réf. mandat", f.mandatRef] as [string, string]] : []),
  ];

  const finRows: TableRow[] = [
    dataRow("Mode de financement", f.typeFinancement),
    ...(f.typeFinancement === "Prêt bancaire" ? [
      dataRow("Montant du prêt", E(f.montantPret)),
      dataRow("Apport personnel", E(f.apportPersonnel)),
      ...(f.banqueSollicitee ? [dataRow("Banque sollicitée", f.banqueSollicitee)] : []),
      dataRow("Taux maximum", `${f.tauxMax}%`),
      dataRow("Durée", `${f.dureePretMois} mois`),
    ] : [
      dataRow("Financement", "Fonds propres / Comptant"),
    ]),
  ];

  const modalRows: TableRow[] = [
    dataRow("Validité de l'offre", `${f.validiteJours} jours à compter de la date ci-dessus`),
    ...(f.dateEntreeJouissance ? [dataRow("Entrée en jouissance souhaitée", fdShort(f.dateEntreeJouissance))] : []),
    ...(f.sequestre > 0 ? [dataRow("Séquestre à la signature", E(f.sequestre))] : []),
    ...(f.notaire ? [dataRow("Notaire désigné par l'acquéreur", f.notaire)] : []),
  ];

  const children: (Paragraph | Table)[] = [
    // ── Header ─────────────────────────────────────────────────────────────────
    title("CASA CARAÏBES", PT(20)),
    centered("Agence Immobilière — Martinique", PT(9)),
    divider(),

    // ── Titre ──────────────────────────────────────────────────────────────────
    title("OFFRE D'ACHAT", PT(20)),
    ...(f.numero ? [subtitle(`N° ${f.numero}`)] : []),
    centered(`${f.lieu || "Fort-de-France"}, le ${fd(f.date)}`),
    spacer(100),

    // ── Acquéreurs ─────────────────────────────────────────────────────────────
    articleHeading("ARTICLE 1 — L'ACQUÉREUR"),
    bodyText("Le(s) soussigné(s) :"),
    ...f.acquereurs.map(acquereurLine),

    // ── Bien ───────────────────────────────────────────────────────────────────
    articleHeading("ARTICLE 2 — DÉSIGNATION DU BIEN"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: bienRows.map((r, i, arr) => dataRow(r[0], r[1] || dash, i === arr.length - 1)),
      borders: TB,
    }),

    // ── Prix ───────────────────────────────────────────────────────────────────
    articleHeading("ARTICLE 3 — PRIX PROPOSÉ"),
    body(
      normal("Le(s) acquéreur(s) propose(nt) d'acquérir le bien susmentionné au prix de "),
      bold(E(f.prixOffert)),
      normal(` (${nombreEnLettres(f.prixOffert)}), frais d'agence inclus.`),
    ),

    // ── Financement ────────────────────────────────────────────────────────────
    articleHeading("ARTICLE 4 — FINANCEMENT"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: finRows,
      borders: TB,
    }),

    // ── Conditions suspensives ─────────────────────────────────────────────────
    articleHeading("ARTICLE 5 — CONDITIONS SUSPENSIVES"),
    bodyText("La présente offre est formulée sous les conditions suspensives suivantes :"),
    ...(f.conditionPret ? [
      bullet(`Obtention d'un prêt immobilier d'un montant de ${E(f.montantPret)}, au taux maximum de ${f.tauxMax}% sur ${f.dureePretMois} mois auprès de ${f.banqueSollicitee || "tout établissement bancaire"}.`),
    ] : []),
    ...(f.conditionVenteBien ? [
      bullet(`Vente préalable du bien appartenant à l'acquéreur : ${f.descriptionBienVente || dash}.`),
    ] : []),
    ...(f.autresConditions ? [bullet(f.autresConditions)] : []),
    bodyText("À défaut de réalisation des conditions suspensives dans les délais convenus, la présente offre sera caduque de plein droit."),

    // ── Modalités ──────────────────────────────────────────────────────────────
    articleHeading("ARTICLE 6 — MODALITÉS DE L'OFFRE"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: modalRows,
      borders: TB,
    }),
    bodyText(`Si le(s) vendeur(s) ne répond(ent) pas dans ce délai de ${f.validiteJours} jours, la présente offre sera réputée refusée et deviendra automatiquement caduque.`),

    // ── Déclarations acquéreur ─────────────────────────────────────────────────
    articleHeading("ARTICLE 7 — DÉCLARATIONS DE L'ACQUÉREUR"),
    bodyText("Le(s) acquéreur(s) déclare(nt) :"),
    bullet("Avoir pris connaissance de la description du bien et de ses caractéristiques."),
    bullet("Avoir visité le bien ou renoncer à la visite en connaissance de cause."),
    bullet("Disposer de la capacité juridique pour contracter."),
    bullet("Avoir été informé(s) des délais légaux et de rétractation applicables."),

    // ── Mentions légales ───────────────────────────────────────────────────────
    spacer(80),
    new Paragraph({
      children: [run("Document établi par Casa Caraïbes SARL — RCS Fort-de-France 928 647 981 — Carte pro T n°CPI97212024000000007. La présente offre ne constitue pas un avant-contrat au sens de l'article 1589 du Code civil. Elle ne devient contraignante pour le vendeur qu'après acceptation écrite et expresse dans le délai imparti.", { italic: true, size: PT(8.5), color: GREY })],
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
              children: sigBlock("L'(LES) ACQUÉREUR(S)", f.acquereurs.map(a => `${a.civilite} ${a.prenom} ${a.nom}`).join(" & ")),
              borders: { ...noBorders, right: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: sigBlock("LE VENDEUR", f.nomVendeur || "…………………………………", "Acceptation de l'offre"),
              borders: noBorders,
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
      ],
      borders: TB,
    }),

    spacer(80),
    new Paragraph({
      children: [bold("Casa Caraïbes — Intermédiaire :", PT(9)), run(`  ${f.redacteur || "M. Luc CLEMENTE"}`, { size: PT(9) })],
      spacing: { before: 60, after: 20 },
    }),
  ];

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1134, bottom: 907, left: 1020, right: 1020 } },
      },
      children,
    }],
  });

  return Packer.toBlob(doc);
}
