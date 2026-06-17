import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, ShadingType } from "docx";
import type { MandatVenteFull, Mandant } from "../schemas/redacteur/mandatVenteFull.schema";
import { calcMandatVente, needsDPE } from "../schemas/redacteur/mandatVenteFull.schema";
import {
  E, fd, fdShort, dash, PT,
  bold, normal, run,
  title, subtitle, centered, articleHeading, body, bodyText, bullet, spacer, divider,
  dataRow, headerRow, sigBlock,
  PRIMARY, GREY, LINE, WHITE, noBorders,
} from "./docxHelpers";

function mandantLines(m: Mandant): Paragraph[] {
  const name = [m.civilite, m.prenom, m.nom].filter(Boolean).join(" ");
  const ps: Paragraph[] = [];
  ps.push(new Paragraph({ children: [bold(name || dash, PT(10))], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 40 } }));
  if (m.dateNaissance) ps.push(new Paragraph({ children: [run(`Né(e) le ${fdShort(m.dateNaissance)}`, { italic: true, size: PT(9), color: GREY })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 20 } }));
  if (m.nationalite) ps.push(new Paragraph({ children: [run(`Nationalité : ${m.nationalite}`, { italic: true, size: PT(9), color: GREY })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 20 } }));
  if (m.adresse) ps.push(new Paragraph({ children: [run(`Domicilié(e) : ${m.adresse}`, { italic: true, size: PT(9), color: GREY })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 20 } }));
  if (m.codePostal || m.ville) ps.push(new Paragraph({ children: [run(`${m.codePostal} ${m.ville.toUpperCase()} — ${m.pays || "FRANCE"}`, { italic: true, size: PT(9), color: GREY })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 20 } }));
  if (m.tel) ps.push(new Paragraph({ children: [run(`Tél : ${m.tel}`, { italic: true, size: PT(9), color: GREY })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 20 } }));
  if (m.email) ps.push(new Paragraph({ children: [run(`Email : ${m.email}`, { italic: true, size: PT(9), color: GREY })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 20 } }));
  ps.push(new Paragraph({ children: [run(`Qualité : ${m.qualite}`, { bold: true, size: PT(8.5), color: PRIMARY })], alignment: AlignmentType.CENTER, spacing: { before: 40, after: 60 } }));
  return ps;
}

function mandataireLines(): Paragraph[] {
  const lines = [
    ["Casa Caraïbes SARL", true],
    ["RCS Fort-de-France 928 647 981", false],
    ["Carte professionnelle T n°CPI97212024000000007", false],
    ["Garantie financière : GALIAN", false],
    ["RCP : MMA IARD — Police n° 120 137 405", false],
    ["Tél : +596 696 43 39 49", false],
    ["Email : contact@casacaraibes.com", false],
  ] as [string, boolean][];
  return lines.map(([text, b]) => new Paragraph({
    children: [run(text, { bold: b, size: PT(b ? 10 : 9), color: b ? "1A1A18" : GREY, italic: !b })],
    alignment: AlignmentType.CENTER,
    spacing: { before: b ? 60 : 0, after: 20 },
  }));
}

function partiesTable(f: MandatVenteFull): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      // En-tête
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "MANDANTS", bold: true, color: WHITE, size: PT(9) })], alignment: AlignmentType.CENTER })],
            shading: { fill: PRIMARY, type: ShadingType.SOLID, color: PRIMARY },
            borders: { ...noBorders, right: { style: BorderStyle.SINGLE, size: 4, color: "FFFFFF" } },
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "MANDATAIRE", bold: true, color: WHITE, size: PT(9) })], alignment: AlignmentType.CENTER })],
            shading: { fill: PRIMARY, type: ShadingType.SOLID, color: PRIMARY },
            borders: noBorders,
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      // Corps : mandants | mandataire
      new TableRow({
        children: [
          new TableCell({
            children: mandantLines(f.mandants[0]!),
            borders: { ...noBorders, right: { style: BorderStyle.SINGLE, size: 4, color: LINE }, top: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: mandataireLines(),
            borders: { ...noBorders, top: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ],
    borders: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE }, left: { style: BorderStyle.SINGLE, size: 4, color: LINE }, right: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
  });
}

function designationRows(f: MandatVenteFull): TableRow[] {
  const rows: [string, string][] = [
    ["Adresse", [f.residence, f.adresseBien].filter(Boolean).join(", ")],
    ["Commune", `${f.commune}${f.codePostal ? ` (${f.codePostal})` : ""}`],
    ["Type de bien", f.typeBien],
  ];
  if (f.surfaceHabitable > 0) rows.push(["Surface habitable", `${f.surfaceHabitable} m²`]);
  if (f.surfaceCarrez > 0)    rows.push(["Surface loi Carrez", `${f.surfaceCarrez} m²`]);
  if (f.surfaceTerrain > 0)   rows.push(["Surface terrain", `${f.surfaceTerrain} m²`]);
  if (f.nbPieces)             rows.push(["Nombre de pièces", f.nbPieces]);
  if (f.refCadastrale)        rows.push(["Référence cadastrale", f.refCadastrale]);
  return rows.map((r, i) => dataRow(r[0], r[1] || dash, i === rows.length - 1));
}

export async function generateMandatDOCX(f: MandatVenteFull): Promise<Blob> {
  const c = calcMandatVente(f);
  const honorairesMention = f.chargeHonoraires === "vendeur" ? "vendeur" : "l'acquéreur";
  const dureeDebut = f.dateDebut ? fdShort(f.dateDebut) : dash;

  const children: (Paragraph | Table)[] = [
    // ── Header ─────────────────────────────────────────────────────────────────
    title("CASA CARAÏBES", PT(20)),
    centered("Agence Immobilière — Martinique", PT(9)),
    divider(),

    // ── Titre ──────────────────────────────────────────────────────────────────
    title("MANDAT DE VENTE", PT(20)),
    subtitle(`N° ${f.numero}`),
    centered(`${f.lieu || "Fort-de-France"}, le ${fd(f.date)}`),
    spacer(80),

    // ── Parties ────────────────────────────────────────────────────────────────
    partiesTable(f),
    spacer(120),

    // ── Article 1 ──────────────────────────────────────────────────────────────
    articleHeading("ARTICLE 1 — OBJET ET DÉSIGNATION DU BIEN"),
    bodyText("Le mandant confie à Casa Caraïbes le mandat de vendre le bien immobilier suivant :"),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: designationRows(f),
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE }, left: { style: BorderStyle.SINGLE, size: 4, color: LINE }, right: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
    }),

    body(bold("OCCUPATION : "), normal(`Bien ${f.occupation === "Libre" ? "libre à la vente" : "occupé"}.`)),

    ...(f.occupation === "Occupé" ? [body(
      normal(`Le bien est actuellement occupé en vertu d'un ${f.bailType} consenti à `),
      bold(f.nomLocataire || dash),
      normal(` moyennant un loyer mensuel de ${E(f.loyerMensuel)}, venant à expiration le ${f.datFinBail ? fdShort(f.datFinBail) : dash}.`),
    )] : []),

    ...(f.servitudes ? [body(bold("SERVITUDES : "), normal(f.servitudes))] : []),

    // ── Article 1 bis ──────────────────────────────────────────────────────────
    articleHeading("ARTICLE 1 BIS — DIAGNOSTICS TECHNIQUES OBLIGATOIRES"),
    bodyText("Le mandant déclare avoir été informé que la vente est soumise à la fourniture d'un Dossier de Diagnostic Technique (DDT) comprenant notamment :"),
    ...(needsDPE(f.typeBien) ? [bullet(`Diagnostic de Performance Énergétique (DPE) — Classe ${f.classeDPE || "à réaliser"} / GES ${f.classeGES || "à réaliser"}`)] : []),
    bullet(`État parasitaire relatif aux termites — ${f.etatTermites}`),
    bullet("État des risques et pollutions (ERNMT) — Martinique : zone de sismicité 4"),
    bullet("Constat de risque d'exposition au plomb (CREP) — si bien construit avant 1949"),
    bullet("État de l'installation intérieure d'électricité et de gaz (si installation de plus de 15 ans)"),
    bullet("Certificat de conformité de l'assainissement"),
    body(normal("Le diagnostiqueur mandaté est : "), bold(f.diagnostiqueur || "à désigner"), normal(". Les frais de diagnostic sont à la charge exclusive du vendeur.")),

    // ── Article 2 ──────────────────────────────────────────────────────────────
    articleHeading("ARTICLE 2 — PRIX ET CONDITIONS FINANCIÈRES"),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["Désignation", "Montant"]),
        dataRow("Prix de vente FAI (frais d'agence inclus)", E(f.prixFAI)),
        dataRow(`Honoraires Casa Caraïbes TTC (${f.honorairesPct}% — TVA ${f.tvaApplicable ? "8,5% DOM" : "non applicable"})`, E(c.honorairesTTC)),
        dataRow("Prix net vendeur", E(c.prixNetVendeur), true),
      ],
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE }, left: { style: BorderStyle.SINGLE, size: 4, color: LINE }, right: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
    }),
    bodyText(`Les honoraires sont à la charge du ${honorairesMention} et seront versés lors de la signature de l'acte authentique de vente devant notaire. Aucune rémunération ne sera exigible avant la réalisation effective de la vente (loi Hoguet du 2 janvier 1970, art. 6).`),

    // ── Article 3 ──────────────────────────────────────────────────────────────
    articleHeading("ARTICLE 3 — TYPE, DURÉE ET CONDITIONS DU MANDAT"),
    body(bold("Nature : "), normal(`Mandat ${f.typeMandat.toLowerCase()} enregistré sous le numéro ${f.numero} au registre des mandats de Casa Caraïbes.`)),
    body(bold("Durée : "), normal(`Le présent mandat est consenti pour une durée de ${f.dureeAns} an${f.dureeAns > 1 ? "s" : ""} à compter du ${dureeDebut}, soit jusqu'au ${c.dateFin || dash}. Il sera renouvelé tacitement par périodes d'un mois, sauf dénonciation par LRAR adressée 15 jours ouvrés avant chaque échéance.`)),
    body(bold("Droit de suite : "), normal("Casa Caraïbes conserve un droit à commission pendant douze (12) mois suivant l'expiration ou la résiliation du présent mandat pour tout acquéreur présenté durant la période de validité.")),

    // ── Article 4 ──────────────────────────────────────────────────────────────
    articleHeading("ARTICLE 4 — OBLIGATIONS DE CASA CARAÏBES"),
    bodyText("Casa Caraïbes s'engage à :"),
    bullet("Inscrire le présent mandat au registre des mandats"),
    bullet("Effectuer la prospection active et assurer la publicité du bien (portails, réseaux sociaux, site internet)"),
    bullet("Organiser et accompagner les visites avec les acquéreurs potentiels"),
    bullet("Procéder à la vérification de la solvabilité des acquéreurs avant toute transmission d'offre"),
    bullet("Assister le mandant dans les négociations"),
    bullet("Remettre toute offre d'achat au mandant dans les meilleurs délais"),
    bullet("Respecter le secret professionnel et les obligations de confidentialité"),
    ...(f.avecPanneau ? [bullet("Poser et maintenir un panneau de vente sur le bien pendant toute la durée du mandat")] : []),

    // ── Article 5 ──────────────────────────────────────────────────────────────
    articleHeading("ARTICLE 5 — RÉMUNÉRATION ET TVA"),
    body(normal(`Casa Caraïbes percevra, en cas de vente effectivement réalisée, des honoraires d'un montant de `), bold(E(c.honorairesTTC) + " TTC"), normal(` (dont TVA au taux de 8,5 % applicable en Martinique — DOM, soit ${E(c.tva)} de TVA), représentant ${f.honorairesPct}% du prix de vente FAI de ${E(f.prixFAI)}. Cette rémunération n'est exigible qu'à la condition que la vente soit effectivement réalisée et que l'acte authentique soit signé.`)),

    // ── Article 6 ──────────────────────────────────────────────────────────────
    articleHeading("ARTICLE 6 — RÉSILIATION"),
    bodyText("Passée la période de trois (3) mois, chacune des parties pourra résilier le présent mandat par lettre recommandée avec accusé de réception, moyennant un préavis de quinze (15) jours ouvrés avant l'échéance de la période mensuelle en cours."),

    // ── Article 7 ──────────────────────────────────────────────────────────────
    articleHeading("ARTICLE 7 — REPRÉSENTATION ET POUVOIRS"),
    bodyText("Le mandant autorise Casa Caraïbes à le représenter auprès des acquéreurs potentiels, de l'étude notariale désignée et de tout tiers intervenant dans le cadre de la réalisation de la vente."),

    // ── Article 8 ──────────────────────────────────────────────────────────────
    articleHeading("ARTICLE 8 — LUTTE ANTI-BLANCHIMENT (LCB-FT)"),
    bodyText("Conformément aux articles L.561-1 et suivants du Code monétaire et financier, Casa Caraïbes est assujettie aux obligations de vigilance en matière de lutte contre le blanchiment de capitaux et le financement du terrorisme (LCB-FT). Le mandant s'engage à fournir tout justificatif d'identité, de domicile et d'origine des fonds requis."),

    // ── Article 9 ──────────────────────────────────────────────────────────────
    articleHeading("ARTICLE 9 — PROTECTION DES DONNÉES PERSONNELLES (RGPD)"),
    bodyText("Les données personnelles collectées dans le cadre du présent mandat sont traitées par Casa Caraïbes SARL, responsable de traitement. Conformément au RGPD du 27 avril 2016, le mandant dispose d'un droit d'accès, de rectification, d'effacement et de portabilité de ses données. Pour exercer ces droits : contact@casacaraibes.com."),

    // ── Article 10 ─────────────────────────────────────────────────────────────
    articleHeading("ARTICLE 10 — DROIT DE RÉTRACTATION"),
    body(normal("Si le présent mandat est conclu hors des locaux commerciaux, le mandant dispose d'un délai de rétractation de "), bold("quatorze (14) jours calendaires"), normal(" à compter de la date de signature, conformément aux articles L.221-18 et suivants du Code de la consommation.")),

    spacer(80),
    new Paragraph({
      children: [run("Le présent mandat est établi conformément à la loi n° 70-9 du 2 janvier 1970 (loi Hoguet), au décret n° 72-678 du 20 juillet 1972, à la loi n° 2014-366 du 24 mars 2014 (loi ALUR) et à l'arrêté du 10 janvier 2017. Tout litige relatif au présent mandat sera soumis à la compétence des juridictions de Fort-de-France.", { italic: true, size: PT(8.5), color: GREY })],
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
              children: [
                ...sigBlock("LES MANDANTS", f.mandants.map(m => [m.civilite, m.prenom, m.nom].filter(Boolean).join(" ")).join(" & ")),
              ],
              borders: { ...noBorders, right: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [
                ...sigBlock("LE MANDATAIRE", f.redacteur, `Pour Casa Caraïbes SARL — Fort-de-France, le ${fd(f.date)}`),
              ],
              borders: noBorders,
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
        page: {
          margin: { top: 1134, bottom: 907, left: 1020, right: 1020 },
        },
      },
      children,
    }],
  });

  return Packer.toBlob(doc);
}
