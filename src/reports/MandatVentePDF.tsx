import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { MandatVenteFull, Mandant } from "../schemas/redacteur/mandatVenteFull.schema";
import { calcMandatVente, isCopro, isTerrain, isFonds, needsCarrez, needsDPE } from "../schemas/redacteur/mandatVenteFull.schema";

const P = "#1A3A52";
const LINE = "#E4E4E0";
const INK = "#1A1A18";
const SUB = "#6B6B67";
const BF = "Helvetica-Bold";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9.5, color: INK, padding: "20mm 18mm 16mm" },
  // Header
  logoBox: { alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottom: `1 solid ${LINE}` },
  logoTxt: { fontSize: 22, fontFamily: BF, color: INK, letterSpacing: 0.5 },
  logoSub: { fontSize: 9, color: SUB, marginTop: 2 },
  // Titre doc
  docTitre: { fontSize: 20, fontFamily: BF, color: INK, textAlign: "center", marginBottom: 3 },
  docNum: { fontSize: 11, fontFamily: BF, color: P, textAlign: "center", marginBottom: 2 },
  docLieu: { fontSize: 9, color: SUB, textAlign: "center", fontStyle: "italic", marginBottom: 14 },
  divider: { height: 1, backgroundColor: LINE, marginBottom: 14 },
  // Tableau parties
  partiesRow: { flexDirection: "row", border: `0.5 solid ${LINE}`, marginBottom: 16 },
  partiesHead: { flexDirection: "row" },
  partiesHeadCell: { flex: 1, backgroundColor: P, padding: "6 12", textAlign: "center" },
  partiesHeadTxt: { color: "#fff", fontFamily: BF, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 },
  partiesBody: { flexDirection: "row" },
  partiesCell: { flex: 1, padding: "10 12", borderRight: `0.5 solid ${LINE}` },
  partiesCellLast: { flex: 1, padding: "10 12" },
  mandantName: { fontFamily: BF, fontSize: 9.5, color: INK, textAlign: "center", marginBottom: 4 },
  mandantLine: { fontSize: 9, color: SUB, textAlign: "center", fontStyle: "italic", lineHeight: 1.5 },
  mandantQualite: { color: P, fontFamily: BF, fontSize: 8.5, textAlign: "center", marginTop: 4 },
  // Articles
  articleTitle: { fontSize: 10.5, fontFamily: BF, color: P, marginTop: 14, marginBottom: 6, borderLeft: `3 solid ${P}`, paddingLeft: 8 },
  body: { fontSize: 9.5, color: INK, lineHeight: 1.6, marginBottom: 6, textAlign: "justify" },
  bold: { fontFamily: BF },
  italic: { fontStyle: "italic" },
  tableBox: { border: `0.5 solid ${LINE}`, borderRadius: 4, marginVertical: 6 },
  tableRow: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}`, padding: "5 8" },
  tableRowLast: { flexDirection: "row", padding: "5 8" },
  tableLbl: { flex: 2, fontSize: 9, color: SUB },
  tableVal: { flex: 1, fontSize: 9.5, fontFamily: BF, color: INK, textAlign: "right" },
  highlight: { backgroundColor: "#EBF1F6", borderRadius: 4, padding: "8 12", marginVertical: 6 },
  highlightTxt: { fontSize: 9.5, color: P, fontFamily: BF, textAlign: "center" },
  infoCard: { backgroundColor: "#EBF1F6", borderRadius: 4, padding: "8 12", marginVertical: 6, borderLeft: `3 solid ${P}` },
  infoCardTxt: { fontSize: 9, color: P, lineHeight: 1.6 },
  // Signatures
  sigRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  sigBlock: { flex: 1, borderTop: `0.5 solid ${INK}`, paddingTop: 8, marginHorizontal: 6 },
  sigTxt: { fontSize: 8.5, color: INK, fontFamily: BF, marginBottom: 2 },
  sigSub: { fontSize: 8, color: SUB, fontStyle: "italic" },
  sigLine: { height: 30 },
  // Footer
  footer: { position: "absolute", bottom: "10mm", left: "18mm", right: "18mm", borderTop: `0.5 solid ${LINE}`, paddingTop: 6 },
  footerTxt: { fontSize: 7, color: SUB, textAlign: "center" },
});

const E = (n: number) => `${Math.round(n || 0).toLocaleString("fr-FR")} €`;
const fd = (d: string) => d ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "……………………";
const fdShort = (d: string) => d ? new Date(d + "T12:00").toLocaleDateString("fr-FR") : "……………";
const dash = "……………………………………";

const FOOTER_TXT = "Casa Caraïbes SARL — RCS Fort-de-France 928 647 981 — Carte pro T n°CPI97212024000000007 — Garant : GALIAN — RCP : MMA IARD n° 120 137 405 — contact@casacaraibes.com";

function MandantBlock({ m }: { m: Mandant }) {
  const name = [m.civilite, m.prenom, m.nom].filter(Boolean).join(" ");
  return (
    <View>
      <Text style={s.mandantName}>{name || dash}</Text>
      {m.dateNaissance && <Text style={s.mandantLine}>Né(e) le {fdShort(m.dateNaissance)}</Text>}
      {m.nationalite && <Text style={s.mandantLine}>Nationalité : {m.nationalite}</Text>}
      {m.adresse && <Text style={s.mandantLine}>Domicilié(e) : {m.adresse}</Text>}
      {(m.codePostal || m.ville) && <Text style={s.mandantLine}>{m.codePostal} {m.ville.toUpperCase()}{m.pays && m.pays !== "FRANCE" ? ` — ${m.pays}` : " — FRANCE"}</Text>}
      {m.tel && <Text style={s.mandantLine}>Tél : {m.tel}</Text>}
      {m.email && <Text style={s.mandantLine}>Email : {m.email}</Text>}
      <Text style={s.mandantQualite}>Qualité : {m.qualite}</Text>
    </View>
  );
}

/** Tableau de désignation adapté selon le type de bien */
function DesignationTable({ f }: { f: MandatVenteFull }) {
  const t = f.typeBien;

  if (isFonds(t)) {
    return (
      <View>
        <Text style={[s.body, { marginTop: 4 }]}>
          <Text style={s.bold}>Description du fonds : </Text>{f.descriptionBien || dash}
        </Text>
        {f.chiffreAffaires > 0 && (
          <Text style={s.body}>
            <Text style={s.bold}>Chiffre d'affaires annuel HT : </Text>{E(f.chiffreAffaires)}
          </Text>
        )}
        {f.commune && (
          <Text style={s.body}>
            <Text style={s.bold}>Commune : </Text>{f.commune}{f.codePostal ? ` (${f.codePostal})` : ""}
          </Text>
        )}
        {f.refCadastrale && (
          <Text style={s.body}>
            <Text style={s.bold}>Réf. cadastrale : </Text>{f.refCadastrale}
          </Text>
        )}
      </View>
    );
  }

  if (isTerrain(t)) {
    const rows: [string, string][] = [
      ["Commune", `${f.commune}${f.codePostal ? ` (${f.codePostal})` : ""}`],
      ["Type", "Terrain"],
      ...(f.surfaceFonciere > 0 ? [["Surface foncière", `${f.surfaceFonciere} m²`] as [string, string]] : []),
      ...(f.refCadastrale ? [["Référence cadastrale", f.refCadastrale] as [string, string]] : []),
    ];
    return (
      <View style={s.tableBox}>
        {rows.map((row, i) => (
          <View key={i} style={i === rows.length - 1 ? s.tableRowLast : s.tableRow}>
            <Text style={[s.tableLbl, { fontFamily: BF }]}>{row[0]}</Text>
            <Text style={{ flex: 2, fontSize: 9.5, color: INK }}>{row[1] || dash}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (t === "Appartement") {
    const rows: [string, string][] = [
      ["Adresse", [f.residence, f.adresseBien].filter(Boolean).join(", ")],
      ["Commune", `${f.commune}${f.codePostal ? ` (${f.codePostal})` : ""}`],
      ["Type de bien", f.typeBien],
      ...(f.nomsLots ? [["N° de lot(s)", f.nomsLots] as [string, string]] : []),
      ...(f.tantiemes ? [["Tantièmes", f.tantiemes] as [string, string]] : []),
      ...(f.surfaceCarrez > 0 ? [["Surface loi Carrez (m²)*", `${f.surfaceCarrez} m²`] as [string, string]] : []),
      ...(f.surfaceTotale > 0 ? [["Surface totale (m²)", `${f.surfaceTotale} m²`] as [string, string]] : []),
      ...(f.nbPieces ? [["Nombre de pièces", f.nbPieces] as [string, string]] : []),
      ...(f.refCadastrale ? [["Référence cadastrale", f.refCadastrale] as [string, string]] : []),
    ];
    return (
      <View>
        <View style={s.tableBox}>
          {rows.map((row, i) => (
            <View key={i} style={i === rows.length - 1 ? s.tableRowLast : s.tableRow}>
              <Text style={[s.tableLbl, { fontFamily: BF }]}>{row[0]}</Text>
              <Text style={{ flex: 2, fontSize: 9.5, color: INK }}>{row[1] || dash}</Text>
            </View>
          ))}
        </View>
        {(f.nomsLots || f.residence) && (
          <Text style={s.body}>
            Lot(s) N°{f.nomsLots || dash} de la copropriété {f.residence || dash}{f.descriptionBien ? `, comprenant ${f.descriptionBien}` : ""}.
          </Text>
        )}
        {(f.syndic || f.chargesAnnuelles > 0) && (
          <View>
            <Text style={[s.body, { marginTop: 4 }]}><Text style={s.bold}>Informations de copropriété</Text></Text>
            {f.syndic && <Text style={s.body}><Text style={s.bold}>Syndic : </Text>{f.syndic}</Text>}
            {f.chargesAnnuelles > 0 && <Text style={s.body}><Text style={s.bold}>Charges annuelles : </Text>{E(f.chargesAnnuelles)}</Text>}
          </View>
        )}
      </View>
    );
  }

  if (t === "Local commercial") {
    const rows: [string, string][] = [
      ["Adresse", [f.residence, f.adresseBien].filter(Boolean).join(", ")],
      ["Commune", `${f.commune}${f.codePostal ? ` (${f.codePostal})` : ""}`],
      ["Type de bien", f.typeBien],
      ...(f.surfaceTotale > 0 ? [["Surface totale (m²)", `${f.surfaceTotale} m²`] as [string, string]] : []),
      ...(needsCarrez(t) || f.surfaceCarrez > 0 ? (f.surfaceCarrez > 0 ? [["Surface loi Carrez (m²)", `${f.surfaceCarrez} m²`] as [string, string]] : []) : []),
      ...(f.refCadastrale ? [["Référence cadastrale", f.refCadastrale] as [string, string]] : []),
    ];
    return (
      <View>
        <View style={s.tableBox}>
          {rows.map((row, i) => (
            <View key={i} style={i === rows.length - 1 ? s.tableRowLast : s.tableRow}>
              <Text style={[s.tableLbl, { fontFamily: BF }]}>{row[0]}</Text>
              <Text style={{ flex: 2, fontSize: 9.5, color: INK }}>{row[1] || dash}</Text>
            </View>
          ))}
        </View>
        {f.descriptionBien && <Text style={s.body}><Text style={s.bold}>Description : </Text>{f.descriptionBien}</Text>}
        {isCopro(t) && (f.syndic || f.chargesAnnuelles > 0) && (
          <View>
            <Text style={[s.body, { marginTop: 4 }]}><Text style={s.bold}>Informations de copropriété</Text></Text>
            {f.syndic && <Text style={s.body}><Text style={s.bold}>Syndic : </Text>{f.syndic}</Text>}
            {f.chargesAnnuelles > 0 && <Text style={s.body}><Text style={s.bold}>Charges annuelles : </Text>{E(f.chargesAnnuelles)}</Text>}
          </View>
        )}
      </View>
    );
  }

  // Villa / Maison (et tout autre type par défaut)
  const rows: [string, string][] = [
    ["Adresse", [f.residence, f.adresseBien].filter(Boolean).join(", ")],
    ["Commune", `${f.commune}${f.codePostal ? ` (${f.codePostal})` : ""}`],
    ["Type de bien", f.typeBien],
    ...(f.surfaceHabitable > 0 ? [["Surface habitable (m²)", `${f.surfaceHabitable} m²`] as [string, string]] : f.surfaceTotale > 0 ? [["Surface (m²)", `${f.surfaceTotale} m²`] as [string, string]] : []),
    ...(f.surfaceTerrain > 0 ? [["Surface terrain (m²)", `${f.surfaceTerrain} m²`] as [string, string]] : []),
    ...(t === "Villa" && f.surfacePiscine > 0 ? [["Piscine (m²)", `${f.surfacePiscine} m²`] as [string, string]] : []),
    ...(f.nbPieces ? [["Nombre de pièces", f.nbPieces] as [string, string]] : []),
    ...(f.refCadastrale ? [["Référence cadastrale", f.refCadastrale] as [string, string]] : []),
  ];
  return (
    <View>
      <View style={s.tableBox}>
        {rows.map((row, i) => (
          <View key={i} style={i === rows.length - 1 ? s.tableRowLast : s.tableRow}>
            <Text style={[s.tableLbl, { fontFamily: BF }]}>{row[0]}</Text>
            <Text style={{ flex: 2, fontSize: 9.5, color: INK }}>{row[1] || dash}</Text>
          </View>
        ))}
      </View>
      {f.descriptionBien && <Text style={s.body}><Text style={s.bold}>Description : </Text>{f.descriptionBien}</Text>}
    </View>
  );
}

export function MandatVentePDF({ f }: { f: MandatVenteFull }) {
  const c = calcMandatVente(f);
  const honorairesMention = f.chargeHonoraires === "vendeur" ? "vendeur" : "l'acquéreur";
  const dureeDebut = f.dateDebut ? fdShort(f.dateDebut) : dash;
  const dureeFin = c.dateFin || dash;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Logo */}
        <View style={s.logoBox}>
          <Text style={s.logoTxt}>CASA CARAÏBES</Text>
          <Text style={s.logoSub}>Agence Immobilière — Martinique</Text>
        </View>

        {/* Titre */}
        <Text style={s.docTitre}>MANDAT DE VENTE</Text>
        <Text style={s.docNum}>N° {f.numero}</Text>
        <Text style={s.docLieu}>{f.lieu || "Fort-de-France"}, le {fd(f.date)}</Text>
        <View style={s.divider} />

        {/* Tableau parties */}
        <View style={{ border: `0.5 solid ${LINE}`, marginBottom: 16 }}>
          <View style={s.partiesHead}>
            <View style={[s.partiesHeadCell, { borderRight: `0.5 solid rgba(255,255,255,0.3)` }]}>
              <Text style={s.partiesHeadTxt}>MANDANTS</Text>
            </View>
            <View style={s.partiesHeadCell}>
              <Text style={s.partiesHeadTxt}>MANDATAIRE</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1, padding: "10 12", borderRight: `0.5 solid ${LINE}` }}>
              {f.mandants.map((m: Mandant, i: number) => (
                <View key={i} style={i > 0 ? { marginTop: 10, paddingTop: 10, borderTop: `0.5 solid ${LINE}` } : {}}>
                  <MandantBlock m={m} />
                </View>
              ))}
            </View>
            <View style={{ flex: 1, padding: "10 12" }}>
              <Text style={[s.mandantName]}>Casa Caraïbes SARL</Text>
              <Text style={[s.mandantLine]}>Représentée par {f.redacteur}</Text>
              <Text style={[s.mandantLine, { marginTop: 6 }]}>RCS Fort-de-France 928 647 981</Text>
              <Text style={s.mandantLine}>Carte professionnelle T</Text>
              <Text style={s.mandantLine}>n°CPI97212024000000007</Text>
              <Text style={[s.mandantLine, { marginTop: 6 }]}>Garantie financière : GALIAN</Text>
              <Text style={s.mandantLine}>RCP : MMA IARD</Text>
              <Text style={s.mandantLine}>Police n° 120 137 405</Text>
              <Text style={[s.mandantLine, { marginTop: 6 }]}>Tél : +596 696 43 39 49</Text>
              <Text style={s.mandantLine}>Email : contact@casacaraibes.com</Text>
            </View>
          </View>
        </View>

        {/* Paraphes bas de page 1 */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ fontSize: 8, color: SUB }}>Paraphes mandant(s) : ………………</Text>
          <Text style={{ fontSize: 8, color: SUB }}>Paraphes mandataire : ………………</Text>
        </View>

        {/* Article 1 */}
        <Text style={s.articleTitle}>ARTICLE 1 — OBJET ET DÉSIGNATION DU BIEN</Text>
        <Text style={s.body}>Le mandant confie à Casa Caraïbes le mandat de vendre le bien immobilier suivant :</Text>

        <DesignationTable f={f} />

        {/* Occupation */}
        <Text style={[s.body, { marginTop: 4 }]}>
          <Text style={s.bold}>OCCUPATION : </Text>Bien {f.occupation === "Libre" ? "libre à la vente" : "occupé"}.
        </Text>
        {f.occupation === "Occupé" && (
          <Text style={s.body}>
            Le bien est actuellement occupé en vertu d'un {f.bailType} consenti à {f.nomLocataire || dash} moyennant un loyer mensuel de {E(f.loyerMensuel)}, venant à expiration le {f.datFinBail ? fdShort(f.datFinBail) : dash}. La vente sera consentie avec maintien dans les lieux de l'occupant, sauf accord contraire entre les parties.
          </Text>
        )}

        {/* Servitudes */}
        {f.servitudes && (
          <Text style={[s.body, { marginTop: 4 }]}>
            <Text style={s.bold}>SERVITUDES : </Text>{f.servitudes}
          </Text>
        )}

        {/* Article 1 bis — Diagnostics */}
        <Text style={s.articleTitle}>ARTICLE 1 BIS — DIAGNOSTICS TECHNIQUES OBLIGATOIRES</Text>
        <Text style={s.body}>
          Le mandant déclare avoir été informé que la vente est soumise à la fourniture d'un Dossier de Diagnostic Technique (DDT) comprenant notamment :{"\n"}
          {needsDPE(f.typeBien) ? `  • Diagnostic de Performance Énergétique (DPE) — Classe ${f.classeDPE || "à réaliser"} / GES ${f.classeGES || "à réaliser"}\n` : ""}
          {"  "}• État parasitaire relatif aux termites — {f.etatTermites} [obligatoire sur l'ensemble du territoire de la Martinique (Arrêté préfectoral)]{"\n"}
          {"  "}• État des risques et pollutions (ERNMT) — Martinique : zone de sismicité 4, zone exposée aux cyclones et aléas naturels{"\n"}
          {"  "}• Constat de risque d'exposition au plomb (CREP) — si bien construit avant 1949{"\n"}
          {"  "}• État de l'installation intérieure d'électricité et de gaz (si installation de plus de 15 ans){"\n"}
          {"  "}• Certificat de conformité de l'assainissement
        </Text>
        <Text style={s.body}>
          Le diagnostiqueur mandaté est : {f.diagnostiqueur || "à désigner"}. Les frais de diagnostic sont à la charge exclusive du vendeur.
        </Text>
        {f.ernmt && (
          <Text style={s.body}><Text style={s.bold}>ERNMT — Informations : </Text>{f.ernmt}</Text>
        )}
        {f.anomaliesElec && (
          <Text style={s.body}><Text style={s.bold}>Anomalies électriques constatées : </Text>{f.anomaliesElec}</Text>
        )}

        <View style={s.footer}>
          <Text style={s.footerTxt}>{FOOTER_TXT}</Text>
        </View>
      </Page>

      {/* Page 2 — Articles 2 à 3 */}
      <Page size="A4" style={s.page}>
        {/* Article 2 */}
        <Text style={s.articleTitle}>ARTICLE 2 — PRIX ET CONDITIONS FINANCIÈRES</Text>
        <View style={s.tableBox}>
          {[
            ["Prix de vente FAI (frais d'agence inclus)", E(f.prixFAI)],
            [`Honoraires Casa Caraïbes TTC (${f.honorairesPct}% — TVA ${f.tvaApplicable ? "8,5% DOM" : "non applicable"})`, E(c.honorairesTTC)],
            ["Prix net vendeur", E(c.prixNetVendeur)],
          ].map(([l, v], i, arr) => (
            <View key={i} style={i === arr.length - 1 ? s.tableRowLast : s.tableRow}>
              <Text style={s.tableLbl}>{l}</Text>
              <Text style={[s.tableVal, i === arr.length - 1 ? { color: P } : {}]}>{v}</Text>
            </View>
          ))}
        </View>
        <Text style={s.body}>Les honoraires sont à la charge du {honorairesMention} et seront versés lors de la signature de l'acte authentique de vente devant notaire. Aucune rémunération ne sera exigible avant la réalisation effective de la vente (loi Hoguet du 2 janvier 1970, art. 6).</Text>

        {/* Article 3 */}
        <Text style={s.articleTitle}>ARTICLE 3 — TYPE, DURÉE ET CONDITIONS DU MANDAT</Text>
        <Text style={s.body}>
          <Text style={s.bold}>Nature : </Text>
          Mandat {f.typeMandat.toLowerCase()} {f.typeMandat === "Semi-exclusif" ? "avec clause de présentation directe, " : ""}enregistré sous le numéro {f.numero} au registre des mandats de Casa Caraïbes.
        </Text>
        {f.typeMandat === "Semi-exclusif" && (
          <>
            <Text style={s.body}>Dans le cadre du présent mandat, le mandant confie à Casa Caraïbes l'exclusivité de la commercialisation de son bien, afin de bénéficier d'un suivi personnalisé et d'une mobilisation optimale des moyens de l'agence.</Text>
            {f.avecApportDirect && (
              <Text style={s.body}>Toutefois, si le mandant présente lui-même ou communique à Casa Caraïbes les coordonnées d'un acquéreur de son réseau personnel, Casa Caraïbes prend en charge l'intégralité du suivi du dossier. En reconnaissance de cet apport direct, les honoraires d'agence dus par le vendeur sont réduits de moitié, soit <Text style={s.bold}>{E(c.honoReduit)} TTC ({c.pctReduit}% du prix de vente FAI — TVA 8,5% DOM incluse)</Text>, le solde des honoraires restant à la charge exclusive du vendeur.</Text>
            )}
          </>
        )}
        {f.typeMandat === "Exclusif" && (
          <Text style={s.body}>Dans le cadre du présent mandat exclusif, le mandant s'interdit de confier la vente de son bien à tout autre intermédiaire ou d'y procéder lui-même pendant toute la durée du mandat.</Text>
        )}
        <Text style={s.body}>
          <Text style={s.bold}>Durée : </Text>
          Le présent mandat est consenti pour une durée de {f.dureeAns} an{f.dureeAns > 1 ? "s" : ""} à compter du {dureeDebut}, soit jusqu'au {dureeFin}. À l'issue de cette période initiale, il sera renouvelé tacitement par périodes successives d'un (1) mois, sauf dénonciation par lettre recommandée avec accusé de réception adressée au moins quinze (15) jours ouvrés avant chaque échéance (loi n° 70-9 du 2 janvier 1970, dite loi Hoguet). Nonobstant la durée ferme ci-dessus, chaque partie dispose d'une faculté de dénonciation anticipée à l'issue d'un délai de trois (3) mois à compter de la date de signature, sous réserve d'un préavis de quinze (15) jours ouvrés notifié par lettre recommandée avec accusé de réception.
        </Text>
        <Text style={s.body}><Text style={s.bold}>Droit de suite : </Text>Casa Caraïbes conserve un droit à commission pendant douze (12) mois suivant l'expiration ou la résiliation du présent mandat, pour tout acquéreur présenté ou mis en relation par ses soins durant la période de validité du mandat, dès lors que la vente viendrait à se réaliser avec cet acquéreur.</Text>
        {!f.avecSousMandat && <Text style={s.body}><Text style={s.bold}>Sous-mandat : </Text>Le recours à un sous-mandataire n'est pas autorisé sauf accord écrit préalable et exprès du mandant.</Text>}
        {f.avecInterAgence && <Text style={s.body}><Text style={s.bold}>Inter-agence : </Text>Casa Caraïbes se réserve la faculté de collaborer avec d'autres agences immobilières dans le cadre d'un inter-agence, afin d'élargir la diffusion du bien. Dans ce cadre, Casa Caraïbes demeure l'interlocuteur unique et exclusif du mandant. Le partage éventuel des honoraires entre agences est réglé entre professionnels et ne modifie en aucun cas le montant des honoraires dus par le vendeur.</Text>}

        <View style={s.footer}>
          <Text style={s.footerTxt}>{FOOTER_TXT}</Text>
        </View>
      </Page>

      {/* Page 3 — Articles 4 à 10 + Signatures */}
      <Page size="A4" style={s.page}>
        {/* Article 4 */}
        <Text style={s.articleTitle}>ARTICLE 4 — OBLIGATIONS DE CASA CARAÏBES</Text>
        <Text style={s.body}>
          Casa Caraïbes s'engage à :{"\n"}
          {"  "}• Inscrire le présent mandat au registre des mandats sous le numéro {f.numero}{"\n"}
          {"  "}• Effectuer la prospection active et assurer la publicité du bien sur les portails immobiliers (SeLoger, Le Bon Coin, Logic-Immo...), les réseaux sociaux et le site internet de l'agence{"\n"}
          {"  "}• Organiser, planifier et accompagner les visites du bien avec les acquéreurs potentiels{"\n"}
          {"  "}• Procéder à la vérification de la solvabilité des acquéreurs potentiels avant toute transmission d'offre{"\n"}
          {"  "}• Assister le mandant dans les négociations et le conseiller sur les conditions de la vente{"\n"}
          {"  "}• Remettre toute offre d'achat au mandant dans les meilleurs délais{"\n"}
          {"  "}• Coordonner la réalisation des diagnostics techniques obligatoires auprès de prestataires agréés, les frais restant à la charge du vendeur{"\n"}
          {"  "}• Respecter le secret professionnel et les obligations de confidentialité{"\n"}
          {f.avecPanneau ? "  • Poser et maintenir un panneau de vente sur le bien pendant toute la durée du mandat\n" : ""}
          {"  "}• Contribuer à la finalisation de la vente jusqu'à la signature de l'acte authentique devant notaire
        </Text>

        {/* Article 5 */}
        <Text style={s.articleTitle}>ARTICLE 5 — RÉMUNÉRATION ET TVA</Text>
        <Text style={s.body}>Casa Caraïbes percevra, en cas de vente effectivement réalisée, des honoraires d'un montant de <Text style={s.bold}>{E(c.honorairesTTC)} TTC</Text> (dont TVA au taux de 8,5 % applicable en Martinique — DOM, soit {E(c.tva)} de TVA), représentant {f.honorairesPct}% du prix de vente FAI de {E(f.prixFAI)}. Cette rémunération n'est exigible qu'à la condition que la vente soit effectivement réalisée et que l'acte authentique soit signé. Elle sera versée lors de la signature de l'acte authentique de vente, conformément à l'article 6 de la loi Hoguet du 2 janvier 1970.</Text>
        <Text style={s.body}>Conformément à l'arrêté du 10 janvier 2017 relatif à l'information des consommateurs par les professionnels intervenant dans une transaction immobilière, le barème des honoraires de Casa Caraïbes est affiché dans nos locaux, mentionné sur nos annonces et disponible sur simple demande.</Text>

        {/* Article 6 */}
        <Text style={s.articleTitle}>ARTICLE 6 — RÉSILIATION</Text>
        <Text style={s.body}>Passée la période de trois (3) mois, chacune des parties pourra résilier le présent mandat par lettre recommandée avec accusé de réception, moyennant un préavis de quinze (15) jours ouvrés avant l'échéance de la période mensuelle en cours. En cas de résiliation anticipée du mandat par le mandant pendant la période initiale ferme, sans motif légitime reconnu, le mandant pourra être redevable d'une indemnité forfaitaire égale aux frais effectivement engagés et justifiés par Casa Caraïbes dans le cadre de l'exécution du présent mandat.</Text>

        {/* Articles 7-10 */}
        <Text style={s.articleTitle}>ARTICLE 7 — REPRÉSENTATION ET POUVOIRS</Text>
        <Text style={s.body}>Le mandant autorise Casa Caraïbes à le représenter auprès des acquéreurs potentiels, de l'étude notariale désignée et de tout tiers intervenant dans le cadre de la réalisation de la vente. Casa Caraïbes est habilitée à recueillir et transmettre les offres d'achat, à signer tout document préalable à la vente au nom et pour le compte du mandant, dans les strictes limites des conditions financières et des modalités définies au présent mandat.</Text>

        <Text style={s.articleTitle}>ARTICLE 8 — LUTTE ANTI-BLANCHIMENT (LCB-FT)</Text>
        <Text style={s.body}>Conformément aux articles L.561-1 et suivants du Code monétaire et financier, Casa Caraïbes est assujettie aux obligations de vigilance en matière de lutte contre le blanchiment de capitaux et le financement du terrorisme (LCB-FT). À ce titre, le mandant s'engage à fournir tout justificatif d'identité, de domicile et d'origine des fonds requis par la réglementation en vigueur.</Text>

        <Text style={s.articleTitle}>ARTICLE 9 — PROTECTION DES DONNÉES PERSONNELLES (RGPD)</Text>
        <Text style={s.body}>Les données personnelles collectées dans le cadre du présent mandat sont traitées par Casa Caraïbes SARL, en qualité de responsable de traitement, pour les finalités suivantes : exécution du présent mandat de vente, prospection commerciale, respect des obligations légales. Conformément au RGPD (UE) 2016/679, le mandant dispose d'un droit d'accès, de rectification, d'effacement et de portabilité de ses données. Contact : contact@casacaraibes.com.</Text>

        <Text style={s.articleTitle}>ARTICLE 10 — DROIT DE RÉTRACTATION</Text>
        <Text style={s.body}>Si le présent mandat est conclu hors des locaux commerciaux de Casa Caraïbes, le mandant dispose d'un délai de rétractation de <Text style={s.bold}>quatorze (14) jours calendaires</Text> à compter de la date de signature, conformément aux articles L.221-18 et suivants du Code de la consommation. Durant ce délai, Casa Caraïbes ne pourra entreprendre aucune démarche active sans accord écrit et exprès du mandant.</Text>

        <Text style={[s.body, { marginTop: 6, fontStyle: "italic", color: SUB, fontSize: 8.5 }]}>
          Le présent mandat est établi conformément à la loi n° 70-9 du 2 janvier 1970 (loi Hoguet), au décret n° 72-678 du 20 juillet 1972, à la loi n° 2014-366 du 24 mars 2014 (loi ALUR) et à l'arrêté du 10 janvier 2017. Tout litige relatif au présent mandat sera soumis à la compétence des juridictions de Fort-de-France.
        </Text>

        {/* Signatures */}
        <View style={{ marginTop: 16 }}>
          <Text style={[s.body, { fontFamily: BF, marginBottom: 10 }]}>LES MANDANTS</Text>
          {f.mandants.map((m: Mandant, i: number) => (
            <View key={i} style={{ marginBottom: 18 }}>
              <Text style={[s.body, { fontFamily: BF }]}>{m.civilite} {m.prenom} {m.nom}</Text>
              <Text style={[s.body, { color: SUB, fontStyle: "italic", fontSize: 8.5 }]}>
                Paraphes sur chaque page : ………………
              </Text>
              <Text style={[s.body, { color: SUB, fontStyle: "italic", fontSize: 8.5 }]}>
                Lu et approuvé — Bon pour mandat {f.typeMandat.toLowerCase()} de vente
              </Text>
              <View style={{ height: 30, borderBottom: `0.5 solid ${LINE}`, marginTop: 8, width: 160 }} />
            </View>
          ))}
        </View>
        <View style={{ marginTop: 10 }}>
          <Text style={[s.body, { fontFamily: BF, marginBottom: 6 }]}>LE MANDATAIRE</Text>
          <Text style={s.body}>{f.redacteur}{"\n"}Pour Casa Caraïbes SARL{"\n"}À Fort-de-France, le {fd(f.date)}</Text>
          <View style={{ height: 30, borderBottom: `0.5 solid ${LINE}`, marginTop: 8, width: 160 }} />
        </View>

        <View style={s.footer}>
          <Text style={s.footerTxt}>{FOOTER_TXT}</Text>
        </View>
      </Page>
    </Document>
  );
}
